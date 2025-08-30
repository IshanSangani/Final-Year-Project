import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAppContext } from '../context/AppContext';
import { theme } from '../constants/Theme';
import { strings } from '../utils/strings';

export default function ProfileScreen() {
  const { state, dispatch } = useAppContext();
  const router = useRouter();
  
  // Toggle dark mode
  const handleToggleDarkMode = () => {
    dispatch({ type: 'TOGGLE_DARK_MODE' });
  };
  
  // Toggle notifications
  const handleToggleNotifications = () => {
    dispatch({ 
      type: 'UPDATE_SETTINGS',
      payload: { notifications: !state.settings?.notifications }
    });
  };
  
  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      strings.profile.logoutConfirm,
      '',
      [
        {
          text: strings.common.cancel,
          style: 'cancel',
        },
        {
          text: "Confirm",
          onPress: () => {
            dispatch({ type: 'LOGOUT' });
            // In a real implementation, we would navigate to the login screen
            console.log("Navigate to Login screen");
            Alert.alert("Logged out successfully. In a real app, you would be redirected to the login screen.");
          },
        },
      ]
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{strings.profile.title}</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {/* User info */}
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={40} color="#fff" />
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{state.user?.name || 'Guest User'}</Text>
            <Text style={styles.userEmail}>{state.user?.email || 'guest@example.com'}</Text>
          </View>
          
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>{strings.profile.editProfile}</Text>
          </TouchableOpacity>
        </View>
        
        {/* Settings */}
        <View style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>{strings.common.settings}</Text>
          
          {/* Notifications toggle */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
              <Text style={styles.settingLabel}>{strings.profile.notifications}</Text>
            </View>
            <Switch
              value={state.settings?.notifications}
              onValueChange={handleToggleNotifications}
              trackColor={{ true: theme.colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
          
          {/* Dark mode toggle */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="moon-outline" size={24} color={theme.colors.text} />
              <Text style={styles.settingLabel}>{strings.profile.darkMode}</Text>
            </View>
            <Switch
              value={state.darkMode}
              onValueChange={handleToggleDarkMode}
              trackColor={{ true: theme.colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
          
          {/* Language selection */}
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="language-outline" size={24} color={theme.colors.text} />
              <Text style={styles.settingLabel}>{strings.profile.language}</Text>
            </View>
            <View style={styles.settingValue}>
              <Text style={styles.settingValueText}>English</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>
        
        {/* About section */}
        <TouchableOpacity style={styles.aboutItem}>
          <Ionicons name="information-circle-outline" size={24} color={theme.colors.text} />
          <Text style={styles.aboutLabel}>{strings.profile.about}</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} style={styles.aboutArrow} />
        </TouchableOpacity>
        
        {/* Logout button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
          <Text style={styles.logoutText}>{strings.profile.logout}</Text>
        </TouchableOpacity>
        
        {/* App version */}
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.l,
    paddingTop: theme.spacing.l,
    paddingBottom: theme.spacing.m,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.l,
  },
  userCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.l,
    marginVertical: theme.spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: theme.spacing.m,
  },
  userName: {
    fontSize: theme.typography.fontSize.l,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  userEmail: {
    fontSize: theme.typography.fontSize.s,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  editButton: {
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
    backgroundColor: `${theme.colors.primary}20`,
    borderRadius: theme.borderRadius.m,
  },
  editButtonText: {
    color: theme.colors.primary,
    fontWeight: '500',
    fontSize: theme.typography.fontSize.s,
  },
  settingsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.l,
    marginBottom: theme.spacing.l,
    ...theme.shadows.small,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.m,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.m,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.colors.border}40`,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: theme.typography.fontSize.m,
    color: theme.colors.text,
    marginLeft: theme.spacing.m,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValueText: {
    fontSize: theme.typography.fontSize.m,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.s,
  },
  aboutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.l,
    marginBottom: theme.spacing.l,
    ...theme.shadows.small,
  },
  aboutLabel: {
    fontSize: theme.typography.fontSize.m,
    color: theme.colors.text,
    marginLeft: theme.spacing.m,
    flex: 1,
  },
  aboutArrow: {
    marginLeft: theme.spacing.s,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.m,
    marginBottom: theme.spacing.m,
  },
  logoutText: {
    fontSize: theme.typography.fontSize.m,
    color: theme.colors.error,
    marginLeft: theme.spacing.s,
    fontWeight: '500',
  },
  versionText: {
    textAlign: 'center',
    fontSize: theme.typography.fontSize.s,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xxl,
  },
});
