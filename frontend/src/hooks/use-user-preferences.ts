import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';

interface UserPreferences {
  displayName?: string;
  hasCompletedOnboarding?: boolean;
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  notificationsEnabled?: boolean;
  lastActiveDate?: string;
  chatSettings?: {
    showTypingIndicator?: boolean;
    soundEnabled?: boolean;
    animationsEnabled?: boolean;
  };
}

interface UseUserPreferencesReturn {
  preferences: UserPreferences;
  isLoading: boolean;
  error: string | null;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  setDisplayName: (name: string) => Promise<void>;
  clearPreferences: () => Promise<void>;
  hasCompletedOnboarding: boolean;
  displayName: string | null;
}

const STORAGE_KEY = 'helium_user_preferences';
const SUPABASE_TABLE = 'user_preferences';

export function useUserPreferences(): UseUserPreferencesReturn {
  const { user, supabase } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load preferences from localStorage and Supabase
  const loadPreferences = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First, load from localStorage for immediate access
      const localPrefs = localStorage.getItem(STORAGE_KEY);
      if (localPrefs) {
        const parsed = JSON.parse(localPrefs);
        setPreferences(parsed);
      }

      // Then, if user is authenticated, load from Supabase
      if (user?.id && supabase) {
        const { data, error: supabaseError } = await supabase
          .from(SUPABASE_TABLE)
          .select('preferences')
          .eq('user_id', user.id)
          .single();

        if (supabaseError && supabaseError.code !== 'PGRST116') {
          // PGRST116 is "not found" error, which is expected for new users
          console.error('Error loading preferences from Supabase:', supabaseError);
          setError('Failed to load user preferences');
        } else if (data?.preferences) {
          const cloudPrefs = data.preferences as UserPreferences;
          
          // Merge cloud preferences with local preferences
          const mergedPrefs = { ...preferences, ...cloudPrefs };
          setPreferences(mergedPrefs);
          
          // Update localStorage with merged preferences
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedPrefs));
        }
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
      setError('Failed to load preferences');
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase, preferences]);

  // Save preferences to both localStorage and Supabase
  const savePreferences = useCallback(async (newPreferences: UserPreferences) => {
    try {
      // Always save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
      
      // Save to Supabase if user is authenticated
      if (user?.id && supabase) {
        const { error: supabaseError } = await supabase
          .from(SUPABASE_TABLE)
          .upsert({
            user_id: user.id,
            preferences: newPreferences,
            updated_at: new Date().toISOString(),
          });

        if (supabaseError) {
          console.error('Error saving preferences to Supabase:', supabaseError);
          // Don't throw error here, as localStorage save succeeded
        }
      }
    } catch (err) {
      console.error('Error saving preferences:', err);
      throw new Error('Failed to save preferences');
    }
  }, [user, supabase]);

  // Update preferences
  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);
    await savePreferences(newPreferences);
  }, [preferences, savePreferences]);

  // Set display name specifically
  const setDisplayName = useCallback(async (name: string) => {
    await updatePreferences({ 
      displayName: name,
      hasCompletedOnboarding: true,
      lastActiveDate: new Date().toISOString(),
    });
  }, [updatePreferences]);

  // Clear all preferences
  const clearPreferences = useCallback(async () => {
    setPreferences({});
    localStorage.removeItem(STORAGE_KEY);
    
    if (user?.id && supabase) {
      await supabase
        .from(SUPABASE_TABLE)
        .delete()
        .eq('user_id', user.id);
    }
  }, [user, supabase]);

  // Load preferences on mount and when user changes
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Update last active date when component mounts
  useEffect(() => {
    if (preferences.displayName && !isLoading) {
      const today = new Date().toDateString();
      const lastActive = preferences.lastActiveDate ? new Date(preferences.lastActiveDate).toDateString() : null;
      
      if (lastActive !== today) {
        updatePreferences({ lastActiveDate: new Date().toISOString() });
      }
    }
  }, [preferences.displayName, preferences.lastActiveDate, isLoading, updatePreferences]);

  return {
    preferences,
    isLoading,
    error,
    updatePreferences,
    setDisplayName,
    clearPreferences,
    hasCompletedOnboarding: Boolean(preferences.hasCompletedOnboarding),
    displayName: preferences.displayName || null,
  };
}

// Hook for checking if user should see onboarding
export function useOnboardingStatus() {
  const { hasCompletedOnboarding, displayName, isLoading } = useUserPreferences();
  
  const shouldShowOnboarding = !isLoading && !hasCompletedOnboarding && !displayName;
  
  return {
    shouldShowOnboarding,
    hasCompletedOnboarding,
    isLoading,
  };
}

// Hook for getting time-based greeting
export function useGreeting(userName?: string) {
  const [greeting, setGreeting] = useState('');
  
  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      let timeGreeting = '';
      
      if (hour >= 5 && hour < 12) timeGreeting = 'Good morning';
      else if (hour >= 12 && hour < 17) timeGreeting = 'Good afternoon';
      else if (hour >= 17 && hour < 21) timeGreeting = 'Good evening';
      else timeGreeting = 'Good night';
      
      setGreeting(userName ? `${timeGreeting}, ${userName}` : timeGreeting);
    };
    
    updateGreeting();
    
    // Update greeting every minute
    const interval = setInterval(updateGreeting, 60000);
    
    return () => clearInterval(interval);
  }, [userName]);
  
  return greeting;
}

export default useUserPreferences;

