/*
  # Update admin password

  Updates the password for the admin user (admin@johanna-leder.de) to a new value.
*/

DO $$
BEGIN
  -- Update password for admin user
  UPDATE auth.users
  SET encrypted_password = crypt('83408205', gen_salt('bf'))
  WHERE email = 'admin@johanna-leder.de';
END $$;