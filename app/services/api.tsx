/**
 * API Service
 * Handles communication with backend services
 */

import { User, Recording, AnalysisResult } from '../context/AppContext';

// Base URL for API calls
const API_BASE_URL = 'https://api.respiratoryhealth.com';

// Simulate API calls with a delay
const simulateApiCall = <T>(data: T, delay: number = 1000): Promise<T> => {
  return new Promise(resolve => {
    setTimeout(() => resolve(data), delay);
  });
};

/**
 * Authentication
 */

// Login user
export async function loginUser(email: string, password: string): Promise<User> {
  // Simulated API response
  const mockResponse: User = {
    id: '1234',
    name: 'John Doe',
    email: email,
  };
  
  return simulateApiCall(mockResponse);
}

// Register user
export async function registerUser(
  name: string, 
  email: string, 
  password: string
): Promise<User> {
  // Simulated API response
  const mockResponse: User = {
    id: '1234',
    name: name,
    email: email,
  };
  
  return simulateApiCall(mockResponse);
}

// Login as guest
export async function loginAsGuest(): Promise<User> {
  // Simulated API response
  const mockResponse: User = {
    id: 'guest-123',
    name: 'Guest',
    email: 'guest@example.com',
    isGuest: true,
  };
  
  return simulateApiCall(mockResponse);
}

/**
 * Recording Analysis
 */

// Send recording for analysis
export async function analyzeRecording(recordingUri: string): Promise<AnalysisResult> {
  // Simulated analysis result
  const mockResponse: AnalysisResult = {
    condition: 'Healthy',
    probability: 0.92,
  };
  
  return simulateApiCall(mockResponse, 2000);
}

// Sync recordings with server
export async function syncRecordings(recordings: Recording[]): Promise<boolean> {
  // Simulate successful sync
  return simulateApiCall(true, 1500);
}

/**
 * User Profile
 */

// Update user profile
export async function updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
  // Simulated API response
  const mockResponse: User = {
    id: userId,
    name: updates.name || 'John Doe',
    email: updates.email || 'john@example.com',
  };
  
  return simulateApiCall(mockResponse);
}

// Get user's health history
export async function getUserHistory(userId: string): Promise<any[]> {
  // Simulated API response
  const mockResponse = [
    {
      date: '2023-07-01',
      status: 'Healthy',
      score: 95,
    },
    {
      date: '2023-06-15',
      status: 'Minor Issues',
      score: 82,
    },
    {
      date: '2023-06-01',
      status: 'Healthy',
      score: 90,
    },
  ];
  
  return simulateApiCall(mockResponse);
}
