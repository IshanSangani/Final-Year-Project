/**
 * SpectrogramRenderer Component
 * Renders an audio spectrogram visualization
 * 
 * REQUIRED DEPENDENCIES (DO NOT EDIT package.json, install these manually):
 * npm install react-native-svg
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import theme from '../styles/theme';

// Conditionally import SVG components based on availability
let Svg, Rect, G;
try {
  ({ Svg, Rect, G } = require('react-native-svg'));
} catch (e) {
  console.log('react-native-svg not available. Using fallback renderer.');
}

// Import FFT utils for spectrogram generation
import fftUtils from '../utils/fft';

const WINDOW_WIDTH = Dimensions.get('window').width;
const DEFAULT_HEIGHT = 200;
const DEFAULT_CELL_SIZE = 6;

const SpectrogramRenderer = ({
  audioData = null, // Audio buffer data
  spectrogram = null, // Pre-computed spectrogram data (if available)
  width = WINDOW_WIDTH - theme.spacing.l * 2,
  height = DEFAULT_HEIGHT,
  cellSize = DEFAULT_CELL_SIZE,
  style = {},
  colorGradient = theme.colors.spectrogram,
}) => {
  const [spectrogramData, setSpectrogramData] = useState(null);
  const [error, setError] = useState(null);

  // Generate spectrogram data if not provided
  useEffect(() => {
    if (spectrogram) {
      setSpectrogramData(spectrogram);
      return;
    }

    if (!audioData || audioData.length === 0) {
      return;
    }

    try {
      const computedSpectrogram = fftUtils.generateSpectrogram(
        audioData,
        1024, // FFT size
        512   // Hop size
      );
      setSpectrogramData(computedSpectrogram);
    } catch (err) {
      console.error('Error generating spectrogram:', err);
      setError('Failed to generate spectrogram');
    }
  }, [audioData, spectrogram]);

  // If SVG components are not available, render a fallback visualization
  if (!Svg || !Rect || !G) {
    return <FallbackSpectrogram width={width} height={height} style={style} />;
  }

  // If there's no data to render
  if (!spectrogramData && !audioData) {
    return (
      <View style={[styles.container, { width, height }, style]}>
        <Text style={styles.placeholder}>No audio data available</Text>
      </View>
    );
  }

  // If there was an error
  if (error) {
    return (
      <View style={[styles.container, { width, height }, style]}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  // If data is still processing
  if (!spectrogramData) {
    return (
      <View style={[styles.container, { width, height }, style]}>
        <Text style={styles.placeholder}>Generating spectrogram...</Text>
      </View>
    );
  }

  // Calculate dimensions
  const timeSteps = spectrogramData.length;
  const freqBins = spectrogramData[0]?.length || 0;
  
  // Adjust cell size if needed to fit within width/height
  const adjustedCellWidth = Math.min(cellSize, width / timeSteps);
  const adjustedCellHeight = Math.min(cellSize, height / freqBins);
  
  // Limit the number of bins to display based on height
  const maxFreqBins = Math.floor(height / adjustedCellHeight);
  const visibleFreqBins = Math.min(freqBins, maxFreqBins);
  
  // Get color for intensity value (0-1)
  const getColor = (value) => {
    // Use the color gradient based on intensity
    if (value < 0.25) return colorGradient[0];
    if (value < 0.5) return colorGradient[1];
    if (value < 0.75) return colorGradient[2];
    return colorGradient[3];
  };

  return (
    <View style={[styles.container, { width, height }, style]}>
      <Svg width={width} height={height}>
        <G>
          {spectrogramData.map((timeSlice, timeIndex) => {
            // Skip rendering cells that would be off-screen
            if (timeIndex * adjustedCellWidth > width) return null;
            
            return timeSlice.slice(0, visibleFreqBins).map((intensity, freqIndex) => {
              // Invert frequency index to show low frequencies at the bottom
              const invertedFreqIndex = visibleFreqBins - freqIndex - 1;
              
              return (
                <Rect
                  key={`${timeIndex}-${freqIndex}`}
                  x={timeIndex * adjustedCellWidth}
                  y={invertedFreqIndex * adjustedCellHeight}
                  width={adjustedCellWidth}
                  height={adjustedCellHeight}
                  fill={getColor(intensity)}
                />
              );
            });
          })}
        </G>
      </Svg>
    </View>
  );
};

// Fallback spectrogram renderer that doesn't require SVG
const FallbackSpectrogram = ({ width, height, style }) => {
  // Create a simple grid of colored divs as a fallback
  const rows = 20;
  const cols = 40;
  const cellWidth = width / cols;
  const cellHeight = height / rows;
  
  // Generate mock spectrogram data
  const mockData = [];
  for (let i = 0; i < rows; i++) {
    const row = [];
    for (let j = 0; j < cols; j++) {
      // Create a pattern that looks somewhat like a spectrogram
      const centerX = cols / 2;
      const centerY = rows / 2;
      const distanceFromCenter = Math.sqrt(
        Math.pow(j - centerX, 2) + 
        Math.pow(i - centerY, 2)
      );
      
      // Create some patterns
      const value = Math.max(0, Math.min(1, 
        0.8 - (distanceFromCenter / Math.max(cols, rows)) + 
        0.2 * Math.sin(j * 0.5) + 
        0.1 * Math.cos(i * 0.7)
      ));
      
      row.push(value);
    }
    mockData.push(row);
  }
  
  return (
    <View style={[styles.container, { width, height }, style]}>
      <Text style={styles.fallbackTitle}>Client-side spectrogram preview (approx.)</Text>
      <View style={styles.fallbackGrid}>
        {mockData.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.fallbackRow}>
            {row.map((value, colIndex) => {
              // Use opacity to represent intensity
              const backgroundColor = `rgba(76, 110, 245, ${value})`;
              return (
                <View
                  key={`cell-${rowIndex}-${colIndex}`}
                  style={{
                    width: cellWidth,
                    height: cellHeight,
                    backgroundColor,
                  }}
                />
              );
            })}
          </View>
        ))}
      </View>
      <Text style={styles.fallbackNote}>
        Install react-native-svg for better visualizations
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    overflow: 'hidden',
  },
  placeholder: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.m,
  },
  error: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.m,
  },
  fallbackTitle: {
    position: 'absolute',
    top: theme.spacing.s,
    fontSize: theme.typography.fontSize.s,
    color: theme.colors.textSecondary,
    zIndex: 10,
  },
  fallbackGrid: {
    width: '100%',
    height: '100%',
    flexDirection: 'column',
  },
  fallbackRow: {
    flexDirection: 'row',
  },
  fallbackNote: {
    position: 'absolute',
    bottom: theme.spacing.s,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
  },
});

export default SpectrogramRenderer;
