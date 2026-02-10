/**
 * Utility functies om klantbedrijf namen uit vacature titels te halen
 * 
 * NIEUWE LOGICA: Tags zijn nu de primaire bron voor bedrijfsidentificatie
 */

/**
 * Haalt bedrijfsnaam op uit tags (PRIMAIRE BRON)
 * Tags hebben prioriteit boven titel extractie
 */
export function extractCompanyFromTags(job: any): string | null {
  if (!job) return null;
  
  // Check verschillende mogelijke tag velden
  const tags = job.tags || job.tag_names || job.labels || job.label_names || [];
  
  if (!Array.isArray(tags) || tags.length === 0) {
    return null;
  }
  
  // Extract tag namen (kan strings zijn of objecten)
  const tagNames = tags
    .map((tag: any) => {
      if (typeof tag === 'string') return tag.trim();
      if (tag && typeof tag === 'object') {
        return tag.name || tag.label || tag.title || null;
      }
      return null;
    })
    .filter((name): name is string => Boolean(name) && name.length > 0);
  
  if (tagNames.length === 0) {
    return null;
  }
  
  // Gebruik de eerste tag als bedrijfsnaam
  // (In de toekomst kunnen we slimmere logica toevoegen om de juiste tag te kiezen)
  const companyName = cleanCompanyName(tagNames[0]);
  
  // Valideer dat het een redelijke bedrijfsnaam is (niet te kort, niet te lang)
  if (companyName.length >= 2 && companyName.length < 100) {
    return companyName;
  }
  
  return null;
}

/**
 * Lijst van bekende bedrijfsnamen (whitelist)
 * Deze lijst wordt gebruikt om bedrijfsnamen correct te identificeren
 */
const KNOWN_COMPANIES = [
  'Kader Group',
  'Vacumetal',
  'Don Bureau',
  'Bosch Beton',
  'Bouwgroep Peters',
  'GB-Meubelen',
  'CANNA',
  'Circus Gran Casino',
  'De Groot Bewerkingsmachines',
  'HQ Pack',
  'KIS Group',
  'Kragten',
  'Methorst',
  'Mosadex',
  'NIRAS',
  'Noverno',
  'Onestein',
  'Owow',
  'Pelgrimshof',
  'Pergamijn',
  'PPT',
  'Rioned',
  'Seerden',
  'Siebers',
  'SocialFind',
  'Taxperience',
  'thyssenkrupp',
  'Trappenfabriek Vermeulen',
  'Ugoo',
  'Van de Reijt Meststoffen',
  'Van Heek Medical',
  'Van Wijnen',
  'Waterschap Aa en Maas',
  'Waterschap de Brabantse Delta',
  'Waterschap De Dommel',
  'Willy Naessens',
].map(name => name.toLowerCase());

/**
 * Checkt of een string een bekende bedrijfsnaam bevat
 * Gebruikt zowel de hardcoded lijst als de database (als beschikbaar)
 */
