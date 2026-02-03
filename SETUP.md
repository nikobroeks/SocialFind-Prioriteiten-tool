# Setup Instructies

## Stap 1: Dependencies Installeren

```bash
npm install
```

## Stap 2: Supabase Project Opzetten

1. Maak een nieuw project aan op [Supabase](https://supabase.com)
2. Ga naar de SQL Editor
3. Kopieer en voer het SQL schema uit uit `supabase/schema.sql`
4. Noteer je Project URL en Anon Key uit de Project Settings > API

## Stap 3: Admin Users Aanmaken

1. Ga naar Authentication > Users in je Supabase dashboard
2. Maak 2 users aan met de email adressen die je als admins wilt gebruiken
3. Noteer de user IDs (of email adressen)
4. Voer het volgende SQL uit in de SQL Editor (vervang de email adressen):

```sql
-- Vervang 'admin1@example.com' en 'admin2@example.com' met je echte admin emails
INSERT INTO public.user_roles (user_id, email, role)
SELECT id, 'admin1@example.com', 'admin'
FROM auth.users
WHERE email = 'admin1@example.com'
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.user_roles (user_id, email, role)
SELECT id, 'admin2@example.com', 'admin'
FROM auth.users
WHERE email = 'admin2@example.com'
ON CONFLICT (email) DO NOTHING;
```

5. Voor alle andere users die je aanmaakt, krijgen ze automatisch geen rol (en dus geen toegang). Je kunt ze handmatig een 'viewer' rol geven:

```sql
INSERT INTO public.user_roles (user_id, email, role)
SELECT id, 'viewer@example.com', 'viewer'
FROM auth.users
WHERE email = 'viewer@example.com'
ON CONFLICT (email) DO NOTHING;
```

## Stap 4: Recruitee API Credentials

1. Log in op je Recruitee account
2. Ga naar Settings > API
3. Genereer een API key
4. Noteer je Company ID (dit staat meestal in de URL of API documentatie)

## Stap 5: Environment Variables

1. Kopieer `.env.local.example` naar `.env.local`
2. Vul de volgende variabelen in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
RECRUITEE_API_KEY=your-recruitee-api-key
RECRUITEE_COMPANY_ID=your-company-id
```

## Stap 6: Development Server Starten

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in je browser.

## Belangrijke Notities

### Recruitee API Endpoint

De huidige implementatie gebruikt:
- Endpoint: `https://api.recruitee.com/c/{company_id}/jobs`
- Filter: `status=published`

Als je Recruitee API een andere structuur heeft, pas dan `lib/recruitee.ts` aan.

### Business Logica Prioriteit

De berekening gebeurt in `lib/utils.ts` in de `calculatePriority` functie:

- **Red**: `client_pain = true` OF (`strategy_score = 'Key Account'` AND `hiring_chance = 'High'`)
- **Orange**: (`strategy_score = 'Key Account'` OF `hiring_chance = 'High'`) AND `client_pain = false`
- **Green**: Alle andere gevallen

Je kunt deze logica aanpassen naar je eigen business rules.

### RLS Policies

De Row Level Security policies zorgen ervoor dat:
- Alle ingelogde users kunnen prioriteiten **lezen**
- Alleen admins kunnen prioriteiten **aanmaken, updaten en verwijderen**

De `is_admin()` functie controleert of een user een admin rol heeft in de `user_roles` tabel.

