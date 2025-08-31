/**
 * HistoryScreen
 * Shows all saved recordings with play, share, and delete options
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Sharing from 'expo-sharing';

import { useAppContext, ActionTypes } from '../context/AppContext';
import Header from '../components/Header';
import theme from '../styles/theme';
import strings from '../utils/strings';
import storageService from '../services/storageService';
import audioService from '../services/audioService';

const HistoryScreen = () => {
  const navigation = useNavigation();
  const { state, dispatch } = useAppContext();
  
  const [recordings, setRecordings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playingId, setPlayingId] = useState(null);
  const [sound, setSound] = useState(null);
  
  // Load recordings
  useEffect(() => {
    const loadRecordings = async () => {
      try {
        setIsLoading(true);
        console.log('[HistoryScreen] Initializing storage and loading recordings...');
        
        // Initialize storage first
        await storageService.initialize();
        
        // Then get recordings
        const allRecordings = await storageService.getRecordings();
        console.log('[HistoryScreen] Found recordings:', allRecordings.length);
        
        if (allRecordings.length > 0) {
          console.log('[HistoryScreen] First recording:', allRecordings[0].filename);
        }
        
        setRecordings(allRecordings);
      } catch (error) {
        console.error('[HistoryScreen] Error loading recordings:', error);
        Alert.alert('Error', 'Failed to load recordings. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRecordings();
  }, [state.recordings]);
  
  // Clean up audio resources on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);
  
  // Format recording duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Format recording date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

// Check if a recording is a stethoscope recording
const isStethoscopeRecording = (recording) => {
  return recording.source === 'stethoscope' || 
         recording.type === 'stethoscope' ||
         (recording.filename && recording.filename.startsWith('stetho-'));
};  // Format recording time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString();
  };
  
  // Toggle play/pause for a recording
  const handlePlayPause = async (recording) => {
    try {
      // If the same recording is already playing, pause it
      if (playingId === recording.id && sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await sound.pauseAsync();
          } else {
            await sound.playAsync();
          }
          return;
        }
      }
      
      // If a different recording was playing, stop it first
      if (sound) {
        await sound.unloadAsync();
      }
      
      // Play the selected recording
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recording.uri },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );
      
      setSound(newSound);
      setPlayingId(recording.id);
      
    } catch (error) {
      console.error('Error playing recording:', error);
    }
  };
  
  // Monitor playback status
  const onPlaybackStatusUpdate = (status) => {
    if (status.didJustFinish) {
      setPlayingId(null);
    }
  };
  
  // Share a recording
  const handleShare = async (recording) => {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Sharing is not available on this device');
        return;
      }
      
      await Sharing.shareAsync(recording.uri);
    } catch (error) {
      console.error('Error sharing recording:', error);
      Alert.alert('Error', 'Could not share recording');
    }
  };
  
  // Navigate to analyze screen for a recording
  const handleAnalyze = (recording) => {
    navigation.navigate('Analyze', { recordingId: recording.id });
  };
  
  // Delete a recording
  const handleDelete = (recording) => {
    Alert.alert(
      strings.history.deleteConfirm,
      '',
      [
        {
          text: strings.history.cancel,
          style: 'cancel',
        },
        {
          text: strings.history.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              // Stop playback if the recording is playing
              if (playingId === recording.id && sound) {
                await sound.unloadAsync();
                setSound(null);
                setPlayingId(null);
              }
              
              // Delete the recording
              await storageService.deleteRecording(recording.id);
              
              // Update global state
              dispatch({
                type: ActionTypes.DELETE_RECORDING,
                payload: recording.id,
              });
              
              // Update local state
              setRecordings(prevRecordings => 
                prevRecordings.filter(r => r.id !== recording.id)
              );
              
            } catch (error) {
              console.error('Error deleting recording:', error);
              Alert.alert('Error', 'Could not delete recording');
            }
          },
        },
      ]
    );
  };
  
  // Render a recording item
  const renderItem = ({ item }) => {
    const isPlaying = playingId === item.id;
    const hasAnalysis = !!item.analysisResult;
    
    return (
      <View style={styles.recordingItem}>
        <View style={styles.recordingHeader}>
          <Text style={styles.recordingDate}>{formatDate(item.createdAt)}</Text>
          <Text style={styles.recordingTime}>{formatTime(item.createdAt)}</Text>
        </View>
        
        <View style={styles.recordingBody}>
          <View style={styles.recordingInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="medical" size={16} color={theme.colors.primary} />
              <Text style={styles.infoText}>Stethoscope Recording</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.infoText}>{formatDuration(item.duration)}</Text>
            </View>
            
            {hasAnalysis && (
              <View style={styles.analysisIndicator}>
                <Text style={styles.analysisText}>
                  {item.analysisResult.diseases[0].name}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handlePlayPause(item)}
            >
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={22} 
                color={theme.colors.primary} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleShare(item)}
            >
              <Ionicons name="share-outline" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleAnalyze(item)}
            >
              <Ionicons name="analytics-outline" size={22} color={theme.colors.secondary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleDelete(item)}
            >
              <Ionicons name="trash-outline" size={22} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };
  
  // Render empty state
  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }
    
    return (
      <View style={styles.emptyState}>
        <Ionicons name="medical-outline" size={64} color={theme.colors.textSecondary} />
        <Text style={styles.emptyStateText}>No Stethoscope Recordings</Text>
        <TouchableOpacity
          style={styles.recordButton}
          onPress={() => navigation.navigate('Record')}
        >
          <Text style={styles.recordButtonText}>Record Stethoscope Audio</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <Header title={strings.history.title} />
      
      <FlatList
        data={recordings}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      
      {recordings.length > 0 && (
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>{recordings.length} recordings</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    padding: theme.spacing.l,
    flexGrow: 1,
  },
  recordingItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    ...theme.shadows.small,
  },
  recordingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.s,
  },
  recordingDate: {
    fontSize: theme.typography.fontSize.m,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  recordingTime: {
    fontSize: theme.typography.fontSize.s,
    color: theme.colors.textSecondary,
  },
  recordingBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordingInfo: {
    flexDirection: 'column',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  infoText: {
    fontSize: theme.typography.fontSize.s,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  analysisIndicator: {
    backgroundColor: `${theme.colors.primary}20`,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.s,
    borderRadius: theme.borderRadius.s,
    alignSelf: 'flex-start',
  },
  analysisText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.s,
  },
  separator: {
    height: theme.spacing.m,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyStateText: {
    marginTop: theme.spacing.m,
    fontSize: theme.typography.fontSize.m,
    color: theme.colors.textSecondary,
  },
  recordButton: {
    marginTop: theme.spacing.l,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
  },
  recordButtonText: {
    color: '#fff',
    fontSize: theme.typography.fontSize.m,
    fontWeight: '500',
  },
  footerContainer: {
    padding: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    alignItems: 'center',
  },
  footerText: {
    fontSize: theme.typography.fontSize.s,
    color: theme.colors.textSecondary,
  },
});

export default HistoryScreen;
