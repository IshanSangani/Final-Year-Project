/**
 * Audio Service
 * Handles audio recording, playback, and processing
 */
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
import { Recording, AnalysisResult } from '../context/AppContext';

// Audio recording settings
const RECORDING_OPTIONS = {
  isMeteringEnabled: true,
  android: {
    extension: '.wav',
    outputFormat: Audio.AndroidOutputFormat.DEFAULT,
    audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.wav',
    audioQuality: Audio.IOSAudioQuality.HIGH,
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
const allowedAudioKeys = [
  'allowsRecordingIOS',
  'playsInSilentModeIOS',
  'staysActiveInBackground',
  'interruptionModeIOS',
  'interruptionModeAndroid',
  'shouldDuckAndroid',
  'playThroughEarpieceAndroid',
];

// Directory for storing audio recordings
const RECORDINGS_DIRECTORY = `${FileSystem.documentDirectory}recordings/`;
// Debug: print recordings directory at module load
console.log('Recordings directory path:', RECORDINGS_DIRECTORY);

// Ensure the recordings directory exists
async function ensureDirectoryExists() {
  const dirInfo = await FileSystem.getInfoAsync(RECORDINGS_DIRECTORY);
  console.log('ensureDirectoryExists - dirInfo:', dirInfo);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(RECORDINGS_DIRECTORY, { intermediates: true });
    console.log('ensureDirectoryExists - created directory:', RECORDINGS_DIRECTORY);
  }
}

// Request permissions for audio recording
export async function requestAudioPermissions(): Promise<boolean> {
  try {
    await ensureDirectoryExists();
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting audio permissions:', error);
    return false;
  }
}

// Start a new recording
export async function startRecording(): Promise<Audio.Recording | null> {
  try {
    // Request permissions
    const permissionGranted = await requestAudioPermissions();
    if (!permissionGranted) {
      Alert.alert('Permission Required', 'Microphone access is required to record audio');
      return null;
    }

    // Set audio mode for recording (sanitized + logged)
    const audioModeForRecording = {
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
  interruptionModeIOS: (Audio as any).INTERRUPTION_MODE_IOS_DO_NOT_MIX,
  interruptionModeAndroid: (Audio as any).INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
    };
    const allowedAudioKeys = [
      'allowsRecordingIOS',
      'playsInSilentModeIOS',
      'staysActiveInBackground',
      'interruptionModeIOS',
      'interruptionModeAndroid',
      'shouldDuckAndroid',
      'playThroughEarpieceAndroid',
    ];
    const sanitizedAudioMode = Object.fromEntries(
      Object.entries(audioModeForRecording).filter(([k, v]) => allowedAudioKeys.includes(k) && v !== undefined)
    );
    console.log('Audio.setAudioModeAsync (recording) ->', sanitizedAudioMode);
    await Audio.setAudioModeAsync(sanitizedAudioMode);

    // Create and start recording
    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(RECORDING_OPTIONS);
    await recording.startAsync();
    return recording;
  } catch (error) {
    console.error('Error starting recording:', error);
    Alert.alert('Error', 'Failed to start recording');
    return null;
  }
}

// Stop the current recording and save it
export async function stopRecording(
  recording: Audio.Recording
): Promise<{ uri: string; duration: number } | null> {
  try {
    if (!recording) return null;

    // Stop recording
    await recording.stopAndUnloadAsync();

    // Get recording info
    const info = await recording.getStatusAsync();
    const { durationMillis } = info;
    
    // Generate a unique filename
    const fileName = `recording-${Date.now()}.wav`;
    const uri = recording.getURI();
    
    if (!uri) {
      throw new Error('Recording URI is null');
    }

    // Move recording to our directory with a proper filename
    const destUri = `${RECORDINGS_DIRECTORY}${fileName}`;
    await FileSystem.moveAsync({
      from: uri,
      to: destUri,
    });

    // Reset audio mode (sanitized + logged)
    const audioModeReset = {
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    };
    const sanitizedReset = Object.fromEntries(
      Object.entries(audioModeReset).filter(([k, v]) => allowedAudioKeys.includes(k) && v !== undefined)
    );
    console.log('Audio.setAudioModeAsync (reset) ->', sanitizedReset);
    await Audio.setAudioModeAsync(sanitizedReset);

    return {
      uri: destUri,
      duration: durationMillis ? durationMillis / 1000 : 0,
    };
  } catch (error) {
    console.error('Error stopping recording:', error);
    Alert.alert('Error', 'Failed to save recording');
    return null;
  }
}

// Play a recording
export async function playRecording(uri: string): Promise<Audio.Sound | null> {
  try {
    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('Audio file does not exist');
    }

    // Set audio mode for playback (sanitized + logged)
    const audioModeForPlayback = {
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
  interruptionModeIOS: (Audio as any).INTERRUPTION_MODE_IOS_DO_NOT_MIX,
  interruptionModeAndroid: (Audio as any).INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
    };
    const sanitizedPlayback = Object.fromEntries(
      Object.entries(audioModeForPlayback).filter(([k, v]) => allowedAudioKeys.includes(k) && v !== undefined)
    );
    console.log('Audio.setAudioModeAsync (playback) ->', sanitizedPlayback);
    await Audio.setAudioModeAsync(sanitizedPlayback);

    // Load and play sound
    const sound = new Audio.Sound();
    await sound.loadAsync({ uri });
    await sound.playAsync();
    return sound;
  } catch (error) {
    console.error('Error playing recording:', error);
    Alert.alert('Error', 'Failed to play recording');
    return null;
  }
}

