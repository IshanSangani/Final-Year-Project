/**
 * WaveformMeter Component
 * Displays real-time audio amplitude levels as an animated waveform
 */

import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import theme from '../styles/theme';

const WINDOW_WIDTH = Dimensions.get('window').width;
const MAX_BAR_HEIGHT = 100; // Maximum height of the tallest bar in the waveform
const DEFAULT_NUM_BARS = 32; // Number of amplitude bars to display

const WaveformMeter = ({
  amplitude = 0, // Normalized amplitude value between 0 and 1
  isRecording = false,
  color = theme.colors.waveform,
  activeColor = theme.colors.recording,
  style = {},
  numBars = DEFAULT_NUM_BARS,
  mirror = true, // Whether to mirror the waveform vertically
}) => {
  const [barValues, setBarValues] = useState([]);
  const animatedValues = useRef([]).current;

  // Initialize or update animated values array
  useEffect(() => {
    // Create or update animated values array to match number of bars
    while (animatedValues.length < numBars) {
      animatedValues.push(new Animated.Value(0));
    }
    
    // Initialize bar values if empty
    if (barValues.length === 0) {
      setBarValues(new Array(numBars).fill(0));
    }
  }, [numBars]);

  // Update and animate bars when amplitude changes
  useEffect(() => {
    if (!isRecording) {
      // Reset bars when not recording
      const animations = animatedValues.map(anim =>
        Animated.timing(anim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        })
      );
      Animated.parallel(animations).start();
      return;
    }

    // Generate new bar values - simulate natural audio waveform
    // Use the amplitude value but add some randomness for a natural look
    const newValues = [];
    for (let i = 0; i < numBars; i++) {
      // Center bars tend to be taller
      const distanceFromCenter = Math.abs(i - numBars / 2) / (numBars / 2);
      const centerBoost = 1 - 0.3 * distanceFromCenter;
      
      // Randomize height but constrained by amplitude
      const randomFactor = 0.3 + Math.random() * 0.7;
      let value = amplitude * randomFactor * centerBoost;
      
      // Add small minimum height when recording
      if (isRecording && value < 0.05) {
        value = 0.05 + Math.random() * 0.05;
      }
      
      newValues.push(value);
    }

    // Smooth transition by averaging with previous values
    const smoothedValues = barValues.length > 0
      ? newValues.map((val, i) => barValues[i] * 0.6 + val * 0.4)
      : newValues;

    setBarValues(smoothedValues);

    // Animate to new values
    const animations = animatedValues.map((anim, i) =>
      Animated.timing(anim, {
        toValue: smoothedValues[i],
        duration: 50,
        useNativeDriver: false,
      })
    );

    Animated.parallel(animations).start();
  }, [amplitude, isRecording]);

  const barColor = isRecording ? activeColor : color;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.barsContainer}>
        {animatedValues.map((anim, index) => (
          <React.Fragment key={index}>
            <Animated.View
              style={[
                styles.bar,
                {
                  height: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [3, MAX_BAR_HEIGHT],
                  }),
                  backgroundColor: barColor,
                  width: (WINDOW_WIDTH - theme.spacing.l * 2) / numBars - 2,
                },
              ]}
            />
            {index < numBars - 1 && <View style={styles.barSpacer} />}
          </React.Fragment>
        ))}
      </View>
      
      {/* Mirror the waveform if enabled */}
      {mirror && (
        <View style={[styles.barsContainer, styles.mirrorContainer]}>
          {animatedValues.map((anim, index) => (
            <React.Fragment key={`mirror-${index}`}>
              <Animated.View
                style={[
                  styles.bar,
                  styles.mirrorBar,
                  {
                    height: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [3, MAX_BAR_HEIGHT],
                    }),
                    backgroundColor: barColor,
                    width: (WINDOW_WIDTH - theme.spacing.l * 2) / numBars - 2,
                    opacity: 0.4, // Make mirrored bars semi-transparent
                  },
                ]}
              />
              {index < numBars - 1 && <View style={styles.barSpacer} />}
            </React.Fragment>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.l,
  },
  barsContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: MAX_BAR_HEIGHT / 2,
  },
  mirrorContainer: {
    transform: [{ rotateX: '180deg' }],
    opacity: 0.3,
  },
  bar: {
    width: 3,
    borderRadius: 3,
  },
  mirrorBar: {
    opacity: 0.5,
  },
  barSpacer: {
    width: 2,
  },
});

export default WaveformMeter;
