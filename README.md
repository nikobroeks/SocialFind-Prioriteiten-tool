# SocialFind Prioriteiten Dashboard

Interne webapplicatie voor recruitment weekstarts prioriteitsbeheer.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Taal**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend/DB**: Supabase (PostgreSQL + Auth)
- **Data Fetching**: TanStack Query
- **Iconen**: Lucide React

## Quick Start

Zie [SETUP.md](./SETUP.md) voor gedetailleerde setup instructies.

### Snelle Setup

1. **Dependencies installeren:**
```bash
npm install
```

2. **Environment variabelen configureren:**
```bash
cp .env.local.example .env.local
# Vul .env.local in met je credentials
```

3. **Database schema uitvoeren:**
- Open Supabase SQL Editor
- Kopieer en voer `supabase/schema.sql` uit
- Maak admin users aan (zie SETUP.md)

4. **Development server starten:**
```bash
npm run dev
```

## Project Structuur

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes (Recruitee proxy)
│   ├── login/             # Login pagina
│   └── page.tsx           # Dashboard homepage
├── components/            # React components
│   ├── dashboard.tsx      # Hoofd dashboard
│   ├── priority-modal.tsx # Prioriteit bewerken modal
│   └── ...
├── lib/                   # Utilities en configuratie
│   ├── recruitee.ts       # Recruitee API client
│   ├── supabase/          # Supabase configuratie
│   └── utils.ts           # Utility functies
├── types/                 # TypeScript type definities
├── hooks/                 # Custom React hooks
└── supabase/              # SQL schema en migraties
```

## Documentatie

- **[SETUP.md](./SETUP.md)**: Gedetailleerde setup instructies
- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Architectuur documentatie

## Features

- ✅ Vacatures ophalen van Recruitee API (alleen 'published')
- ✅ Prioriteits-metadata beheren per vacature
- ✅ Automatische prioriteit berekening op basis van 3 pijlers
- ✅ Handmatige override mogelijkheid
- ✅ Role-based access control (Admin/Viewer)
- ✅ Dashboard gegroepeerd per company
- ✅ Real-time updates met TanStack Query

## Business Logica

De prioriteit wordt automatisch berekend op basis van:

1. **Strategie Score**: Key Account, Longterm, of Ad-hoc
2. **Hiring Chance**: High, Medium, of Low
3. **Client Pain**: Boolean (onrust/escalatie)

**Prioriteit Regels:**
- **Red**: Client pain = true OF (Key Account + High hiring chance)
- **Orange**: (Key Account OF High hiring chance) zonder client pain
- **Green**: Alle andere gevallen

Een admin kan de berekende prioriteit handmatig overschrijven.
