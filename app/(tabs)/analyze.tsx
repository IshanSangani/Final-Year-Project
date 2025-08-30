import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Share,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

import { useAppContext } from '../context/AppContext';
import { theme } from '../constants/Theme';
import { strings } from '../utils/strings';
import { analyzeRecording, getRecordings, deleteRecording } from '../services/audioService';
import { Recording, AnalysisResult } from '../context/AppContext';

// Spectrogram component with TypeScript
interface SpectrogramRendererProps {
  data?: number[];
  isLoading?: boolean;
}

const SpectrogramRenderer: React.FC<SpectrogramRendererProps> = ({ data, isLoading }) => {
  const { width } = useWindowDimensions();
  const canvasWidth = width - theme.spacing.l * 2;
  const canvasHeight = 150;
  
  if (isLoading) {
    return (
      <View style={[styles.spectrogram, { width: canvasWidth, height: canvasHeight }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <View style={[styles.spectrogram, { width: canvasWidth, height: canvasHeight }]}>
        <Text style={styles.noDataText}>{strings.analyze.noSpectrogramData}</Text>
      </View>
    );
  }
  
  // Render mock spectrogram - in a real app this would use Canvas or WebGL
  return (
    <View style={[styles.spectrogram, { width: canvasWidth, height: canvasHeight }]}>
      <View style={styles.spectrogramContent}>
        {data.map((value, index) => (
          <View 
            key={index}
            style={{
              width: 3,
              height: Math.max(3, value * canvasHeight / 255),
              backgroundColor: theme.colors.spectrogram[Math.floor(value * theme.colors.spectrogram.length / 255)] || '#00a0dc',
              marginHorizontal: 1,
            }}
          />
        ))}
      </View>
    </View>
  );
};

export default function AnalyzeScreen() {
  const { state, dispatch } = useAppContext();
  const router = useRouter();
  const params = useLocalSearchParams();
  const recordingId = params.recordingId as string;
  
  const [recording, setRecording] = useState<Recording | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [spectrogramData, setSpectrogramData] = useState<number[]>([]);
  
  // Load recording data
  useEffect(() => {
    const fetchRecording = async () => {
      if (!recordingId) {
        router.replace('/(tabs)');
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Try to find recording in state first
        const stateRecording = state.recordings.find(r => r.id === recordingId);
        
        if (stateRecording) {
          setRecording(stateRecording as Recording);
          if (stateRecording.analysis) {
            setAnalysisResult(stateRecording.analysis);
            setSpectrogramData(stateRecording.spectrogramData || generateMockSpectrogramData());
          }
        } else {
          // If not in state, try to load from storage
          const recordings = await getRecordings();
          const loadedRecording = recordings.find(r => r.id === recordingId);
          
          if (loadedRecording) {
            setRecording(loadedRecording as Recording);
            if (loadedRecording.analysis) {
              setAnalysisResult(loadedRecording.analysis);
              setSpectrogramData(loadedRecording.spectrogramData || generateMockSpectrogramData());
            }
          } else {
            // If still not found, go back to home
            Alert.alert(strings.analyze.recordingNotFound);
            router.replace('/(tabs)');
            return;
          }
        }
      } catch (error) {
        console.error('Error loading recording:', error);
        Alert.alert(strings.common.error, strings.analyze.errorLoading);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecording();
    
    // Clean up
    return () => {
      unloadSound();
    };
  }, [recordingId]);
  
  // Generate mock spectrogram data
  const generateMockSpectrogramData = () => {
    const data: number[] = [];
    for (let i = 0; i < 100; i++) {
      // Create a pattern that looks like audio waves
      data.push(Math.abs(Math.sin(i / 5) * 200 + Math.random() * 55));
    }
    return data;
  };
  
  // Load sound object
  useEffect(() => {
    const loadSound = async () => {
      if (recording?.uri) {
        try {
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: recording.uri },
            { shouldPlay: false }
          );
          setSound(newSound);
          
          // Add status update listener
          newSound.setOnPlaybackStatusUpdate(status => {
            if (status.isLoaded && !status.isPlaying && status.didJustFinish) {
              setIsPlaying(false);
            }
          });
        } catch (error) {
          console.error('Error loading sound:', error);
        }
      }
    };
    
    loadSound();
  }, [recording]);
  
  // Unload sound when component unmounts
  const unloadSound = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
    }
  };
  
  // Handle play/pause
  const togglePlayback = async () => {
    if (!sound) return;
    
    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playFromPositionAsync(0);
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error playing/pausing sound:', error);
    }
  };
  
  // Handle analyze button press
  const handleAnalyze = async () => {
    if (!recording) return;
    
    try {
      setIsAnalyzing(true);
      
      // Perform the analysis
      const result = await analyzeRecording(recording.uri);
      
      if (result) {
        // Generate spectrogram data - in a real app this would be returned from the analysis
        const spectrogramData = generateMockSpectrogramData();
        
        // Update recording with analysis results
        const updatedRecording = {
          ...recording,
          analyzed: true,
          analysis: result,
          spectrogramData,
        };
        
        // Update context state
        dispatch({ 
          type: 'UPDATE_RECORDING',
          payload: updatedRecording
        });
        
        // Update local state
        setAnalysisResult(result);
        setSpectrogramData(spectrogramData);
        setRecording(updatedRecording as Recording);
      }
    } catch (error) {
      console.error('Error analyzing recording:', error);
      Alert.alert(strings.common.error, strings.analyze.analysisError);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Handle share button press
  const handleShare = async () => {
    if (!recording || !analysisResult) return;
    
    try {
      const message = `
        ${strings.analyze.shareMessage}
        
        ${strings.analyze.recordingDate}: ${new Date(recording.date).toLocaleDateString()}
        ${strings.analyze.duration}: ${recording.duration.toFixed(1)} ${strings.analyze.seconds}
        
        ${strings.analyze.respiratoryRate}: ${analysisResult.respiratoryRate} ${strings.analyze.breathsPerMinute}
        ${strings.analyze.respiratoryCondition}: ${analysisResult.condition}
        ${strings.analyze.confidence}: ${analysisResult.confidence.toFixed(1)}%
        
        ${analysisResult.irregularities ? `${strings.analyze.irregularities}: ${strings.analyze.detected}` : ''}
      `;
      
      await Share.share({
        message,
        title: strings.analyze.shareTitle,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };
  
  // Handle delete button press
  const handleDelete = () => {
    if (!recording) return;
    
    Alert.alert(
      strings.analyze.deleteConfirm,
      strings.analyze.deleteMessage,
      [
        {
          text: strings.common.cancel,
          style: 'cancel'
        },
        {
          text: strings.common.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecording(recording.id);
              dispatch({ type: 'DELETE_RECORDING', payload: recording.id });
              router.replace('/(tabs)');
            } catch (error) {
              console.error('Error deleting recording:', error);
              Alert.alert(strings.common.error, strings.analyze.deleteError);
            }
          }
        }
      ]
    );
  };
  
  // Format date for display
  const getFormattedDate = () => {
    if (!recording) return '';
    const date = new Date(recording.date);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{strings.analyze.loading}</Text>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{strings.analyze.title}</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Recording info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{strings.analyze.recordingInfo}</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{strings.analyze.recordedOn}</Text>
            <Text style={styles.infoValue}>{getFormattedDate()}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{strings.analyze.duration}</Text>
            <Text style={styles.infoValue}>
              {recording?.duration ? `${recording.duration.toFixed(1)} ${strings.analyze.seconds}` : '-'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{strings.analyze.fileSize}</Text>
            <Text style={styles.infoValue}>
              {recording?.fileSize ? `${(recording.fileSize / 1024 / 1024).toFixed(2)} MB` : '-'}
            </Text>
          </View>
          
          {/* Playback controls */}
          <TouchableOpacity 
            style={styles.playButton}
            onPress={togglePlayback}
            disabled={!sound}
          >
            <Ionicons 
              name={isPlaying ? "pause" : "play"} 
              size={24} 
              color="#fff" 
            />
            <Text style={styles.playButtonText}>
              {isPlaying ? strings.analyze.pause : strings.analyze.play}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Analysis results */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{strings.analyze.analysisResults}</Text>
          
          {/* Spectrogram */}
          <Text style={styles.sectionTitle}>{strings.analyze.spectrogram}</Text>
          <SpectrogramRenderer 
            data={spectrogramData} 
            isLoading={isAnalyzing}
          />
          
          {analysisResult ? (
            <>
              {/* Results */}
              <View style={styles.resultsContainer}>
                <View style={styles.resultBox}>
                  <Text style={styles.resultValue}>{analysisResult.respiratoryRate}</Text>
                  <Text style={styles.resultLabel}>{strings.analyze.breathsPerMinute}</Text>
                </View>
                
                <View style={styles.resultBox}>
                  <Text style={[
                    styles.resultValue,
                    analysisResult.condition === 'Normal' 
                      ? { color: theme.colors.success }
                      : { color: theme.colors.warning }
                  ]}>
                    {analysisResult.condition}
                  </Text>
                  <Text style={styles.resultLabel}>{strings.analyze.condition}</Text>
                </View>
                
                <View style={styles.resultBox}>
                  <Text style={styles.resultValue}>{analysisResult.confidence.toFixed(1)}%</Text>
                  <Text style={styles.resultLabel}>{strings.analyze.confidence}</Text>
                </View>
              </View>
              
              {/* Analysis details */}
              <View style={styles.analysisDetails}>
                <Text style={styles.analysisTitle}>{strings.analyze.interpretation}</Text>
                <Text style={styles.analysisText}>{analysisResult.interpretation}</Text>
                
                <Text style={styles.analysisTitle}>{strings.analyze.recommendations}</Text>
                <Text style={styles.analysisText}>{analysisResult.recommendations}</Text>
              </View>
              
              {/* Share button */}
              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Ionicons name="share-outline" size={20} color="#fff" />
                <Text style={styles.shareButtonText}>{strings.analyze.share}</Text>
              </TouchableOpacity>
            </>
          ) : (
            /* Analyze button */
            <TouchableOpacity 
              style={styles.analyzeButton}
              onPress={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="analytics-outline" size={20} color="#fff" />
                  <Text style={styles.analyzeButtonText}>{strings.analyze.analyze}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
        
        {/* Delete button */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
          <Text style={styles.deleteButtonText}>{strings.analyze.deleteRecording}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.m,
    fontSize: theme.typography.fontSize.m,
    color: theme.colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
  },
  title: {
    fontSize: theme.typography.fontSize.l,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.l,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.l,
    marginBottom: theme.spacing.l,
    ...theme.shadows.small,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.l,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.m,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.s,
    paddingBottom: theme.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.colors.border}40`,
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
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    marginTop: theme.spacing.m,
  },
  playButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: theme.spacing.s,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.m,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: theme.spacing.m,
    marginTop: theme.spacing.l,
  },
  spectrogram: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.m,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spectrogramContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: '100%',
    width: '100%',
    paddingBottom: 10,
  },
  noDataText: {
    fontSize: theme.typography.fontSize.m,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    marginTop: theme.spacing.l,
  },
  analyzeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: theme.spacing.s,
  },
  resultsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: theme.spacing.l,
  },
  resultBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.m,
    marginHorizontal: theme.spacing.xs,
    backgroundColor: `${theme.colors.primary}10`,
    borderRadius: theme.borderRadius.m,
  },
  resultValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  resultLabel: {
    fontSize: theme.typography.fontSize.s,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  analysisDetails: {
    marginTop: theme.spacing.l,
  },
  analysisTitle: {
    fontSize: theme.typography.fontSize.m,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: theme.spacing.s,
  },
  analysisText: {
    fontSize: theme.typography.fontSize.m,
    color: theme.colors.text,
    lineHeight: 22,
    marginBottom: theme.spacing.m,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    marginTop: theme.spacing.m,
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: theme.spacing.s,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.m,
    marginBottom: theme.spacing.xxl,
  },
  deleteButtonText: {
    color: theme.colors.error,
    marginLeft: theme.spacing.xs,
  },
});
