import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Berekent de prioriteit op basis van de 3 pijlers
 * Business logica: 
 * - Red: client_pain = true OF (strategy_score = 'Key Account' AND hiring_chance = 'High')
 * - Orange: (strategy_score = 'Key Account' OR hiring_chance = 'High') AND client_pain = false
 * - Green: alle andere gevallen
 */
export function calculatePriority(
  strategyScore: 'Key Account' | 'Longterm' | 'Ad-hoc' | null,
  hiringChance: 'High' | 'Medium' | 'Low' | null,
  clientPain: boolean
): 'Red' | 'Orange' | 'Green' {
  // Als er client pain is, altijd Red
  if (clientPain) {
    return 'Red';
  }

  // Key Account + High hiring chance = Red
  if (strategyScore === 'Key Account' && hiringChance === 'High') {
    return 'Red';
  }

  // Key Account OF High hiring chance (zonder pain) = Orange
  if (strategyScore === 'Key Account' || hiringChance === 'High') {
    return 'Orange';
  }

  // Alle andere gevallen = Green
  return 'Green';
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

