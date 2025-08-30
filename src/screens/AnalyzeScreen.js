/**
 * AnalyzeScreen
 * Shows spectrogram visualization and analysis results for a recording
 * 
 * REQUIRED DEPENDENCIES (DO NOT EDIT package.json, install these manually):
 * npm install react-native-svg
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

import { useAppContext, ActionTypes } from '../context/AppContext';
import Header from '../components/Header';
import SpectrogramRenderer from '../components/SpectrogramRenderer';
import theme from '../styles/theme';
import strings from '../utils/strings';
import api from '../services/api';
import storageService from '../services/storageService';
import audioService from '../services/audioService';

const AnalyzeScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { state, dispatch } = useAppContext();
  const { recordingId } = route.params || {};
  
  const [recording, setRecording] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  
  // Fetch recording data
  useEffect(() => {
    const loadRecording = async () => {
      try {
        if (!recordingId) {
          throw new Error('No recording ID provided');
        }
        
        const recordingData = await storageService.getRecordingById(recordingId);
        
        if (!recordingData) {
          throw new Error('Recording not found');
        }
        
        setRecording(recordingData);
        
        // If there's already an analysis result, use it
        if (recordingData.analysisResult) {
          setAnalysisResult(recordingData.analysisResult);
        }
        
      } catch (error) {
        console.error('Error loading recording:', error);
        Alert.alert('Error', 'Could not load recording: ' + error.message);
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRecording();
  }, [recordingId, navigation]);
  
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
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Toggle play/pause
  const togglePlayback = async () => {
    try {
      if (!recording) return;
      
      if (isPlaying && sound) {
        await sound.pauseAsync();
        setIsPlaying(false);
        return;
      }
      
      if (sound) {
        await sound.playAsync();
        setIsPlaying(true);
        return;
      }
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recording.uri },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );
      
      setSound(newSound);
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing recording:', error);
    }
  };
  
  // Monitor playback status
  const onPlaybackStatusUpdate = (status) => {
    if (status.didJustFinish) {
      setIsPlaying(false);
    }
  };
  
  // Send to server for analysis
  const handleAnalyze = async () => {
    try {
      setIsAnalyzing(true);
      
      // Call API to analyze recording
      const result = await api.recordings.analyze(recording.id, recording.uri);
      
      // Update state with analysis result
      setAnalysisResult(result);
      
      // Update recording in storage
      await storageService.updateRecording(recording.id, {
        analysisResult: result,
      });
      
      // Update recording in global state
      dispatch({
        type: ActionTypes.UPDATE_ANALYSIS,
        payload: {
          id: recording.id,
          analysisResult: result,
        },
      });
      
    } catch (error) {
      console.error('Error analyzing recording:', error);
      Alert.alert('Error', 'Could not analyze recording: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Share results
  const handleShare = async () => {
    try {
      if (!analysisResult) return;
      
      // Format analysis results for sharing
      const mainDisease = analysisResult.diseases[0];
      const shareMessage = 
        `Respiratory Analysis Results:\n\n` +
        `Date: ${formatDate(analysisResult.timestamp)}\n` +
        `Most likely condition: ${mainDisease.name} (${Math.round(mainDisease.probability * 100)}%)\n` +
        `Respiratory rate: ${analysisResult.respiratoryRate} breaths/min\n\n` +
        `Analyzed using Respiratory Health App`;
      
      await Share.share({
        message: shareMessage,
        title: 'Respiratory Analysis Results',
      });
      
    } catch (error) {
      console.error('Error sharing results:', error);
    }
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Analysis" showBack={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>{strings.common.loading}</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <Header title="Analysis" showBack={true} />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Recording info */}
          <View style={styles.recordingInfo}>
            <Text style={styles.recordingDate}>
              {formatDate(recording.createdAt)}
            </Text>
            <Text style={styles.recordingDuration}>
              Duration: {formatDuration(recording.duration)}
            </Text>
          </View>
          
          {/* Playback control */}
          <TouchableOpacity 
            style={styles.playButton}
            onPress={togglePlayback}
          >
            <Ionicons 
              name={isPlaying ? "pause" : "play"} 
              size={24} 
              color="#fff" 
            />
            <Text style={styles.playButtonText}>
              {isPlaying ? "Pause" : "Play Recording"}
            </Text>
          </TouchableOpacity>
          
          {/* Spectrogram */}
          <View style={styles.spectrogramContainer}>
            <Text style={styles.sectionTitle}>
              {strings.analyze.spectrogramTitle}
            </Text>
            <SpectrogramRenderer 
              style={styles.spectrogram}
              height={180}
            />
          </View>
          
          {/* Analysis Results */}
          <View style={styles.analysisContainer}>
            <Text style={styles.sectionTitle}>
              {strings.analyze.resultsTitle}
            </Text>
            
            {!analysisResult ? (
              <View style={styles.noAnalysisContainer}>
                <Text style={styles.noAnalysisText}>
                  {strings.analyze.processing}
                </Text>
                <TouchableOpacity 
                  style={styles.analyzeButton}
                  onPress={handleAnalyze}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.analyzeButtonText}>
                      {strings.analyze.sendToServer}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.resultsContainer}>
                {/* Health status */}
                <View style={styles.statusContainer}>
                  <Text style={styles.statusLabel}>
                    {strings.analyze.healthStatus}:
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    { 
                      backgroundColor: 
                        analysisResult.diseases[0].probability > 0.7 
                          ? theme.colors.success 
                          : analysisResult.diseases[0].probability > 0.4
                            ? theme.colors.warning
                            : theme.colors.error
                    }
                  ]}>
                    <Text style={styles.statusText}>
                      {analysisResult.diseases[0].name}
                    </Text>
                  </View>
                </View>
                
                {/* Respiratory rate */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Respiratory Rate:</Text>
                  <Text style={styles.infoValue}>
                    {analysisResult.respiratoryRate} breaths/min
                  </Text>
                </View>
                
                {/* Disease probabilities */}
                <View style={styles.probabilitiesContainer}>
                  <Text style={styles.probabilitiesTitle}>
                    {strings.analyze.probability}:
                  </Text>
                  
                  {analysisResult.diseases.map((disease, index) => (
                    <View key={index} style={styles.probabilityRow}>
                      <Text style={styles.diseaseName}>{disease.name}</Text>
                      <View style={styles.probabilityBarContainer}>
                        <View 
                          style={[
                            styles.probabilityBar,
                            { 
                              width: `${disease.probability * 100}%`,
                              backgroundColor: 
                                index === 0 ? theme.colors.primary : 
                                index === 1 ? theme.colors.secondary : 
                                theme.colors.inactive
                            }
                          ]} 
                        />
                      </View>
                      <Text style={styles.probabilityValue}>
                        {Math.round(disease.probability * 100)}%
                      </Text>
                    </View>
                  ))}
                </View>
                
                {/* Recommendations */}
                <View style={styles.recommendationsContainer}>
                  <Text style={styles.recommendationsTitle}>Recommendations:</Text>
                  {analysisResult.recommendations.map((recommendation, index) => (
                    <View key={index} style={styles.recommendationItem}>
                      <Ionicons 
                        name="checkmark-circle" 
                        size={16} 
                        color={theme.colors.primary}
                        style={styles.recommendationIcon}
                      />
                      <Text style={styles.recommendationText}>
                        {recommendation}
                      </Text>
                    </View>
                  ))}
                </View>
                
                {/* Share results */}
                <TouchableOpacity 
                  style={styles.shareButton}
                  onPress={handleShare}
                >
                  <Ionicons name="share-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.shareButtonText}>
                    {strings.analyze.shareResults}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {/* Disclaimer */}
          <View style={styles.disclaimerContainer}>
            <Text style={styles.disclaimerText}>
              DISCLAIMER: This analysis is for informational purposes only and should not replace professional medical advice.
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.m,
    color: theme.colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.l,
  },
  recordingInfo: {
    marginBottom: theme.spacing.l,
  },
  recordingDate: {
    fontSize: theme.typography.fontSize.l,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  recordingDuration: {
    fontSize: theme.typography.fontSize.m,
    color: theme.colors.textSecondary,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.l,
  },
  playButtonText: {
    color: '#fff',
    fontSize: theme.typography.fontSize.m,
    fontWeight: '500',
    marginLeft: theme.spacing.s,
  },
  spectrogramContainer: {
    marginBottom: theme.spacing.l,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.l,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.m,
  },
  spectrogram: {
    width: '100%',
    borderRadius: theme.borderRadius.m,
    overflow: 'hidden',
    ...theme.shadows.small,
  },
  analysisContainer: {
    marginBottom: theme.spacing.l,
  },
  noAnalysisContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  noAnalysisText: {
    fontSize: theme.typography.fontSize.m,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.l,
  },
  analyzeButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: theme.typography.fontSize.m,
    fontWeight: '500',
  },
  resultsContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.l,
    ...theme.shadows.small,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.l,
  },
  statusLabel: {
    fontSize: theme.typography.fontSize.m,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginRight: theme.spacing.s,
  },
  statusBadge: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
  },
  statusText: {
    color: '#fff',
    fontSize: theme.typography.fontSize.m,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.m,
  },
  infoLabel: {
    fontSize: theme.typography.fontSize.m,
    color: theme.colors.textSecondary,
  },
  infoValue: {
    fontSize: theme.typography.fontSize.m,
    fontWeight: '500',
    color: theme.colors.text,
  },
  probabilitiesContainer: {
    marginTop: theme.spacing.m,
    marginBottom: theme.spacing.l,
  },
  probabilitiesTitle: {
    fontSize: theme.typography.fontSize.m,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.m,
  },
  probabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.s,
  },
  diseaseName: {
    width: '30%',
    fontSize: theme.typography.fontSize.s,
    color: theme.colors.text,
  },
  probabilityBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: `${theme.colors.border}50`,
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: theme.spacing.s,
  },
  probabilityBar: {
    height: '100%',
    borderRadius: 4,
  },
  probabilityValue: {
    width: '15%',
    fontSize: theme.typography.fontSize.s,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  recommendationsContainer: {
    marginBottom: theme.spacing.l,
  },
  recommendationsTitle: {
    fontSize: theme.typography.fontSize.m,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.m,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.s,
  },
  recommendationIcon: {
    marginRight: theme.spacing.s,
    marginTop: 2,
  },
  recommendationText: {
    flex: 1,
    fontSize: theme.typography.fontSize.s,
    color: theme.colors.text,
    lineHeight: theme.typography.lineHeight.s,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.m,
  },
  shareButtonText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.m,
    marginLeft: theme.spacing.s,
  },
  disclaimerContainer: {
    marginTop: theme.spacing.l,
    padding: theme.spacing.m,
    backgroundColor: `${theme.colors.warning}20`,
    borderRadius: theme.borderRadius.m,
  },
  disclaimerText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default AnalyzeScreen;
