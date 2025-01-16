/*
  # Add new admin user

  1. Changes
    - Add ferlitsch.manuel@gmail.com as an admin user
*/

DO $$
DECLARE
  admin_uid uuid;
BEGIN
  -- Check if user already exists in auth.users
  SELECT id INTO admin_uid
  FROM auth.users
  WHERE email = 'ferlitsch.manuel@gmail.com';

  -- If user doesn't exist, create it
  IF admin_uid IS NULL THEN
    -- Insert user into auth.users
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
      'ferlitsch.manuel@gmail.com',
      crypt('83408205', gen_salt('bf')), -- Using the same password as the main admin
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
  END IF;

  -- Add or update user role to admin in public.users
  INSERT INTO public.users (id, role)
  VALUES (admin_uid, 'admin')
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin';
END $$;