
-- Enable the necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL CHECK (length(username) >= 3 AND length(username) <= 30),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  image_url TEXT,
  has_premium BOOLEAN DEFAULT FALSE
);

-- Create clipboard_items table
CREATE TABLE clipboard_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'image')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add index for faster queries by user
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX clipboard_user_id_idx ON clipboard_items(user_id);
CREATE INDEX clipboard_created_at_idx ON clipboard_items(created_at);

-- Create todo_items table
CREATE TABLE todo_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT '-',
  completed BOOLEAN DEFAULT FALSE,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  eta TIMESTAMP WITH TIME ZONE,
  
  -- Add index for faster queries by user
  CONSTRAINT fk_todo_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX todo_user_id_idx ON todo_items(user_id);
CREATE INDEX todo_created_at_idx ON todo_items(created_at);

-- Create user_preferences table
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme_name TEXT DEFAULT 'paper',
  font_name TEXT DEFAULT 'Inter',
  font_size INTEGER DEFAULT 16,
  language_code TEXT DEFAULT 'en',
  storage_type TEXT DEFAULT 'cookies' CHECK (storage_type IN ('cookies', 'localStorage', 'cloud')),
  favorite_themes TEXT[] DEFAULT '{}',
  favorite_fonts TEXT[] DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create custom_themes table
CREATE TABLE custom_themes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  background TEXT NOT NULL,
  main TEXT NOT NULL,
  main_hover TEXT NOT NULL,
  text TEXT NOT NULL,
  subtext TEXT NOT NULL,
  border TEXT NOT NULL,
  card TEXT NOT NULL,
  accent TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure theme names are unique per user
  UNIQUE(user_id, name)
);

-- Create activity_logs table for tracking user activity
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX activity_user_id_idx ON activity_logs(user_id);
CREATE INDEX activity_type_idx ON activity_logs(activity_type);

-- Create RLS (Row Level Security) policies
-- These ensure users can only access their own data

-- Enable RLS on all tables
ALTER TABLE clipboard_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for clipboard_items
CREATE POLICY "Users can view their own clipboard items" 
  ON clipboard_items FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clipboard items" 
  ON clipboard_items FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clipboard items" 
  ON clipboard_items FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clipboard items" 
  ON clipboard_items FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for todo_items
CREATE POLICY "Users can view their own todo items" 
  ON todo_items FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own todo items" 
  ON todo_items FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own todo items" 
  ON todo_items FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own todo items" 
  ON todo_items FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for user_preferences
CREATE POLICY "Users can view their own preferences" 
  ON user_preferences FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" 
  ON user_preferences FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
  ON user_preferences FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policies for custom_themes
CREATE POLICY "Users can view their own custom themes" 
  ON custom_themes FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom themes" 
  ON custom_themes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom themes" 
  ON custom_themes FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom themes" 
  ON custom_themes FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for activity_logs
CREATE POLICY "Users can view their own activity logs" 
  ON activity_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity logs" 
  ON activity_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Create function to handle user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default preferences for new user
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to set up new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE PROCEDURE handle_new_user();