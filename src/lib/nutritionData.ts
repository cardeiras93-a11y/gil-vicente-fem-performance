export type NutritionStatusLevel = 'Adequada' | 'Atenção' | 'Alerta' | 'Risco';

export interface NutritionMonthEntry {
  skf?: number | null; // ∑8SKF in mm
  status?: NutritionStatusLevel;
  weight?: number;
  fatMassPct?: number; // e.g. 0.200 (20.0%)
  muscleMassKg?: number;
}

export interface AthleteNutritionRecord {
  athleteId: string; // e.g. 'ath-2'
  canonicalName: string; // e.g. 'CAROL'
  fullName: string; // e.g. 'CAROLINA GOMES'
  position: 'GR' | 'DC' | 'LAT' | 'MC' | 'EX' | 'PL';
  heightCm: number;
  targetWeightKg: number;
  augustWeightKg: number;
  augustFatMassPct: number;
  augustMuscleMassKg: number;
  history: {
    august?: NutritionMonthEntry;
    september?: NutritionMonthEntry;
    october?: NutritionMonthEntry;
    november?: NutritionMonthEntry;
    [monthKey: string]: NutritionMonthEntry | undefined;
  };
  notes?: string;
}

export interface TeamNutritionMonthlyAverage {
  monthKey: string;
  monthLabelPt: string;
  averageSkf: number;
  totalEvaluated: number;
  status: NutritionStatusLevel;
}

export const TEAM_MONTHLY_AVERAGES: TeamNutritionMonthlyAverage[] = [
  { monthKey: 'august', monthLabelPt: 'Agosto', averageSkf: 98.4, totalEvaluated: 20, status: 'Atenção' },
  { monthKey: 'september', monthLabelPt: 'Setembro', averageSkf: 90.7, totalEvaluated: 21, status: 'Alerta' },
  { monthKey: 'october', monthLabelPt: 'Outubro', averageSkf: 86.8, totalEvaluated: 21, status: 'Atenção' },
  { monthKey: 'november', monthLabelPt: 'Novembro', averageSkf: 85.8, totalEvaluated: 21, status: 'Atenção' },
];

export const SKF_THRESHOLDS = {
  ADEQUATE: 80.0,
  ATTENTION: 90.0,
  ALERT: 100.0,
};

export function getStatusFromSkf(skf?: number | null): NutritionStatusLevel {
  if (skf === undefined || skf === null || isNaN(skf) || skf <= 0) return 'Adequada';
  if (skf <= SKF_THRESHOLDS.ADEQUATE) return 'Adequada';
  if (skf <= SKF_THRESHOLDS.ATTENTION) return 'Atenção';
  if (skf <= SKF_THRESHOLDS.ALERT) return 'Alerta';
  return 'Risco';
}

export function getStatusStyle(status: NutritionStatusLevel): {
  badge: string;
  text: string;
  border: string;
  bg: string;
  indicator: string;
} {
  switch (status) {
    case 'Adequada':
      return {
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        bg: 'bg-emerald-950/30',
        indicator: 'bg-emerald-500',
      };
    case 'Atenção':
      return {
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        bg: 'bg-amber-950/30',
        indicator: 'bg-amber-500',
      };
    case 'Alerta':
      return {
        badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
        text: 'text-orange-400',
        border: 'border-orange-500/30',
        bg: 'bg-orange-950/30',
        indicator: 'bg-orange-500',
      };
    case 'Risco':
    default:
      return {
        badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        text: 'text-rose-400',
        border: 'border-rose-500/30',
        bg: 'bg-rose-950/30',
        indicator: 'bg-rose-500',
      };
  }
}

