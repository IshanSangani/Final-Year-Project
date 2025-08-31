/**
 * Storage Service
 * Handles local storage of recordings and metadata using AsyncStorage and FileSystem
 * 
 * REQUIRED DEPENDENCIES (DO NOT EDIT package.json, install these manually):
 * expo install expo-file-system @react-native-async-storage/async-storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

// Simple UUID generator that doesn't rely on crypto.getRandomValues()
const generateUUID = () => {
  const s4 = () => 
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
};

// Constants - Use cacheDirectory to ensure files are saved to physical storage
const RECORDINGS_DIRECTORY = `${FileSystem.cacheDirectory}stethoscope_recordings/`;
const RECORDINGS_METADATA_KEY = 'stethoscope_recordings';

// Log storage location for debugging
console.log('Storage location:', RECORDINGS_DIRECTORY);

// Ensure recordings directory exists
const ensureDirectoryExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(RECORDINGS_DIRECTORY);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(RECORDINGS_DIRECTORY, { intermediates: true });
  }
};

// Initialize storage
const initialize = async () => {
  try {
    await ensureDirectoryExists();
    
    // Verify storage is working by listing contents
    const dirContents = await FileSystem.readDirectoryAsync(RECORDINGS_DIRECTORY).catch(() => []);
    console.log('Storage initialized. Found files:', dirContents.length);
    
    // Check existing metadata
    const recordingsJson = await AsyncStorage.getItem(RECORDINGS_METADATA_KEY);
    const recordings = recordingsJson ? JSON.parse(recordingsJson) : [];
    console.log('Found recordings in metadata:', recordings.length);
    
    // Ensure we have at least one test recording
    if (recordings.length === 0 && dirContents.length === 0) {
      console.log('Creating test recording entry in metadata');
      const testRecording = {
        id: generateUUID(),
        filename: 'test-recording.m4a',
        uri: `${RECORDINGS_DIRECTORY}test-recording.m4a`,
        createdAt: new Date().toISOString(),
        duration: 10,
        size: 1000,
        source: 'stethoscope',
        type: 'test'
      };
      
      await AsyncStorage.setItem(RECORDINGS_METADATA_KEY, JSON.stringify([testRecording]));
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing storage:', error);
    return false;
  }
};

// Save a recording file and its metadata
const saveRecording = async (uri, metadata = {}) => {
  try {
    console.log('Saving recording from uri:', uri);
    await ensureDirectoryExists();
    
    // Generate a unique ID and filename
    const id = generateUUID();
    const timestamp = Date.now();
    const filename = `stetho-${timestamp}.m4a`;
    const destinationUri = `${RECORDINGS_DIRECTORY}${filename}`;
    
    console.log('Will save to:', destinationUri);
  
    // Copy the recording file to app storage
    await FileSystem.copyAsync({
      from: uri,
      to: destinationUri,
    });
    
    // Create recording metadata
    const recording = {
      id,
      filename,
      uri: destinationUri,
      createdAt: new Date().toISOString(),
      duration: metadata.duration || 0,
      size: metadata.size || 0,
      analysisResult: null,
      source: "stethoscope", // Mark all recordings as coming from stethoscope
      ...metadata,
    };
    
    // Get existing recordings
    const existingRecordingsJson = await AsyncStorage.getItem(RECORDINGS_METADATA_KEY);
    const existingRecordings = existingRecordingsJson ? JSON.parse(existingRecordingsJson) : [];
    
    // Add new recording to the list
    const updatedRecordings = [recording, ...existingRecordings];
    
    // Save updated recordings list
    await AsyncStorage.setItem(RECORDINGS_METADATA_KEY, JSON.stringify(updatedRecordings));
    
    return recording;
  } catch (error) {
    console.error('Error saving recording:', error);
    throw new Error('Failed to save recording');
  }
};

// Get all recordings metadata
const getRecordings = async () => {
  try {
    // Ensure directory exists
    await ensureDirectoryExists();
    
    // Get metadata from AsyncStorage
    const recordingsJson = await AsyncStorage.getItem(RECORDINGS_METADATA_KEY);
    const recordings = recordingsJson ? JSON.parse(recordingsJson) : [];
    
    // Verify files actually exist and filter out any that don't
    const validRecordings = [];
    
    for (const recording of recordings) {
      const fileInfo = await FileSystem.getInfoAsync(recording.uri);
      if (fileInfo.exists) {
        validRecordings.push(recording);
      } else {
        console.log('Recording file missing:', recording.filename);
      }
    }
    
    console.log(`Found ${validRecordings.length} valid recordings out of ${recordings.length}`);
    
    // If we had to filter out recordings, update the stored list
    if (validRecordings.length < recordings.length) {
      await AsyncStorage.setItem(RECORDINGS_METADATA_KEY, JSON.stringify(validRecordings));
    }
    
    return validRecordings;
  } catch (error) {
    console.error('Error getting recordings:', error);
    return [];
  }
};

// Get a single recording by ID
const getRecordingById = async (id) => {
  try {
    const recordings = await getRecordings();
    return recordings.find(recording => recording.id === id) || null;
  } catch (error) {
    console.error('Error getting recording by ID:', error);
    return null;
  }
};

// Update recording metadata
const updateRecording = async (id, updates) => {
  try {
    const recordings = await getRecordings();
    const updatedRecordings = recordings.map(recording => 
      recording.id === id ? { ...recording, ...updates } : recording
    );
    
    await AsyncStorage.setItem(RECORDINGS_METADATA_KEY, JSON.stringify(updatedRecordings));
    
    return updatedRecordings.find(r => r.id === id);
  } catch (error) {
    console.error('Error updating recording:', error);
    throw new Error('Failed to update recording');
  }
};

// Delete a recording
const deleteRecording = async (id) => {
  try {
    // Get recordings
    const recordings = await getRecordings();
    const recordingToDelete = recordings.find(r => r.id === id);
    
    if (!recordingToDelete) {
      throw new Error('Recording not found');
    }
    
    // Delete the file
    await FileSystem.deleteAsync(recordingToDelete.uri);
    
    // Update metadata
    const updatedRecordings = recordings.filter(r => r.id !== id);
    await AsyncStorage.setItem(RECORDINGS_METADATA_KEY, JSON.stringify(updatedRecordings));
    
    return true;
  } catch (error) {
    console.error('Error deleting recording:', error);
    throw new Error('Failed to delete recording');
  }
};

// Get available storage space
const getAvailableStorage = async () => {
  try {
    const { totalSpace, freeSpace } = await FileSystem.getFreeDiskStorageAsync();
    return {
      total: totalSpace,
      free: freeSpace,
      used: totalSpace - freeSpace,
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return null;
  }
};

export default {
  initialize,
  saveRecording,
  getRecordings,
  getRecordingById,
  updateRecording,
  deleteRecording,
  getAvailableStorage,
};
