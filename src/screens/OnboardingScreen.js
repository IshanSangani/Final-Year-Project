/**
 * Onboarding Screen
 * Introduction slides for first-time users
 */

import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  FlatList, 
  TouchableOpacity, 
  Image,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { useAppContext, ActionTypes } from '../context/AppContext';
import theme from '../styles/theme';
import strings from '../utils/strings';

const { width, height } = Dimensions.get('window');

// Onboarding slides data
const slides = [
  {
    id: '1',
    title: strings.onboarding.slide1Title,
    description: strings.onboarding.slide1Description,
    icon: 'mic-outline',
  },
  {
    id: '2',
    title: strings.onboarding.slide2Title,
    description: strings.onboarding.slide2Description,
    icon: 'analytics-outline',
  },
  {
    id: '3',
    title: strings.onboarding.slide3Title,
    description: strings.onboarding.slide3Description,
    icon: 'pulse-outline',
  },
];

const OnboardingScreen = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();
  const { dispatch } = useAppContext();

  // Handle skip
  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem('onboardingComplete', 'true');
      dispatch({ type: ActionTypes.COMPLETE_ONBOARDING });
      navigation.navigate('Login');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  // Handle next slide
  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      handleGetStarted();
    }
  };

  // Handle get started
  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem('onboardingComplete', 'true');
      dispatch({ type: ActionTypes.COMPLETE_ONBOARDING });
      navigation.navigate('Login');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  // Render onboarding slide
  const renderItem = ({ item }) => {
    return (
      <View style={styles.slide}>
        <View style={styles.iconContainer}>
          <Ionicons name={item.icon} size={100} color={theme.colors.primary} />
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    );
  };

  // Render pagination dots
  const renderPagination = () => {
    return (
      <View style={styles.paginationContainer}>
        {slides.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [10, 20, 10],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                { width: dotWidth, opacity },
                i === currentIndex && styles.activeDot,
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>{strings.onboarding.skip}</Text>
      </TouchableOpacity>
      
      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width
          );
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
      />
      
      {/* Pagination */}
      {renderPagination()}
      
      {/* Bottom buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.button, styles.nextButton]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {currentIndex === slides.length - 1
              ? strings.onboarding.getStarted
              : strings.onboarding.next}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  slide: {
    width,
    paddingHorizontal: theme.spacing.l,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: `${theme.colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.m,
    textAlign: 'center',
  },
  description: {
    fontSize: theme.typography.fontSize.l,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.l,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: theme.spacing.l,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: theme.colors.primary,
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.l,
    paddingBottom: theme.spacing.xl,
  },
  button: {
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  nextButton: {
    backgroundColor: theme.colors.primary,
    flex: 1,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: theme.typography.fontSize.m,
    fontWeight: 'bold',
    marginRight: theme.spacing.s,
  },
  skipButton: {
    position: 'absolute',
    top: theme.spacing.l,
    right: theme.spacing.l,
    zIndex: 10,
    padding: theme.spacing.s,
  },
  skipText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.m,
  },
});

export default OnboardingScreen;
