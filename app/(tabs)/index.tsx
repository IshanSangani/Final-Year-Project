import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAppContext } from '../context/AppContext';
import { theme } from '../constants/Theme';
import { strings } from '../utils/strings';
import { getRecordings } from '../services/audioService';
import { Recording } from '../context/AppContext';

export default function HomeScreen() {
  const { state } = useAppContext();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [recentRecordings, setRecentRecordings] = useState<Partial<Recording>[]>([]);

  // Load recent recordings
  useEffect(() => {
    const loadRecordings = async () => {
      try {
        setIsLoading(true);
        
        // If there are recordings in state, use those
        if (state.recordings.length > 0) {
          // Get only the 5 most recent recordings
          setRecentRecordings(state.recordings.slice(0, 5));
        } else {
          // Otherwise fetch recordings
          const recordings = await getRecordings();
          setRecentRecordings(recordings.slice(0, 5));
        }
      } catch (error) {
        console.error('Error loading recordings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecordings();
  }, [state.recordings]);

  // In the real app, we would navigate properly with Expo Router
  // For now, we'll simply display alerts instead of navigation
  
  // Navigate to Record screen
  const handleRecord = () => {
    // In a real implementation, we would navigate to the Record tab
    console.log("Navigate to Record tab");
    alert("Navigate to Record tab");
  };

  // Navigate to Recording History screen
  const handleViewAllRecordings = () => {
    // In a real implementation, we would navigate to the History tab
    console.log("Navigate to History tab");
    alert("Navigate to History tab");
  };

  // Navigate to Analysis screen
  const handleAnalyze = (recording: Partial<Recording>) => {
    // In a real implementation, we would navigate to the Analyze screen
    console.log("Navigate to Analysis with recording ID:", recording.id);
    alert("Navigate to Analysis with recording ID: " + recording.id);
  };

  // Render recording item
  const renderRecordingItem = ({ item }: { item: Partial<Recording> }) => {
    // Format date
    const recordingDate = item.date ? new Date(item.date) : new Date();
    const formattedDate = recordingDate.toLocaleDateString();
    
    return (
      <TouchableOpacity
        style={styles.recordingItem}
        onPress={() => handleAnalyze(item)}
      >
        <View style={styles.recordingIcon}>
          <Ionicons name="mic" size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.recordingInfo}>
          <Text style={styles.recordingDate}>Recording from {formattedDate}</Text>
          <Text style={styles.recordingDuration}>
            {item.duration ? `${item.duration.toFixed(1)} seconds` : 'Unknown duration'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{strings.home.welcome}</Text>
          <Text style={styles.username}>{state.user?.name || strings.home.guest}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Record card */}
        <TouchableOpacity style={styles.recordCard} onPress={handleRecord}>
          <View style={styles.recordCardContent}>
            <Ionicons name="mic" size={32} color="#fff" />
            <Text style={styles.recordCardText}>{strings.home.recordCTA}</Text>
          </View>
        </TouchableOpacity>

        {/* Recent recordings section */}
        <View style={styles.recentRecordingsHeader}>
          <Text style={styles.sectionTitle}>{strings.home.recentRecordings}</Text>
          <TouchableOpacity onPress={handleViewAllRecordings}>
            <Text style={styles.viewAllText}>{strings.home.viewAll}</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
        ) : recentRecordings.length > 0 ? (
          <FlatList
            data={recentRecordings}
            renderItem={renderRecordingItem}
            keyExtractor={item => item.id || ''}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document" size={48} color={theme.colors.inactive} />
            <Text style={styles.emptyStateText}>{strings.home.noRecordings}</Text>
            <TouchableOpacity style={styles.recordButton} onPress={handleRecord}>
              <Text style={styles.recordButtonText}>{strings.home.recordCTA}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Health tips section */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Health Tips</Text>
          <View style={styles.tipCard}>
            <Ionicons name="water" size={24} color={theme.colors.primary} />
            <Text style={styles.tipText}>
              Stay hydrated! Drinking plenty of water helps maintain respiratory health.
            </Text>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="fitness" size={24} color={theme.colors.primary} />
            <Text style={styles.tipText}>
              Regular exercise improves lung capacity and overall respiratory function.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.l,
    paddingTop: theme.spacing.l,
    paddingBottom: theme.spacing.m,
  },
  greeting: {
    fontSize: theme.typography.fontSize.m,
    color: theme.colors.textSecondary,
  },
  username: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.l,
  },
  recordCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.l,
    marginVertical: theme.spacing.l,
    padding: theme.spacing.l,
    ...theme.shadows.medium,
  },
  recordCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.l,
  },
  recordCardText: {
    fontSize: theme.typography.fontSize.l,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: theme.spacing.m,
  },
  recentRecordingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.l,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  viewAllText: {
    fontSize: theme.typography.fontSize.s,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  loader: {
    marginVertical: theme.spacing.xl,
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
    backgroundColor: `${theme.colors.primary}20`,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
  },
  recordingInfo: {
    flex: 1,
    marginLeft: theme.spacing.m,
  },
  recordingDate: {
    fontSize: theme.typography.fontSize.m,
    color: theme.colors.text,
    fontWeight: '500',
  },
  recordingDuration: {
    fontSize: theme.typography.fontSize.s,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyStateText: {
    fontSize: theme.typography.fontSize.m,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.m,
    marginBottom: theme.spacing.l,
  },
  recordButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
  },
  recordButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  tipsSection: {
    marginTop: theme.spacing.l,
    marginBottom: theme.spacing.xxl,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    marginTop: theme.spacing.m,
    padding: theme.spacing.m,
    ...theme.shadows.small,
  },
  tipText: {
    flex: 1,
    marginLeft: theme.spacing.m,
    fontSize: theme.typography.fontSize.m,
    color: theme.colors.text,
  },
});
