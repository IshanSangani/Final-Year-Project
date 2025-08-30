/**
 * Home Screen
 * Main dashboard screen showing quick actions and recent recordings
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

import { useAppContext } from '../context/AppContext';
import theme from '../styles/theme';
import strings from '../utils/strings';
import Header from '../components/Header';
import storageService from '../services/storageService';
import audioService from '../services/audioService';

const HomeScreen = () => {
  const { state } = useAppContext();
  const navigation = useNavigation();
  const [recentRecordings, setRecentRecordings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playingId, setPlayingId] = useState(null);
  const [sound, setSound] = useState(null);

  // Fetch recent recordings
  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        await storageService.initialize();
        const allRecordings = await storageService.getRecordings();
        
        // Get the 3 most recent recordings
        const recent = allRecordings.slice(0, 3);
        setRecentRecordings(recent);
      } catch (error) {
        console.error('Error fetching recordings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecordings();
  }, [state.recordings]);

  // Clean up audio resources on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

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

  // Navigate to record screen
  const handleRecord = () => {
    navigation.navigate('Record');
  };

  // Navigate to history screen
  const handleViewAll = () => {
    navigation.navigate('History');
  };

  // Navigate to analyze screen for a specific recording
  const handleAnalyze = (recording) => {
    navigation.navigate('Analyze', { recordingId: recording.id });
  };

  // Render header with profile button
  const renderHeader = () => {
    const userName = state.user?.name || strings.home.guest;
    
    const profileButton = (
      <TouchableOpacity 
        onPress={() => navigation.navigate('Profile')}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="person-circle-outline" size={28} color={theme.colors.text} />
      </TouchableOpacity>
    );
    
    return (
      <Header 
        title={`${strings.home.welcome}, ${userName}`}
        rightComponent={profileButton}
      />
    );
  };

  // Render a recording item
  const renderRecordingItem = ({ item }) => {
    const isPlaying = playingId === item.id;
    
    return (
      <View style={styles.recordingItem}>
        <View style={styles.recordingInfo}>
          <Text style={styles.recordingDate}>{formatDate(item.createdAt)}</Text>
          <Text style={styles.recordingDuration}>{formatDuration(item.duration)}</Text>
        </View>
        
        <View style={styles.recordingActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handlePlayPause(item)}
          >
            <Ionicons 
              name={isPlaying ? "pause" : "play"} 
              size={18} 
              color={theme.colors.primary} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.analyzeButton]}
            onPress={() => handleAnalyze(item)}
          >
            <Text style={styles.analyzeButtonText}>{strings.home.analyze}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Record CTA */}
        <TouchableOpacity 
          style={styles.recordButton}
          onPress={handleRecord}
        >
          <View style={styles.recordButtonContent}>
            <Ionicons name="mic" size={24} color="#fff" />
            <Text style={styles.recordButtonText}>{strings.home.recordCTA}</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
        
        {/* Recent recordings section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{strings.home.recentRecordings}</Text>
            <TouchableOpacity onPress={handleViewAll}>
              <Text style={styles.viewAllText}>{strings.home.viewAll}</Text>
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
          ) : recentRecordings.length > 0 ? (
            <View style={styles.recordingsList}>
              {recentRecordings.map((item) => (
                <View key={item.id}>
                  {renderRecordingItem({ item })}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons 
                name="document-outline" 
                size={48} 
                color={theme.colors.textSecondary} 
              />
              <Text style={styles.emptyStateText}>{strings.home.noRecordings}</Text>
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={handleRecord}
              >
                <Text style={styles.emptyStateButtonText}>{strings.home.recordCTA}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Information card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="information-circle-outline" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>How it works</Text>
            <Text style={styles.infoDescription}>
              Record a cough sample to analyze your respiratory health using AI technology.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: theme.spacing.l,
  },
  recordButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.l,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.l,
    ...theme.shadows.medium,
  },
  recordButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordButtonText: {
    color: '#fff',
    fontSize: theme.typography.fontSize.l,
    fontWeight: 'bold',
    marginLeft: theme.spacing.m,
  },
  sectionContainer: {
    marginBottom: theme.spacing.l,
  },
  sectionHeader: {
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
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.s,
  },
  recordingsList: {
    marginBottom: theme.spacing.m,
  },
  recordingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.s,
    ...theme.shadows.small,
  },
  recordingInfo: {
    flex: 1,
  },
  recordingDate: {
    fontSize: theme.typography.fontSize.m,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  recordingDuration: {
    fontSize: theme.typography.fontSize.s,
    color: theme.colors.textSecondary,
  },
  recordingActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: theme.spacing.s,
    borderRadius: theme.borderRadius.s,
    marginLeft: theme.spacing.s,
  },
  analyzeButton: {
    backgroundColor: `${theme.colors.primary}20`,
    paddingHorizontal: theme.spacing.m,
  },
  analyzeButtonText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.s,
    fontWeight: '500',
  },
  loader: {
    marginVertical: theme.spacing.l,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  emptyStateText: {
    marginTop: theme.spacing.m,
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.m,
    textAlign: 'center',
  },
  emptyStateButton: {
    marginTop: theme.spacing.l,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.l,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${theme.colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.m,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: theme.typography.fontSize.m,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  infoDescription: {
    fontSize: theme.typography.fontSize.s,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.lineHeight.s,
  },
});

export default HomeScreen;
