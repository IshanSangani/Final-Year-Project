import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';

import { useAppContext } from '../context/AppContext';
import { theme } from '../constants/Theme';
import { strings } from '../utils/strings';
import { startRecording as startAudioRecording, stopRecording as stopAudioRecording, saveRecording } from '../services/audioService';

// WaveformMeter component with TypeScript
interface WaveformMeterProps {
  isRecording: boolean;
}

const WaveformMeter: React.FC<WaveformMeterProps> = ({ isRecording }) => {
  const [levels, setLevels] = useState<number[]>([]);
  const maxBars = 30;
  
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        // Generate random levels for visualization when recording
        const newLevel = Math.random() * 100;
        setLevels(prev => {
          const updated = [...prev, newLevel];
          if (updated.length > maxBars) {
            return updated.slice(updated.length - maxBars);
          }
          return updated;
        });
      }, 100);
      
      return () => clearInterval(interval);
    } else {
      setLevels([]);
    }
  }, [isRecording]);
  
  return (
    <View style={styles.waveformContainer}>
      {Array.from({ length: maxBars }).map((_, index) => {
        const level = levels[index] || 0;
        return (
          <View 
            key={index} 
            style={[
              styles.waveformBar,
              { 
                height: Math.max(4, level * 0.5),
                backgroundColor: isRecording ? theme.colors.primary : theme.colors.inactive,
                opacity: isRecording ? 1 : 0.5
              }
            ]} 
          />
        );
      })}
    </View>
  );
};

