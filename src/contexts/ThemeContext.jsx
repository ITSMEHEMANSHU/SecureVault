import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeTheme = async () => {
      try {
        // First check localStorage for quick loading
        const savedTheme = localStorage.getItem('theme');
        
        // Then check database for user preference
        const { data: { user } } = await supabase.auth.getUser();
        let userTheme = savedTheme;

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('theme_preference')
            .eq('id', user.id)
            .single();

          if (profile?.theme_preference) {
            userTheme = profile.theme_preference;
          }
        }

        // Final fallback to dark theme
        const finalTheme = userTheme || 'dark';
        setTheme(finalTheme);
        applyThemeToDOM(finalTheme);
        
      } catch (error) {
        console.error('Error initializing theme:', error);
        // Fallback to dark theme
        const fallbackTheme = localStorage.getItem('theme') || 'dark';
        setTheme(fallbackTheme);
        applyThemeToDOM(fallbackTheme);
      } finally {
        setLoading(false);
      }
    };

    initializeTheme();
  }, []);

  const applyThemeToDOM = (theme) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    applyThemeToDOM(newTheme);
    await updateThemeInDatabase(newTheme);
  };

  const updateThemeInDatabase = async (newTheme) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ theme_preference: newTheme })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Failed to update theme in database:', error);
    }
  };

  // Optional: Provide loading state if needed
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};