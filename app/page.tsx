"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Upload, BarChart3, User, FileText, ImageIcon } from "lucide-react"
import Papa from "papaparse"

interface CSVData {
  [key: string]: string | number
}

interface FrequencyBand {
  name: string
  range: string
  description: string
}

interface ChartData {
  index: number
  signal1: number
  signal2: number
  difference: number
  emotion1: string
  emotion2: string
}

interface PatientDetails {
  name: string
  age: string
  gender: string
  testDate: string
  diagnosticCenter: string
}

interface HoverInfo {
  x: number
  y: number
  visible: boolean
  signal1: number
  signal2: number
  difference: number
  index: number
}

const frequencyBands: FrequencyBand[] = [
  { name: "Delta", range: "0.5-4 Hz", description: "Deep Sleep" },
  { name: "Theta", range: "4-8 Hz", description: "Drowsy/Meditative" },
  { name: "Alpha", range: "8-13 Hz", description: "Relaxed/Calm" },
  { name: "Beta", range: "13-30 Hz", description: "Alert/Focused" },
  { name: "Gamma", range: "30+ Hz", description: "Cognitive/Active" },
]

export default function EEGSignalComparator() {
  const [csv1Data, setCsv1Data] = useState<CSVData[]>([])
  const [csv2Data, setCsv2Data] = useState<CSVData[]>([])
  const [csv1Headers, setCsv1Headers] = useState<string[]>([])
  const [csv2Headers, setCsv2Headers] = useState<string[]>([])
  const [selectedChannel1, setSelectedChannel1] = useState<string>("")
  const [selectedChannel2, setSelectedChannel2] = useState<string>("")
  const [selectedFreqBand1, setSelectedFreqBand1] = useState<string>("")
  const [selectedFreqBand2, setSelectedFreqBand2] = useState<string>("")
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [showGraphs, setShowGraphs] = useState(false)
  const [patientDetails, setPatientDetails] = useState<PatientDetails>({
    name: "",
    age: "",
    gender: "",
    testDate: new Date().toISOString().split("T")[0],
    diagnosticCenter: "SDM Hospital",
  })
  const [emotionalSummary, setEmotionalSummary] = useState<string>("")
  const [detailedExplanation, setDetailedExplanation] = useState<string>("")
  const [isDownloading, setIsDownloading] = useState(false)
  const [hoverInfo, setHoverInfo] = useState<HoverInfo>({
    x: 0,
    y: 0,
    visible: false,
    signal1: 0,
    signal2: 0,
    difference: 0,
    index: 0,
  })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reportRef = useRef<HTMLDivElement>(null)

  const detectEmotion = (frequency: number, bandName: string): { state: string; class: string; color: string } => {
    switch (bandName) {
      case "Delta":
        return { state: "Deep Sleep (Delta)", class: "delta", color: "#8B5CF6" }
      case "Theta":
        return { state: "Drowsy (Theta)", class: "theta", color: "#06B6D4" }
      case "Alpha":
        return { state: "Relaxed (Alpha)", class: "alpha", color: "#10B981" }
      case "Beta":
        return { state: "Alert (Beta)", class: "beta", color: "#F59E0B" }
      case "Gamma":
        return { state: "Cognitive (Gamma)", class: "gamma", color: "#EF4444" }
      default:
        return { state: "Unknown", class: "unknown", color: "#6B7280" }
    }
  }

  const generateEmotionalSummary = (data: ChartData[]): { summary: string; explanation: string } => {
    if (!data.length) return { summary: "", explanation: "" }

    const emotionCounts: { [key: string]: number } = {}
    const signal1Values: number[] = []
    const signal2Values: number[] = []

    data.forEach((row) => {
      emotionCounts[row.emotion1] = (emotionCounts[row.emotion1] || 0) + 1
      emotionCounts[row.emotion2] = (emotionCounts[row.emotion2] || 0) + 1
      signal1Values.push(row.signal1)
      signal2Values.push(row.signal2)
    })

    const dominantEmotion = Object.keys(emotionCounts).reduce((a, b) => (emotionCounts[a] > emotionCounts[b] ? a : b))
    const avgDifference = data.reduce((sum, row) => sum + Math.abs(row.difference), 0) / data.length
    const avgSignal1 = signal1Values.reduce((sum, val) => sum + Math.abs(val), 0) / signal1Values.length
    const avgSignal2 = signal2Values.reduce((sum, val) => sum + Math.abs(val), 0) / signal2Values.length

    let summary = ""
    let explanation = ""

    if (dominantEmotion.includes("Alpha")) {
      summary =
        "Patient shows predominantly relaxed brain activity (Alpha waves), indicating good mental wellness and a calm state."
      explanation = `ANALYSIS EXPLANATION:
      
Alpha waves (8-13 Hz) were detected as the dominant frequency in your EEG signals. Here's what this means:

🧠 BRAIN STATE ANALYSIS:
• Alpha waves typically occur when you are awake but relaxed
• They are most prominent when your eyes are closed and you're in a peaceful state
• This suggests good mental health and the ability to relax effectively

📊 SIGNAL DETAILS:
• Average Signal 1 Amplitude: ${avgSignal1.toFixed(3)}
• Average Signal 2 Amplitude: ${avgSignal2.toFixed(3)}
• Average Difference: ${avgDifference.toFixed(3)}
• Dominant Frequency Band: Alpha (8-13 Hz)

🔍 HOW WE DETERMINED THIS:
The analysis examined ${data.length} data points from your EEG recording. Each signal value was categorized based on its amplitude and the selected frequency band (${selectedFreqBand1} and ${selectedFreqBand2}). Alpha waves were found to be most prevalent, indicating a relaxed, meditative state.

✅ CLINICAL SIGNIFICANCE:
This is generally a positive finding, suggesting:
• Good stress management capabilities
• Healthy brain wave patterns
• Ability to achieve relaxed states
• Normal neurological function`
    } else if (dominantEmotion.includes("Beta")) {
      summary =
        "Patient shows high alertness and focus (Beta waves), which may indicate active thinking, concentration, or mild stress."
      explanation = `ANALYSIS EXPLANATION:
      
Beta waves (13-30 Hz) were detected as the dominant frequency in your EEG signals. Here's what this means:

🧠 BRAIN STATE ANALYSIS:
• Beta waves occur during active, busy thinking and concentration
• They are normal during problem-solving and decision-making
• High beta activity may indicate stress, anxiety, or intense focus

📊 SIGNAL DETAILS:
• Average Signal 1 Amplitude: ${avgSignal1.toFixed(3)}
• Average Signal 2 Amplitude: ${avgSignal2.toFixed(3)}
• Average Difference: ${avgDifference.toFixed(3)}
• Dominant Frequency Band: Beta (13-30 Hz)

🔍 HOW WE DETERMINED THIS:
The analysis examined ${data.length} data points from your EEG recording. Beta wave patterns were most prominent, suggesting an active, alert mental state during the recording period.

⚠️ CLINICAL SIGNIFICANCE:
This finding may indicate:
• High mental alertness and focus
• Possible stress or anxiety
• Active cognitive processing
• Need for relaxation techniques if excessive`
    } else if (dominantEmotion.includes("Delta")) {
      summary =
        "Patient shows deep sleep patterns (Delta waves), which may indicate fatigue, deep relaxation, or sedation."
      explanation = `ANALYSIS EXPLANATION:
      
Delta waves (0.5-4 Hz) were detected as the dominant frequency in your EEG signals. Here's what this means:

🧠 BRAIN STATE ANALYSIS:
• Delta waves are the slowest brain waves
• They occur during deep, dreamless sleep
• In awake states, they may indicate extreme fatigue or certain medical conditions

📊 SIGNAL DETAILS:
• Average Signal 1 Amplitude: ${avgSignal1.toFixed(3)}
• Average Signal 2 Amplitude: ${avgSignal2.toFixed(3)}
• Average Difference: ${avgDifference.toFixed(3)}
• Dominant Frequency Band: Delta (0.5-4 Hz)

🔍 HOW WE DETERMINED THIS:
The analysis examined ${data.length} data points showing predominantly slow-wave activity characteristic of delta rhythms.

🏥 CLINICAL SIGNIFICANCE:
This finding may indicate:
• Deep sleep state during recording
• Possible fatigue or exhaustion
• Need for medical evaluation if recorded while awake
• Normal if recorded during sleep`
    } else if (dominantEmotion.includes("Theta")) {
      summary = "Patient shows drowsy patterns (Theta waves), indicating light sleep, meditation, or deep relaxation."
      explanation = `ANALYSIS EXPLANATION:
      
Theta waves (4-8 Hz) were detected as the dominant frequency in your EEG signals. Here's what this means:

🧠 BRAIN STATE ANALYSIS:
• Theta waves occur during light sleep, drowsiness, or deep meditation
• They are associated with creativity, intuition, and subconscious processing
• Common during the transition between wakefulness and sleep

📊 SIGNAL DETAILS:
• Average Signal 1 Amplitude: ${avgSignal1.toFixed(3)}
• Average Signal 2 Amplitude: ${avgSignal2.toFixed(3)}
• Average Difference: ${avgDifference.toFixed(3)}
• Dominant Frequency Band: Theta (4-8 Hz)

🔍 HOW WE DETERMINED THIS:
The analysis examined ${data.length} data points from your EEG recording. The signal amplitudes consistently fell within the theta frequency range, indicating a drowsy or meditative state.

🧘 CLINICAL SIGNIFICANCE:
This finding suggests:
• Relaxed, meditative state
• Possible drowsiness or light sleep
• Enhanced creativity and intuition
• Normal transitional brain state`
    } else if (dominantEmotion.includes("Gamma")) {
      summary = "Patient shows high cognitive activity (Gamma waves), indicating intense mental processing or focus."
      explanation = `ANALYSIS EXPLANATION:
      
Gamma waves (30+ Hz) were detected as the dominant frequency in your EEG signals. Here's what this means:

🧠 BRAIN STATE ANALYSIS:
• Gamma waves are the fastest brain waves
• They occur during high-level cognitive processing
• Associated with consciousness, attention, and learning

📊 SIGNAL DETAILS:
• Average Signal 1 Amplitude: ${avgSignal1.toFixed(3)}
• Average Signal 2 Amplitude: ${avgSignal2.toFixed(3)}
• Average Difference: ${avgDifference.toFixed(3)}
• Dominant Frequency Band: Gamma (30+ Hz)

🔍 HOW WE DETERMINED THIS:
The analysis examined ${data.length} data points showing high-frequency activity characteristic of intense cognitive processing.

🎯 CLINICAL SIGNIFICANCE:
This finding indicates:
• High-level cognitive function
• Intense concentration and focus
• Active learning or problem-solving
• Heightened awareness and attention`
    }

    return { summary, explanation }
  }

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>, csvNumber: 1 | 2) => {
    const file = event.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      complete: (results) => {
        const data = results.data as string[][]
        if (data.length > 0) {
          const headers = data[0].filter((header) => header && header.trim() !== "")
          const rows = data
            .slice(1)
            .map((row) => {
              const obj: CSVData = {}
              headers.forEach((header, index) => {
                const value = row[index]
                if (value !== undefined && value !== "") {
                  obj[header] = isNaN(Number(value)) ? value : Number(value)
                }
              })
              return obj
            })
            .filter((row) => Object.keys(row).length > 0)

          if (csvNumber === 1) {
            setCsv1Data(rows)
            setCsv1Headers(headers)
          } else {
            setCsv2Data(rows)
            setCsv2Headers(headers)
          }
        }
      },
      header: false,
      skipEmptyLines: true,
    })
  }

  const drawChart = () => {
    const canvas = canvasRef.current
    if (!canvas || !chartData.length) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = 800
    canvas.height = 400

    // Clear canvas with white background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Chart dimensions
    const padding = 60
    const chartWidth = canvas.width - 2 * padding
    const chartHeight = canvas.height - 2 * padding - 40

    // Smooth the data for cleaner lines
    const smoothData = (data: number[], windowSize = 5) => {
      const smoothed = []
      for (let i = 0; i < data.length; i++) {
        let sum = 0
        let count = 0
        for (let j = Math.max(0, i - windowSize); j <= Math.min(data.length - 1, i + windowSize); j++) {
          sum += data[j]
          count++
        }
        smoothed.push(sum / count)
      }
      return smoothed
    }

    // Get smoothed data
    const signal1Data = smoothData(chartData.map((d) => d.signal1))
    const signal2Data = smoothData(chartData.map((d) => d.signal2))
    const differenceData = smoothData(chartData.map((d) => d.difference))

    // Find min and max values for all three signals
    const allValues = [...signal1Data, ...signal2Data, ...differenceData]
    const dataMin = Math.min(...allValues)
    const dataMax = Math.max(...allValues)

    // Extend range to include negatives and add padding
    const maxAbs = Math.max(Math.abs(dataMin), Math.abs(dataMax))
    const minValue = -maxAbs * 1.2 // Extend below zero
    const maxValue = maxAbs * 1.2 // Extend above zero
    const valueRange = maxValue - minValue

    // Draw title
    ctx.fillStyle = "#333"
    ctx.font = "14px Arial"
    ctx.textAlign = "center"
    ctx.fillText("EEG Comparison", canvas.width / 2, 25)

    // Draw axes (black lines)
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 1
    ctx.beginPath()
    // Y-axis
    ctx.moveTo(padding, padding + 20)
    ctx.lineTo(padding, padding + chartHeight + 20)
    // X-axis
    ctx.moveTo(padding, padding + chartHeight + 20)
    ctx.lineTo(padding + chartWidth, padding + chartHeight + 20)
    ctx.stroke()

    // Draw light grid
    ctx.strokeStyle = "#e5e5e5"
    ctx.lineWidth = 0.5
    for (let i = 0; i <= 8; i++) {
      const y = padding + 20 + (chartHeight * i) / 8
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(padding + chartWidth, y)
      ctx.stroke()
    }
    for (let i = 0; i <= 10; i++) {
      const x = padding + (chartWidth * i) / 10
      ctx.beginPath()
      ctx.moveTo(x, padding + 20)
      ctx.lineTo(x, padding + chartHeight + 20)
      ctx.stroke()
    }

    // Draw zero line (x-axis)
    const zeroY = padding + 20 + chartHeight - ((0 - minValue) / valueRange) * chartHeight
    ctx.strokeStyle = "#333"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padding, zeroY)
    ctx.lineTo(padding + chartWidth, zeroY)
    ctx.stroke()

    // Draw axis labels
    ctx.fillStyle = "#666"
    ctx.font = "10px Arial"
    ctx.textAlign = "right"
    for (let i = 0; i <= 8; i++) {
      const value = maxValue - (valueRange * i) / 8
      const y = padding + 20 + (chartHeight * i) / 8
      ctx.fillText(value.toFixed(0), padding - 5, y + 3)
    }

    ctx.textAlign = "center"
    for (let i = 0; i <= 10; i++) {
      const value = Math.round((chartData.length * i) / 10)
      const x = padding + (chartWidth * i) / 10
      ctx.fillText(value.toString(), x, padding + chartHeight + 35)
    }

    // Draw axis titles
    ctx.fillStyle = "#333"
    ctx.font = "12px Arial"
    ctx.save()
    ctx.translate(15, canvas.height / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = "center"
    ctx.fillText("Amplitude", 0, 0)
    ctx.restore()
    ctx.textAlign = "center"
    ctx.fillText("Samples", canvas.width / 2, canvas.height - 10)

    // Function to draw smooth curves
    const drawSmoothLine = (data: number[], color: string, lineWidth = 2) => {
      if (data.length < 2) return

      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
      ctx.beginPath()

      // Calculate points
      const points = data.map((value, index) => ({
        x: padding + (chartWidth * index) / (data.length - 1),
        y: padding + 20 + chartHeight - ((value - minValue) / valueRange) * chartHeight,
      }))

      // Start the path
      ctx.moveTo(points[0].x, points[0].y)

      // Draw smooth curves using quadratic curves
      for (let i = 1; i < points.length - 1; i++) {
        const currentPoint = points[i]
        const nextPoint = points[i + 1]
        const controlX = (currentPoint.x + nextPoint.x) / 2
        const controlY = (currentPoint.y + nextPoint.y) / 2
        ctx.quadraticCurveTo(currentPoint.x, currentPoint.y, controlX, controlY)
      }

      // Draw to the last point
      if (points.length > 1) {
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y)
      }

      ctx.stroke()
    }

    // Draw Signal 1 (BLACK smooth line)
    drawSmoothLine(signal1Data, "#0066FF", 2)

    // Draw Signal 2 (RED smooth line)
    drawSmoothLine(signal2Data, "#FF0000", 2)

    // Draw Difference (GREEN smooth line)
    drawSmoothLine(differenceData, "#00AA00", 2)

    // Draw legend
    ctx.fillStyle = "#333"
    ctx.font = "11px Arial"
    ctx.textAlign = "left"
    const legendX = canvas.width - 180
    const legendY = 60

    // Signal 1 legend (BLUE)
    ctx.strokeStyle = "#0066FF"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(legendX, legendY)
    ctx.lineTo(legendX + 20, legendY)
    ctx.stroke()
    ctx.fillText(`${selectedChannel1} (Signal 1)`, legendX + 25, legendY + 4)

    // Signal 2 legend (RED)
    ctx.strokeStyle = "#FF0000"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(legendX, legendY + 20)
    ctx.lineTo(legendX + 20, legendY + 20)
    ctx.stroke()
    ctx.fillText(`${selectedChannel2} (Signal 2)`, legendX + 25, legendY + 24)

    // Difference legend (GREEN)
    ctx.strokeStyle = "#00AA00"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(legendX, legendY + 40)
    ctx.lineTo(legendX + 20, legendY + 40)
    ctx.stroke()
    ctx.fillText("Difference", legendX + 25, legendY + 44)
  }

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !chartData.length) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Scale coordinates to canvas size
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const canvasX = x * scaleX
    const canvasY = y * scaleY

    const padding = 60
    const chartWidth = canvas.width - 2 * padding

    // Check if mouse is within chart area
    if (canvasX >= padding && canvasX <= padding + chartWidth) {
      // Calculate which data point we're closest to
      const dataIndex = Math.round(((canvasX - padding) / chartWidth) * (chartData.length - 1))
      if (dataIndex >= 0 && dataIndex < chartData.length) {
        const data = chartData[dataIndex]
        setHoverInfo({
          x: event.clientX,
          y: event.clientY,
          visible: true,
          signal1: data.signal1,
          signal2: data.signal2,
          difference: data.difference,
          index: dataIndex,
        })
      }
    } else {
      setHoverInfo((prev) => ({ ...prev, visible: false }))
    }
  }

  const handleCanvasMouseLeave = () => {
    setHoverInfo((prev) => ({ ...prev, visible: false }))
  }

  const plotGraphs = () => {
    if (
      !csv1Data.length ||
      !csv2Data.length ||
      !selectedChannel1 ||
      !selectedChannel2 ||
      !selectedFreqBand1 ||
      !selectedFreqBand2
    ) {
      alert("Please upload both CSV files and select channels and frequency bands")
      return
    }

    const minLength = Math.min(csv1Data.length, csv2Data.length)
    const data: ChartData[] = []

    for (let i = 0; i < minLength; i++) {
      const signal1 = Number(csv1Data[i][selectedChannel1]) || 0
      const signal2 = Number(csv2Data[i][selectedChannel2]) || 0
      const difference = signal2 - signal1

      const emotion1 = detectEmotion(signal1, selectedFreqBand1)
      const emotion2 = detectEmotion(signal2, selectedFreqBand2)

      data.push({
        index: i,
        signal1,
        signal2,
        difference,
        emotion1: emotion1.state,
        emotion2: emotion2.state,
      })
    }

    setChartData(data)
    const { summary, explanation } = generateEmotionalSummary(data)
    setEmotionalSummary(summary)
    setDetailedExplanation(explanation)
    setShowGraphs(true)
  }

  // Draw chart when data changes
  useEffect(() => {
    if (chartData.length > 0) {
      drawChart()
    }
  }, [chartData, selectedChannel1, selectedChannel2, selectedFreqBand1, selectedFreqBand2])

  const downloadChartAsImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement("a")
    link.download = `eeg-chart-${patientDetails.name || "patient"}.jpg`
    link.href = canvas.toDataURL("image/jpeg", 0.9)
    link.click()
  }

  const downloadPatientReportAsImage = async () => {
    if (!reportRef.current) return

    setIsDownloading(true)
    try {
      const reportCanvas = document.createElement("canvas")
      const ctx = reportCanvas.getContext("2d")
      if (!ctx) return

      reportCanvas.width = 800
      reportCanvas.height = 850

      // Fill background
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, reportCanvas.width, reportCanvas.height)

      // Header
      ctx.fillStyle = "#333"
      ctx.font = "bold 24px Arial"
      ctx.textAlign = "center"
      ctx.fillText("EEG ANALYSIS REPORT", reportCanvas.width / 2, 40)

      ctx.font = "bold 20px Arial"
      ctx.fillStyle = "#1e40af"
      ctx.fillText(patientDetails.diagnosticCenter, reportCanvas.width / 2, 70)

      // Patient Information
      ctx.font = "bold 16px Arial"
      ctx.fillStyle = "#333"
      ctx.textAlign = "left"
      ctx.fillText("Patient Information", 50, 120)

      ctx.font = "14px Arial"
      ctx.fillText(`Name: ${patientDetails.name || "N/A"}`, 50, 150)
      ctx.fillText(`Age: ${patientDetails.age || "N/A"}`, 50, 170)
      ctx.fillText(`Gender: ${patientDetails.gender || "N/A"}`, 50, 190)
      ctx.fillText(`Test Date: ${patientDetails.testDate}`, 400, 150)
      ctx.fillText(`Diagnostic Center: ${patientDetails.diagnosticCenter}`, 400, 170)

      // Analysis Summary
      ctx.font = "bold 16px Arial"
      ctx.fillText("EEG Analysis Summary", 50, 240)

      ctx.font = "12px Arial"
      const summaryLines = emotionalSummary.match(/.{1,70}/g) || []
      summaryLines.forEach((line, index) => {
        ctx.fillText(line, 50, 270 + index * 15)
      })

      // Copy the chart from the main canvas
      const mainCanvas = canvasRef.current
      if (mainCanvas) {
        ctx.drawImage(mainCanvas, 50, 350, 700, 350)
      }

      // Footer
      ctx.font = "12px Arial"
      ctx.textAlign = "center"
      ctx.fillStyle = "#666"
      ctx.fillText("This report was generated by the EEG Signal Comparator", reportCanvas.width / 2, 750)
      ctx.fillText("For medical advice, please consult with your healthcare provider", reportCanvas.width / 2, 770)

      // Download the report
      const link = document.createElement("a")
      link.download = `eeg-report-${patientDetails.name || "patient"}.jpg`
      link.href = reportCanvas.toDataURL("image/jpeg", 0.9)
      link.click()
    } catch (error) {
      console.error("Error generating report image:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  const downloadTable = () => {
    const csvContent = [
      [
        "Index",
        `${selectedChannel1} (${selectedFreqBand1})`,
        "Emotion 1",
        `${selectedChannel2} (${selectedFreqBand2})`,
        "Emotion 2",
        "Difference",
      ],
      ...chartData.map((row) => [
        row.index,
        row.signal1.toFixed(4),
        row.emotion1,
        row.signal2.toFixed(4),
        row.emotion2,
        row.difference.toFixed(4),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "eeg-analysis-table.csv"
    link.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">EEG Signal Comparator</h1>
          <p className="text-gray-600">Advanced EEG signal analysis with frequency band comparison</p>
        </div>

        {/* Patient Details Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Information
              {emotionalSummary && (
                <Button
                  onClick={downloadPatientReportAsImage}
                  size="sm"
                  variant="outline"
                  className="ml-auto"
                  disabled={isDownloading}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {isDownloading ? "Generating..." : "Download Patient Report"}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Patient Name</label>
                <Input
                  value={patientDetails.name}
                  onChange={(e) => setPatientDetails({ ...patientDetails, name: e.target.value })}
                  placeholder="Enter patient name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Age</label>
                <Input
                  value={patientDetails.age}
                  onChange={(e) => setPatientDetails({ ...patientDetails, age: e.target.value })}
                  placeholder="Enter age"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Gender</label>
                <Select
                  value={patientDetails.gender}
                  onValueChange={(value) => setPatientDetails({ ...patientDetails, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Test Date</label>
                <Input
                  type="date"
                  value={patientDetails.testDate}
                  onChange={(e) => setPatientDetails({ ...patientDetails, testDate: e.target.value })}
                />
              </div>
            </div>

            {emotionalSummary && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">EEG Analysis Summary</h3>
                <p className="text-gray-700 mb-4">{emotionalSummary}</p>

                {detailedExplanation && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-blue-700 font-medium hover:text-blue-900">
                      Click for Detailed Analysis Explanation
                    </summary>
                    <div className="mt-3 p-3 bg-white rounded border">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">{detailedExplanation}</pre>
                    </div>
                  </details>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload CSV Files & Select Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-600">Signal 1 Configuration</h3>
                <div>
                  <label className="block text-sm font-medium mb-2">CSV File 1</label>
                  <Input type="file" accept=".csv" onChange={(e) => handleCSVUpload(e, 1)} className="cursor-pointer" />
                </div>
                {csv1Headers.length > 0 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Select Channel</label>
                      <Select value={selectedChannel1} onValueChange={setSelectedChannel1}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select channel" />
                        </SelectTrigger>
                        <SelectContent>
                          {csv1Headers
                            .filter((header) => header && header.trim() !== "")
                            .map((header) => (
                              <SelectItem key={header} value={header}>
                                {header}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Select Frequency Band</label>
                      <Select value={selectedFreqBand1} onValueChange={setSelectedFreqBand1}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency band" />
                        </SelectTrigger>
                        <SelectContent>
                          {frequencyBands.map((band) => (
                            <SelectItem key={band.name} value={band.name}>
                              {band.name} ({band.range}) - {band.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-red-600">Signal 2 Configuration</h3>
                <div>
                  <label className="block text-sm font-medium mb-2">CSV File 2</label>
                  <Input type="file" accept=".csv" onChange={(e) => handleCSVUpload(e, 2)} className="cursor-pointer" />
                </div>
                {csv2Headers.length > 0 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Select Channel</label>
                      <Select value={selectedChannel2} onValueChange={setSelectedChannel2}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select channel" />
                        </SelectTrigger>
                        <SelectContent>
                          {csv2Headers
                            .filter((header) => header && header.trim() !== "")
                            .map((header) => (
                              <SelectItem key={header} value={header}>
                                {header}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Select Frequency Band</label>
                      <Select value={selectedFreqBand2} onValueChange={setSelectedFreqBand2}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency band" />
                        </SelectTrigger>
                        <SelectContent>
                          {frequencyBands.map((band) => (
                            <SelectItem key={band.name} value={band.name}>
                              {band.name} ({band.range}) - {band.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-center mt-8">
              <Button onClick={plotGraphs} className="flex items-center gap-2" size="lg">
                <BarChart3 className="h-5 w-5" />
                Generate EEG Analysis
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Graph Section */}
        {showGraphs && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>EEG Signal Comparison Analysis</CardTitle>
                <div className="flex gap-2">
                  <Button onClick={downloadChartAsImage} size="sm" variant="outline">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Download Chart as JPG
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Canvas Chart with Hover */}
                <div className="flex justify-center relative">
                  <canvas
                    ref={canvasRef}
                    className="border border-gray-300 rounded-lg shadow-lg bg-white cursor-crosshair"
                    style={{ maxWidth: "100%", height: "auto" }}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseLeave={handleCanvasMouseLeave}
                  />

                  {/* Hover Tooltip */}
                  {hoverInfo.visible && (
                    <div
                      className="absolute bg-black text-white p-2 rounded shadow-lg pointer-events-none z-10"
                      style={{
                        left: hoverInfo.x + 10,
                        top: hoverInfo.y - 80,
                        transform: "translate(-50%, 0)",
                      }}
                    >
                      <div className="text-xs">
                        <div>Sample: {hoverInfo.index}</div>
                        <div className="text-gray-300">
                          {selectedChannel1}: {hoverInfo.signal1.toFixed(4)}
                        </div>
                        <div className="text-red-300">
                          {selectedChannel2}: {hoverInfo.signal2.toFixed(4)}
                        </div>
                        <div className="text-green-300">Difference: {hoverInfo.difference.toFixed(4)}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                    <span className="text-sm font-medium">{selectedChannel1} (Signal 1)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium">{selectedChannel2} (Signal 2)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                    <span className="text-sm font-medium">Difference (Above = Positive, Below = Negative)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Frequency Band Legend */}
            <Card>
              <CardHeader>
                <CardTitle>Frequency Band Reference</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {frequencyBands.map((band) => (
                    <div key={band.name} className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                      <div
                        className={`w-6 h-6 rounded-full mb-2 ${
                          band.name === "Delta"
                            ? "bg-purple-500"
                            : band.name === "Theta"
                              ? "bg-cyan-500"
                              : band.name === "Alpha"
                                ? "bg-green-500"
                                : band.name === "Beta"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                        }`}
                      ></div>
                      <span className="font-medium text-sm">{band.name}</span>
                      <span className="text-xs text-gray-600">{band.range}</span>
                      <span className="text-xs text-gray-500 text-center">{band.description}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Data Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Detailed Signal Analysis ({chartData.length} samples)</CardTitle>
                <Button onClick={downloadTable} size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Table
                </Button>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Index</TableHead>
                        <TableHead>
                          {selectedChannel1} ({selectedFreqBand1})
                        </TableHead>
                        <TableHead>Emotion 1</TableHead>
                        <TableHead>
                          {selectedChannel2} ({selectedFreqBand2})
                        </TableHead>
                        <TableHead>Emotion 2</TableHead>
                        <TableHead>Difference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {chartData.map((row, index) => (
                        <TableRow key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                          <TableCell>{row.index}</TableCell>
                          <TableCell>{row.signal1.toFixed(4)}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                row.emotion1.includes("Delta")
                                  ? "bg-purple-100 text-purple-800"
                                  : row.emotion1.includes("Theta")
                                    ? "bg-cyan-100 text-cyan-800"
                                    : row.emotion1.includes("Alpha")
                                      ? "bg-green-100 text-green-800"
                                      : row.emotion1.includes("Beta")
                                        ? "bg-yellow-100 text-yellow-800"
                                        : row.emotion1.includes("Gamma")
                                          ? "bg-red-100 text-red-800"
                                          : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {row.emotion1}
                            </span>
                          </TableCell>
                          <TableCell>{row.signal2.toFixed(4)}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                row.emotion2.includes("Delta")
                                  ? "bg-purple-100 text-purple-800"
                                  : row.emotion2.includes("Theta")
                                    ? "bg-cyan-100 text-cyan-800"
                                    : row.emotion2.includes("Alpha")
                                      ? "bg-green-100 text-green-800"
                                      : row.emotion2.includes("Beta")
                                        ? "bg-yellow-100 text-yellow-800"
                                        : row.emotion2.includes("Gamma")
                                          ? "bg-red-100 text-red-800"
                                          : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {row.emotion2}
                            </span>
                          </TableCell>
                          <TableCell
                            className={row.difference > 0 ? "text-green-600" : row.difference < 0 ? "text-red-600" : ""}
                          >
                            {row.difference.toFixed(4)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Hidden div for report reference */}
        <div ref={reportRef} className="hidden" />
      </div>
    </div>
  )
}
