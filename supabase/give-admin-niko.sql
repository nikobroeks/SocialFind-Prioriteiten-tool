-- Geef admin rechten aan niko.broeks@gmail.com
-- Voer dit uit in Supabase SQL Editor

INSERT INTO public.user_roles (user_id, email, role)
SELECT id, 'niko.broeks@gmail.com', 'admin'
FROM auth.users
WHERE email = 'niko.broeks@gmail.com'
ON CONFLICT (email) DO UPDATE SET role = 'admin';

-- Verifieer dat de rol is toegewezen
SELECT 
  ur.id,
  ur.email,
  ur.role,
  ur.created_at,
  au.email as auth_email,
  au.created_at as user_created_at
FROM public.user_roles ur
JOIN auth.users au ON ur.user_id = au.id
WHERE ur.email = 'niko.broeks@gmail.com';

