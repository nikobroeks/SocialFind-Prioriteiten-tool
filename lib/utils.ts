import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { ClientPainLevel, TimeCriticality, StrategicValue, AccountHealth } from '@/types/database';

/**
 * Berekent de prioriteit op basis van de 4 pijlers
 * Puntensysteem:
 * - Laag = 1 punt
 * - Medium = 2 punten
 * - Hoog = 3 punten
 * 
 * Totaal: 4-12 punten
 * - 10-12 punten = Red (hoge prioriteit)
 * - 7-9 punten = Orange (medium prioriteit)
 * - 4-6 punten = Green (lage prioriteit)
 */
export function calculatePriority(
  clientPainLevel: ClientPainLevel | null,
  timeCriticality: TimeCriticality | null,
  strategicValue: StrategicValue | null,
  accountHealth: AccountHealth | null
): 'Red' | 'Orange' | 'Green' {
  // Bereken punten voor elke pijler
  const getClientPainPoints = (): number => {
    if (!clientPainLevel) return 0;
    switch (clientPainLevel) {
      case 'Nee': return 1;
      case 'Beginnend': return 2;
      case 'Ja': return 3;
      default: return 0;
    }
  };

  const getTimeCriticalityPoints = (): number => {
    if (!timeCriticality) return 0;
    switch (timeCriticality) {
      case 'Net begonnen': return 1;
      case 'Lopend': return 2;
      case 'Tegen het einde van samenwerking': return 3;
      default: return 0;
    }
  };

  const getStrategicValuePoints = (): number => {
    if (!strategicValue) return 0;
    switch (strategicValue) {
      case 'C-klant': return 1;
      case 'B-klant': return 2;
      case 'A-klant': return 3;
      default: return 0;
    }
  };

  const getAccountHealthPoints = (): number => {
    if (!accountHealth) return 0;
    switch (accountHealth) {
      case 'Tevreden stakeholder': return 1;
      case 'Onrustige stakeholder': return 2;
      case 'Kans op churn': return 3;
      default: return 0;
    }
  };

  // Tel alle punten op
  const totalPoints = 
    getClientPainPoints() +
    getTimeCriticalityPoints() +
    getStrategicValuePoints() +
    getAccountHealthPoints();

  // Als er geen pijlers zijn ingevuld, return Green
  if (totalPoints === 0) {
    return 'Green';
  }

  // Bepaal prioriteit op basis van totaal aantal punten
  if (totalPoints >= 10) {
    return 'Red';
  } else if (totalPoints >= 7) {
    return 'Orange';
  } else {
    return 'Green';
  }
}

/**
 * Bepaalt de display priority (gebruikt manual_override als die bestaat)
 */
export function getDisplayPriority(
  calculatedPriority: 'Red' | 'Orange' | 'Green',
  manualOverride: 'Red' | 'Orange' | 'Green' | null
): 'Red' | 'Orange' | 'Green' {
  return manualOverride ?? calculatedPriority;
}

