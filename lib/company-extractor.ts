/**
 * Utility functies om klantbedrijf namen uit vacature titels te halen
 */

/**
 * Haalt de klantbedrijf naam uit een vacature titel
 * Patronen die worden herkend:
 * - "... bij [Company]"
 * - "... voor [Company]"
 * - "... at [Company]"
 * - "[Company] - ..."
 * - "[Company] ..."
 */
export function extractCompanyFromTitle(title: string): string {
  if (!title) return 'Onbekend Bedrijf';

  // Patroon 1: "... bij [Company]" of "... voor [Company]"
  const bijPattern = /(?:bij|voor|at|@)\s+([A-Z][A-Za-z0-9\s&.-]+?)(?:\s|$|,|\.)/i;
  const bijMatch = title.match(bijPattern);
  if (bijMatch && bijMatch[1]) {
    return bijMatch[1].trim();
  }

  // Patroon 2: "[Company] - ..." of "[Company] ..." (als het eerste deel een bedrijfsnaam lijkt)
  // Dit is lastiger, maar we kunnen proberen het eerste deel te nemen als het eruit ziet als een bedrijfsnaam
  const startPattern = /^([A-Z][A-Za-z0-9\s&.-]+?)(?:\s*-\s*|\s{2,})/;
  const startMatch = title.match(startPattern);
  if (startMatch && startMatch[1]) {
    const potentialCompany = startMatch[1].trim();
    // Als het eerste deel niet te lang is en eruit ziet als een bedrijfsnaam
    if (potentialCompany.length < 50 && !potentialCompany.toLowerCase().includes('vacature')) {
      return potentialCompany;
    }
  }

  // Fallback: gebruik de hele titel als we niets kunnen vinden
  // Of return een generieke naam
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

