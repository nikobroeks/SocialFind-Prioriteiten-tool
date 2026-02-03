/**
 * Utility functies om klantbedrijf namen uit vacature titels te halen
 */

/**
 * Haalt de klantbedrijf naam uit een vacature titel
 * Patronen die worden herkend:
 * - "... bij [Company]" (bijvoorbeeld: "Monteur bij van de Reijt meststoffen")
 * - "... voor [Company]"
 * - "... at [Company]"
 * - "[Company] - ..."
 * - "[Company] ..."
 */
export function extractCompanyFromTitle(title: string): string {
  if (!title) return 'Onbekend Bedrijf';

  // Patroon 1: "... bij [Company]" of "... voor [Company]"
  // Verbeterd: pak alles na "bij/voor" tot het einde of tot een duidelijk scheidingsteken
  // Ondersteunt Nederlandse bedrijfsnamen met "van", "de", "het", etc.
  const bijPattern = /(?:bij|voor|at|@)\s+([A-Z][A-Za-z0-9\s&.-]+?)(?:\s*$|\s*-\s*|\s*\|)/i;
  const bijMatch = title.match(bijPattern);
  if (bijMatch && bijMatch[1]) {
    let companyName = bijMatch[1].trim();
    // Verwijder trailing punctuation
    companyName = companyName.replace(/[.,;:]+$/, '').trim();
    // Als het resultaat te kort is (minder dan 2 karakters), probeer meer te pakken
    if (companyName.length < 2) {
      // Probeer alles na "bij/voor" tot het einde
      const fullMatch = title.match(/(?:bij|voor|at|@)\s+(.+)$/i);
      if (fullMatch && fullMatch[1]) {
        companyName = fullMatch[1].trim();
        // Verwijder common job-related suffixes
        companyName = companyName.replace(/\s*-\s*(?:vacature|job|functie).*$/i, '').trim();
      }
    }
    if (companyName.length > 1) {
      return companyName;
    }
  }

  // Patroon 1b: "... bij [Company]" - alternatief patroon voor het einde van de string
  const bijEndPattern = /(?:bij|voor|at|@)\s+(.+)$/i;
  const bijEndMatch = title.match(bijEndPattern);
  if (bijEndMatch && bijEndMatch[1]) {
    let companyName = bijEndMatch[1].trim();
    // Verwijder trailing punctuation en job-related tekst
    companyName = companyName.replace(/[.,;:]+$/, '').trim();
    companyName = companyName.replace(/\s*-\s*(?:vacature|job|functie|sollicitatie).*$/i, '').trim();
    if (companyName.length > 1 && companyName.length < 100) {
      return companyName;
    }
  }

  // Patroon 2: "[Company] - ..." of "[Company] | ..." (als het eerste deel een bedrijfsnaam lijkt)
  const startPattern = /^([A-Z][A-Za-z0-9\s&.-]+?)(?:\s*-\s*|\s*\|\s*|\s{2,})/;
  const startMatch = title.match(startPattern);
  if (startMatch && startMatch[1]) {
    const potentialCompany = startMatch[1].trim();
    // Als het eerste deel niet te lang is en eruit ziet als een bedrijfsnaam
    if (potentialCompany.length >= 2 && potentialCompany.length < 80 && 
        !potentialCompany.toLowerCase().includes('vacature') &&
        !potentialCompany.toLowerCase().includes('sollicitatie') &&
        !potentialCompany.toLowerCase().includes('job')) {
      return potentialCompany;
    }
  }

  // Patroon 3: Als de titel zelf een bedrijfsnaam lijkt (geen functietitel woorden)
  const jobTitleWords = ['monteur', 'medewerker', 'manager', 'directeur', 'assistent', 'specialist', 
                         'consultant', 'engineer', 'developer', 'administratief', 'technisch', 'produktionsleiter'];
  const titleLower = title.toLowerCase();
  const hasJobTitle = jobTitleWords.some(word => titleLower.includes(word));
  
  // Als er geen job title woorden zijn, kan de hele titel een bedrijfsnaam zijn
  if (!hasJobTitle && title.length > 2 && title.length < 100) {
    return title.trim();
  }

  // Fallback: probeer het laatste deel van de titel als bedrijfsnaam
  // (vaak staat het bedrijf aan het einde)
  const parts = title.split(/[\s-|]+/);
  if (parts.length > 1) {
    // Neem de laatste 2-4 woorden als potentiële bedrijfsnaam
    const lastWords = parts.slice(-4).join(' ');
    if (lastWords.length > 2 && lastWords.length < 80) {
      // Check of het geen job title woorden bevat
      const lastWordsLower = lastWords.toLowerCase();
      const hasJobTitleInLast = jobTitleWords.some(word => lastWordsLower.includes(word));
      if (!hasJobTitleInLast) {
        return lastWords.trim();
      }
    }
  }

  // Laatste fallback: gebruik de hele titel als we niets kunnen vinden
  // Maar alleen als het niet te lang is en geen duidelijke job title woorden bevat
  if (title.length < 100 && !hasJobTitle) {
    return title.trim();
  }

  return 'Onbekend Bedrijf';
}

/**
 * Genereert een unieke ID voor een bedrijf op basis van de naam
 * Dit wordt gebruikt voor groepering
 */
export function getCompanyId(companyName: string): string {
  // Normaliseer de naam (lowercase, verwijder speciale tekens)
  return companyName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Verwijder diacritics
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

