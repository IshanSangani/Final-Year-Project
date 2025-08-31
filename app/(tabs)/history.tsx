import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Audio } from 'expo-av';

import { useAppContext } from '../context/AppContext';
import { theme } from '../constants/Theme';
import { strings } from '../utils/strings';
import { getRecordings, deleteRecording, playRecording } from '../services/audioService';
import { Recording } from '../context/AppContext';

export default function HistoryScreen() {
  const { state, dispatch } = useAppContext();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [recordings, setRecordings] = useState<Partial<Recording>[]>([]);
  const [filterType, setFilterType] = useState('all'); // 'all', 'analyzed', 'unanalyzed'
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Load recordings from storage
  useEffect(() => {
    const loadRecordings = async () => {
      try {
        setIsLoading(true);
        console.log('[HistoryScreen] Loading recordings from storage...');
        const recordings = await getRecordings();
        console.log(`[HistoryScreen] Loaded ${recordings.length} recordings`);
        setRecordings(recordings);
      } catch (error) {
        console.error('[HistoryScreen] Error loading recordings:', error);
        Alert.alert('Error', 'Unable to load past recordings');
      } finally {
        setIsLoading(false);
      }
    };

    loadRecordings();
  }, [state.recordings]); // Reload when recordings in state change
  
  // Clean up sound when component unmounts
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Filter recordings based on selection
  const filteredRecordings = React.useMemo(() => {
    switch (filterType) {
      case 'analyzed':
        return recordings.filter(r => r.analyzed);
      case 'unanalyzed':
        return recordings.filter(r => !r.analyzed);
      default:
        return recordings;
    }
  }, [recordings, filterType]);

  // Play recording handler
  const handlePlayRecording = async (recording: Partial<Recording>) => {
    try {
      if (!recording.id || !recording.uri) {
        throw new Error('Invalid recording data');
      }

      // If already playing this recording, stop it
      if (playingId === recording.id && sound) {
        await sound.stopAsync();
        setPlayingId(null);
        setSound(null);
        return;
      }
      
      // If playing a different recording, stop the current one
      if (sound) {
        await sound.stopAsync();
        setSound(null);
      }
      
      // Play the selected recording
      console.log(`[HistoryScreen] Playing recording: ${recording.id}`);
      const newSound = await playRecording(recording.uri);
      
      if (newSound) {
        setSound(newSound);
        setPlayingId(recording.id);
        
        // Set up playback status update listener to reset state when done
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setPlayingId(null);
          }
        });
      }
    } catch (error) {
      console.error('[HistoryScreen] Error playing recording:', error);
      Alert.alert('Error', 'Failed to play recording');
      setPlayingId(null);
    }
  };

  // Share recording handler
  const handleShareRecording = async (recording: Partial<Recording>) => {
    try {
      if (!recording.uri) return;
      
      await Share.share({
        url: recording.uri,
        title: `Stethoscope Recording (${format(new Date(recording.createdAt || ''), 'MMM d, yyyy')})`,
      });
    } catch (error) {
      console.error('[HistoryScreen] Error sharing recording:', error);
      Alert.alert('Error', 'Failed to share recording');
    }
  };

  // Delete recording handler
  const handleDeleteRecording = (id: string) => {
    Alert.alert(
      strings.history.deleteConfirmTitle || 'Delete Recording',
      strings.history.deleteConfirmMessage || 'Are you sure you want to delete this recording? This cannot be undone.',
      [
        {
          text: strings.common.cancel || 'Cancel',
          style: 'cancel',
        },
        {
          text: strings.common.delete || 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // If this recording is playing, stop it
              if (playingId === id && sound) {
                await sound.stopAsync();
                setSound(null);
                setPlayingId(null);
              }
              
              console.log(`[HistoryScreen] Deleting recording: ${id}`);
              await deleteRecording(id);
              dispatch({ type: 'DELETE_RECORDING', payload: id });
              setRecordings(prev => prev.filter(r => r.id !== id));
              console.log('[HistoryScreen] Recording deleted successfully');
            } catch (error) {
              console.error('[HistoryScreen] Error deleting recording:', error);
              Alert.alert('Error', 'Failed to delete recording');
            }
          },
        },
      ]
    );
  };

  // View recording details handler
  const handleViewRecording = (recordingId: string) => {
    console.log(`[HistoryScreen] Navigating to analyze screen with recording ID: ${recordingId}`);
    // Navigate to the analyze screen with the recording ID
    router.push(`/(tabs)/analyze?recordingId=${recordingId}`);
  };

  // Render recording item
  const renderRecordingItem = ({ item }: { item: Partial<Recording> }) => {
    if (!item.id) return null;
    
    // Format date for display
    const recordingDate = item.date ? new Date(item.date) : new Date();
    const formattedDate = format(recordingDate, 'MMM d, yyyy • h:mm a');
    const isPlaying = playingId === item.id;

    return (
      <View style={styles.recordingItem}>
        {/* Recording info section - tap to view analysis */}
        <TouchableOpacity 
          style={styles.recordingInfoContainer}
          onPress={() => handleViewRecording(item.id!)}
        >
          <View style={[
            styles.recordingIcon,
            { backgroundColor: `${theme.colors.primary}20` }
          ]}>
            <Ionicons
              name="medical"
              size={24}
              color={theme.colors.primary}
            />
          </View>
          
          <View style={styles.recordingInfo}>
            <Text style={styles.recordingTitle}>
              Stethoscope Recording
            </Text>
            <Text style={styles.recordingDate}>{formattedDate}</Text>
            <Text style={styles.recordingDuration}>
              {item.duration 
                ? `${item.duration.toFixed(1)} seconds` 
                : 'Unknown duration'}
            </Text>
          </View>
        </TouchableOpacity>
        
        {/* Action buttons */}
        <View style={styles.actionsContainer}>
          {/* Play/Pause button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => item.uri && handlePlayRecording(item)}
          >
            <Ionicons 
              name={isPlaying ? "pause-circle" : "play-circle"} 
              size={28} 
              color={theme.colors.primary} 
            />
          </TouchableOpacity>
          
          {/* Share button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleShareRecording(item)}
          >
            <Ionicons name="share-outline" size={24} color={theme.colors.secondary} />
          </TouchableOpacity>
          
          {/* Delete button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteRecording(item.id!)}
          >
            <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="medical-outline" size={64} color={theme.colors.inactive} />
      <Text style={styles.emptyStateTitle}>No Stethoscope Recordings</Text>
      <Text style={styles.emptyStateDescription}>
        You haven't made any stethoscope recordings yet. Tap below to make your first recording.
      </Text>
      <TouchableOpacity
        style={styles.recordButton}
        onPress={() => {
          console.log("[HistoryScreen] Navigating to Record tab");
          router.navigate("/(tabs)/record");
        }}
      >
        <Text style={styles.recordButtonText}>Record Now</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{strings.history.title}</Text>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterType === 'all' && styles.filterButtonActive,
          ]}
          onPress={() => setFilterType('all')}
        >
          <Text
            style={[
              styles.filterText,
              filterType === 'all' && styles.filterTextActive,
            ]}
          >
            {strings.history.all}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterType === 'analyzed' && styles.filterButtonActive,
          ]}
          onPress={() => setFilterType('analyzed')}
        >
          <Text
            style={[
              styles.filterText,
              filterType === 'analyzed' && styles.filterTextActive,
            ]}
          >
            {strings.history.analyzedFilter}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterType === 'unanalyzed' && styles.filterButtonActive,
          ]}
          onPress={() => setFilterType('unanalyzed')}
        >
          <Text
            style={[
              styles.filterText,
              filterType === 'unanalyzed' && styles.filterTextActive,
            ]}
          >
            {strings.history.unanalyzedFilter}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recordings list */}
      {isLoading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={filteredRecordings}
          renderItem={renderRecordingItem}
          keyExtractor={(item) => item.id || 'unknown'}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.l,
    paddingTop: theme.spacing.l,
    paddingBottom: theme.spacing.m,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.l,
    paddingBottom: theme.spacing.m,
  },
  filterButton: {
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    marginRight: theme.spacing.s,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    fontSize: theme.typography.fontSize.s,
    color: theme.colors.textSecondary,
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: theme.spacing.l,
  },
  recordingItem: {
    flexDirection: 'column',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.m,
    overflow: 'hidden',
    ...theme.shadows.small,
  },
  recordingInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.m,
  },
  recordingIcon: {
    borderRadius: theme.borderRadius.m,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingInfo: {
    flex: 1,
    marginLeft: theme.spacing.m,
  },
  recordingTitle: {
    fontSize: theme.typography.fontSize.m,
    fontWeight: '500',
    color: theme.colors.text,
  },
  recordingDate: {
    fontSize: theme.typography.fontSize.s,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  recordingDuration: {
    fontSize: theme.typography.fontSize.s,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: `${theme.colors.border}50`,
    padding: theme.spacing.s,
  },
  actionButton: {
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.s,
  },
  deleteButton: {
    padding: theme.spacing.s,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
  },
  emptyStateTitle: {
    fontSize: theme.typography.fontSize.l,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.l,
  },
  emptyStateDescription: {
    fontSize: theme.typography.fontSize.m,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.m,
    marginBottom: theme.spacing.l,
  },
  recordButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
    ...theme.shadows.small,
  },
  recordButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
