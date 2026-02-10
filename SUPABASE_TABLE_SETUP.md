# Company Visibility Tabel Aanmaken via Supabase Dashboard

Als de SQL editor niet werkt vanwege timeout problemen, kun je de tabel handmatig aanmaken via de Supabase Dashboard.

## Stappen:

1. **Ga naar je Supabase Dashboard**
   - Open je project in Supabase
   - Ga naar "Table Editor" in het linker menu

2. **Klik op "New Table"**
   - Geef de tabel de naam: `company_visibility`
   - Zorg dat het schema `public` is

3. **Voeg de volgende kolommen toe:**

   | Column Name | Type | Default Value | Nullable | Unique |
   |-------------|------|---------------|----------|--------|
   | id | uuid | gen_random_uuid() | No | Primary Key |
   | recruitee_company_id | int4 | - | No | No |
   | company_name | text | - | No | No |
   | is_visible | bool | true | No | No |
   | created_at | timestamptz | now() | No | No |
   | updated_at | timestamptz | now() | No | No |
   | updated_by | uuid | - | Yes | No |

4. **Voeg een Unique Constraint toe:**
   - Klik op "Add constraint"
   - Type: Unique
   - Columns: `recruitee_company_id`, `company_name`

5. **Enable Row Level Security:**
   - Ga naar "Authentication" > "Policies"
   - Zoek de tabel `company_visibility`
   - Klik op "Enable RLS"

6. **Voeg Policies toe:**
   - Klik op "New Policy"
   - Policy name: "Authenticated users can view company visibility"
   - Allowed operation: SELECT
   - USING expression: `auth.role() = 'authenticated'`

   - Klik op "New Policy"
   - Policy name: "Admins can insert company visibility"
   - Allowed operation: INSERT
   - WITH CHECK expression: `public.is_admin(auth.uid())`

   - Klik op "New Policy"
   - Policy name: "Admins can update company visibility"
   - Allowed operation: UPDATE
   - USING expression: `public.is_admin(auth.uid())`
   - WITH CHECK expression: `public.is_admin(auth.uid())`

   - Klik op "New Policy"
   - Policy name: "Admins can delete company visibility"
   - Allowed operation: DELETE
   - USING expression: `public.is_admin(auth.uid())`

7. **Voeg een Trigger toe (optioneel, voor updated_at):**
   - Ga naar "Database" > "Triggers"
   - Klik op "New Trigger"
   - Name: `update_company_visibility_updated_at`
   - Table: `company_visibility`
   - Events: UPDATE
   - Function: `update_updated_at_column()`
   - Trigger type: BEFORE

## Na het aanmaken:

Test of de tabel werkt door deze query uit te voeren:
```sql
SELECT * FROM public.company_visibility LIMIT 1;
```

