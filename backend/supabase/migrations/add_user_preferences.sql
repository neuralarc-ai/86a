-- Migration: Create user_preferences table for Helium user naming feature
-- This table stores user preferences including display names and settings
-- Developed by NeuralArc Inc (neuralarc.ai)

-- Create the user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    preferences JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one preference record per user
    UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_updated_at ON user_preferences(updated_at);

-- Create a GIN index on the JSONB preferences column for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_preferences_preferences ON user_preferences USING GIN(preferences);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER trigger_update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_preferences_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only access their own preferences
CREATE POLICY "Users can view their own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" ON user_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Create a function to get user preferences with default values
CREATE OR REPLACE FUNCTION get_user_preferences(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    user_prefs JSONB;
    default_prefs JSONB := '{
        "displayName": null,
        "hasCompletedOnboarding": false,
        "theme": "system",
        "language": "en",
        "notificationsEnabled": true,
        "chatSettings": {
            "showTypingIndicator": true,
            "soundEnabled": true,
            "animationsEnabled": true
        }
    }';
BEGIN
    -- Get user preferences
    SELECT preferences INTO user_prefs
    FROM user_preferences
    WHERE user_id = target_user_id;
    
    -- If no preferences found, return defaults
    IF user_prefs IS NULL THEN
        RETURN default_prefs;
    END IF;
    
    -- Merge with defaults to ensure all fields are present
    RETURN default_prefs || user_prefs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to upsert user preferences
CREATE OR REPLACE FUNCTION upsert_user_preferences(
    target_user_id UUID,
    new_preferences JSONB
)
RETURNS JSONB AS $$
DECLARE
    result_prefs JSONB;
BEGIN
    -- Upsert the preferences
    INSERT INTO user_preferences (user_id, preferences)
    VALUES (target_user_id, new_preferences)
    ON CONFLICT (user_id)
    DO UPDATE SET 
        preferences = user_preferences.preferences || new_preferences,
        updated_at = NOW()
    RETURNING preferences INTO result_prefs;
    
    RETURN result_prefs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_preferences(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_user_preferences(UUID, JSONB) TO authenticated;

-- Create a view for easier querying of user preferences with defaults
CREATE OR REPLACE VIEW user_preferences_with_defaults AS
SELECT 
    up.user_id,
    COALESCE(up.preferences, '{}'::jsonb) || '{
        "displayName": null,
        "hasCompletedOnboarding": false,
        "theme": "system",
        "language": "en",
        "notificationsEnabled": true,
        "chatSettings": {
            "showTypingIndicator": true,
            "soundEnabled": true,
            "animationsEnabled": true
        }
    }'::jsonb AS preferences,
    up.created_at,
    up.updated_at
FROM user_preferences up
RIGHT JOIN auth.users au ON up.user_id = au.id;

-- Grant access to the view
GRANT SELECT ON user_preferences_with_defaults TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE user_preferences IS 'Stores user preferences including display names and application settings';
COMMENT ON COLUMN user_preferences.user_id IS 'Foreign key to auth.users table';
COMMENT ON COLUMN user_preferences.preferences IS 'JSONB object containing all user preferences';
COMMENT ON FUNCTION get_user_preferences(UUID) IS 'Returns user preferences merged with default values';
COMMENT ON FUNCTION upsert_user_preferences(UUID, JSONB) IS 'Inserts or updates user preferences';

-- Example usage queries (for reference):
/*
-- Get user preferences with defaults
SELECT get_user_preferences(auth.uid());

-- Update user display name
SELECT upsert_user_preferences(
    auth.uid(), 
    '{"displayName": "John Doe", "hasCompletedOnboarding": true}'::jsonb
);

-- Update chat settings
SELECT upsert_user_preferences(
    auth.uid(),
    '{"chatSettings": {"soundEnabled": false}}'::jsonb
);

-- Get all preferences for current user
SELECT * FROM user_preferences_with_defaults WHERE user_id = auth.uid();
*/

