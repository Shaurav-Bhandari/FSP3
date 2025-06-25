-- Rollback for: Initial schema setup
-- Created: 2024-01-01T00:00:00.000Z
-- File: 20240101000000_initial_schema.rollback.sql

-- Drop indexes first
DROP INDEX IF EXISTS idx_users_search;
DROP INDEX IF EXISTS idx_data_entries_search;
DROP INDEX IF EXISTS idx_settings_public;
DROP INDEX IF EXISTS idx_settings_key;
DROP INDEX IF EXISTS idx_notifications_type;
DROP INDEX IF EXISTS idx_notifications_read;
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_audit_logs_created_at;
DROP INDEX IF EXISTS idx_audit_logs_user_id;
DROP INDEX IF EXISTS idx_audit_logs_table_record;
DROP INDEX IF EXISTS idx_views_created_at;
DROP INDEX IF EXISTS idx_views_user_id;
DROP INDEX IF EXISTS idx_views_data_entry_id;
DROP INDEX IF EXISTS idx_likes_data_entry_id;
DROP INDEX IF EXISTS idx_likes_user_id;
DROP INDEX IF EXISTS idx_comments_status;
DROP INDEX IF EXISTS idx_comments_parent_id;
DROP INDEX IF EXISTS idx_comments_user_id;
DROP INDEX IF EXISTS idx_comments_data_entry_id;
DROP INDEX IF EXISTS idx_data_entries_tags;
DROP INDEX IF EXISTS idx_data_entries_meta_data;
DROP INDEX IF EXISTS idx_data_entries_slug;
DROP INDEX IF EXISTS idx_data_entries_deleted_at;
DROP INDEX IF EXISTS idx_data_entries_created_at;
DROP INDEX IF EXISTS idx_data_entries_published_at;
DROP INDEX IF EXISTS idx_data_entries_visibility;
DROP INDEX IF EXISTS idx_data_entries_status;
DROP INDEX IF EXISTS idx_data_entries_category_id;
DROP INDEX IF EXISTS idx_data_entries_user_id;
DROP INDEX IF EXISTS idx_categories_active;
DROP INDEX IF EXISTS idx_categories_parent_id;
DROP INDEX IF EXISTS idx_categories_slug;
DROP INDEX IF EXISTS idx_user_sessions_expires_at;
DROP INDEX IF EXISTS idx_user_sessions_token;
DROP INDEX IF EXISTS idx_user_sessions_user_id;
DROP INDEX IF EXISTS idx_users_deleted_at;
DROP INDEX IF EXISTS idx_users_created_at;
DROP INDEX IF EXISTS idx_users_status;
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_users_username;
DROP INDEX IF EXISTS idx_users_email;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS views;
DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS data_entries;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS users;

-- Drop custom types
DROP TYPE IF EXISTS user_status;
DROP TYPE IF EXISTS user_role;

-- Drop extensions (be careful with this in production)
-- DROP EXTENSION IF EXISTS "citext";
-- DROP EXTENSION IF EXISTS "uuid-ossp";