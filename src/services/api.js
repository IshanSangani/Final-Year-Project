/**
 * API Service
 * Placeholder for backend API integration
 * 
 * TODO: Replace with actual API implementation when backend is available
 */

// Simulated API response delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock user data for authentication
const MOCK_USERS = [
  { id: '1', email: 'test@example.com', password: 'password', name: 'Test User' },
  { id: '2', email: 'demo@example.com', password: 'password', name: 'Demo User' },
];

// Mock disease probabilities for analysis results
const generateMockAnalysis = () => {
  return {
    timestamp: new Date().toISOString(),
    diseases: [
      { name: 'Bronchitis', probability: Math.random() * 0.5 },
      { name: 'Common Cold', probability: Math.random() * 0.7 },
      { name: 'COVID-19', probability: Math.random() * 0.3 },
      { name: 'Asthma', probability: Math.random() * 0.4 },
      { name: 'Healthy', probability: 0.7 + Math.random() * 0.3 },
    ].sort((a, b) => b.probability - a.probability),
    respiratoryRate: Math.floor(12 + Math.random() * 10),
    audioQuality: Math.random() * 100,
    recommendations: [
      'Continue monitoring your respiratory health',
      'Consider consulting with a healthcare provider',
      'Stay hydrated and get plenty of rest',
    ],
  };
};

// Auth API endpoints
const auth = {
  login: async (email, password) => {
    // Simulate API request
    await delay(1000);
    
    const user = MOCK_USERS.find(u => u.email === email && u.password === password);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Remove password from returned user object
    const { password: _, ...userWithoutPassword } = user;
    
    return {
      user: userWithoutPassword,
      token: 'mock-jwt-token',
    };
  },
  
  register: async (email, password, name) => {
    // Simulate API request
    await delay(1500);
    
    // Check if user already exists
    if (MOCK_USERS.some(u => u.email === email)) {
      throw new Error('User already exists');
    }
    
    // Create new mock user
    const newUser = {
      id: `${MOCK_USERS.length + 1}`,
      email,
      password,
      name: name || email.split('@')[0],
    };
    
    // Add to mock users (would be persisted in a real backend)
    MOCK_USERS.push(newUser);
    
    // Remove password from returned user object
    const { password: _, ...userWithoutPassword } = newUser;
    
    return {
      user: userWithoutPassword,
      token: 'mock-jwt-token',
    };
  },
  
  forgotPassword: async (email) => {
    // Simulate API request
    await delay(1000);
    
    // Check if user exists
    if (!MOCK_USERS.some(u => u.email === email)) {
      throw new Error('User not found');
    }
    
    return { success: true, message: 'Password reset email sent' };
  },
};

// Recordings API endpoints
const recordings = {
  analyze: async (recordingId, audioUri) => {
    // Simulate API request with longer delay for "processing"
    await delay(2000);
    
    // TODO: In a real implementation, this would upload the audio file to the backend
    console.log(`Analyzing recording ${recordingId} from ${audioUri}`);
    
    // Generate mock analysis results
    return generateMockAnalysis();
  },
  
  getHistory: async (userId) => {
    // Simulate API request
    await delay(800);
    
    // This would fetch from server in a real implementation
    // Here we're assuming recordings are stored locally
    return { success: true };
  },
};

// User profile API endpoints
const profile = {
  updateProfile: async (userId, profileData) => {
    // Simulate API request
    await delay(1000);
    
    // This would update the user profile on the server
    console.log(`Updating profile for user ${userId}`, profileData);
    
    return {
      success: true,
      user: {
        id: userId,
        ...profileData,
      }
    };
  },
};

export default {
  auth,
  recordings,
  profile,
};