export const INITIAL_NUTRITION_RECORDS: AthleteNutritionRecord[] = [
  {
    athleteId: 'ath-26',
    canonicalName: 'PAYTON',
    fullName: 'PAYTON WOODWARD',
    position: 'GR',
    heightCm: 174.0,
    targetWeightKg: 69.0,
    augustWeightKg: 70.0,
    augustFatMassPct: 0.200,
    augustMuscleMassKg: 36.3,
    history: {
      august: { skf: 85.7, status: 'Atenção', weight: 70.0, fatMassPct: 0.200, muscleMassKg: 36.3 },
      september: { skf: 85.7, status: 'Atenção' },
      october: { skf: 72.7, status: 'Adequada' },
      november: { skf: 77.5, status: 'Adequada' },
    },
    notes: 'Excelente evolução: desceu de Atenção para Adequada mantendo excelente massa muscular.',
  },
  {
    athleteId: 'ath-2',
    canonicalName: 'CAROL',
    fullName: 'CAROLINA GOMES',
    position: 'GR',
    heightCm: 162.4,
    targetWeightKg: 58.0,
    augustWeightKg: 58.3,
    augustFatMassPct: 0.242,
    augustMuscleMassKg: 29.0,
    history: {
      august: { skf: 102.4, status: 'Risco', weight: 58.3, fatMassPct: 0.242, muscleMassKg: 29.0 },
      september: { skf: 85.1, status: 'Atenção' },
      october: { skf: 82.8, status: 'Atenção' },
      november: { skf: 79.5, status: 'Adequada' },
    },
    notes: 'Grande conquista: -22.9 mm eliminados desde Agosto, atingindo o patamar Adequada (≤80mm) em Novembro.',
  },
  {
    athleteId: 'ath-22',
    canonicalName: 'SIMÃES',
    fullName: 'MARIANA SIMÃES',
    position: 'LAT',
    heightCm: 162.5,
    targetWeightKg: 59.0,
    augustWeightKg: 56.8,
    augustFatMassPct: 0.191,
    augustMuscleMassKg: 27.4,
    history: {
      august: { skf: 82.0, status: 'Atenção', weight: 56.8, fatMassPct: 0.191, muscleMassKg: 27.4 },
      september: { skf: 78.0, status: 'Adequada' },
      october: { skf: 85.7, status: 'Atenção' },
      november: { skf: 86.7, status: 'Atenção' },
    },
    notes: 'Diferença de peso de +2.2kg para o peso alvo. Manter vigilância na densidade calórica.',
  },
  {
    athleteId: 'ath-17',
    canonicalName: 'RIBEIRO',
    fullName: 'MARIA RIBEIRO',
    position: 'DC',
    heightCm: 168.5,
    targetWeightKg: 65.0,
    augustWeightKg: 67.5,
    augustFatMassPct: 0.218,
    augustMuscleMassKg: 33.3,
    history: {
      august: { skf: 104.8, status: 'Risco', weight: 67.5, fatMassPct: 0.218, muscleMassKg: 33.3 },
      september: { skf: 94.0, status: 'Alerta' },
      october: { skf: 85.8, status: 'Atenção' },
      november: { skf: 83.7, status: 'Atenção' },
    },
    notes: 'Trajetória decrescente exemplar: de 104.8mm para 83.7mm (-21.1 mm eliminados).',
  },
  {
    athleteId: 'ath-20',
    canonicalName: 'SARA T.',
    fullName: 'SARA TEIXEIRA',
    position: 'MC',
    heightCm: 172.3,
    targetWeightKg: 66.0,
    augustWeightKg: 66.6,
    augustFatMassPct: 0.205,
    augustMuscleMassKg: 30.7,
    history: {
      august: { skf: 87.1, status: 'Atenção', weight: 66.6, fatMassPct: 0.205, muscleMassKg: 30.7 },
      september: { skf: 71.3, status: 'Adequada' },
      october: { skf: 67.2, status: 'Adequada' },
      november: { skf: 75.2, status: 'Adequada' },
    },
    notes: 'Totalmente estabilizada na zona Adequada (≤80mm) em todos os últimos 3 meses.',
  },
  {
    athleteId: 'ath-13',
    canonicalName: 'MARTHE',
    fullName: 'MARTHE ENLID',
    position: 'MC',
    heightCm: 168.8,
    targetWeightKg: 66.0,
    augustWeightKg: 70.2,
    augustFatMassPct: 0.238,
    augustMuscleMassKg: 34.5,
    history: {
      august: { skf: 121.4, status: 'Risco', weight: 70.2, fatMassPct: 0.238, muscleMassKg: 34.5 },
      september: { skf: 112.5, status: 'Risco' },
      october: { skf: 110.4, status: 'Risco' },
      november: { skf: 107.4, status: 'Risco' },
    },
    notes: 'Evolução contínua (-14.0 mm desde Agosto). Plano alimentar focado na perda de massa gorda.',
  },
  {
    athleteId: 'ath-19',
    canonicalName: 'SARA A.',
    fullName: 'SARA ALVES',
    position: 'LAT',
    heightCm: 170.2,
    targetWeightKg: 68.0,
    augustWeightKg: 70.8,
    augustFatMassPct: 0.251,
    augustMuscleMassKg: 33.9,
    history: {
      august: { skf: 125.1, status: 'Risco', weight: 70.8, fatMassPct: 0.251, muscleMassKg: 33.9 },
      september: { skf: 114.8, status: 'Risco' },
      october: { skf: 110.1, status: 'Risco' },
      november: { skf: 107.8, status: 'Risco' },
    },
    notes: 'Progresso estável (-17.3 mm eliminados). Alvo de curto prazo: transição para <100 mm.',
  },
  {
    athleteId: 'ath-5',
    canonicalName: 'FAITH',
    fullName: 'FAITH DOBOSIEWICZ',
    position: 'DC',
    heightCm: 174.2,
    targetWeightKg: 72.2,
    augustWeightKg: 81.1,
    augustFatMassPct: 0.247,
    augustMuscleMassKg: 37.7,
    history: {
      august: { skf: 120.2, status: 'Risco', weight: 81.1, fatMassPct: 0.247, muscleMassKg: 37.7 },
      september: { skf: 107.7, status: 'Risco' },
      october: { skf: 91.3, status: 'Risco' },
      november: { skf: 89.0, status: 'Atenção' },
    },
    notes: 'Evolução espetacular: -31.2 mm eliminados! Saiu da zona de Risco diretamente para Atenção (89mm).',
  },
  {
    athleteId: 'ath-27',
    canonicalName: 'CHELSEA',
    fullName: 'CHELSEA WAGNER',
    position: 'LAT',
    heightCm: 177.0,
    targetWeightKg: 72.0,
    augustWeightKg: 73.0,
    augustFatMassPct: 0.235,
    augustMuscleMassKg: 33.8,
    history: {
      august: { skf: 112.0, status: 'Risco', weight: 73.0, fatMassPct: 0.235, muscleMassKg: 33.8 },
      september: { skf: 112.0, status: 'Risco' },
      october: { skf: 97.5, status: 'Risco' },
      november: { skf: 97.5, status: 'Risco' },
    },
    notes: 'Redução acentuada entre Setembro e Outubro (-14.5 mm), estabilizada em 97.5 mm.',
  },
  {
    athleteId: 'ath-4',
    canonicalName: 'EVA',
    fullName: 'EVA CRUZ',
    position: 'MC',
    heightCm: 155.2,
    targetWeightKg: 50.0,
    augustWeightKg: 47.0,
    augustFatMassPct: 0.169,
    augustMuscleMassKg: 24.0,
    history: {
      august: { skf: 62.3, status: 'Adequada', weight: 47.0, fatMassPct: 0.169, muscleMassKg: 24.0 },
      september: { skf: 63.2, status: 'Adequada' },
      october: { skf: 64.2, status: 'Adequada' },
      november: { skf: 66.8, status: 'Adequada' },
    },
    notes: 'Composição corporal de excelência. Foco no ganho controlado de massa muscular (+3.0kg para o alvo).',
  },
  {
    athleteId: 'ath-10',
    canonicalName: 'MAGUI',
    fullName: 'MARGARIDA OLIVEIRA',
    position: 'MC',
    heightCm: 160.1,
    targetWeightKg: 57.0,
    augustWeightKg: 59.4,
    augustFatMassPct: 0.208,
    augustMuscleMassKg: 29.1,
    history: {
      august: { skf: 92.2, status: 'Alerta', weight: 59.4, fatMassPct: 0.208, muscleMassKg: 29.1 },
      september: { skf: 86.4, status: 'Atenção' },
      october: { skf: 85.5, status: 'Atenção' },
      november: { skf: 84.0, status: 'Atenção' },
    },
    notes: 'Consistente e em descida constante (-8.2 mm). Muito próxima da marca dos 80 mm.',
  },
  {
    athleteId: 'ath-28',
    canonicalName: 'IZZY',
    fullName: 'ISRAELA GROVES',
    position: 'MC',
    heightCm: 173.0,
    targetWeightKg: 68.0,
    augustWeightKg: 70.0,
    augustFatMassPct: 0.230,
    augustMuscleMassKg: 35.0,
    history: {
      august: { skf: 116.1, status: 'Risco', weight: 70.0, fatMassPct: 0.230, muscleMassKg: 35.0 },
      september: { skf: null },
      october: { skf: 116.1, status: 'Risco' },
      november: { skf: 109.4, status: 'Risco' },
    },
    notes: 'Progresso positivo de Outubro para Novembro (-6.7 mm). Acompanhamento no processo de reabilitação.',
  },
  {
    athleteId: 'ath-12',
    canonicalName: 'MANU',
    fullName: 'MANUELA BAPTISTA',
    position: 'MC',
    heightCm: 157.4,
    targetWeightKg: 55.0,
    augustWeightKg: 58.4,
    augustFatMassPct: 0.209,
    augustMuscleMassKg: 28.7,
    history: {
      august: { skf: 89.8, status: 'Atenção', weight: 58.4, fatMassPct: 0.209, muscleMassKg: 28.7 },
      september: { skf: 85.5, status: 'Atenção' },
      october: { skf: 79.7, status: 'Adequada' },
      november: { skf: 74.0, status: 'Adequada' },
    },
    notes: 'Exemplo de consistência: atingiu patamar Adequada em Outubro e consolidou em 74.0 mm em Novembro (-15.8 mm).',
  },
  {
    athleteId: 'ath-23',
    canonicalName: 'TICHA',
    fullName: 'PATRÍCIA BARREIROS',
    position: 'MC',
    heightCm: 159.2,
    targetWeightKg: 57.0,
    augustWeightKg: 60.1,
    augustFatMassPct: 0.228,
    augustMuscleMassKg: 28.6,
    history: {
      august: { skf: 101.3, status: 'Risco', weight: 60.1, fatMassPct: 0.228, muscleMassKg: 28.6 },
      september: { skf: 94.1, status: 'Alerta' },
      october: { skf: 92.3, status: 'Risco' },
      november: { skf: 88.0, status: 'Atenção' },
    },
    notes: 'Transição muito positiva em Novembro: desceu para a faixa de Atenção (88.0 mm).',
  },
  {
    athleteId: 'ath-15',
    canonicalName: 'NICOLE',
    fullName: 'NICOLE CASSAMÁ',
    position: 'LAT',
    heightCm: 160.5,
    targetWeightKg: 57.0,
    augustWeightKg: 58.5,
    augustFatMassPct: 0.244,
    augustMuscleMassKg: 30.2,
    history: {
      august: { skf: 139.0, status: 'Risco', weight: 58.5, fatMassPct: 0.244, muscleMassKg: 30.2 },
      september: { skf: 126.0, status: 'Risco' },
      october: { skf: 114.6, status: 'Risco' },
      november: { skf: 111.4, status: 'Risco' },
    },
    notes: 'Uma das maiores reduções do plantel: -27.6 mm eliminados desde Agosto.',
  },
  {
    athleteId: 'ath-1',
    canonicalName: 'CARLOTA',
    fullName: 'CARLOTA CRISTO',
    position: 'LAT',
    heightCm: 174.0,
    targetWeightKg: 68.0,
    augustWeightKg: 68.7,
    augustFatMassPct: 0.236,
    augustMuscleMassKg: 32.5,
    history: {
      august: { skf: 115.6, status: 'Risco', weight: 68.7, fatMassPct: 0.236, muscleMassKg: 32.5 },
      september: { skf: 111.0, status: 'Risco' },
      october: { skf: 108.9, status: 'Risco' },
      november: { skf: null },
    },
    notes: 'Redução consistente até Outubro (-6.7 mm). Aguarda avaliação de Novembro.',
  },
  {
    athleteId: 'ath-24',
    canonicalName: 'TITA',
    fullName: 'PATRÍCIA DIAS',
    position: 'EX',
    heightCm: 170.9,
    targetWeightKg: 60.0,
    augustWeightKg: 57.0,
    augustFatMassPct: 0.181,
    augustMuscleMassKg: 28.0,
    history: {
      august: { skf: 64.8, status: 'Adequada', weight: 57.0, fatMassPct: 0.181, muscleMassKg: 28.0 },
      september: { skf: 57.9, status: 'Adequada' },
      october: { skf: 61.8, status: 'Adequada' },
      november: { skf: 58.9, status: 'Adequada' },
    },
    notes: 'Referência do plantel: sempre na faixa mais saudável e atlética (<65 mm).',
  },
  {
    athleteId: 'ath-21',
    canonicalName: 'SERENA',
    fullName: 'SERENA QUEIRÓS',
    position: 'EX',
    heightCm: 162.6,
    targetWeightKg: 58.0,
    augustWeightKg: 59.8,
    augustFatMassPct: 0.199,
    augustMuscleMassKg: 30.2,
    history: {
      august: { skf: 83.3, status: 'Atenção', weight: 59.8, fatMassPct: 0.199, muscleMassKg: 30.2 },
      september: { skf: 81.0, status: 'Atenção' },
      october: { skf: 77.2, status: 'Adequada' },
      november: { skf: 78.8, status: 'Adequada' },
    },
    notes: 'Manteve-se em patamar Adequada nos últimos dois meses (77-78 mm).',
  },
  {
    athleteId: 'ath-3',
    canonicalName: 'CARTAXO',
    fullName: 'SARA CARTAXO',
    position: 'EX',
    heightCm: 163.0,
    targetWeightKg: 58.0,
    augustWeightKg: 55.7,
    augustFatMassPct: 0.185,
    augustMuscleMassKg: 28.7,
    history: {
      august: { skf: 73.6, status: 'Adequada', weight: 55.7, fatMassPct: 0.185, muscleMassKg: 28.7 },
      september: { skf: 65.3, status: 'Adequada' },
      october: { skf: 66.2, status: 'Adequada' },
      november: { skf: 64.1, status: 'Adequada' },
    },
    notes: 'Excelente evolução em toda a linha (-9.5 mm). Totalmente no patamar Adequada.',
  },
  {
    athleteId: 'ath-14',
    canonicalName: 'MERIVA',
    fullName: 'DIANA MERIVA',
    position: 'PL',
    heightCm: 170.0,
    targetWeightKg: 63.0,
    augustWeightKg: 62.7,
    augustFatMassPct: 0.220,
    augustMuscleMassKg: 30.9,
    history: {
      august: { skf: 90.0, status: 'Atenção', weight: 62.7, fatMassPct: 0.220, muscleMassKg: 30.9 },
      september: { skf: 77.3, status: 'Adequada' },
      october: { skf: 72.4, status: 'Adequada' },
      november: { skf: 69.8, status: 'Adequada' },
    },
    notes: 'Uma das reduções mais pronunciadas (-20.2 mm eliminados), agora em excelentes 69.8 mm.',
  },
  {
    athleteId: 'ath-25',
    canonicalName: 'VERÓNICA',
    fullName: 'VERÓNICA KHUDIAKOVA',
    position: 'PL',
    heightCm: 163.9,
    targetWeightKg: 65.0,
    augustWeightKg: 69.5,
    augustFatMassPct: 0.226,
    augustMuscleMassKg: 34.1,
    history: {
      august: { skf: 110.8, status: 'Risco', weight: 69.5, fatMassPct: 0.226, muscleMassKg: 34.1 },
      september: { skf: 100.0, status: 'Alerta' },
      october: { skf: 95.8, status: 'Risco' },
      november: { skf: 98.8, status: 'Risco' },
    },
    notes: 'Progresso global de -12.0 mm desde Agosto. Próximo objetivo: consolidar <90 mm.',
  },
  {
    athleteId: 'ath-11',
    canonicalName: 'MALTA',
    fullName: 'MARIA MALTA',
    position: 'PL',
    heightCm: 155.3,
    targetWeightKg: 55.0,
    augustWeightKg: 56.7,
    augustFatMassPct: 0.212,
    augustMuscleMassKg: 28.0,
    history: {
      august: { skf: 103.8, status: 'Risco', weight: 56.7, fatMassPct: 0.212, muscleMassKg: 28.0 },
      september: { skf: 94.9, status: 'Alerta' },
      october: { skf: 94.1, status: 'Risco' },
      november: { skf: 92.5, status: 'Risco' },
    },
    notes: 'Descida progressiva (-11.3 mm eliminados desde Agosto). Perto do peso alvo (56.7 vs 55.0 kg).',
  },
];

