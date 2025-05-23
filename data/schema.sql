/* ---------- 1. Users ---------- */

create table users (
  uid uuid primary key,
  username text,
  datas jsonb,
  is_drawer_open boolean,
  has_premium boolean,
  storage_type text
);

/* ---------- 2. Themes data ---------- */

create table custom_themes (
  uid uuid primary key references users(uid),
  timestamp bigint,
  contents jsonb
);

/* ---------- 3. User settings ---------- */

create table user_settings (
  uid uuid primary key references users(uid),
  app_language text,
  app_font jsonb,
  current_theme jsonb,
  clipboard_text text,
  active_tab text,
  todo_active_tab text,
  settings_drawer_open boolean,
  share_drawer_open boolean,
  info_drawer_open boolean
);

/* ---------- 4. Clipboard history ---------- */

create table clipboard_history (
  id text primary key,
  uid uuid references users(uid),
  content text,
  timestamp bigint,
  type text
);

/* ---------- 5. Todos ---------- */

create table todos (
  id text primary key,
  uid uuid references users(uid),
  text text,
  description text,
  completed boolean,
  archived boolean,
  priority text,
  created_at bigint
);

/* ---------- 6. User favorites ---------- */

create table user_favorites (
  uid uuid primary key references users(uid),
  favorite_theme jsonb,
  favorite_font jsonb
);



-- Enable row level security for all tables
alter table users enable row level security;
alter table custom_themes enable row level security;
alter table user_settings enable row level security;
alter table clipboard_history enable row level security;
alter table todos enable row level security;
alter table user_favorites enable row level security;



-- Create a policy to allow anyone to read usernames
CREATE POLICY "Allow read of usernames for public check"
ON users
FOR SELECT
USING (true);  -- This allows all rows to be selected (read-only)

-- Policies for custom_themes table
create policy "Allow users to access their own custom_themes"
on custom_themes
for all
using (auth.uid() = uid)
with check (auth.uid() = uid);

-- Policies for user_settings table
create policy "Allow users to access their own settings"
on user_settings
for all
using (auth.uid() = uid)
with check (auth.uid() = uid);

-- Policies for clipboard_history table
create policy "Allow users to access their own clipboard history"
on clipboard_history
for all
using (auth.uid() = uid)
with check (auth.uid() = uid);

-- Policies for todos table
create policy "Allow users to access their own todos"
on todos
for all
using (auth.uid() = uid)
with check (auth.uid() = uid);

-- Policies for user_favorites table
create policy "Allow users to access their own user_favorites"
on user_favorites
for all
using (auth.uid() = uid)
with check (auth.uid() = uid);






CREATE POLICY "Allow users to insert their own user row"
ON users
FOR INSERT
WITH CHECK (uid = auth.uid());

CREATE POLICY "Allow users to update their own user row"
ON users
FOR UPDATE
USING (uid = auth.uid())
WITH CHECK (uid = auth.uid());

CREATE POLICY "Allow users to delete their own user row"
ON users
FOR DELETE
USING (uid = auth.uid());



CREATE POLICY "Allow user_settings to insert their own user row"
ON user_settings
FOR INSERT
WITH CHECK (uid = auth.uid());

CREATE POLICY "Allow user_settings to update their own user row"
ON user_settings
FOR UPDATE
USING (uid = auth.uid())
WITH CHECK (uid = auth.uid());

CREATE POLICY "Allow user_settings to delete their own user row"
ON user_settings
FOR DELETE
USING (uid = auth.uid());

