import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Image,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Link, useRouter } from 'expo-router';

import { ActionTypes, useAppContext } from '../context/AppContext';
import { theme } from '../constants/Theme';
import { strings } from '../utils/strings';
import { loginUser, loginAsGuest } from '../services/api';

export default function LoginScreen() {
  const { dispatch } = useAppContext();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  // Validate form inputs
  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    let isValid = true;

    if (!email) {
      newErrors.email = strings.auth.emailRequired;
      isValid = false;
    } else if (!email.includes('@')) {
      newErrors.email = strings.auth.invalidEmail;
      isValid = false;
    }

    if (!password) {
      newErrors.password = strings.auth.passwordRequired;
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = strings.auth.passwordLength;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle login
  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      setErrors({});

      // Call login API
      const user = await loginUser(email, password);

      // Update global state with user data
      dispatch({ type: ActionTypes.SET_USER, payload: user });

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ general: 'Invalid email or password' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle guest login
  const handleGuestLogin = async () => {
    try {
      setIsLoading(true);
      
      // Login as guest
      const guestUser = await loginAsGuest();
      
      // Update global state with guest user data
      dispatch({ type: ActionTypes.SET_USER, payload: guestUser });
      
      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Guest login error:', error);
      setErrors({ general: 'Failed to login as guest' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="auto" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.innerContainer}>
          {/* App Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>Respiratory Health</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <TextInput
              style={[styles.input, errors.email ? styles.inputError : null]}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            <TextInput
              style={[styles.input, errors.password ? styles.inputError : null]}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

            {errors.general && <Text style={styles.errorText}>{errors.general}</Text>}

            <TouchableOpacity 
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>{strings.auth.login}</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.guestButton}
              onPress={handleGuestLogin}
              disabled={isLoading}
            >
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>{strings.auth.forgotPassword}</Text>
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>{strings.auth.noAccount}</Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text style={styles.registerLink}>{strings.auth.register}</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  innerContainer: {
    flex: 1,
    padding: theme.spacing.l,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: theme.spacing.m,
  },
  logoText: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    backgroundColor: theme.colors.surface,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    color: theme.colors.error,
    marginBottom: theme.spacing.s,
    fontSize: theme.typography.fontSize.s,
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    marginTop: theme.spacing.m,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: theme.typography.fontSize.m,
  },
  guestButton: {
    backgroundColor: 'transparent',
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    marginTop: theme.spacing.s,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  guestButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.m,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: theme.spacing.l,
  },
  forgotPasswordText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.s,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.l,
  },
  registerText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.s,
  },
  registerLink: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.s,
    marginLeft: theme.spacing.xs,
    fontWeight: 'bold',
  },
});
