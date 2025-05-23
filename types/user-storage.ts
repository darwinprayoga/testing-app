export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  image: string;
  is_logged_in: boolean;
  has_premium: boolean;
}

export interface Theme {
  name: string;
  background: string;
  main: string;
  main_hover: string;
  text_color: string;
  subtext: string;
  border: string;
  card: string;
  accent: string;
  is_custom: boolean;
}

export interface ClipboardHistory {
  id: string;
  content: string;
  timestamp: number;
  type: string;
}

export interface Todo {
  id: string;
  text: string;
  description: string;
  completed: boolean;
  archived: boolean;
  priority: string;
  created_at: number | null;
}

export interface UserActivity {
  type: string;
  timestamp: number;
  details: Record<string, any>;
}
