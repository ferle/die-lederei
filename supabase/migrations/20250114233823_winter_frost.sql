/*
  # Create admin user
  
  1. Changes
    - Create admin user with secure credentials
    - Set admin role in public.users table
*/

DO $$
DECLARE
  admin_uid uuid;
BEGIN
  -- Check if admin user already exists
  SELECT id INTO admin_uid
  FROM auth.users
  WHERE email = 'admin@johanna-leder.de';

  -- If admin doesn't exist, create it
  IF admin_uid IS NULL THEN
    -- Insert admin user into auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@johanna-leder.de',
      crypt('admin123', gen_salt('bf')), -- Password: admin123
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO admin_uid;

    -- Insert into public.users only if we created a new admin user
    IF admin_uid IS NOT NULL THEN
      INSERT INTO public.users (id, role)
      SELECT admin_uid, 'admin'
      WHERE NOT EXISTS (
        SELECT 1 FROM public.users WHERE id = admin_uid
      );
    END IF;
  END IF;
END $$;