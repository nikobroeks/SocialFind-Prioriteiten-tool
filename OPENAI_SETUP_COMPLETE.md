# ✅ OpenAI API Key Geconfigureerd

## Wat is er ingesteld

Je API key is toegevoegd aan `.env.local`. Het systeem gebruikt nu automatisch **AI-powered matching** voor job titles.

## Welk model gebruiken we?

**Model**: `text-embedding-3-small`

Dit is een **embedding model** (geen chat model zoals GPT-4). Het zet tekst om naar vectoren (getallen) zodat we kunnen berekenen hoe gelijkaardig teksten zijn.

### Waarom dit model?

- ✅ **Goedkoop**: ~$0.02 per 1M tokens
- ✅ **Snel**: Snelle response tijd
- ✅ **Perfect voor matching**: Ontworpen voor semantic similarity
- ✅ **Nederlands ondersteuning**: Werkt goed met Nederlandse teksten

### Je API key werkt voor:

- ✅ Alle embedding modellen (`text-embedding-3-small`, `text-embedding-3-large`, etc.)
- ✅ Alle chat modellen (GPT-4, GPT-3.5, etc.) - als je die later wilt gebruiken
- ✅ Alle andere OpenAI API's

## Hoe het nu werkt

1. **Je klikt op "Zoek" bij een Red priority job**
2. **Systeem gebruikt AI** om de vacature titel te analyseren
3. **Vergelijkt met alle kandidaat titels** in de talent pool
4. **Vindt semantisch gelijkaardige matches** (niet alleen exacte woorden)

### Voorbeeld:

**Vacature**: "Marketing Associate bij CANNA"

**AI vindt automatisch**:
- ✅ "Content Marketeer" (0.89 similarity)
- ✅ "Marketing Manager" (0.92 similarity)  
- ✅ "Projectmanager Marketing" (0.85 similarity)
- ❌ "Software Engineer" (0.12 similarity - geen match)

## Testen

1. **Start de development server** (als die nog niet draait):
   ```bash
   npm run dev
   ```

2. **Ga naar het dashboard** en klik op "Zoek" bij een Red priority job

3. **Check de browser console** (F12) - je zou moeten zien:
   ```
   matchingMethod: ai
   ```

4. **Als je "matchingMethod: keyword" ziet**, betekent dat:
   - De API key is niet correct geladen (herstart de server)
   - Of er is een API error (check console voor details)

## Kosten

Met `text-embedding-3-small`:
- **Per scan**: ~€0.001-0.01 (afhankelijk van aantal kandidaten)
- **100 scans**: ~€0.10-1.00
- **Gratis credits**: OpenAI geeft $5 gratis bij aanmelding

## Troubleshooting

**Probleem**: "matchingMethod: keyword" (geen AI)
- **Oplossing**: Herstart de Next.js server (`npm run dev`)
- **Oplossing**: Check of `.env.local` de juiste key heeft
- **Oplossing**: Check browser console voor errors

**Probleem**: "OpenAI API error"
- **Oplossing**: Check of je credits hebt op je OpenAI account
- **Oplossing**: Check of de API key correct is (begint met `sk-proj-`)

**Probleem**: Te weinig matches
- **Oplossing**: Verlaag threshold in `lib/job-matching-ai.ts` (regel 75): `similarityThreshold = 0.6`

**Probleem**: Te veel matches
- **Oplossing**: Verhoog threshold naar `0.8` voor strengere matching

## Volgende stappen

Het systeem werkt nu met AI! Probeer het uit met verschillende vacatures en kijk hoe goed de matches zijn.

Als je betere resultaten wilt, kunnen we:
1. **Threshold aanpassen** (hoe streng de matching is)
2. **Caching toevoegen** (sneller voor herhaalde scans)
3. **Batch processing** (meerdere vacatures tegelijk)

