/**
 * Audio Service
 * Handles stethoscope audio recording, playback, and visualization
 * 
 * REQUIRED DEPENDENCIES (DO NOT EDIT package.json, install these manual// Save recording
const saveRecording = async (recordingResult, additionalMetadata = {}) => {
  try {
    console.log('[AudioService] Saving stethoscope recording...');
    
    // Save recording using storage service
    const savedRecording = await storageService.saveRecording(recordingResult.uri, {
      duration: recordingResult.duration,
      size: recordingResult.size,
      source: "stethoscope", // Always mark as stethoscope recording
      ...additionalMetadata,
    });
    
    return savedRecording;
  } catch (error) {
    console.error('[AudioService] Error saving recording:', error);
    throw error;
  }
};stall expo-av expo-permissions
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import storageService from './storageService';

// Allowed audio mode keys used for sanitization
const allowedAudioKeys = [
  'allowsRecordingIOS',
  'playsInSilentModeIOS',
  'staysActiveInBackground',
  'interruptionModeIOS',
  'interruptionModeAndroid',
  'shouldDuckAndroid',
  'playThroughEarpieceAndroid',
];

// Audio recording options for stethoscope recordings
const RECORDING_OPTIONS = {
  isMeteringEnabled: true,
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    audioQuality: Audio.IOSAudioQuality.HIGH, // Higher quality for medical recordings
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

// Allowed audio mode keys used for sanitization
const allowedKeys = [
  'allowsRecordingIOS',
  'playsInSilentModeIOS',
  'staysActiveInBackground',
  'interruptionModeIOS',
  'interruptionModeAndroid',
  'playThroughEarpieceAndroid',
  'shouldDuckAndroid',
];

// Service state
let recording = null;
let sound = null;
let recordingStatus = {};
let onRecordingStatusUpdate = null;

// Request permissions
const requestPermissions = async () => {
  const { status } = await Audio.requestPermissionsAsync();
  return status === 'granted';
};

// Start recording
const startRecording = async (onStatusUpdate = null) => {
  try {
    // Ensure permissions
    const permissionGranted = await requestPermissions();
    if (!permissionGranted) {
      throw new Error('Permission to access microphone was denied');
    }
    
    // Set audio mode for recording (sanitized + logged)
    const audioMode = {
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false,
      shouldDuckAndroid: true,
    };
    
    console.log('[AudioService] Starting stethoscope recording...');
    
    const sanitized = Object.fromEntries(Object.entries(audioMode).filter(([k, v]) => allowedKeys.includes(k) && v !== undefined));
    console.log('Audio.setAudioModeAsync (src recording) ->', sanitized);
    await Audio.setAudioModeAsync(sanitized);
    
    // Create and prepare recording
    recording = new Audio.Recording();
    
    // Set recording status update callback
    if (onStatusUpdate) {
      onRecordingStatusUpdate = onStatusUpdate;
      recording.setOnRecordingStatusUpdate(onStatusUpdate);
    }
    
    await recording.prepareToRecordAsync(RECORDING_OPTIONS);
    
    // Start recording
    await recording.startAsync();
    
    return true;
  } catch (error) {
    console.error('Error starting recording:', error);
    throw error;
  }
};

// Stop recording
const stopRecording = async () => {
  try {
    if (!recording) {
      throw new Error('No active recording');
    }
    
    // Stop recording
    await recording.stopAndUnloadAsync();
    
    // Get recording URI
    const uri = recording.getURI();
    
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(uri);
    
    // Get duration from recording status
    const duration = recordingStatus.durationMillis || 0;
    
    // Reset recording
    const recordingToReturn = recording;
    recording = null;
    
    // Reset audio mode (sanitized + logged)
    const resetMode = {
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false,
      shouldDuckAndroid: true,
    };
    const sanitizedReset = Object.fromEntries(Object.entries(resetMode).filter(([k, v]) => allowedKeys.includes(k) && v !== undefined));
    console.log('Audio.setAudioModeAsync (src reset) ->', sanitizedReset);
    await Audio.setAudioModeAsync(sanitizedReset);
    
    return {
      uri,
      duration: duration / 1000, // Convert to seconds
      size: fileInfo.size,
      metering: recordingStatus.metering,
    };
  } catch (error) {
    console.error('Error stopping recording:', error);
    throw error;
  }
};

// Save recording
const saveRecording = async (recordingResult, additionalMetadata = {}) => {
  try {
    // Save recording using storage service
    const savedRecording = await storageService.saveRecording(recordingResult.uri, {
      duration: recordingResult.duration,
      size: recordingResult.size,
      ...additionalMetadata,
    });
    
    return savedRecording;
  } catch (error) {
    console.error('Error saving recording:', error);
    throw error;
  }
};

// Load and play a recording
const playRecording = async (uri, onPlaybackStatusUpdate = null) => {
  try {
    // Unload any existing sound
    if (sound) {
      await sound.unloadAsync();
    }
    
    // Load the sound
    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: false },
      onPlaybackStatusUpdate
    );
    
    sound = newSound;
    
    // Start playback
    await sound.playAsync();
    
    return sound;
  } catch (error) {
    console.error('Error playing recording:', error);
    throw error;
  }
};

// Stop playback
const stopPlayback = async () => {
  try {
    if (sound) {
      await sound.stopAsync();
    }
  } catch (error) {
    console.error('Error stopping playback:', error);
  }
};

// Pause playback
const pausePlayback = async () => {
  try {
    if (sound) {
      await sound.pauseAsync();
    }
  } catch (error) {
    console.error('Error pausing playback:', error);
  }
};

// Resume playback
const resumePlayback = async () => {
  try {
    if (sound) {
      await sound.playAsync();
    }
  } catch (error) {
    console.error('Error resuming playback:', error);
  }
};

// Get current recording status
const getRecordingStatus = () => recordingStatus;

// Clean up resources
const cleanup = async () => {
  try {
    if (recording) {
      await recording.stopAndUnloadAsync();
      recording = null;
    }
    
    if (sound) {
      await sound.unloadAsync();
      sound = null;
    }
  } catch (error) {
    console.error('Error cleaning up audio resources:', error);
  }
};

export default {
  requestPermissions,
  startRecording,
  stopRecording,
  saveRecording,
  playRecording,
  stopPlayback,
  pausePlayback,
  resumePlayback,
  getRecordingStatus,
  cleanup,
};