// Delete a recording
export async function deleteRecording(id: string): Promise<boolean> {
  try {
    // Find the recording by ID to get the URI
    const recordings = await getRecordings();
    const recording = recordings.find(r => r.id === id);
    
    if (!recording || !recording.uri) {
      return false;
    }
    
    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(recording.uri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(recording.uri);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting recording:', error);
    Alert.alert('Error', 'Failed to delete recording');
    return false;
  }
}

// Get all saved recordings
export async function getRecordings(): Promise<Partial<Recording>[]> {
  try {
    await ensureDirectoryExists();
    
    // Get all files in the recordings directory
    const files = await FileSystem.readDirectoryAsync(RECORDINGS_DIRECTORY);
  console.log('getRecordings - files in directory:', files);
    
    // Filter for audio files
    const audioFiles = files.filter(file => 
      file.endsWith('.wav') || file.endsWith('.mp3') || file.endsWith('.m4a')
    );
    
    // Sort by date (newest first) based on filename
    audioFiles.sort().reverse();
    
    // Create recordings metadata
    return audioFiles.map(fileName => {
      // Extract timestamp from filename (assuming format recording-timestamp.extension)
      const timestamp = fileName.split('-')[1]?.split('.')[0];
      const date = timestamp ? new Date(Number(timestamp)) : new Date();
      
      return {
        id: fileName,
        uri: `${RECORDINGS_DIRECTORY}${fileName}`,
        date: date.toISOString(),
        // We don't know the duration without loading the file
        duration: 0,
      };
    });
  } catch (error) {
    console.error('Error getting recordings:', error);
    return [];
  }
}

// Generate spectrogram data (placeholder for now)
export async function generateSpectrogramData(uri: string): Promise<number[]> {
  // This would typically involve processing the audio file to create a spectrogram
  // For now we return mock data
  console.log('Generating spectrogram for:', uri);
  
  // Generate mock spectrogram data
  const data: number[] = [];
  for (let i = 0; i < 100; i++) {
    // Create a pattern that looks like audio waves
    data.push(Math.abs(Math.sin(i / 5) * 200 + Math.random() * 55));
  }
  
  return data;
}

// Save a recording to storage
export async function saveRecording(recordingData: Partial<Recording>): Promise<boolean> {
  try {
    // Ensure we have a valid ID and URI
    if (!recordingData.id || !recordingData.uri) {
      throw new Error('Recording must have an ID and URI');
    }
    
    // If this is a temporary file, move it to our recordings directory
    if (!recordingData.uri.startsWith(RECORDINGS_DIRECTORY)) {
      await ensureDirectoryExists();
      
      // Generate a proper filename based on the ID
      const fileName = `${recordingData.id}.wav`;
      const destUri = `${RECORDINGS_DIRECTORY}${fileName}`;
      
      // Move the file
      await FileSystem.moveAsync({
        from: recordingData.uri,
        to: destUri,
      });
      
      // Update the URI
      recordingData.uri = destUri;
    }
    
    // Get file info to update metadata including size
    const fileInfo = await FileSystem.getInfoAsync(recordingData.uri, { size: true });
    
    if (fileInfo.exists && 'size' in fileInfo) {
      // Update file size in recording data
      recordingData.fileSize = fileInfo.size;
    }
    
    // Return success
    return fileInfo.exists;
  } catch (error) {
    console.error('Error saving recording:', error);
    return false;
  }
}

// Analyze a recording (placeholder for now)
export async function analyzeRecording(uri: string): Promise<AnalysisResult> {
  try {
    // In a real app, this would send the audio to a server or local model for analysis
    // For now we return mock data with a delay to simulate processing
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock analysis results
    const respiratoryRate = 15 + Math.floor(Math.random() * 10); // 15-25 breaths/min
    const confidence = 70 + Math.floor(Math.random() * 25); // 70-95%
    
    // Determine condition based on respiratory rate
    let condition = 'Normal';
    let irregularities = false;
    
    if (respiratoryRate < 12) {
      condition = 'Bradypnea';
      irregularities = true;
    } else if (respiratoryRate > 20) {
      condition = 'Tachypnea';
      irregularities = true;
    }
    
    // Generate interpretation and recommendations
    const interpretation = irregularities
      ? `Your respiratory rate of ${respiratoryRate} breaths per minute indicates ${condition}, which may be a sign of respiratory distress.`
      : `Your respiratory rate of ${respiratoryRate} breaths per minute is within the normal range, suggesting healthy respiratory function.`;
    
    const recommendations = irregularities
      ? `Consider consulting a healthcare provider about your respiratory rate. Stay hydrated and maintain good ventilation in your environment.`
      : `Continue monitoring your respiratory health periodically. Regular exercise and good air quality can help maintain respiratory health.`;
    
    return {
      respiratoryRate,
      condition,
      confidence,
      irregularities,
      interpretation,
      recommendations,
    };
  } catch (error) {
    console.error('Error analyzing recording:', error);
    throw new Error('Failed to analyze recording');
  }
}
