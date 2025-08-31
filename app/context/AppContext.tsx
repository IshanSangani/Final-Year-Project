/**
 * App Context Provider
 * Global state management using Context API + useReducer
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define types
export interface Recording {
  id: string;
  uri: string;
  duration: number;
  date: string;
  createdAt?: string; // New field for consistent date handling
  fileSize?: number;
  analyzed?: boolean;
  source: "stethoscope"; // Only stethoscope recordings
  analysisResult?: AnalysisResult;
  spectrogramData?: number[];
}

export interface AnalysisResult {
  condition?: string;
  probability?: number;
  spectrogramUrl?: string;
  respiratoryRate?: number;
  confidence?: number;
  irregularities?: boolean;
  interpretation?: string;
  recommendations?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isGuest?: boolean;
}

export interface AppSettings {
  notifications: boolean;
  [key: string]: any;
}

export interface AppState {
  user: User | null;
  recordings: Recording[];
  isLoading: boolean;
  error: string | null;
  isOnboardingComplete: boolean;
  settings: AppSettings;
}

// Initial state
const initialState: AppState = {
  user: null,
  recordings: [],
  isLoading: false,
  error: null,
  isOnboardingComplete: false,
  settings: {
    notifications: true,
  }
};

// Action types
export const ActionTypes = {
  SET_USER: 'SET_USER',
  LOGOUT: 'LOGOUT',
  ADD_RECORDING: 'ADD_RECORDING',
  UPDATE_RECORDING: 'UPDATE_RECORDING',
  DELETE_RECORDING: 'DELETE_RECORDING',
  UPDATE_ANALYSIS: 'UPDATE_ANALYSIS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  COMPLETE_ONBOARDING: 'COMPLETE_ONBOARDING',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
};

// Define action interfaces
interface SetUserAction {
  type: typeof ActionTypes.SET_USER;
  payload: User;
}

interface LogoutAction {
  type: typeof ActionTypes.LOGOUT;
}

interface AddRecordingAction {
  type: typeof ActionTypes.ADD_RECORDING;
  payload: Recording;
}

interface UpdateRecordingAction {
  type: typeof ActionTypes.UPDATE_RECORDING;
  payload: Partial<Recording> & { id: string };
}

interface DeleteRecordingAction {
  type: typeof ActionTypes.DELETE_RECORDING;
  payload: string;
}

interface UpdateAnalysisAction {
  type: typeof ActionTypes.UPDATE_ANALYSIS;
  payload: { id: string; analysisResult: AnalysisResult };
}

interface SetLoadingAction {
  type: typeof ActionTypes.SET_LOADING;
  payload: boolean;
}

interface SetErrorAction {
  type: typeof ActionTypes.SET_ERROR;
  payload: string | null;
}

interface CompleteOnboardingAction {
  type: typeof ActionTypes.COMPLETE_ONBOARDING;
}

interface UpdateSettingsAction {
  type: typeof ActionTypes.UPDATE_SETTINGS;
  payload: Partial<AppSettings>;
}

type AppAction =
  | SetUserAction
  | LogoutAction
  | AddRecordingAction
  | UpdateRecordingAction
  | DeleteRecordingAction
  | UpdateAnalysisAction
  | SetLoadingAction
  | SetErrorAction
  | CompleteOnboardingAction
  | UpdateSettingsAction;

// Reducer function
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case ActionTypes.SET_USER:
      return { ...state, user: action.payload, error: null };
    
    case ActionTypes.LOGOUT:
      return { ...state, user: null, error: null };
    
    case ActionTypes.ADD_RECORDING:
      return { 
        ...state, 
        recordings: [action.payload, ...state.recordings],
        error: null
      };
    
    case ActionTypes.UPDATE_RECORDING:
      return {
        ...state,
        recordings: state.recordings.map(recording => 
          recording.id === action.payload.id ? { ...recording, ...action.payload } : recording
        ),
        error: null
      };
    
    case ActionTypes.DELETE_RECORDING:
      return {
        ...state,
        recordings: state.recordings.filter(recording => recording.id !== action.payload),
        error: null
      };
    
    case ActionTypes.UPDATE_ANALYSIS:
      return {
        ...state,
        recordings: state.recordings.map(recording => 
          recording.id === action.payload.id 
            ? { ...recording, analysisResult: action.payload.analysisResult } 
            : recording
        ),
        error: null
      };
    
    case ActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
    
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload };
    
    case ActionTypes.COMPLETE_ONBOARDING:
      return { ...state, isOnboardingComplete: true };
      
    case ActionTypes.UPDATE_SETTINGS:
      return { 
        ...state, 
        settings: { ...state.settings, ...action.payload },
        error: null 
      };
    
    default:
      return state;
  }
}

// Create context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Custom hook for using the context
export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// Provider component
interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // Load persisted state on app start
  useEffect(() => {
    const loadPersistedState = async () => {
      try {
        // Load user data
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          dispatch({ type: ActionTypes.SET_USER, payload: JSON.parse(userData) });
        }
        
        // Load recordings metadata
        const recordingsData = await AsyncStorage.getItem('recordings');
        if (recordingsData) {
          const recordings = JSON.parse(recordingsData);
          recordings.forEach((recording: Recording) => {
            dispatch({ type: ActionTypes.ADD_RECORDING, payload: recording });
          });
        }
        
        // Check if onboarding is completed
        const onboardingComplete = await AsyncStorage.getItem('onboardingComplete');
        if (onboardingComplete === 'true') {
          dispatch({ type: ActionTypes.COMPLETE_ONBOARDING });
        }
        
        // Load settings
        const settingsData = await AsyncStorage.getItem('settings');
        if (settingsData) {
          dispatch({ 
            type: ActionTypes.UPDATE_SETTINGS, 
            payload: JSON.parse(settingsData) 
          });
        }
        
      } catch (error) {
        console.error('Error loading persisted state:', error);
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'Failed to load app data' });
      }
    };
    
    loadPersistedState();
  }, []);
  
  // Persist state changes
  useEffect(() => {
    const persistState = async () => {
      try {
        // Persist user
        if (state.user) {
          await AsyncStorage.setItem('user', JSON.stringify(state.user));
        } else {
          await AsyncStorage.removeItem('user');
        }
        
        // Persist recordings metadata
        if (state.recordings.length > 0) {
          await AsyncStorage.setItem('recordings', JSON.stringify(state.recordings));
        }
        
        // Persist onboarding status
        if (state.isOnboardingComplete) {
          await AsyncStorage.setItem('onboardingComplete', 'true');
        }
        
        // Persist settings
        await AsyncStorage.setItem('settings', JSON.stringify(state.settings));
        
      } catch (error) {
        console.error('Error persisting state:', error);
      }
    };
    
    persistState();
  }, [state.user, state.recordings, state.isOnboardingComplete, state.settings]);
  
  const value = { state, dispatch };
  
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}
