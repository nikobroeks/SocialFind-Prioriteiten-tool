import { VacancyWithPriority, CompanyGroup } from '@/types/dashboard';

/**
 * Export vacatures naar CSV formaat
 */
export function exportVacanciesToCSV(
  vacancies: VacancyWithPriority[],
  filename: string = 'vacatures-export.csv'
): void {
  const headers = [
    'Bedrijf',
    'Vacature Titel',
    'Prioriteit',
    'Strategie Score',
    'Hiring Chance',
    'Client Pain',
    'Notities',
    'Vacature ID',
    'Bedrijf ID',
  ];

  const rows = vacancies.map((vacancy) => [
    vacancy.company.name,
    vacancy.job.title,
    vacancy.displayPriority,
    vacancy.priority?.strategy_score || '-',
    vacancy.priority?.hiring_chance || '-',
    vacancy.priority?.client_pain ? 'Ja' : 'Nee',
    vacancy.priority?.notes || '-',
    vacancy.job.id.toString(),
    vacancy.company.id.toString(),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  downloadFile(csvContent, filename, 'text/csv');
}

/**
 * Export bedrijven naar CSV formaat
 */
export function exportCompaniesToCSV(
  companyGroups: CompanyGroup[],
  filename: string = 'bedrijven-export.csv'
): void {
  const headers = [
    'Bedrijf',
    'Bedrijf ID',
    'Prioriteit',
    'Aantal Vacatures',
    'Red Vacatures',
    'Orange Vacatures',
    'Green Vacatures',
  ];

  const rows = companyGroups.map((group) => {
    const redCount = group.vacancies.filter((v) => v.displayPriority === 'Red').length;
    const orangeCount = group.vacancies.filter((v) => v.displayPriority === 'Orange').length;
    const greenCount = group.vacancies.filter((v) => v.displayPriority === 'Green').length;

    return [
      group.company.name,
      group.company.id.toString(),
      group.companyPriority || 'Green',
      group.vacancies.length.toString(),
      redCount.toString(),
      orangeCount.toString(),
      greenCount.toString(),
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  downloadFile(csvContent, filename, 'text/csv');
}

/**
 * Export alle data (bedrijven + vacatures) naar CSV
 */
export function exportAllDataToCSV(
  companyGroups: CompanyGroup[],
  filename: string = 'complete-export.csv'
): void {
  const headers = [
    'Bedrijf',
    'Bedrijf ID',
    'Bedrijf Prioriteit',
    'Vacature Titel',
    'Vacature ID',
    'Vacature Prioriteit',
    'Strategie Score',
    'Hiring Chance',
    'Client Pain',
    'Notities',
  ];

  const rows: string[][] = [];
  companyGroups.forEach((group) => {
    group.vacancies.forEach((vacancy) => {
      rows.push([
        group.company.name,
        group.company.id.toString(),
        group.companyPriority || 'Green',
        vacancy.job.title,
        vacancy.job.id.toString(),
        vacancy.displayPriority,
        vacancy.priority?.strategy_score || '-',
        vacancy.priority?.hiring_chance || '-',
        vacancy.priority?.client_pain ? 'Ja' : 'Nee',
        vacancy.priority?.notes || '-',
      ]);
    });
  });

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  downloadFile(csvContent, filename, 'text/csv');
}

/**
 * Download een bestand naar de gebruiker
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

