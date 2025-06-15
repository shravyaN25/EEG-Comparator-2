import matplotlib.pyplot as plt
import numpy as np

# Create sample data that looks like your reference image
samples = 3000
x = np.linspace(0, samples, samples)

# Signal 1 - relatively flat with small variations (like gray line in reference)
signal1 = np.random.normal(0, 20, samples) + 5 * np.sin(x/100)

# Signal 2 - with some peaks and variations (like blue line in reference)
signal2 = np.random.normal(0, 30, samples) + 50 * np.sin(x/200) + 100 * np.exp(-((x-1500)**2)/50000)

# Difference between the two signals
difference = signal2 - signal1

# Create the plot exactly like your reference image
plt.figure(figsize=(10, 5), facecolor='white')

# Plot the three lines
plt.plot(x, signal1, color='#888888', linewidth=1, label='Fz1-M1 (CSV 1)', alpha=0.9)
plt.plot(x, signal2, color='#4A90E2', linewidth=1, label='Fz1-M2 (CSV 2)', alpha=0.9)
plt.plot(x, difference, color='#FF6B6B', linewidth=1, label='Difference', alpha=0.9)

# Style the plot to match reference image
plt.title('EEG Comparison', fontsize=12, pad=20)
plt.xlabel('Samples', fontsize=10)
plt.ylabel('Amplitude', fontsize=10)

# Add grid
plt.grid(True, alpha=0.3, linestyle='-', linewidth=0.5)

# Set axis limits and ticks to match reference
plt.xlim(0, 3000)
plt.ylim(-400, 400)
plt.xticks([0, 500, 1000, 1500, 2000, 2500, 3000])
plt.yticks([-400, -200, 0, 200, 400])

# Add legend in upper right corner
plt.legend(loc='upper right', fontsize=9, framealpha=0.9)

# Clean layout
plt.tight_layout()

# Display
plt.show()

print("✅ EEG Comparison Plot Generated!")
print("📊 Three lines plotted:")
print("   - Gray line: Signal 1 (CSV 1)")
print("   - Blue line: Signal 2 (CSV 2)") 
print("   - Red line: Difference (Signal2 - Signal1)")
