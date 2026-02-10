# Supabase Connection Troubleshooting

Als je geen queries kunt uitvoeren en geen data kunt bekijken, controleer het volgende:

## 1. Check Supabase Project Status

Ga naar je Supabase Dashboard en controleer:

- **Project Status**: Is het project actief of gepauzeerd?
- **Free Tier**: Free tier projecten worden automatisch gepauzeerd na 7 dagen inactiviteit
- **Quota**: Is je project over quota? (check "Settings" > "Usage")

## 2. Project Heractiveren (als gepauzeerd)

Als je project gepauzeerd is:
1. Ga naar je Supabase Dashboard
2. Klik op "Restore project" of "Resume project"
3. Wacht enkele minuten tot het project weer actief is

## 3. Database Connectie Check

Probeer deze stappen:

1. **Check Database Status**:
   - Ga naar "Settings" > "Database"
   - Controleer of de database "Active" is
   - Check de connection string

2. **Test via Table Editor**:
   - Ga naar "Table Editor"
   - Probeer een bestaande tabel te bekijken (bijv. `user_roles` of `vacancy_priorities`)
   - Als dit ook niet werkt, is het een database connectie probleem

3. **Check API Status**:
   - Ga naar "Settings" > "API"
   - Controleer of de API keys actief zijn
   - Test of je applicatie nog werkt (niet alleen SQL editor)

## 4. Mogelijke Oorzaken

### Project Gepauzeerd (meest waarschijnlijk)
- Free tier projecten pauzeren automatisch na 7 dagen inactiviteit
- Oplossing: Heractiveer het project via dashboard

### Database Overbelast
- Te veel queries tegelijk
- Oplossing: Wacht enkele minuten en probeer opnieuw

### Regionale Problemen
- Supabase regio heeft problemen
- Oplossing: Check Supabase status page

### Project Over Quota
- Database storage vol
- Oplossing: Upgrade plan of ruim data op

## 5. Snelle Fixes

1. **Herstart Project**:
   - Ga naar "Settings" > "General"
   - Klik op "Restart project" (als beschikbaar)

2. **Check Billing**:
   - Ga naar "Settings" > "Billing"
   - Controleer of er geen betalingsproblemen zijn

3. **Contact Support**:
   - Als niets werkt, gebruik de "Debug with Assistant" knop in de SQL editor
   - Of ga naar Supabase Discord/Support

## 6. Alternatief: Maak Nieuwe Tabel Later

Als je project weer werkt maar SQL editor nog steeds timeout geeft:
- Gebruik de Table Editor UI om de tabel aan te maken
- Of wacht tot Supabase het probleem heeft opgelost

