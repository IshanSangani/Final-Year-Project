import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Create a new analyze.tsx file outside the tabs directory
// This file can be accessed from anywhere in the app
export default function AnalyzeScreen() {
  return (
    <View>
      <Text>Analyze Screen outside tabs</Text>
    </View>
  );
}
