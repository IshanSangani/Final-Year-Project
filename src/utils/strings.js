/**
 * App-wide localization strings
 * Placeholder for future i18n implementation
 */

export default {
  // Auth screens
  auth: {
    login: 'Log In',
    register: 'Sign Up',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password?',
    noAccount: "Don't have an account? Sign up",
    haveAccount: "Already have an account? Log in",
    emailRequired: 'Email is required',
    passwordRequired: 'Password is required',
    passwordMatch: 'Passwords must match',
    invalidEmail: 'Please enter a valid email',
    passwordLength: 'Password must be at least 6 characters',
  },
  
  // Onboarding
  onboarding: {
    welcome: 'Welcome to Respiratory Health',
    description: 'Monitor your respiratory health with advanced audio analysis',
    slide1Title: 'Record Your Cough',
    slide1Description: 'Simply record a cough sample with your phone',
    slide2Title: 'AI Analysis',
    slide2Description: 'Our AI analyzes your cough patterns',
    slide3Title: 'Track Progress',
    slide3Description: 'Monitor your respiratory health over time',
    getStarted: 'Get Started',
    skip: 'Skip',
    next: 'Next',
  },
  
  // Home screen
  home: {
    welcome: 'Welcome',
    guest: 'Guest',
    recordCTA: 'Record Sample',
    recentRecordings: 'Recent Recordings',
    viewAll: 'View All',
    noRecordings: 'No recordings yet',
    analyze: 'Analyze',
  },
  
  // Record screen
  record: {
    instructions: 'Press and hold to record',
    recording: 'Recording...',
    permission: 'Microphone access is required',
    retry: 'Retry',
    analyze: 'Analyze',
    seconds: 'seconds',
    save: 'Save Recording',
    cancel: 'Cancel',
    tooShort: 'Recording too short',
    holdLonger: 'Please hold for at least 3 seconds',
  },
  
  // Analyze screen
  analyze: {
    title: 'Analysis Results',
    processing: 'Processing your recording...',
    sendToServer: 'Send to Server',
    sendingToServer: 'Sending to server...',
    spectrogramTitle: 'Spectrogram Preview',
    resultsTitle: 'Respiratory Analysis',
    healthStatus: 'Health Status',
    probability: 'Probability',
    saveResults: 'Save Results',
    shareResults: 'Share Results',
  },
  
  // History screen
  history: {
    title: 'History',
    noRecordings: 'No recordings yet',
    recordNew: 'Record New',
    deleteConfirm: 'Delete this recording?',
    cancel: 'Cancel',
    delete: 'Delete',
    share: 'Share',
    duration: 'Duration',
    date: 'Date',
    time: 'Time',
  },
  
  // Profile screen
  profile: {
    title: 'Profile',
    editProfile: 'Edit Profile',
    notifications: 'Notifications',
    darkMode: 'Dark Mode',
    language: 'Language',
    about: 'About',
    logout: 'Logout',
    logoutConfirm: 'Are you sure you want to log out?',
    cancel: 'Cancel',
    confirm: 'Confirm',
  },
  
  // Common
  common: {
    loading: 'Loading...',
    error: 'Something went wrong',
    retry: 'Retry',
    ok: 'OK',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    next: 'Next',
    done: 'Done',
    settings: 'Settings',
  },
  
  // Errors
  errors: {
    permissionDenied: 'Permission denied',
    networkError: 'Network error',
    storageError: 'Storage error',
    lowStorage: 'Low storage space',
    unknownError: 'Something went wrong',
    microphoneRequired: 'Microphone access is required to record audio',
    storageRequired: 'Storage access is required to save recordings',
  },
};
