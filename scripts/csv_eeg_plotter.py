import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

def plot_eeg_comparison(csv1_path, csv2_path, channel1, channel2):
    """
    Plot EEG comparison with three lines: signal1, signal2, and difference
    
    Parameters:
    csv1_path: path to first CSV file
    csv2_path: path to second CSV file
    channel1: column name for first signal
    channel2: column name for second signal
    """
    
    try:
        # Read CSV files
        df1 = pd.read_csv(csv1_path)
        df2 = pd.read_csv(csv2_path)
        
        # Extract signals
        signal1 = df1[channel1].values
        signal2 = df2[channel2].values
        
        # Make sure both signals have the same length
        min_length = min(len(signal1), len(signal2))
        signal1 = signal1[:min_length]
        signal2 = signal2[:min_length]
        
        # Calculate difference
        difference = signal2 - signal1
        
        # Create the plot
        plt.figure(figsize=(12, 6))
        
        # Plot all three lines with clear, distinct colors
        plt.plot(range(min_length), signal1, 
                color='#999999', linewidth=1.5, 
                label=f'{channel1} (CSV 1)', alpha=0.8)
        
        plt.plot(range(min_length), signal2, 
                color='#4A90E2', linewidth=1.5, 
                label=f'{channel2} (CSV 2)', alpha=0.8)
        
        plt.plot(range(min_length), difference, 
                color='#FF6B6B', linewidth=1.5, 
                label='Difference (CSV2 - CSV1)', alpha=0.8)
        
        # Customize the plot to match your reference image
        plt.title('EEG Comparison', fontsize=14, fontweight='normal')
        plt.xlabel('Samples', fontsize=12)
        plt.ylabel('Amplitude', fontsize=12)
        
        # Add grid (light gray like in reference)
        plt.grid(True, alpha=0.3, linestyle='-', linewidth=0.5)
        
        # Add legend in upper right
        plt.legend(loc='upper right', fontsize=10)
        
        # Set clean axis limits
        plt.xlim(0, min_length)
        plt.xticks(np.linspace(0, min_length, 6, dtype=int))
        
        # Make it look professional
        plt.tight_layout()
        
        # Show the plot
        plt.show()
        
        # Print statistics
        print("EEG Analysis Complete!")
        print(f"Samples analyzed: {min_length}")
        print(f"Signal 1 ({channel1}) - Mean: {signal1.mean():.3f}, Std: {signal1.std():.3f}")
        print(f"Signal 2 ({channel2}) - Mean: {signal2.mean():.3f}, Std: {signal2.std():.3f}")
        print(f"Difference - Mean: {difference.mean():.3f}, Std: {difference.std():.3f}")
        
        return signal1, signal2, difference
        
    except Exception as e:
        print(f"Error: {e}")
        print("Please check your CSV file paths and column names.")
        return None, None, None

# Example usage (uncomment and modify paths as needed):
# signal1, signal2, diff = plot_eeg_comparison('path/to/file1.csv', 'path/to/file2.csv', 'channel1', 'channel2')
