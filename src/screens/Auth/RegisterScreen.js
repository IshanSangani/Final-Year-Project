/**
 * Register Screen
 * User registration form
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { useAppContext, ActionTypes } from '../../context/AppContext';
import theme from '../../styles/theme';
import strings from '../../utils/strings';
import api from '../../services/api';
import Header from '../../components/Header';

const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [errors, setErrors] = useState({});
  
  const navigation = useNavigation();
  const { dispatch } = useAppContext();

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!name) {
      newErrors.name = 'Name is required';
    }
    
    if (!email) {
      newErrors.email = strings.auth.emailRequired;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = strings.auth.invalidEmail;
    }
    
    if (!password) {
      newErrors.password = strings.auth.passwordRequired;
    } else if (password.length < 6) {
      newErrors.password = strings.auth.passwordLength;
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = strings.auth.passwordMatch;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle register
  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await api.auth.register(email, password, name);
      
      // Update global state with user data
      dispatch({ 
        type: ActionTypes.SET_USER, 
        payload: response.user 
      });
      
      // Navigate to home screen
      // This is handled by the navigator based on user state
      
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert(
        'Registration Failed', 
        error.message || 'Please check your information and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Header title="Create Account" showBack={true} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            {/* Name input */}
            <View style={styles.inputContainer}>
              <Ionicons 
                name="person-outline" 
                size={20} 
                color={theme.colors.textSecondary} 
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
                accessibilityLabel="Full Name"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            
            {/* Email input */}
            <View style={styles.inputContainer}>
              <Ionicons 
                name="mail-outline" 
                size={20} 
                color={theme.colors.textSecondary} 
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={strings.auth.email}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
                accessibilityLabel={strings.auth.email}
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            
            {/* Password input */}
            <View style={styles.inputContainer}>
              <Ionicons 
                name="lock-closed-outline" 
                size={20} 
                color={theme.colors.textSecondary} 
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={strings.auth.password}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
                returnKeyType="next"
                accessibilityLabel={strings.auth.password}
                placeholderTextColor={theme.colors.textSecondary}
              />
              <TouchableOpacity 
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                style={styles.visibilityIcon}
              >
                <Ionicons 
                  name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={theme.colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            
            {/* Confirm Password input */}
            <View style={styles.inputContainer}>
              <Ionicons 
                name="lock-closed-outline" 
                size={20} 
                color={theme.colors.textSecondary} 
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={strings.auth.confirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!isConfirmPasswordVisible}
                returnKeyType="done"
                accessibilityLabel={strings.auth.confirmPassword}
                placeholderTextColor={theme.colors.textSecondary}
              />
              <TouchableOpacity 
                onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                style={styles.visibilityIcon}
              >
                <Ionicons 
                  name={isConfirmPasswordVisible ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={theme.colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}
            
            {/* Register button */}
            <TouchableOpacity 
              style={styles.registerButton} 
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>{strings.auth.register}</Text>
              )}
            </TouchableOpacity>
            
            {/* Login link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>
                {strings.auth.haveAccount}{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>{strings.auth.login}</Text>
              </TouchableOpacity>
            </View>
            
            {/* Privacy note */}
            <Text style={styles.privacyText}>
              By signing up, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.m,
    paddingHorizontal: theme.spacing.m,
    marginBottom: theme.spacing.m,
    height: 50,
  },
  inputIcon: {
    marginRight: theme.spacing.s,
  },
  input: {
    flex: 1,
    height: '100%',
    color: theme.colors.text,
  },
  visibilityIcon: {
    padding: theme.spacing.s,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.s,
    marginTop: -theme.spacing.s,
    marginBottom: theme.spacing.m,
    marginLeft: theme.spacing.s,
  },
  registerButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.m,
    paddingVertical: theme.spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.m,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: theme.typography.fontSize.m,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.l,
  },
  loginText: {
    color: theme.colors.textSecondary,
  },
  loginLink: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  privacyText: {
    marginTop: theme.spacing.xl,
    fontSize: theme.typography.fontSize.s,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default RegisterScreen;
