export const CloudTables = {
  userProfile: "users",
  customThemes: "custom_themes",
  clipboardHistory: "clipboard_history",
  todos: "todos",
  userFavorites: "user_favorites",
  settings: "user_settings",
} as const;

export type CloudKey = keyof typeof CloudTables;
