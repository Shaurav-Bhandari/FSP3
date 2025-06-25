-- Migration: Functions and triggers
-- Created: 2024-01-01T01:00:00.000Z
-- File: 20240101010000_functions_and_triggers.sql

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(
        regexp_replace(
            regexp_replace(
                regexp_replace(input_text, '[^a-zA-Z0-9\s-]', '', 'g'),
                '\s+', '-', 'g'
            ),
            '-+', '-', 'g'
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Function to update slug automatically
CREATE OR REPLACE FUNCTION update_slug_from_title()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.title IS NOT NULL AND (OLD.title IS NULL OR NEW.title != OLD.title) THEN
        NEW.slug = generate_slug(NEW.title);
        
        -- Ensure slug is unique by appending number if needed
        DECLARE
            base_slug TEXT := NEW.slug;
            counter INTEGER := 1;
        BEGIN
            WHILE EXISTS (
                SELECT 1 FROM data_entries 
                WHERE slug = NEW.slug AND id != COALESCE(NEW.id, 0)
            ) LOOP
                NEW.slug = base_slug || '-' || counter;
                counter = counter + 1;
            END LOOP;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update view count
CREATE OR REPLACE FUNCTION increment_view_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE data_entries 
    SET view_count = view_count + 1 
    WHERE id = NEW.data_entry_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update like count
CREATE OR REPLACE FUNCTION update_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE data_entries 
        SET like_count = like_count + 1 
        WHERE id = NEW.data_entry_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE data_entries 
        SET like_count = like_count - 1 
        WHERE id = OLD.data_entry_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to create audit log
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    audit_user_id INTEGER;
    audit_ip_address INET;
    audit_user_agent TEXT;
BEGIN
    -- Get user context (these would be set by the application)
    audit_user_id := COALESCE(current_setting('app.current_user_id', true)::INTEGER, NULL);
    audit_ip_address := COALESCE(current_setting('app.current_ip_address', true)::INET, NULL);
    audit_user_agent := COALESCE(current_setting('app.current_user_agent', true), NULL);
    
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (
            table_name, record_id, action, new_values, 
            user_id, ip_address, user_agent
        ) VALUES (
            TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW),
            audit_user_id, audit_ip_address, audit_user_agent
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (
            table_name, record_id, action, old_values, new_values,
            user_id, ip_address, user_agent
        ) VALUES (
            TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW),
            audit_user_id, audit_ip_address, audit_user_agent
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (
            table_name, record_id, action, old_values,
            user_id, ip_address, user_agent
        ) VALUES (
            TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD),
            audit_user_id, audit_ip_address, audit_user_agent
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to soft delete
CREATE OR REPLACE FUNCTION soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
        RETURN NULL; -- Prevent actual deletion
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions 
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_id_param INTEGER)
RETURNS TABLE(
    total_posts INTEGER,
    total_comments INTEGER,
    total_likes_received INTEGER,
    total_views INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE((SELECT COUNT(*)::INTEGER FROM data_entries WHERE user_id = user_id_param AND deleted_at IS NULL), 0),
        COALESCE((SELECT COUNT(*)::INTEGER FROM comments WHERE user_id = user_id_param), 0),
        COALESCE((SELECT SUM(like_count)::INTEGER FROM data_entries WHERE user_id = user_id_param), 0),
        COALESCE((SELECT SUM(view_count)::INTEGER FROM data_entries WHERE user_id = user_id_param), 0);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_entries_updated_at 
    BEFORE UPDATE ON data_entries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at 
    BEFORE UPDATE ON comments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at 
    BEFORE UPDATE ON settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for slug generation
CREATE TRIGGER generate_data_entry_slug 
    BEFORE INSERT OR UPDATE ON data_entries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_slug_from_title();

-- Create triggers for view counting
CREATE TRIGGER increment_view_count_trigger 
    AFTER INSERT ON views 
    FOR EACH ROW 
    EXECUTE FUNCTION increment_view_count();

-- Create triggers for like counting
CREATE TRIGGER update_like_count_insert 
    AFTER INSERT ON likes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_like_count();

CREATE TRIGGER update_like_count_delete 
    AFTER DELETE ON likes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_like_count();

-- Create audit log triggers
CREATE TRIGGER audit_users 
    AFTER INSERT OR UPDATE OR DELETE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_data_entries 
    AFTER INSERT OR UPDATE OR DELETE ON data_entries 
    FOR EACH ROW 
    EXECUTE FUNCTION create_audit_log();

-- Create soft delete trigger for users
CREATE TRIGGER soft_delete_users 
    BEFORE DELETE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION soft_delete();

-- Create a view for active users
CREATE VIEW active_users AS
SELECT 
    id, uuid, username, email, role, status, 
    first_name, last_name, avatar_url, email_verified,
    last_login, login_count, created_at, updated_at
FROM users 
WHERE deleted_at IS NULL;

-- Create a view for published data entries
CREATE VIEW published_data_entries AS
SELECT 
    de.id, de.uuid, de.title, de.slug, de.description, 
    de.content, de.excerpt