# AI-Powered Job Matching Setup

## Overzicht

Het systeem gebruikt nu een **hybride aanpak** voor job title matching:
1. **AI Matching** (als beschikbaar) - Gebruikt OpenAI embeddings voor semantische matching
2. **Keyword Matching** (fallback) - Gebruikt synoniemen en keyword extractie

## Waarom AI beter is

Met 203+ vacatures met complexe titels zoals:
- "Marketing Associate"
- "Projectmanager Marketing" 
- "Productcoördinator"
- "Financial Export Coordinator"
- "(De)montage Plaatwerker"

...is AI matching veel beter omdat het:
- ✅ **Semantische gelijkenis** begrijpt (niet alleen exacte woorden)
- ✅ **Context** meeneemt ("Marketing" en "Marketeer" worden automatisch herkend als gerelateerd)
- ✅ **Nederlandse en Engelse** termen combineert
- ✅ **Automatisch leert** zonder handmatige configuratie

## Setup (Optioneel - AI Matching)

### Stap 1: OpenAI API Key aanmaken

1. Ga naar [OpenAI Platform](https://platform.openai.com/)
2. Maak een account of log in
3. Ga naar "API Keys" → "Create new secret key"
4. Kopieer de API key

### Stap 2: API Key toevoegen aan project

Voeg toe aan `.env.local`:

```env
OPENAI_API_KEY=sk-...jouw-api-key...
```

### Stap 3: Kosten

- **Model**: `text-embedding-3-small` (goedkoopste optie)
- **Kosten**: ~$0.02 per 1M tokens
- **Geschat**: ~€0.01-0.05 per 100 vacatures gescand
- **Gratis tier**: $5 gratis credits bij aanmelding

## Hoe het werkt

### Met AI (als `OPENAI_API_KEY` is ingesteld):

1. **Vacature titel** → Wordt omgezet naar een "embedding" (vector van 1536 getallen)
2. **Kandidaat titels** → Ook omgezet naar embeddings
3. **Cosine similarity** → Berekent hoe gelijkaardig de vectoren zijn (0-1 score)
4. **Threshold** → Alleen matches boven 0.7 similarity worden getoond

**Voorbeeld:**
- Vacature: "Marketing Associate"
- Kandidaat: "Content Marketeer"
- **AI ziet**: Beide zijn marketing-gerelateerd → Match! ✅
- **Keyword matching**: Geen exacte woorden → Geen match ❌

### Zonder AI (fallback):

Gebruikt de huidige synoniemen-aanpak met keyword matching.

## Testen

### Test met AI:
```bash
# Zet OPENAI_API_KEY in .env.local
npm run dev
# Klik op "Zoek" bij een Red priority job
# Check console voor "matchingMethod: ai"
```

### Test zonder AI:
```bash
# Verwijder OPENAI_API_KEY uit .env.local
npm run dev
# Klik op "Zoek" bij een Red priority job
# Check console voor "matchingMethod: keyword"
```

## Alternatieven (gratis)

Als je geen OpenAI API key wilt gebruiken, zijn er gratis alternatieven:

### 1. **Hugging Face Embeddings** (gratis)
- Model: `sentence-transformers/all-MiniLM-L6-v2`
- Geen API key nodig
- Kan lokaal draaien

### 2. **Supabase Vector** (als je Supabase gebruikt)
- Gratis tier beschikbaar
- Vector search ingebouwd

### 3. **Google Cloud Vertex AI** (gratis tier)
- $300 gratis credits

## Performance

- **Met AI**: ~1-2 seconden voor 100 kandidaten
- **Zonder AI**: ~0.1 seconden (sneller maar minder nauwkeurig)

## Toekomstige verbeteringen

1. **Caching**: Embeddings kunnen gecached worden (niet elke keer opnieuw berekenen)
2. **Batch processing**: Meerdere vacatures tegelijk verwerken
3. **Fine-tuning**: Model trainen op jouw specifieke vacatures
4. **Multi-language**: Betere ondersteuning voor Nederlands/Engels mix

## Troubleshooting

**Probleem**: "AI matching failed, falling back to keyword matching"
- **Oplossing**: Check of `OPENAI_API_KEY` correct is ingesteld
- **Oplossing**: Check of je credits hebt op je OpenAI account

**Probleem**: Te weinig matches
- **Oplossing**: Verlaag `similarityThreshold` van 0.7 naar 0.6 in `lib/job-matching-ai.ts`

**Probleem**: Te veel matches
- **Oplossing**: Verhoog `similarityThreshold` van 0.7 naar 0.8

