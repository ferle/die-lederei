-- Create a view to safely expose auth.users email to authenticated admins
CREATE OR REPLACE VIEW auth_users AS
SELECT id, email, created_at
FROM auth.users;

-- Grant access to the view for authenticated users
GRANT SELECT ON auth_users TO authenticated;