function containsKnownCompany(text: string, knownCompaniesFromDB?: string[]): string | null {
  if (!text) return null;
  
  const textLower = text.toLowerCase();
  
  // Combine hardcoded list with database list
  const allKnownCompanies = knownCompaniesFromDB 
    ? [...KNOWN_COMPANIES, ...knownCompaniesFromDB.map(c => c.toLowerCase())]
    : KNOWN_COMPANIES;
  
  const allOriginalNames = knownCompaniesFromDB 
    ? [
        'Kader Group', 'Vacumetal', 'Don Bureau', 'Bosch Beton', 'Bouwgroep Peters',
        'GB-Meubelen', 'CANNA', 'Circus Gran Casino', 'De Groot Bewerkingsmachines',
        'HQ Pack', 'KIS Group', 'Kragten', 'Methorst', 'Mosadex', 'NIRAS', 'Noverno',
        'Onestein', 'Owow', 'Pelgrimshof', 'Pergamijn', 'PPT', 'Rioned', 'Seerden',
        'Siebers', 'SocialFind', 'Taxperience', 'thyssenkrupp', 'Trappenfabriek Vermeulen',
        'Ugoo', 'Van de Reijt Meststoffen', 'Van Heek Medical', 'Van Wijnen',
        'Waterschap Aa en Maas', 'Waterschap de Brabantse Delta', 'Waterschap De Dommel',
        'Willy Naessens',
        ...knownCompaniesFromDB
      ]
    : [
        'Kader Group', 'Vacumetal', 'Don Bureau', 'Bosch Beton', 'Bouwgroep Peters',
        'GB-Meubelen', 'CANNA', 'Circus Gran Casino', 'De Groot Bewerkingsmachines',
        'HQ Pack', 'KIS Group', 'Kragten', 'Methorst', 'Mosadex', 'NIRAS', 'Noverno',
        'Onestein', 'Owow', 'Pelgrimshof', 'Pergamijn', 'PPT', 'Rioned', 'Seerden',
        'Siebers', 'SocialFind', 'Taxperience', 'thyssenkrupp', 'Trappenfabriek Vermeulen',
        'Ugoo', 'Van de Reijt Meststoffen', 'Van Heek Medical', 'Van Wijnen',
        'Waterschap Aa en Maas', 'Waterschap de Brabantse Delta', 'Waterschap De Dommel',
        'Willy Naessens'
      ];
  
  // Check exacte matches eerst
  for (const company of allKnownCompanies) {
    if (textLower === company || textLower.includes(company)) {
      // Vind de originele naam (met juiste hoofdletters)
      for (const original of allOriginalNames) {
        if (original.toLowerCase() === company) {
          return original;
        }
      }
    }
  }
  
  return null;
}

/**
 * Haalt de klantbedrijf naam uit een vacature titel
 * Patronen die worden herkend:
 * - "... bij [Company]" (bijvoorbeeld: "Monteur bij van de Reijt meststoffen")
 * - "... bei [Company]" (Duits)
 * - "... voor [Company]"
 * - "[Job Title] - [Company]" (meest voorkomend)
 * - "[Company] - [Job Title]" (minder voorkomend)
 * - "[Job Title] | [Company]"
 */
