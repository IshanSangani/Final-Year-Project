/**
 * RecordButton Component
 * A styled button for recording audio
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Easing,
  Text,
  AccessibilityInfo
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import theme from '../styles/theme';

const RecordButton = ({ 
  isRecording = false, 
  onPressIn, 
  onPressOut,
  onPress,
  disabled = false,
  mode = 'press-hold', // 'press-hold' or 'toggle'
  size = 'large',
  style = {},
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [accessibilityEnabled, setAccessibilityEnabled] = useState(false);

  // Check if screen reader is enabled
  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(
      screenReaderEnabled => {
        setAccessibilityEnabled(screenReaderEnabled);
      }
    );
  }, []);

  // Animation effects
  useEffect(() => {
    if (isRecording) {
      // Start the pulsing animation for recording state
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Reset animations
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isRecording, pulseAnim]);

  const handlePressIn = () => {
    if (disabled) return;
    
    // Scale down animation
    Animated.timing(scale, {
      toValue: 0.9,
      duration: 200,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Call onPressIn handler
    if (mode === 'press-hold' && onPressIn) {
      onPressIn();
    }
  };

  const handlePressOut = () => {
    if (disabled) return;
    
    // Scale back up animation
    Animated.timing(scale, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();

    // Call onPressOut handler
    if (mode === 'press-hold' && onPressOut) {
      onPressOut();
    }
  };

  const handlePress = () => {
    if (disabled) return;
    
    // Haptic feedback for toggle mode
    if (mode === 'toggle') {
      Haptics.impactAsync(
        isRecording 
          ? Haptics.ImpactFeedbackStyle.Light 
          : Haptics.ImpactFeedbackStyle.Medium
      );
      
      // Call onPress handler for toggle mode
      if (onPress) {
        onPress();
      }
    }
  };

  // Determine button size
  const buttonSize = size === 'large' ? 80 : size === 'medium' ? 60 : 40;
  const iconSize = size === 'large' ? 36 : size === 'medium' ? 28 : 20;

  // Determine inner and outer colors based on recording state
  const outerColor = isRecording ? theme.colors.recording : theme.colors.primary;
  const innerColor = isRecording ? '#FFFFFF' : theme.colors.background;
  const iconColor = isRecording ? theme.colors.recording : theme.colors.primary;

  return (
    <View style={[styles.container, style]}>
      {isRecording && (
        <Animated.View 
          style={[
            styles.pulse, 
            { 
              width: buttonSize * 1.5, 
              height: buttonSize * 1.5,
              borderRadius: buttonSize * 0.75,
              transform: [{ scale: pulseAnim }],
              backgroundColor: `${theme.colors.recording}40`, // 25% opacity
            }
          ]} 
        />
      )}
      <Animated.View
        style={{
          transform: [{ scale }],
        }}
      >
        <TouchableOpacity
          style={[
            styles.button, 
            { 
              width: buttonSize, 
              height: buttonSize,
              borderRadius: buttonSize / 2,
              backgroundColor: outerColor,
              borderWidth: isRecording ? 0 : 1,
            }
          ]}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          disabled={disabled}
          activeOpacity={0.8}
          accessibilityLabel={isRecording ? "Stop recording" : "Start recording"}
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          accessibilityHint={
            mode === 'press-hold' 
              ? "Press and hold to record audio" 
              : "Tap to start or stop recording audio"
          }
        >
          <View style={[
            styles.innerButton, 
            { 
              width: buttonSize * 0.7,
              height: buttonSize * 0.7,
              borderRadius: buttonSize * 0.35,
              backgroundColor: innerColor,
            }
          ]}>
            <Ionicons 
              name={isRecording ? "square" : "mic"} 
              size={iconSize} 
              color={iconColor} 
            />
          </View>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Add label for accessibility */}
      {accessibilityEnabled && (
        <Text style={styles.accessibilityLabel}>
          {isRecording ? "Recording in progress. Tap to stop." : "Tap to record"}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    ...theme.shadows.medium,
  },
  innerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  pulse: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1,
  },
  accessibilityLabel: {
    marginTop: theme.spacing.s,
    fontSize: theme.typography.fontSize.s,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    opacity: 0, // Visual users won't see this text
    height: 1,
  },
});

export default RecordButton;
