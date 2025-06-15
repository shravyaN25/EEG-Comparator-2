import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

# Sample data generation for demonstration
# In real use, you would load your CSV files here
np.random.seed(42)
samples = 1000

# Generate sample EEG-like data
signal1 = np.random.normal(0, 50, samples) + 10 * np.sin(np.linspace(0, 20*np.pi, samples))
signal2 = np.random.normal(0, 60, samples) + 15 * np.sin(np.linspace(0, 25*np.pi, samples)) + 20
difference = signal2 - signal1

# Create the plot
plt.figure(figsize=(12, 6))

# Plot all three lines
plt.plot(range(samples), signal1, color='#999999', linewidth=1.5, label='Signal 1 (Channel 1)', alpha=0.8)
plt.plot(range(samples), signal2, color='#4A90E2', linewidth=1.5, label='Signal 2 (Channel 2)', alpha=0.8)
plt.plot(range(samples), difference, color='#FF6B6B', linewidth=1.5, label='Difference (Signal2 - Signal1)', alpha=0.8)

# Customize the plot
plt.title('EEG Comparison', fontsize=14, fontweight='normal')
plt.xlabel('Samples', fontsize=12)
plt.ylabel('Amplitude', fontsize=12)

# Add grid
plt.grid(True, alpha=0.3, linestyle='-', linewidth=0.5)

# Add legend
plt.legend(loc='upper right', fontsize=10)

# Set axis limits and ticks
plt.xlim(0, samples)
plt.xticks(np.linspace(0, samples, 6))

# Make it look clean and professional
plt.tight_layout()

# Display the plot
plt.show()

print("EEG Comparison Plot Generated Successfully!")
print(f"Signal 1 range: {signal1.min():.2f} to {signal1.max():.2f}")
print(f"Signal 2 range: {signal2.min():.2f} to {signal2.max():.2f}")
print(f"Difference range: {difference.min():.2f} to {difference.max():.2f}")