export default function RecordScreen() {
  const { state, dispatch } = useAppContext();
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [recordingMode] = useState("stethoscope"); // Only stethoscope mode is available
  const recording = useRef<Audio.Recording | null>(null);
  // Use number type for timer on both web and native platforms
  const timerRef = useRef<number | null>(null);
  
  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recording.current) {
        stopRecording();
      }
    };
  }, []);
  
  // Request permissions for audio recording
  useEffect(() => {
    const getPermissions = async () => {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permissions Required',
            'To record audio, you need to grant microphone permissions.',
            [{ text: 'OK' }]
          );
        }
        
        const initialAudioMode = {
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        };
        const allowed = ['allowsRecordingIOS', 'playsInSilentModeIOS', 'staysActiveInBackground'];
        const sanitized = Object.fromEntries(Object.entries(initialAudioMode).filter(([k, v]) => allowed.includes(k) && v !== undefined));
        console.log('Audio.setAudioModeAsync (initial permissions) ->', sanitized);
        await Audio.setAudioModeAsync(sanitized);
      } catch (error) {
        console.error('Error requesting permissions:', error);
      }
    };
    
    getPermissions();
  }, []);
  
  // Start recording function
  const startRecording = async () => {
    try {
      // Provide haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Reset states
      setIsRecording(true);
      setIsPaused(false);
      setRecordingDuration(0);
      
      // Use the imported startAudioRecording function
      const recordingObject = await startAudioRecording();
      
      if (recordingObject) {
        recording.current = recordingObject;
        
        // Start timer
        timerRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000) as unknown as number;
      } else {
        // If we failed to get a recording object, reset the state
        setIsRecording(false);
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
      setIsRecording(false);
    }
  };
  
  // Pause recording function
  const pauseRecording = async () => {
    if (!recording.current) return;
    
    try {
      // Provide haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      if (isPaused) {
        // Resume recording
        await recording.current.startAsync();
        setIsPaused(false);
        
        // Resume timer
        timerRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000) as unknown as number;
      } else {
        // Pause recording
        await recording.current.pauseAsync();
        setIsPaused(true);
        
        // Pause timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    } catch (error) {
      console.error('Failed to pause/resume recording:', error);
    }
  };
  
  // Stop recording function
  const stopRecording = async () => {
    if (!recording.current) return;
    
    try {
      setIsSaving(true);
      console.log("[RecordScreen] Stopping stethoscope recording...");
      
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Use the imported stopAudioRecording function
      const result = await stopAudioRecording(recording.current);
      recording.current = null;
      
      if (result && result.uri) {
        console.log("[RecordScreen] Recording stopped successfully, URI:", result.uri);
        
        // Create recording data object for stethoscope recording
        const recordingData = {
          id: `stetho-${Date.now()}`,
          uri: result.uri,
          fileSize: 0, // Will be updated by saveRecording
          duration: result.duration,
          date: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          analyzed: false,
          source: "stethoscope" as const,
        };
        
        console.log("[RecordScreen] Saving recording metadata:", recordingData);
        
        // Save to local storage
        const saved = await saveRecording(recordingData);
        
        if (saved) {
          // Update app state
          dispatch({ 
            type: 'ADD_RECORDING', 
            payload: recordingData as any
          });
          
          console.log("[RecordScreen] Recording saved successfully");
          
          // Navigate to the History screen
          router.navigate("/(tabs)/history");
        } else {
          throw new Error('Failed to save recording');
        }
      }
    } catch (error) {
      console.error('[RecordScreen] Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to save recording. Please try again.');
    } finally {
      setIsRecording(false);
      setIsPaused(false);
      setIsSaving(false);
      setRecordingDuration(0);
    }
  };
  
  // Format time function
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>RespireSense Recording</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Recording Mode Banner */}
        <View style={styles.modeBanner}>
          <Ionicons name="medical" size={24} color="#fff" />
          <Text style={styles.modeText}>Stethoscope Recording Mode</Text>
        </View>
        
        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
          <Text style={styles.instructionsText}>
            Place your stethoscope on your chest to record respiratory sounds.
            Try to breathe normally and avoid movement during recording.
          </Text>
        </View>
        
        {/* Recording visualization */}
        <View style={styles.visualizationContainer}>
          <WaveformMeter isRecording={isRecording && !isPaused} />
          <Text style={styles.timerText}>{formatTime(recordingDuration)}</Text>
        </View>
        
        {/* Recording controls */}
        <View style={styles.controlsContainer}>
          {isRecording ? (
            <>
              {/* Pause/Resume button */}
              <TouchableOpacity
                style={[styles.controlButton, styles.secondaryButton]}
                onPress={pauseRecording}
                disabled={isSaving}
              >
                <Ionicons 
                  name={isPaused ? 'play' : 'pause'} 
                  size={30} 
                  color={theme.colors.text} 
                />
              </TouchableOpacity>
              
              {/* Stop button */}
              <TouchableOpacity
                style={[styles.controlButton, styles.stopButton]}
                onPress={stopRecording}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" size="large" />
                ) : (
                  <Ionicons name="square" size={30} color="#fff" />
                )}
              </TouchableOpacity>
            </>
          ) : (
            /* Record button */
            <TouchableOpacity
              style={[styles.controlButton, styles.recordButton]}
              onPress={startRecording}
            >
              <Ionicons name="mic" size={40} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>{strings.record.tipsTitle}</Text>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
            <Text style={styles.tipText}>{strings.record.tip1}</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
            <Text style={styles.tipText}>{strings.record.tip2}</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
            <Text style={styles.tipText}>{strings.record.tip3}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.l,
    paddingTop: theme.spacing.l,
    paddingBottom: theme.spacing.m,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.l,
  },
  modeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    marginVertical: theme.spacing.m,
    ...theme.shadows.small,
  },
  modeText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: theme.spacing.m,
    fontSize: theme.typography.fontSize.m,
  },
  instructionsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    marginVertical: theme.spacing.m,
    ...theme.shadows.small,
  },
  instructionsText: {
    flex: 1,
    marginLeft: theme.spacing.m,
    fontSize: theme.typography.fontSize.m,
    color: theme.colors.text,
  },
  visualizationContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.l,
    marginVertical: theme.spacing.l,
    padding: theme.spacing.l,
    ...theme.shadows.medium,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 100,
    width: '100%',
  },
  waveformBar: {
    width: 4,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  timerText: {
    marginTop: theme.spacing.l,
    fontSize: 40,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: theme.spacing.xl,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
    ...theme.shadows.medium,
  },
  recordButton: {
    backgroundColor: theme.colors.danger,
    width: 80,
    height: 80,
  },
  stopButton: {
    backgroundColor: theme.colors.danger,
    width: 70,
    height: 70,
    marginLeft: theme.spacing.l,
  },
  secondaryButton: {
    backgroundColor: theme.colors.surface,
    width: 60,
    height: 60,
  },
  tipsContainer: {
    marginBottom: theme.spacing.xxl,
  },
  tipsTitle: {
    fontSize: theme.typography.fontSize.l,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.m,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.m,
  },
  tipText: {
    marginLeft: theme.spacing.s,
    fontSize: theme.typography.fontSize.m,
    color: theme.colors.text,
  },
});
