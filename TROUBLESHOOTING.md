# Troubleshooting Guide

## Probleem: Kan niet inloggen

### Stap 1: Check Email Confirmatie

Supabase vereist standaard email confirmatie. Je moet dit uitschakelen of de user bevestigen:

1. Ga naar Supabase Dashboard > Authentication > Settings
2. Scroll naar "Email Auth"
3. Zet "Enable email confirmations" UIT
4. Of: Bevestig de user handmatig in Authentication > Users

### Stap 2: Check Database Schema

Zorg dat je het schema hebt uitgevoerd:

1. Ga naar Supabase Dashboard > SQL Editor
2. Voer `supabase/schema.sql` uit
3. Check of de tabellen bestaan: `user_roles` en `vacancy_priorities`

### Stap 3: Check User Role

Voor `admin@admin`:
1. Log in met `admin@admin` / `admin`
2. De admin rol wordt automatisch toegevoegd
3. Als dit niet werkt, voer handmatig uit:

```sql
INSERT INTO public.user_roles (user_id, email, role)
SELECT id, 'admin@admin', 'admin'
FROM auth.users
WHERE email = 'admin@admin'
ON CONFLICT (email) DO NOTHING;
```

### Stap 4: Check RLS Policies

De RLS policies moeten correct zijn ingesteld. Check of je deze policies hebt:

```sql
-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'user_roles';
SELECT * FROM pg_policies WHERE tablename = 'vacancy_priorities';
```

### Stap 5: Debug Page

Ga naar `/debug` om te zien wat er mis gaat:
- User info
- Role info
- Environment variables

### Stap 6: Browser Console

Open de browser console (F12) en check voor errors:
- Network errors
- Authentication errors
- RLS policy errors

## Veelvoorkomende Fouten

### "Email not confirmed"
**Oplossing:** Bevestig email in Supabase dashboard of zet email confirmatie uit

### "Invalid login credentials"
**Oplossing:** Check email en wachtwoord, zorg dat user bestaat in Supabase

### "new row violates row-level security policy"
**Oplossing:** Check RLS policies, zorg dat user een rol heeft

### "relation does not exist"
**Oplossing:** Voer het database schema uit (`supabase/schema.sql`)

## Test Admin Login

1. Ga naar `/register`
2. Email: `admin@admin`
3. Wachtwoord: `admin`
4. Bevestig wachtwoord: `admin`
5. Klik "Account aanmaken"

Als dit niet werkt:
1. Maak user handmatig aan in Supabase Dashboard
2. Zet "Auto Confirm User" aan
3. Log in via `/login`

