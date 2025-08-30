/**
 * Storage Service
 * Handles local file storage operations
 */

import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { Recording } from '../context/AppContext';

// Base directory for app files
const BASE_DIRECTORY = FileSystem.documentDirectory || '';

// Directories for different file types
const DIRECTORIES = {
  recordings: `${BASE_DIRECTORY}recordings/`,
  spectrograms: `${BASE_DIRECTORY}spectrograms/`,
  exports: `${BASE_DIRECTORY}exports/`,
};

// Create necessary directories
export async function initializeStorage(): Promise<boolean> {
  try {
    for (const path of Object.values(DIRECTORIES)) {
      const dirInfo = await FileSystem.getInfoAsync(path);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(path, { intermediates: true });
      }
    }
    return true;
  } catch (error) {
    console.error('Error initializing storage:', error);
    return false;
  }
}

// Save a file to local storage
export async function saveFile(
  uri: string,
  directory: string,
  filename: string
): Promise<string | null> {
  try {
    const destinationUri = `${directory}${filename}`;
    await FileSystem.copyAsync({
      from: uri,
      to: destinationUri,
    });
    return destinationUri;
  } catch (error) {
    console.error('Error saving file:', error);
    return null;
  }
}

// Delete a file from local storage
export async function deleteFile(uri: string): Promise<boolean> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(uri);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

// List files in a directory
export async function listFiles(directory: string): Promise<string[]> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(directory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      return [];
    }
    
    return await FileSystem.readDirectoryAsync(directory);
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
}

// Store recording metadata
export async function storeRecordingMetadata(recordings: Recording[]): Promise<boolean> {
  try {
    await AsyncStorage.setItem('recordings', JSON.stringify(recordings));
    return true;
  } catch (error) {
    console.error('Error storing recording metadata:', error);
    return false;
  }
}

// Retrieve recording metadata
export async function getRecordingMetadata(): Promise<Recording[]> {
  try {
    const data = await AsyncStorage.getItem('recordings');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error retrieving recording metadata:', error);
    return [];
  }
}

// Check available storage space
export async function checkStorageSpace(): Promise<{
  available: number;
  total: number;
} | null> {
  try {
    // This is a simplified approach as exact storage info depends on the platform
    // For a real app, platform-specific APIs might be needed
    
    // On some platforms, we can get free space info
    const dirInfo = await FileSystem.getFreeDiskStorageAsync();
    const totalInfo = await FileSystem.getTotalDiskCapacityAsync();
    
    return {
      available: dirInfo,
      total: totalInfo,
    };
  } catch (error) {
    console.error('Error checking storage space:', error);
    return null;
  }
}

// Clean up temporary files
export async function cleanupTempFiles(): Promise<boolean> {
  try {
    const tempDir = FileSystem.cacheDirectory;
    if (tempDir) {
      await FileSystem.deleteAsync(tempDir, { idempotent: true });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error cleaning up temp files:', error);
    return false;
  }
}
