/**
 * Respiratory Health Audio Analysis App
 * Main App Entry Point
 * 
 * REQUIRED DEPENDENCIES (DO NOT EDIT package.json, install these manually):
 * 
 * expo install expo-av expo-file-system expo-sharing @react-navigation/native @react-navigation/native-stack
 * @react-navigation/bottom-tabs expo-image expo-asset expo-permissions react-native-svg
 */

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AppProvider>
        <AppNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
}
