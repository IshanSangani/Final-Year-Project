/**
 * ProfileScreen
 * User profile and settings
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAppContext, ActionTypes } from '../context/AppContext';
import Header from '../components/Header';
import theme from '../styles/theme';
import strings from '../utils/strings';

const ProfileScreen = () => {
  const { state, dispatch } = useAppContext();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Get user information
  const user = state.user;
  const isGuest = user?.isGuest || false;
  
  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    state.settings?.notifications ?? true
  );
  
  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      strings.profile.logoutConfirm,
      '',
      [
        {
          text: strings.profile.cancel,
          style: 'cancel',
        },
        {
          text: strings.profile.confirm,
          onPress: async () => {
            try {
              setIsLoggingOut(true);
              
              // Clear user data from storage
              await AsyncStorage.removeItem('user');
              
              // Update global state
              dispatch({ type: ActionTypes.LOGOUT });
              
            } catch (error) {
              console.error('Error logging out:', error);
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };
  
  // Handle notifications toggle
  const handleToggleNotifications = (value) => {
    setNotificationsEnabled(value);
    
    // Update settings in global state
    dispatch({
      type: ActionTypes.UPDATE_SETTINGS,
      payload: { notifications: value },
    });
  };
  
  // Render a settings item with a switch
  const renderSwitchItem = ({ icon, title, value, onValueChange }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingItemLeft}>
        <Ionicons name={icon} size={22} color={theme.colors.primary} />
        <Text style={styles.settingItemText}>{title}</Text>
      </View>
      <Switch
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor="#fff"
        onValueChange={onValueChange}
        value={value}
      />
    </View>
  );
  
  // Render a settings item with a chevron
  const renderChevronItem = ({ icon, title, onPress, disabled = false }) => (
    <TouchableOpacity
      style={[styles.settingItem, disabled && styles.settingItemDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.settingItemLeft}>
        <Ionicons 
          name={icon} 
          size={22} 
          color={disabled ? theme.colors.inactive : theme.colors.primary} 
        />
        <Text 
          style={[
            styles.settingItemText,
            disabled && styles.settingItemTextDisabled
          ]}
        >
          {title}
        </Text>
      </View>
      <Ionicons 
        name="chevron-forward" 
        size={18} 
        color={disabled ? theme.colors.inactive : theme.colors.textSecondary} 
      />
    </TouchableOpacity>
  );
  
  // Render a section header
  const renderSectionHeader = (title) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <Header title={strings.profile.title} />
      
      <ScrollView style={styles.scrollView}>
        {/* User info */}
        <View style={styles.userInfoContainer}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color="#fff" />
          </View>
          <View style={styles.userTextContainer}>
            <Text style={styles.userName}>{user?.name || 'Guest'}</Text>
            <Text style={styles.userEmail}>
              {isGuest ? 'Guest User' : (user?.email || '')}
            </Text>
          </View>
          {!isGuest && (
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>{strings.profile.editProfile}</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Settings */}
        {renderSectionHeader('Settings')}
        
        <View style={styles.settingsContainer}>
          {renderSwitchItem({
            icon: 'notifications-outline',
            title: strings.profile.notifications,
            value: notificationsEnabled,
            onValueChange: handleToggleNotifications,
          })}
          
          {renderChevronItem({
            icon: 'language-outline',
            title: strings.profile.language,
            onPress: () => {
              Alert.alert('Coming Soon', 'Language settings will be available in a future update.');
            },
          })}
          
          {renderChevronItem({
            icon: 'information-circle-outline',
            title: strings.profile.about,
            onPress: () => {
              Alert.alert('About', 'Respiratory Health App\nVersion 1.0.0');
            },
          })}
        </View>
        
        {/* Account */}
        {renderSectionHeader('Account')}
        
        <View style={styles.settingsContainer}>
          {renderChevronItem({
            icon: 'cloud-upload-outline',
            title: 'Sync Account',
            onPress: () => {
              Alert.alert('Coming Soon', 'Account sync will be available in a future update.');
            },
            disabled: isGuest,
          })}
          
          {renderChevronItem({
            icon: 'shield-checkmark-outline',
            title: 'Privacy & Security',
            onPress: () => {
              Alert.alert('Coming Soon', 'Privacy settings will be available in a future update.');
            },
            disabled: isGuest,
          })}
          
          {renderChevronItem({
            icon: 'help-circle-outline',
            title: 'Help & Support',
            onPress: () => {
              Alert.alert('Help & Support', 'For support please contact support@respiratoryhealth.com');
            },
          })}
        </View>
        
        {/* Logout button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator color={theme.colors.error} size="small" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={22} color={theme.colors.error} />
              <Text style={styles.logoutButtonText}>{strings.profile.logout}</Text>
            </>
          )}
        </TouchableOpacity>
        
        {/* App version */}
        <Text style={styles.versionText}>Version 1.0.0</Text>
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
  userInfoContainer: {
    padding: theme.spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userTextContainer: {
    marginLeft: theme.spacing.m,
    flex: 1,
  },
  userName: {
    fontSize: theme.typography.fontSize.l,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  userEmail: {
    fontSize: theme.typography.fontSize.s,
    color: theme.colors.textSecondary,
  },
  editButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.m,
    backgroundColor: `${theme.colors.primary}20`,
    borderRadius: theme.borderRadius.m,
  },
  editButtonText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.s,
    fontWeight: '500',
  },
  sectionHeader: {
    padding: theme.spacing.m,
    paddingBottom: theme.spacing.s,
    backgroundColor: theme.colors.background,
  },
  sectionHeaderText: {
    fontSize: theme.typography.fontSize.s,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingsContainer: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingItemDisabled: {
    opacity: 0.6,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingItemText: {
    fontSize: theme.typography.fontSize.m,
    color: theme.colors.text,
    marginLeft: theme.spacing.m,
  },
  settingItemTextDisabled: {
    color: theme.colors.textSecondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: theme.spacing.l,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.l,
    padding: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.error,
    borderRadius: theme.borderRadius.m,
  },
  logoutButtonText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.m,
    fontWeight: '500',
    marginLeft: theme.spacing.s,
  },
  versionText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.l,
  },
});

export default ProfileScreen;