export function extractCompanyFromTitle(title: string): string {
  if (!title) return 'Onbekend Bedrijf';

  // Helper functie om recruitment suffixes te verwijderen
  const removeRecruitmentSuffixes = (name: string): string => {
    return name
      .replace(/\s+(linkedin\s*pipeline|pipeline|recruitment|recruiting|talent|hiring|jobs|vacatures?)$/i, '')
      .trim();
  };

  // Helper functie om te checken of een string een functietitel lijkt te zijn
  // Dit is een conservatieve check - alleen duidelijke functietitel woorden
  const isLikelyJobTitle = (text: string): boolean => {
    if (!text || text.length < 2) return false;
    
    const textLower = text.toLowerCase().trim();
    
    // Alleen zeer specifieke functietitel woorden die bijna altijd functietitels zijn
    const strongJobTitleIndicators = [
      'monteur', 'medewerker', 'manager', 'directeur', 'assistent', 'specialist', 
      'consultant', 'engineer', 'developer', 'secretaresse', 'secretaris', 'receptionist',
      'notaris', 'kandidaat', 'associate', 'senior', 'junior', 'officer',
      'operator', 'technician', 'begeleider', 'adviseur', 'functioneelbeheerder',
      'directievoerder', 'produktionsleiter', 'personalreferent', 'betontechnologe',
      'assembly', 'representative', 'qhse', 'marketeer', 'coördinator', 'productcoördinator',
      'information security', 'field services', 'civiele techniek', 'elektrotechniek',
      'geodesie', 'infrastructuur', 'flexbureau', 'talentpool'
    ];
    
    // Check of het een sterk functietitel indicator bevat
    if (strongJobTitleIndicators.some(word => textLower.includes(word))) {
      return true;
    }
    
    // Check op patronen die duidelijk functietitels zijn
    if (textLower.includes('(m/v)') || 
        textLower.includes('(eng)') ||
        textLower.includes('(india)') ||
        textLower.includes('(niveau') ||
        /^\d+\s*(vacature|vacatures)/i.test(text)) {
      return true;
    }
    
    return false;
  };

  // EERST: Check of er een bekende bedrijfsnaam in de titel voorkomt
  // Note: knownCompaniesFromDB parameter zou moeten worden doorgegeven vanuit de caller
  // Voor nu gebruiken we alleen de hardcoded lijst
  const knownCompany = containsKnownCompany(title);
  if (knownCompany) {
    return cleanCompanyName(knownCompany);
  }

  // Patroon 1: "... bij [Company]" of "... bei [Company]" - MEEST BETROUWBAAR
  // Bijvoorbeeld: "Standortleiter bei Bosch Beton" -> "Bosch Beton"
  // Bijvoorbeeld: "Notaris bij Taxperience" -> "Taxperience"
  const bijPattern = /(?:bij|bei|voor|at|@)\s+(.+)$/i;
  const bijMatch = title.match(bijPattern);
  if (bijMatch && bijMatch[1]) {
    let companyName = bijMatch[1].trim();
    // Verwijder trailing punctuation
    companyName = companyName.replace(/[.,;:]+$/, '').trim();
    // Verwijder recruitment suffixes
    companyName = removeRecruitmentSuffixes(companyName);
    
    // Check of het een bekende bedrijfsnaam is
    const known = containsKnownCompany(companyName);
    if (known) {
      return cleanCompanyName(known);
    }
    
    // Als het resultaat niet te lang is en geen functietitel lijkt te zijn
    if (companyName.length >= 2 && companyName.length < 100 && !isLikelyJobTitle(companyName)) {
      return cleanCompanyName(companyName);
    }
  }

  // Patroon 2: "[Job Title] - [Company]" of "[Company] - [Job Title]"
  // Bijvoorbeeld: "Allround Secretaresse (M/V) - Taxperience" -> "Taxperience"
  // Bijvoorbeeld: "Waterschap De Dommel - Adviseur civiele techniek" -> "Waterschap De Dommel"
  // Bijvoorbeeld: "Seerden - Assembly operator" -> "Seerden"
  const dashPattern = /^(.+?)\s*-\s*(.+)$/;
  const dashMatch = title.match(dashPattern);
  if (dashMatch) {
    const firstPart = dashMatch[1].trim();
    const secondPart = dashMatch[2].trim();
    
    // Check of een van de delen een bekende bedrijfsnaam is
    const firstKnown = containsKnownCompany(firstPart);
    const secondKnown = containsKnownCompany(secondPart);
    
    if (firstKnown) {
      return cleanCompanyName(firstKnown);
    }
    if (secondKnown) {
      return cleanCompanyName(secondKnown);
    }
    
    // Check of het eerste deel een functietitel lijkt te zijn
    const firstIsJobTitle = isLikelyJobTitle(firstPart);
    const secondIsJobTitle = isLikelyJobTitle(secondPart);
    
    // Als het eerste deel een functietitel is, is het tweede deel waarschijnlijk het bedrijf
    if (firstIsJobTitle && !secondIsJobTitle && secondPart.length >= 2 && secondPart.length < 80) {
      return cleanCompanyName(removeRecruitmentSuffixes(secondPart));
    }
    
    // Als het tweede deel een functietitel is, is het eerste deel waarschijnlijk het bedrijf
    if (!firstIsJobTitle && secondIsJobTitle && firstPart.length >= 2 && firstPart.length < 80) {
      return cleanCompanyName(removeRecruitmentSuffixes(firstPart));
    }
    
    // Als geen van beide duidelijk een functietitel is, gebruik heuristiek:
    // - Als het eerste deel korter is en begint met hoofdletter, is het waarschijnlijk het bedrijf
    // - Anders is het tweede deel waarschijnlijk het bedrijf (meest voorkomend patroon)
    if (!firstIsJobTitle && !secondIsJobTitle) {
      // Als het eerste deel begint met hoofdletter en niet te lang is, probeer dat eerst
      if (firstPart.match(/^[A-Z]/) && firstPart.length < 50 && firstPart.length >= 2) {
        return cleanCompanyName(removeRecruitmentSuffixes(firstPart));
      }
      // Anders gebruik het tweede deel (meest voorkomend patroon: "Job Title - Company")
      if (secondPart.length >= 2 && secondPart.length < 80) {
        return cleanCompanyName(removeRecruitmentSuffixes(secondPart));
      }
    }
  }
  
  // Patroon 3: "[Job Title] | [Company]"
  // Bijvoorbeeld: "Information Security Officer | Kader Group" -> "Kader Group"
  // Bijvoorbeeld: "Begeleider MBO/HBO Flexbureau | Talentpool" -> "Talentpool"
  const pipePattern = /^(.+?)\s*\|\s*(.+)$/;
  const pipeMatch = title.match(pipePattern);
  if (pipeMatch && pipeMatch[2]) {
    let potentialCompany = pipeMatch[2].trim();
    
    // Check of het een bekende bedrijfsnaam is
    const known = containsKnownCompany(potentialCompany);
    if (known) {
      return cleanCompanyName(known);
    }
    
    // Het deel na de pipe is meestal het bedrijf
    if (!isLikelyJobTitle(potentialCompany) && potentialCompany.length >= 2 && potentialCompany.length < 80) {
      return cleanCompanyName(removeRecruitmentSuffixes(potentialCompany));
    }
  }

  // Patroon 4: "[Job Title], [Company], [Location]"
  // Bijvoorbeeld: "Senior Marketeer, De Groot Bewerkingsmachines, Rosmalen" -> "De Groot Bewerkingsmachines"
  const commaPattern = /^(.+?),\s*(.+?)(?:,\s*(.+))?$/;
  const commaMatch = title.match(commaPattern);
  if (commaMatch && commaMatch[2]) {
    let potentialCompany = commaMatch[2].trim();
    
    // Check of het een bekende bedrijfsnaam is
    const known = containsKnownCompany(potentialCompany);
    if (known) {
      return cleanCompanyName(known);
    }
    
    // Als het tweede deel geen functietitel lijkt te zijn en niet te kort (geen locatie)
    if (!isLikelyJobTitle(potentialCompany) && potentialCompany.length >= 5 && potentialCompany.length < 80) {
      return cleanCompanyName(removeRecruitmentSuffixes(potentialCompany));
    }
  }

  // Fallback: Als de hele titel geen scheidingstekens heeft en geen functietitel lijkt te zijn
  if (!title.includes('-') && !title.includes('|') && !title.match(/(?:bij|bei|voor|at|@)/i)) {
    // Check of de hele titel een bekende bedrijfsnaam is
    const known = containsKnownCompany(title);
    if (known) {
      return cleanCompanyName(known);
    }
    
    // Als de titel geen functietitel lijkt te zijn en een redelijke lengte heeft,
    // probeer het als bedrijfsnaam te gebruiken
    if (!isLikelyJobTitle(title) && title.length > 2 && title.length < 100) {
      return cleanCompanyName(title.trim());
    }
  }

  // Laatste fallback: probeer het laatste woord/deel als bedrijfsnaam
  // Alleen als we echt niets kunnen vinden, gebruik "Onbekend Bedrijf"
  const words = title.trim().split(/\s+/);
  if (words.length > 1) {
    // Neem het laatste woord als potentiële bedrijfsnaam
    const lastWord = words[words.length - 1];
    if (lastWord.length >= 2 && lastWord.length < 50 && !isLikelyJobTitle(lastWord)) {
      return cleanCompanyName(lastWord);
    }
    
    // Of neem de laatste 2 woorden
    const lastTwoWords = words.slice(-2).join(' ');
    if (lastTwoWords.length >= 3 && lastTwoWords.length < 60 && !isLikelyJobTitle(lastTwoWords)) {
      return cleanCompanyName(lastTwoWords);
    }
  }

  // Alleen als we echt niets kunnen vinden, gebruik "Onbekend Bedrijf"
  return 'Onbekend Bedrijf';
}