export const NUTRITION_STORAGE_KEY = 'femperf_nutrition_records_v1';

export function getStoredNutritionRecords(): AthleteNutritionRecord[] {
  if (typeof window === 'undefined') return INITIAL_NUTRITION_RECORDS;
  try {
    const raw = localStorage.getItem(NUTRITION_STORAGE_KEY);
    if (!raw) return INITIAL_NUTRITION_RECORDS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_NUTRITION_RECORDS;
  } catch {
    return INITIAL_NUTRITION_RECORDS;
  }
}

export function saveStoredNutritionRecords(records: AthleteNutritionRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(NUTRITION_STORAGE_KEY, JSON.stringify(records));
    window.dispatchEvent(new Event('femperf_nutrition_updated'));
  } catch (e) {
    console.error('Erro ao guardar registos nutricionais:', e);
  }
}

/**
 * Resolves the nutrition record for a given athlete, handling multi-ID mappings (e.g. Izzy custom IDs or name variations)
 */
export function getNutritionForAthlete(
  athleteId?: string | null,
  athleteName?: string | null
): AthleteNutritionRecord | null {
  const records = getStoredNutritionRecords();
  if (!athleteId && !athleteName) return null;

  const cleanName = (athleteName || '').trim().toUpperCase();

  // 1. Direct ID match
  if (athleteId) {
    const direct = records.find((r) => r.athleteId === athleteId);
    if (direct) return direct;
  }

  // 2. Candidate ID resolution for known aliases (e.g. Izzy)
  if (athleteId === 'ath-custom-1790842877064' || cleanName.includes('IZZY')) {
    const match = records.find((r) => r.athleteId === 'ath-28' || r.canonicalName === 'IZZY');
    if (match) return match;
  }

  // 3. Name normalization match
  if (cleanName) {
    const match = records.find((r) => {
      const c = r.canonicalName.toUpperCase();
      const f = r.fullName.toUpperCase();
      if (cleanName === c || cleanName === f) return true;
      if (c.includes(cleanName) || cleanName.includes(c)) return true;
      if (cleanName.includes('CAROL') && c === 'CAROL') return true;
      if (cleanName.includes('PAYTON') && c === 'PAYTON') return true;
      if (cleanName.includes('TITA') && (c === 'TITA' || f.includes('DIAS'))) return true;
      if (cleanName.includes('TICHA') && (c === 'TICHA' || f.includes('BARREIROS'))) return true;
      if (cleanName.includes('MALTA') && c === 'MALTA') return true;
      if (cleanName.includes('CARTAXO') && c === 'CARTAXO') return true;
      if (cleanName.includes('SIMÃES') && c === 'SIMÃES') return true;
      if (cleanName.includes('VERÓNICA') && c === 'VERÓNICA') return true;
      if (cleanName.includes('RIBEIRO') && c === 'RIBEIRO') return true;
      if (cleanName.includes('FAITH') && c === 'FAITH') return true;
      if (cleanName.includes('CHELSEA') && c === 'CHELSEA') return true;
      if (cleanName.includes('SARA A') && c === 'SARA A.') return true;
      if (cleanName.includes('SARA T') && c === 'SARA T.') return true;
      return false;
    });
    if (match) return match;
  }

  return null;
}
