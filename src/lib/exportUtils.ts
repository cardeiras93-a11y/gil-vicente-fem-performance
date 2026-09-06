import { WellnessEntry, RPEEntry, HydrationEntry } from './types';

// Helper to trigger browser download of CSV/Excel file with UTF-8 BOM
export function downloadExcelCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
  // UTF-8 BOM \uFEFF ensures Excel automatically recognizes special characters (é, á, ã, º, etc.)
  const BOM = '\uFEFF';
  
  // Format row with semicolon separator for European Excel compatibility
  const escapeCell = (val: string | number | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(escapeCell).join(';');
  const rowLines = rows.map((row) => row.map(escapeCell).join(';'));

  const csvContent = BOM + [headerLine, ...rowLines].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 1. Export Wellness Entries
export function exportWellnessToExcel(entries: WellnessEntry[], athleteFilter?: string, filenamePrefix: string = 'Wellness_PreTreino'): void {
  const filtered = athleteFilter && athleteFilter !== 'ALL'
    ? entries.filter((e) => e.athleteName.toLowerCase() === athleteFilter.toLowerCase() || e.athleteId === athleteFilter)
    : entries;

  const headers = [
    'Data',
    'Atleta',
    'Fase Microciclo',
    'Pontuação Wellness Total (7-35)',
    'Qualidade do Sono (1-5)',
    'Duração do Sono (1-5)',
    'Humor / Disposição (1-5)',
    'Nível de Stress (1-5)',
    'Nível de Fadiga (1-5)',
    'Dores Musculares (1-5)',
    'Pernas Pesadas (1-5)',
    'Fase do Ciclo Menstrual',
    'Zonas de Fadiga Muscular',
    'Necessita Fisioterapia',
    'Motivo Fisioterapia',
    'Data de Registo'
  ];

  const rows = filtered.map((e) => {
    const muscleMap = e.muscleFatigue
      ? Object.entries(e.muscleFatigue).map(([m, val]) => `${m}: ${val}/10`).join(' | ')
      : 'Nenhuma';

    const wTotal = e.wellnessTotal || (e.sleepQuality + e.sleepDuration + e.mood + e.stress + e.fatigue + e.soreness + e.heavyLegs);

    return [
      e.date,
      e.athleteName,
      e.matchDayOffset || 'MD-3',
      wTotal,
      e.sleepQuality,
      e.sleepDuration,
      e.mood,
      e.stress,
      e.fatigue,
      e.soreness,
      e.heavyLegs,
      e.menstrualCycle,
      muscleMap,
      e.needsPhysio ? 'SIM' : 'NÃO',
      e.physioReason || '',
      e.createdAt ? new Date(e.createdAt).toLocaleString('pt-PT') : e.date
    ];
  });

  const nameTag = athleteFilter && athleteFilter !== 'ALL' ? `_${athleteFilter}` : '';
  downloadExcelCSV(`${filenamePrefix}${nameTag}_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
}

// 2. Export RPE Entries
export function exportRPEToExcel(entries: RPEEntry[], athleteFilter?: string, filenamePrefix: string = 'PSE_PosTreino'): void {
  const filtered = athleteFilter && athleteFilter !== 'ALL'
    ? entries.filter((e) => e.athleteName.toLowerCase() === athleteFilter.toLowerCase() || e.athleteId === athleteFilter)
    : entries;

  const headers = [
    'Data',
    'Atleta',
    'Fase Microciclo (MD Tag)',
    'Exigência Física / Borg CR10 (1-10)',
    'Duração do Treino (minutos)',
    'Carga Interna sRPE (AU)',
    'Fadiga Pós-Treino (1-10)',
    'Zonas de Desconforto/Fadiga',
    'Comentários / Observações',
    'Data de Registo'
  ];

  const rows = filtered.map((e) => {
    const muscleMap = e.muscleFatigue
      ? Object.entries(e.muscleFatigue).map(([m, val]) => `${m}: ${val}/10`).join(' | ')
      : 'Nenhuma';

    const dur = e.sessionDurationMin || 0;
    const sRPE = e.physicalDemand * dur;

    return [
      e.date,
      e.athleteName,
      e.matchDayOffset || 'MD-3',
      e.physicalDemand,
      dur,
      sRPE,
      e.postFatigue,
      muscleMap,
      e.comments || '',
      e.createdAt ? new Date(e.createdAt).toLocaleString('pt-PT') : e.date
    ];
  });

  const nameTag = athleteFilter && athleteFilter !== 'ALL' ? `_${athleteFilter}` : '';
  downloadExcelCSV(`${filenamePrefix}${nameTag}_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
}

// 3. Export Hydration Entries
export function exportHydrationToExcel(entries: HydrationEntry[], athleteFilter?: string, filenamePrefix: string = 'Pesagem_Hidratacao'): void {
  const filtered = athleteFilter && athleteFilter !== 'ALL'
    ? entries.filter((e) => e.athleteName.toLowerCase() === athleteFilter.toLowerCase() || e.athleteId === athleteFilter)
    : entries;

  const headers = [
    'Data',
    'Atleta',
    'Peso Pré-Treino (kg)',
    'Peso Pós-Treino (kg)',
    'Perda de Peso (kg)',
    'Taxa de Desidratação (%)',
    'Fluidos Ingeridos no Treino (L)',
    'Estado de Hidratação',
    'Necessidade de Reposição Hídrica (L)',
    'Recomendação Clínica',
    'Impacto Biológico / Fisiológico',
    'Data de Registo'
  ];

  const rows = filtered.map((e) => [
    e.date,
    e.athleteName,
    e.preWeight,
    e.postWeight,
    e.weightLoss,
    `${e.dehydrationRate}%`,
    e.fluidsIntake,
    e.status,
    `${e.refillNeededLiters} L`,
    e.recommendation,
    e.biologicalImpact,
    e.createdAt ? new Date(e.createdAt).toLocaleString('pt-PT') : e.date
  ]);

  const nameTag = athleteFilter && athleteFilter !== 'ALL' ? `_${athleteFilter}` : '';
  downloadExcelCSV(`${filenamePrefix}${nameTag}_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
}

// 4. Export Complete All-in-One Data
export function exportAllDataToExcel(
  wellnessEntries: WellnessEntry[],
  rpeEntries: RPEEntry[],
  hydrationEntries: HydrationEntry[],
  athleteFilter?: string
): void {
  const nameTag = athleteFilter && athleteFilter !== 'ALL' ? `_${athleteFilter}` : '_Plantel_Completo';
  const dateStr = new Date().toISOString().split('T')[0];

  // Combined master report
  const headers = [
    'Tipo de Registo',
    'Data',
    'Atleta',
    'Fase Microciclo',
    'Indicador 1 (Wellness Total / Borg CR10 / Peso Pré)',
    'Indicador 2 (Fadiga Pós / Duração min / Peso Pós)',
    'Indicador 3 (Carga sRPE / Perda Peso kg)',
    'Indicador 4 (Desidratação % / Fisioterapia)',
    'Detalhes / Notas / Recomendações'
  ];

  const rows: (string | number)[][] = [];

  // Add Wellness
  const filteredW = athleteFilter && athleteFilter !== 'ALL'
    ? wellnessEntries.filter((e) => e.athleteName.toLowerCase() === athleteFilter.toLowerCase() || e.athleteId === athleteFilter)
    : wellnessEntries;

  filteredW.forEach((e) => {
    const wTotal = e.wellnessTotal || (e.sleepQuality + e.sleepDuration + e.mood + e.stress + e.fatigue + e.soreness + e.heavyLegs);
    rows.push([
      'WELLNESS (Pré-Treino)',
      e.date,
      e.athleteName,
      e.matchDayOffset || 'MD-3',
      `Wellness Total: ${wTotal}/35`,
      `Ciclo: ${e.menstrualCycle}`,
      `Sono: ${e.sleepQuality}/5 (${e.sleepDuration}/5)`,
      `Fisioterapia: ${e.needsPhysio ? 'SIM' : 'NÃO'}`,
      e.physioReason || 'Sem observações'
    ]);
  });

  // Add RPE
  const filteredR = athleteFilter && athleteFilter !== 'ALL'
    ? rpeEntries.filter((e) => e.athleteName.toLowerCase() === athleteFilter.toLowerCase() || e.athleteId === athleteFilter)
    : rpeEntries;

  filteredR.forEach((e) => {
    const dur = e.sessionDurationMin || 0;
    const sRPE = e.physicalDemand * dur;
    rows.push([
      'PSE (Pós-Treino)',
      e.date,
      e.athleteName,
      e.matchDayOffset || 'MD-3',
      `Exigência Borg: ${e.physicalDemand}/10`,
      `Duração: ${dur} min`,
      `Carga sRPE: ${sRPE} AU`,
      `Fadiga Pós: ${e.postFatigue}/10`,
      e.comments || 'Sem observações'
    ]);
  });

  // Add Hydration
  const filteredH = athleteFilter && athleteFilter !== 'ALL'
    ? hydrationEntries.filter((e) => e.athleteName.toLowerCase() === athleteFilter.toLowerCase() || e.athleteId === athleteFilter)
    : hydrationEntries;

  filteredH.forEach((e) => {
    rows.push([
      'PESAGEM & HIDRATAÇÃO',
      e.date,
      e.athleteName,
      '-',
      `Pré: ${e.preWeight}kg`,
      `Pós: ${e.postWeight}kg`,
      `Perda: ${e.weightLoss}kg`,
      `Desidratação: ${e.dehydrationRate}% (${e.status})`,
      `Reposição Hídrica: ${e.refillNeededLiters}L - ${e.recommendation}`
    ]);
  });

  downloadExcelCSV(`Relatorio_Completo_GilVicente${nameTag}_${dateStr}.csv`, headers, rows);
}

// 5. Export Weight Control Entries (PESO)
export function exportWeightToExcel(entries: HydrationEntry[], athleteFilter?: string, filenamePrefix: string = 'Controlo_Ponderal_PESO'): void {
  const filtered = athleteFilter && athleteFilter !== 'ALL'
    ? entries.filter((e) => e.athleteName.toLowerCase() === athleteFilter.toLowerCase() || e.athleteId === athleteFilter)
    : entries;

  const headers = [
    'Data',
    'Atleta',
    'Peso Pré-Treino (kg)',
    'Peso Pós-Treino (kg)',
    'Perda de Peso no Treino (kg)',
    '1º Peso Registado no Mês (kg)',
    'Último Peso Registado no Mês (kg)',
    'Variação Ponderal Mensal (kg)',
    'Data de Registo'
  ];

  const rows = filtered.map((e) => {
    const monthPrefix = e.date.substring(0, 7);
    const monthEntries = entries
      .filter((h) => h.athleteName.toLowerCase() === e.athleteName.toLowerCase() && h.date.startsWith(monthPrefix))
      .sort((a, b) => a.date.localeCompare(b.date));

    const firstEntry = monthEntries.length > 0 ? monthEntries[0] : null;
    const lastEntry = monthEntries.length > 0 ? monthEntries[monthEntries.length - 1] : null;

    const firstWeightMonth = firstEntry ? (firstEntry.preWeight || firstEntry.postWeight) : '';
    const lastWeightMonth = lastEntry ? (lastEntry.postWeight || lastEntry.preWeight) : '';
    const monthlyDiff = (typeof firstWeightMonth === 'number' && typeof lastWeightMonth === 'number')
      ? +(lastWeightMonth - firstWeightMonth).toFixed(1)
      : '';

    return [
      e.date,
      e.athleteName,
      e.preWeight || '',
      e.postWeight || '',
      e.weightLoss || '',
      firstWeightMonth,
      lastWeightMonth,
      monthlyDiff,
      e.createdAt ? new Date(e.createdAt).toLocaleString('pt-PT') : e.date
    ];
  });

  const nameTag = athleteFilter && athleteFilter !== 'ALL' ? `_${athleteFilter}` : '';
  downloadExcelCSV(`${filenamePrefix}${nameTag}_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
}
