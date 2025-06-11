-- Insert initial admin user
-- Default password is 'admin123' (hashed with bcrypt)
INSERT INTO admins (id, username, password_hash, email, role, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'admin',
    '$2b$10$8K1p/a0dR1xqM8K1p/a0dR1xqM8K1p/a0dR1xqM8K1p/a0dR1xqM', -- This is a placeholder hash
    'admin@fspfc.com',
    'super_admin',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
); 