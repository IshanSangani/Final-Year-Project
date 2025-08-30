/**
 * Storage Service
 * Handles local storage of recordings and metadata using AsyncStorage and FileSystem
 * 
 * REQUIRED DEPENDENCIES (DO NOT EDIT package.json, install these manually):
 * expo install expo-file-system @react-native-async-storage/async-storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { v4 as uuidv4 } from 'uuid'; // You'll need to add: npm install uuid

// Constants
const RECORDINGS_DIRECTORY = `${FileSystem.documentDirectory}recordings/`;
const RECORDINGS_METADATA_KEY = 'recordings';

// Ensure recordings directory exists
const ensureDirectoryExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(RECORDINGS_DIRECTORY);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(RECORDINGS_DIRECTORY, { intermediates: true });
  }
};

// Initialize storage
const initialize = async () => {
  await ensureDirectoryExists();
};

// Save a recording file and its metadata
const saveRecording = async (uri, metadata = {}) => {
  await ensureDirectoryExists();
  
  // Generate a unique ID and filename
  const id = uuidv4();
  const filename = `recording_${id}.m4a`;
  const destinationUri = `${RECORDINGS_DIRECTORY}${filename}`;
  
  try {
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
    const recordingsJson = await AsyncStorage.getItem(RECORDINGS_METADATA_KEY);
    return recordingsJson ? JSON.parse(recordingsJson) : [];
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
