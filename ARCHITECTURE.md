# Architectuur Documentatie

## Overzicht

De SocialFind Prioriteiten Dashboard is een Next.js 16 applicatie die vacatures ophaalt van Recruitee en prioriteits-metadata beheert in Supabase.

## Project Structuur

```
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   └── recruitee/           # Recruitee API proxy
│   ├── login/                   # Login pagina
│   ├── layout.tsx               # Root layout met providers
│   ├── page.tsx                 # Dashboard homepage
│   └── globals.css              # Global styles
├── components/                   # React components
│   ├── dashboard.tsx            # Hoofd dashboard component
│   ├── priority-badge.tsx       # Prioriteit badge component
│   ├── priority-modal.tsx       # Modal voor prioriteit bewerken
│   ├── vacancy-row.tsx          # Tabel rij voor vacature
│   └── logout-button.tsx        # Logout knop
├── hooks/                       # Custom React hooks
│   └── use-recruitee-jobs.ts    # Hook voor Recruitee jobs
├── lib/                         # Utilities en configuratie
│   ├── recruitee.ts             # Recruitee API client (server-side)
│   ├── supabase/                # Supabase configuratie
│   │   ├── client.ts            # Client-side Supabase client
│   │   ├── server.ts            # Server-side Supabase client
│   │   └── queries.ts           # Database queries
│   └── utils.ts                 # Utility functies (incl. priority berekening)
├── types/                       # TypeScript type definities
│   ├── recruitee.ts             # Recruitee API types
│   ├── database.ts              # Supabase database types
│   └── dashboard.ts             # Dashboard combined types
├── supabase/                    # Database schema
│   └── schema.sql               # Complete SQL schema met RLS
└── middleware.ts                # Next.js middleware voor auth

```

## Data Flow

### 1. Vacatures Ophalen

```
Client Component (Dashboard)
  ↓
useRecruiteeJobs Hook
  ↓
API Route (/api/recruitee/jobs)
  ↓
Recruitee API Client (lib/recruitee.ts)
  ↓
Recruitee External API
```

### 2. Prioriteiten Ophalen

```
Client Component (Dashboard)
  ↓
TanStack Query
  ↓
Supabase Queries (lib/supabase/queries.ts)
  ↓
Supabase Client
  ↓
PostgreSQL Database
```

### 3. Prioriteit Opslaan (Alleen Admins)

```
Client Component (PriorityModal)
  ↓
Form Submit
  ↓
Supabase Queries (upsertPriority)
  ↓
Supabase Client (met RLS check)
  ↓
PostgreSQL Database (vacancy_priorities tabel)
```

## Database Schema

### `vacancy_priorities` Tabel

Slaat prioriteits-metadata op gekoppeld aan Recruitee vacatures:

- `recruitee_job_id` + `recruitee_company_id`: Unieke identificatie
- `strategy_score`: Key Account, Longterm, of Ad-hoc
- `hiring_chance`: High, Medium, of Low
- `client_pain`: Boolean (onrust/escalatie)
- `calculated_priority`: Automatisch berekend (Red/Orange/Green)
- `manual_override`: Optionele handmatige override
- `notes`: Vrije tekst notities

### `user_roles` Tabel

Slaat gebruikersrollen op:

- `user_id`: Link naar auth.users
- `email`: Email adres (voor eenvoudige lookups)
- `role`: 'admin' of 'viewer'

## Row Level Security (RLS)

### Vacancy Priorities

- **SELECT**: Alle ingelogde users kunnen lezen
- **INSERT/UPDATE/DELETE**: Alleen admins

### User Roles

- **SELECT**: Users kunnen hun eigen rol lezen, admins kunnen alle rollen lezen

## Business Logica

### Prioriteit Berekening (`lib/utils.ts`)

```typescript
calculatePriority(strategyScore, hiringChance, clientPain)
```

**Regels:**
1. **Red**: `client_pain = true` OF (`strategy_score = 'Key Account'` AND `hiring_chance = 'High'`)
2. **Orange**: (`strategy_score = 'Key Account'` OF `hiring_chance = 'High'`) AND `client_pain = false`
3. **Green**: Alle andere gevallen

### Display Priority

De weergave prioriteit gebruikt `manual_override` als die bestaat, anders `calculated_priority`.

## Authenticatie & Authorisatie

### Supabase Auth

- Gebruikers loggen in via Supabase Auth
- Session wordt beheerd via middleware en cookies
- Server-side en client-side clients zijn gescheiden

### Role-Based Access Control (RBAC)

- **Admin**: Kan prioriteiten aanmaken, bewerken en verwijderen
- **Viewer**: Kan alleen prioriteiten bekijken

De rol wordt opgehaald uit de `user_roles` tabel en gebruikt in RLS policies.

## API Routes

### `/api/recruitee/jobs`

Proxy route voor Recruitee API calls. Voorkomt dat API keys blootgesteld worden aan de client.

**Query Parameters:**
- `status`: Job status filter (default: 'published')
- `page`: Pagina nummer
- `per_page`: Items per pagina

## State Management

### TanStack Query

- **Caching**: 1 minuut stale time
- **Auto-refetch**: Uitgeschakeld op window focus
- **Query Keys**:
  - `['recruiteeJobs', options]`: Recruitee vacatures
  - `['priorities']`: Alle prioriteiten
  - `['userRole']`: Huidige gebruiker rol

## UI Componenten

### Dashboard

- Groepeert vacatures per company
- Toont tabel met alle relevante informatie
- Laat alleen admins bewerken

### Priority Modal

- Formulier voor het instellen van de 3 pijlers
- Live preview van berekende prioriteit
- Optie voor handmatige override
- Notities veld

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon key
RECRUITEE_API_KEY=               # Recruitee API key (server-only)
RECRUITEE_COMPANY_ID=            # Recruitee company ID (server-only)
```

## Security Considerations

1. **API Keys**: Recruitee API keys worden alleen server-side gebruikt
2. **RLS**: Database queries worden beschermd door Row Level Security
3. **Auth**: Supabase Auth zorgt voor veilige authenticatie
4. **Middleware**: Session refresh gebeurt automatisch via middleware

## Extensie Mogelijkheden

1. **Filters**: Voeg filters toe voor company, priority, etc.
2. **Sorting**: Sorteer op verschillende kolommen
3. **Bulk Actions**: Bewerk meerdere vacatures tegelijk
4. **History**: Track wijzigingen in prioriteiten
5. **Notifications**: Notificaties bij wijzigingen
6. **Export**: Exporteer data naar CSV/Excel

