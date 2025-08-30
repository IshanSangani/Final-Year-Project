import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { useAppContext } from '../context/AppContext';
import { theme } from '../constants/Theme';
import { strings } from '../utils/strings';
import { getRecordings, deleteRecording } from '../services/audioService';
import { Recording } from '../context/AppContext';

export default function HistoryScreen() {
  const { state, dispatch } = useAppContext();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [filterType, setFilterType] = useState('all'); // 'all', 'analyzed', 'unanalyzed'

  // Load recordings from storage
  useEffect(() => {
    const loadRecordings = async () => {
      try {
        setIsLoading(true);
        const recordings = await getRecordings();
        setRecordings(recordings);
      } catch (error) {
        console.error('Error loading recordings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecordings();
  }, [state.recordings]); // Reload when recordings in state change

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

  // Delete recording handler
  const handleDeleteRecording = (id: string) => {
    Alert.alert(
      strings.history.deleteConfirmTitle,
      strings.history.deleteConfirmMessage,
      [
        {
          text: strings.common.cancel,
          style: 'cancel',
        },
        {
          text: strings.common.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecording(id);
              dispatch({ type: 'DELETE_RECORDING', payload: id });
              setRecordings(prev => prev.filter(r => r.id !== id));
            } catch (error) {
              console.error('Error deleting recording:', error);
              Alert.alert(strings.common.error, strings.history.deleteError);
            }
          },
        },
      ]
    );
  };

  // View recording details handler
  const handleViewRecording = (recordingId: string) => {
    // In a real implementation, we would navigate to the Analysis screen
    // For now, we'll simply display an alert
    console.log("Navigate to Analysis with recording ID:", recordingId);
    Alert.alert(
      "View Recording",
      "In a real app, you would be navigated to the Analysis screen for recording: " + recordingId,
      [{ text: "OK" }]
    );
  };

  // Render recording item
  const renderRecordingItem = ({ item }: { item: Recording }) => {
    // Format date for display
    const recordingDate = item.date ? new Date(item.date) : new Date();
    const formattedDate = format(recordingDate, 'MMM d, yyyy • h:mm a');

    return (
      <TouchableOpacity
        style={styles.recordingItem}
        onPress={() => handleViewRecording(item.id)}
      >
        <View style={[
          styles.recordingIcon,
          { backgroundColor: item.analyzed ? `${theme.colors.success}20` : `${theme.colors.primary}20` }
        ]}>
          <Ionicons
            name={item.analyzed ? "checkmark-circle" : "mic"}
            size={24}
            color={item.analyzed ? theme.colors.success : theme.colors.primary}
          />
        </View>
        
        <View style={styles.recordingInfo}>
          <Text style={styles.recordingTitle}>
            {item.analyzed 
              ? `${strings.history.analyzed} ${strings.history.recording}` 
              : `${strings.history.recording}`}
          </Text>
          <Text style={styles.recordingDate}>{formattedDate}</Text>
          <Text style={styles.recordingDuration}>
            {item.duration 
              ? `${item.duration.toFixed(1)} ${strings.history.seconds}` 
              : strings.history.unknownDuration}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteRecording(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-outline" size={64} color={theme.colors.inactive} />
      <Text style={styles.emptyStateTitle}>{strings.history.noRecordings}</Text>
      <Text style={styles.emptyStateDescription}>{strings.history.startRecording}</Text>
      <TouchableOpacity
        style={styles.recordButton}
        onPress={() => {
          // In a real implementation, we would navigate to the Record tab
          console.log("Navigate to Record tab");
          Alert.alert("Navigate to Record tab");
        }}
      >
        <Text style={styles.recordButtonText}>{strings.record.recording}</Text>
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
          keyExtractor={item => item.id}
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.m,
    padding: theme.spacing.m,
    ...theme.shadows.small,
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
  deleteButton: {
    padding: theme.spacing.s,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
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