/**
 * Normaliseert een bedrijfsnaam voor vergelijking
 * Verwijdert veelvoorkomende suffixes zoals "Group", "BV", "NV", etc.
 */
export function normalizeCompanyNameForMatching(companyName: string): string {
  if (!companyName) return '';
  
  return companyName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Verwijder diacritics
    .trim()
    // Verwijder veelvoorkomende bedrijfsvormen en suffixes
    .replace(/\s+(group|bv|nv|bv\.|nv\.|b\.v\.|n\.v\.|ltd|limited|inc|incorporated|gmbh|ag|sa|spa|bvba|nvba)$/i, '')
    // Verwijder recruitment/HR gerelateerde suffixes
    .replace(/\s+(linkedin\s*pipeline|pipeline|recruitment|recruiting|talent|hiring|jobs|vacatures?)$/i, '')
    // Verwijder locatie informatie (bijvoorbeeld "Roermond", "Leusden", "Brussel")
    .replace(/\s+(roermond|leusden|nuland|tiel|brussel|venlo|woudenberg)$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Reinigt een bedrijfsnaam door onnodige suffixes te verwijderen
 * Dit wordt gebruikt bij het extracten van bedrijfsnamen uit titels
 * Behoudt locaties voor Circus Gran Casino
 */
export function cleanCompanyName(companyName: string): string {
  if (!companyName) return companyName;
  
  const trimmed = companyName.trim();
  
  // Behoud locaties voor Circus Gran Casino
  if (trimmed.toLowerCase().includes('circus gran casino')) {
    return trimmed
      .replace(/\s+(linkedin\s*pipeline|pipeline|recruitment|recruiting|talent|hiring|jobs|vacatures?)$/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  return trimmed
    // Verwijder recruitment/HR gerelateerde suffixes (case-insensitive)
    .replace(/\s+(linkedin\s*pipeline|pipeline|recruitment|recruiting|talent|hiring|jobs|vacatures?)$/i, '')
    // Verwijder locatie informatie aan het einde (behalve voor Circus Gran Casino)
    .replace(/\s+(roermond|leusden|nuland|tiel|brussel|venlo|woudenberg)$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checkt of een bedrijfsnaam een bekende bedrijfsnaam is
 */
export function isKnownCompany(companyName: string): boolean {
  if (!companyName) return false;
  return containsKnownCompany(companyName) !== null;
}

/**
 * Genereert een unieke ID voor een bedrijf op basis van de naam
 * Dit wordt gebruikt voor groepering
 */
export function getCompanyId(companyName: string): string {
  // Gebruik de genormaliseerde naam voor de ID
  const normalized = normalizeCompanyNameForMatching(companyName);
  
  // Normaliseer verder voor ID (verwijder speciale tekens)
  return normalized
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Controleert of twee bedrijfsnamen hetzelfde bedrijf vertegenwoordigen
 * Gebruikt fuzzy matching om variaties zoals "Kader Group" en "Kader" te matchen
 */
export function areCompaniesSame(name1: string, name2: string): boolean {
  if (!name1 || !name2) return false;
  
  const normalized1 = normalizeCompanyNameForMatching(name1);
  const normalized2 = normalizeCompanyNameForMatching(name2);
  
  // Exacte match na normalisatie
  if (normalized1 === normalized2) return true;
  
  // Check of de ene naam een subset is van de andere
  // Bijvoorbeeld: "kader" is een subset van "kader group"
  const words1 = normalized1.split(/\s+/).filter(w => w.length > 0);
  const words2 = normalized2.split(/\s+/).filter(w => w.length > 0);
  
  // Als een naam maar 1 woord heeft en dat woord voorkomt in de andere naam
  if (words1.length === 1 && words2.length > 1) {
    return words2.includes(words1[0]);
  }
  
  if (words2.length === 1 && words1.length > 1) {
    return words1.includes(words2[0]);
  }
  
  // Check of alle woorden van de kortere naam voorkomen in de langere naam
  const shorter = words1.length <= words2.length ? words1 : words2;
  const longer = words1.length > words2.length ? words1 : words2;
  
  if (shorter.length > 0 && shorter.length <= longer.length) {
    return shorter.every(word => longer.includes(word));
  }
  
  return false;
}
