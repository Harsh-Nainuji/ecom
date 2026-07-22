import { Platform } from 'react-native';
import { supabase } from './supabase';

/**
 * Request notification permissions and register the device push token in Supabase.
 * Uses dynamic require to prevent bundle crashes if expo-notifications is not installed.
 */
export async function registerForPushNotificationsAsync(userId: string) {
  if (Platform.OS === 'web') return;

  try {
    let Notifications;
    let Device;
    
    try {
      Notifications = require('expo-notifications');
      Device = require('expo-device');
    } catch {
      // Package not installed in local workspace yet, fail gracefully
      console.log('[Notifications] expo-notifications or expo-device is not installed. Skipping.');
      return;
    }

    if (!Device.isDevice) {
      console.log('[Notifications] Must use a physical device for push notifications');
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('[Notifications] Failed to obtain push permission.');
      return;
    }

    // Replace with your Expo project ID if using bare/managed workflow details
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    
    console.log('[Notifications] Generated Expo Push Token:', token);

    // Save the token to the public.profiles table
    const { error } = await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', userId);

    if (error) {
      console.error('[Notifications] Failed to persist push token to profiles:', error.message);
    } else {
      console.log('[Notifications] Successfully registered push token in database.');
    }
  } catch (err) {
    console.error('[Notifications] Registration error:', err);
  }
}
