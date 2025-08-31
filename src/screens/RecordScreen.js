/**
 * RecordScreen
 * Screen for recording and saving audio samples
 * 
 * REQUIRED DEPENDENCIES (DO NOT EDIT package.json, install these manually):
 * expo install expo-av expo-permissions expo-file-system
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';

import { useAppContext, ActionTypes } from '../context/AppContext';
import RecordButton from '../components/RecordButton';
import Header from '../components/Header';
import WaveformMeter from '../components/WaveformMeter';
import theme from '../styles/theme';
import strings from '../utils/strings';
import audioService from '../services/audioService';
import storageService from '../services/storageService';

const MIN_RECORDING_DURATION = 3; // Minimum recording duration in seconds

const RecordScreen = () => {
  const navigation = useNavigation();
  const { state, dispatch } = useAppContext();
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [amplitude, setAmplitude] = useState(0);
  const [recordingResult, setRecordingResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  
  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Timer reference
  const timerRef = useRef(null);
  
  // Request microphone permission and initialize storage on mount
  useEffect(() => {
    const setup = async () => {
      try {
        // Initialize storage first
        await storageService.initialize();
        
        // Then check permissions
        const permissionGranted = await audioService.requestPermissions();
        if (!permissionGranted) {
          setPermissionDenied(true);
        }
        
        console.log('[RecordScreen] Setup complete, permissions:', permissionGranted);
      } catch (error) {
        console.error('Error in setup:', error);
        setPermissionDenied(true);
      }
    };
    
    setup();
    
    // Clean up audio resources on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      audioService.cleanup();
    };
  }, []);
  
  // Format duration as MM:SS
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Handle recording status updates
  const handleRecordingStatusUpdate = (status) => {
    if (status.isRecording) {
      setRecordingDuration(status.durationMillis / 1000);
      
      // Update amplitude for waveform
      if (status.metering !== undefined) {
        // Convert dB to linear scale (approximately)
        const normalized = Math.max(0, (status.metering + 100) / 100); 
        setAmplitude(normalized);
      }
    }
  };
  
  // Start recording
const startRecording = async () => {
  try {
    // Reset state
    setRecordingResult(null);
    setRecordingDuration(0);
    setAmplitude(0);
    
    console.log('[STETHOSCOPE] Starting stethoscope recording...');
    
    // Start recording with status updates
    const success = await audioService.startRecording(handleRecordingStatusUpdate);
    
    if (success) {
      setIsRecording(true);
      
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  } catch (error) {
    console.error('[STETHOSCOPE] Error starting recording:', error);
    Alert.alert('Error', 'Could not start stethoscope recording: ' + error.message);
  }
};  // Stop recording
  const stopRecording = async () => {
    try {
      if (recordingDuration < MIN_RECORDING_DURATION) {
        Alert.alert(
          strings.record.tooShort,
          strings.record.holdLonger
        );
        
        // Cancel the current recording
        await audioService.cleanup();
        setIsRecording(false);
        
        // Fade out animation
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
        
        return;
      }
      
      setIsProcessing(true);
      
      // Stop the recording and get result
      const result = await audioService.stopRecording();
      
      // Fade out animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      setIsRecording(false);
      setRecordingResult(result);
      
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Could not stop recording: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle record button press (toggle mode)
  const handleRecordPress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  // Play recorded audio
  const playRecording = async () => {
    try {
      if (!recordingResult) return;
      
      setIsPlaying(true);
      await audioService.playRecording(
        recordingResult.uri,
        (status) => {
          if (status.didJustFinish) {
            setIsPlaying(false);
          }
        }
      );
    } catch (error) {
      console.error('Error playing recording:', error);
      setIsPlaying(false);
    }
  };
  
  // Stop playback
  const stopPlayback = async () => {
    try {
      await audioService.stopPlayback();
      setIsPlaying(false);
    } catch (error) {
      console.error('Error stopping playback:', error);
    }
  };
  
  // Save recording
  const handleSave = async () => {
    try {
      if (!recordingResult) return;
      
      setIsProcessing(true);
      
      // Save recording to storage
      const savedRecording = await audioService.saveRecording(
        recordingResult,
        {
          name: `Stethoscope Recording ${new Date().toLocaleString()}`,
          type: 'stethoscope',
          source: 'stethoscope'
        }
      );
      
      // Add recording to global state
      dispatch({
        type: ActionTypes.ADD_RECORDING,
        payload: savedRecording,
      });
      
      // Navigate to analyze screen with the recording
      navigation.navigate('Analyze', { recordingId: savedRecording.id });
      
    } catch (error) {
      console.error('Error saving recording:', error);
      Alert.alert('Error', 'Could not save recording: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Cancel recording
  const handleCancel = () => {
    // Go back
    navigation.goBack();
  };
  
  // Retry permission
  const handleRetryPermission = async () => {
    try {
      const permissionGranted = await audioService.requestPermissions();
      if (permissionGranted) {
        setPermissionDenied(false);
      } else {
        // Show settings instructions
        Alert.alert(
          strings.errors.permissionDenied,
          strings.errors.microphoneRequired,
          [
            { text: 'OK' }
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };
  
  // Render permission denied view
  const renderPermissionDenied = () => {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="mic-off-outline" size={60} color={theme.colors.error} />
        <Text style={styles.permissionTitle}>{strings.errors.permissionDenied}</Text>
        <Text style={styles.permissionText}>
          {strings.errors.microphoneRequired}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleRetryPermission}
        >
          <Text style={styles.retryButtonText}>{strings.record.retry}</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  // Render recording view
  const renderRecordingView = () => {
    return (
      <View style={styles.recordingContainer}>
        {/* Waveform visualization */}
        <Animated.View 
          style={[
            styles.waveformContainer,
            { opacity: fadeAnim }
          ]}
        >
          <WaveformMeter 
            amplitude={amplitude}
            height={100}
            color={theme.colors.primary}
          />
        </Animated.View>
        
        {/* Duration display */}
        <Animated.View
          style={[
            styles.durationContainer,
            { opacity: fadeAnim }
          ]}
        >
          <Text style={styles.durationText}>
            {formatDuration(recordingDuration)}
          </Text>
        </Animated.View>
        
        {/* Recording indicator */}
        <Animated.View
          style={[
            styles.recordingIndicator,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>{strings.record.recording}</Text>
        </Animated.View>
        
        {/* Record button */}
        <View style={styles.buttonContainer}>
          <RecordButton
            isRecording={isRecording}
            onPress={handleRecordPress}
            mode="toggle"
            size="large"
            disabled={isProcessing}
          />
        </View>
        
        {/* Instructions */}
        <Text style={styles.instructionsText}>
          {isRecording ? "Recording stethoscope audio..." : "Place your stethoscope near the microphone to record heart or lung sounds"}
        </Text>
      </View>
    );
  };
  
  // Render preview view
  const renderPreviewView = () => {
    return (
      <View style={styles.previewContainer}>
        <Text style={styles.previewTitle}>Recording Preview</Text>
        
        {/* Duration */}
        <View style={styles.previewInfoContainer}>
          <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.previewInfoText}>
            {formatDuration(recordingResult?.duration || 0)}
          </Text>
        </View>
        
        {/* Playback controls */}
        <View style={styles.playbackContainer}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={isPlaying ? stopPlayback : playRecording}
          >
            <Ionicons 
              name={isPlaying ? "pause" : "play"} 
              size={32} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>
        
        {/* Action buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={handleCancel}
            disabled={isProcessing}
          >
            <Text style={styles.cancelButtonText}>{strings.record.cancel}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton]}
            onPress={handleSave}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>{strings.record.analyze}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Header 
        title="Record" 
        showBack={true}
        onBackPress={() => {
          // If recording, cancel recording first
          if (isRecording) {
            audioService.cleanup();
          }
          navigation.goBack();
        }}
      />
      
      <View style={styles.content}>
        {permissionDenied ? (
          renderPermissionDenied()
        ) : recordingResult ? (
          renderPreviewView()
        ) : (
          renderRecordingView()
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.l,
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stethoModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.primary}15`,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 10,
  },
  stethoModeText: {
    fontSize: theme.typography.fontSize.s,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginLeft: 8,
  },
  waveformContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationContainer: {
    marginVertical: theme.spacing.l,
  },
  durationText: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  buttonContainer: {
    marginBottom: theme.spacing.xl,
  },
  instructionsText: {
    fontSize: theme.typography.fontSize.m,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: theme.spacing.l,
    left: 0,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.recording,
    marginRight: theme.spacing.s,
  },
  recordingText: {
    color: theme.colors.recording,
    fontSize: theme.typography.fontSize.s,
    fontWeight: '500',
  },
  permissionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.l,
    marginBottom: theme.spacing.s,
  },
  permissionText: {
    fontSize: theme.typography.fontSize.m,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.l,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.m,
    marginTop: theme.spacing.l,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: theme.typography.fontSize.m,
    fontWeight: '500',
  },
  previewContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.m,
  },
  previewInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.l,
  },
  previewInfoText: {
    fontSize: theme.typography.fontSize.m,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.s,
  },
  playbackContainer: {
    marginVertical: theme.spacing.xl,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.medium,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginTop: theme.spacing.xl,
  },
  actionButton: {
    borderRadius: theme.borderRadius.m,
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
    marginHorizontal: theme.spacing.s,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  cancelButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.m,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: theme.typography.fontSize.m,
    fontWeight: '500',
  },
});

export default RecordScreen;
