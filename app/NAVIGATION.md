# Respiratory Health Analysis App - Demo Instructions

This is a demo implementation of a respiratory health analysis app using Expo Router and TypeScript. The app allows users to record respiratory sounds, analyze them, and track their respiratory health over time.

## Navigation Notes

Due to TypeScript type checking constraints in the demo, some navigation features have been simplified. In a full implementation:

1. **Tab Navigation**: The app uses Expo Router's file-based routing with the (tabs) directory structure. Each tab is defined in the app/(tabs)/_layout.tsx file.

2. **Navigation Between Tabs**: In a real implementation, you would navigate using:
   ```typescript
   import { useRouter } from 'expo-router';
   
   // Inside your component
   const router = useRouter();
   
   // Navigate to a specific tab
   router.navigate('(tabs)/record');
   ```

3. **Navigation with Parameters**: For screens that require parameters:
   ```typescript
   router.navigate({
     pathname: '/(tabs)/analyze',
     params: { recordingId: 'some-id' }
   });
   ```

4. **Access Parameters**: In the target screen:
   ```typescript
   import { useLocalSearchParams } from 'expo-router';
   
   // Inside your component
   const params = useLocalSearchParams();
   const recordingId = params.recordingId;
   ```

## Known Issues

1. TypeScript type checking for Expo Router navigation is strict and might show errors even when the navigation would work at runtime.

2. For this demo, we've implemented alerts instead of actual navigation in some places to avoid TypeScript errors.

3. In a production app, you would configure the appropriate route patterns in the app/_layout.tsx file to ensure proper navigation.

## Implementation Details

1. **Authentication Flow**: The app includes authentication screens and an onboarding experience.

2. **Data Persistence**: User data and recordings are stored using AsyncStorage.

3. **Audio Recording**: The app uses expo-av for audio recording and playback.

4. **Analysis**: The analysis functionality is currently mocked but could be expanded to integrate with a real backend service.

## Next Steps

1. Fix navigation type issues by properly configuring Expo Router's type definitions
2. Implement actual audio processing and analysis features
3. Add unit and integration tests
4. Refine UI/UX based on user feedback
5. Add more robust error handling and offline support
