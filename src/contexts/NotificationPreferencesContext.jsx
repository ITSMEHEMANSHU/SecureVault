// contexts/NotificationPreferencesContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const NotificationPreferencesContext = createContext();

export function NotificationPreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState({ 
    push_enabled: false, 
    badge_enabled: true 
  });
  const [loading, setLoading] = useState(true);

  // Fetch initial preferences
  useEffect(() => {
    fetchNotificationPreferences();
  }, []);

  const fetchNotificationPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .single();

      if (!error && data?.notification_preferences) {
        setPreferences(data.notification_preferences);
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (newPreferences) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updatedPreferences = { ...preferences, ...newPreferences };
      
      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: updatedPreferences })
        .eq('id', user.id);

      if (!error) {
        setPreferences(updatedPreferences);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating preferences:', error);
      return false;
    }
  };

  return (
    <NotificationPreferencesContext.Provider value={{ 
      preferences, 
      loading, 
      updatePreferences,
      refreshPreferences: fetchNotificationPreferences 
    }}>
      {children}
    </NotificationPreferencesContext.Provider>
  );
}

export const useNotificationPreferences = () => {
  const context = useContext(NotificationPreferencesContext);
  if (!context) {
    throw new Error('useNotificationPreferences must be used within NotificationPreferencesProvider');
  }
  return context;
};