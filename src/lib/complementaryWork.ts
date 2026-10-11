// Utility for Weekly Complementary / Extra-Training Work & WhatsApp Sharing
// Gil Vicente FC — Futebol Feminino

import { TrainingSessionInfo, MatchDayOffset, ComplementaryWorkOptions, ComplementaryWorkConfig } from './types';

export interface ComplementaryWorkItem {
  id: string;
  key: keyof ComplementaryWorkOptions;
  label: string;
  shortLabel: string;
  category: 'gym' | 'recovery' | 'mobility';
  icon: string;
  description: string;
  badgeClass: string;
}

export { type ComplementaryWorkOptions, type ComplementaryWorkConfig };

export const COMPLEMENTARY_WORK_ITEMS: ComplementaryWorkItem[] = [
  // Ginásio & Força
  {
    id: 'upperBody',
    key: 'upperBody',
    label: 'Membros Superiores & Tronco',
    shortLabel: 'Membros Superiores',
    category: 'gym',
    icon: '💪',
    description: 'Puxadas, empurres e cintura escapular',
    badgeClass: 'bg-indigo-950/70 border-indigo-500/40 text-indigo-300',
  },
  {
    id: 'lowerBody',
    key: 'lowerBody',
    label: 'Membros Inferiores (Força / Potência)',
    shortLabel: 'Membros Inferiores',
    category: 'gym',
    icon: '🏋️‍♂️',
    description: 'Força, potência e prevenção isquiotibiais/quadricípites',
    badgeClass: 'bg-violet-950/70 border-violet-500/40 text-violet-300',
  },
  {
    id: 'core',
    key: 'core',
    label: 'Core & Estabilidade Lombo-Pélvica',
    shortLabel: 'Core & Estabilidade',
    category: 'gym',
    icon: '🧱',
    description: 'Pranchas, anti-rotação e estabilidade de anca',
    badgeClass: 'bg-blue-950/70 border-blue-500/40 text-blue-300',
  },

  // Recuperação & Regeneração
  {
    id: 'iceBath',
    key: 'iceBath',
    label: 'Banho de Gelo / Crioterapia',
    shortLabel: 'Banho de Gelo',
    category: 'recovery',
    icon: '🧊',
    description: 'Crioterapia de imersão pós-esforço intenso',
    badgeClass: 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300',
  },
  {
    id: 'sauna',
    key: 'sauna',
    label: 'Sauna / Banhos de Contraste',
    shortLabel: 'Sauna / Contraste',
    category: 'recovery',
    icon: '🧖‍♀️',
    description: 'Regeneração vascular e relaxamento muscular',
    badgeClass: 'bg-amber-950/70 border-amber-500/40 text-amber-300',
  },
  {
    id: 'cardioSubmax',
    key: 'cardioSubmax',
    label: 'Cardio Regenerativo Submáximo',
    shortLabel: 'Cardio Suave (<120 bpm)',
    category: 'recovery',
    icon: '🚴',
    description: 'Bicicleta ergométrica suave ou natação regenerativa',
    badgeClass: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
  },

  // Mobilidade & Prevenção
  {
    id: 'mobility',
    key: 'mobility',
    label: 'Mobilidade Ativa & Flexibilidade',
    shortLabel: 'Mobilidade Ativa',
    category: 'mobility',
    icon: '🧘‍♀️',
    description: 'Mobilidade de anca, tornozelo e coluna torácica',
    badgeClass: 'bg-teal-950/70 border-teal-500/40 text-teal-300',
  },
  {
    id: 'foamRoller',
    key: 'foamRoller',
    label: 'Libertação Miofascial (Rolo)',
    shortLabel: 'Rolo Miofascial',
    category: 'mobility',
    icon: '🌀',
    description: 'Auto-massagem de isquiotibiais, gémeos e banda iliotibial',
    badgeClass: 'bg-rose-950/70 border-rose-500/40 text-rose-300',
  },
  {
    id: 'injuryPrevention',
    key: 'injuryPrevention',
    label: 'Prevenção Específica Individual',
    shortLabel: 'Prevenção Individual',
    category: 'mobility',
    icon: '🛡️',
    description: 'Exercícios personalizados para áreas sensíveis',
    badgeClass: 'bg-orange-950/70 border-orange-500/40 text-orange-300',
  },
];

export function hasAnyComplementaryWork(config?: ComplementaryWorkConfig): boolean {
  if (!config) return false;
  return Boolean(
    config.upperBody ||
    config.lowerBody ||
    config.core ||
    config.iceBath ||
    config.sauna ||
    config.cardioSubmax ||
    config.mobility ||
    config.foamRoller ||
    config.injuryPrevention ||
    (config.notes && config.notes.trim().length > 0)
  );
}

export function getActiveComplementaryItems(config?: ComplementaryWorkConfig): ComplementaryWorkItem[] {
  if (!config) return [];
  return COMPLEMENTARY_WORK_ITEMS.filter((item) => Boolean(config[item.key]));
}

// Format weekday in Portuguese
const WEEKDAY_NAMES_PT = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const WEEKDAY_NAMES_UPPER_PT = ['DOMINGO', 'SEGUNDA-FEIRA', 'TERÇA-FEIRA', 'QUARTA-FEIRA', 'QUINTA-FEIRA', 'SEXTA-FEIRA', 'SÁBADO'];

export function getDayNamePt(dateStr: string, uppercase = false): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const idx = date.getDay();
  return uppercase ? WEEKDAY_NAMES_UPPER_PT[idx] : WEEKDAY_NAMES_PT[idx];
}

export function formatDatePtShort(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
}

// Generate the Monday-to-Sunday dates for the week containing any given date
export function getWeekDates(referenceDateStr: string): string[] {
  const [y, m, d] = referenceDateStr.split('-').map(Number);
  const ref = new Date(y, m - 1, d);
  // Monday is 1, Sunday is 0 -> calculate distance to Monday
  const day = ref.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(ref);
  monday.setDate(ref.getDate() + diffToMonday);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + i);
    const yStr = cur.getFullYear();
    const mStr = String(cur.getMonth() + 1).padStart(2, '0');
    const dStr = String(cur.getDate()).padStart(2, '0');
    dates.push(`${yStr}-${mStr}-${dStr}`);
  }
  return dates;
}

// Generate formatted WhatsApp message text
export function generateWhatsAppWeeklyPlanText(params: {
  microcycleTitle?: string;
  weekDates: string[];
  sessions: Record<string, TrainingSessionInfo>;
  teamName?: string;
  generalNotes?: string;
}): string {
  const {
    microcycleTitle = 'MICROCICLO SEMANAL',
    weekDates,
    sessions,
    teamName = 'GIL VICENTE FC — FUTEBOL FEMININO SUB-15',
    generalNotes,
  } = params;

  const lines: string[] = [];

  lines.push(`🔴🔵 *${teamName}*`);
  lines.push(`📅 *PLANEAMENTO SEMANAL & EXTRA-TREINO* • _${microcycleTitle.toUpperCase()}_`);
  lines.push(`═══════════════════════════════════`);
  lines.push('');
  lines.push('Olá equipa! Segue o planeamento e o trabalho complementar/recuperação recomendado para cada dia:');
  lines.push('');

  weekDates.forEach((dateStr) => {
    const s = sessions[dateStr];
    const dayName = getDayNamePt(dateStr, true);
    const dateFormatted = formatDatePtShort(dateStr);
    const offset = s?.matchDayOffset || '';
    const offsetTag = offset ? ` • ${offset}` : '';

    // Day Header
    lines.push(`🗓️ *${dayName} (${dateFormatted})${offsetTag}*`);

    // Main Activity
    const dayType = s?.dayType || 'training';
    if (dayType === 'match') {
      const matchCat = s?.matchCategory === 'friendly' ? 'Jogo Treino' : s?.matchCategory === 'cup' ? 'Taça de Portugal' : 'Campeonato Nacional';
      const timeStr = s?.startTime ? ` às ${s.startTime}` : '';
      const locStr = s?.locationTime ? ` (${s.locationTime})` : '';
      lines.push(`🏆 *DIA DE JOGO* — ${matchCat}${timeStr}${locStr}`);
    } else if (dayType === 'rest') {
      lines.push(`🏖️ *Dia de Folga / Recuperação*`);
    } else {
      const timeStr = s?.startTime && s?.endTime ? `Das ${s.startTime} às ${s.endTime}` : s?.startTime ? `Início às ${s.startTime}` : 'Horário a confirmar';
      const locStr = s?.locationTime ? ` • ${s.locationTime}` : '';
      lines.push(`⚽ *Treino:* ${timeStr}${locStr}`);
    }

    // Complementary work
    const comp = s?.complementaryWork;
    if (comp && hasAnyComplementaryWork(comp)) {
      const activeItems = getActiveComplementaryItems(comp);
      const gymItems = activeItems.filter((i) => i.category === 'gym');
      const recItems = activeItems.filter((i) => i.category === 'recovery');
      const mobItems = activeItems.filter((i) => i.category === 'mobility');

      if (gymItems.length > 0) {
        lines.push(`🏋️ *Ginásio:* ${gymItems.map((i) => i.shortLabel).join(', ')}`);
      }
      if (recItems.length > 0) {
        lines.push(`🧊 *Recuperação:* ${recItems.map((i) => i.shortLabel).join(', ')}`);
      }
      if (mobItems.length > 0) {
        lines.push(`🧘‍♀️ *Mobilidade:* ${mobItems.map((i) => i.shortLabel).join(', ')}`);
      }
      if (comp.notes && comp.notes.trim()) {
        lines.push(`💬 _"${comp.notes.trim()}"_`);
      }
    } else {
      if (dayType === 'rest') {
        lines.push(`💤 _Foco em repouso passivo, hidratação e boa alimentação._`);
      }
    }

    lines.push('');
  });

  if (generalNotes && generalNotes.trim()) {
    lines.push(`📌 *NOTA GERAL DA EQUIPA TÉCNICA:*`);
    lines.push(`_${generalNotes.trim()}_`);
    lines.push('');
  }

  lines.push(`═══════════════════════════════════`);
  lines.push(`💪 *#NinguémPáraEstaCorrente • Gil Vicente FC*`);

  return lines.join('\n');
}

// Preset application helper
export function applyWeeklyPreset(
  presetKey: 'championship_saturday' | 'championship_sunday' | 'regenerative' | 'double_game',
  weekDates: string[],
  existingSessions: Record<string, TrainingSessionInfo>
): Record<string, TrainingSessionInfo> {
  const result: Record<string, TrainingSessionInfo> = { ...existingSessions };

  // Monday to Sunday (indices 0 to 6)
  weekDates.forEach((dateStr, idx) => {
    const existing = result[dateStr] || {
      date: dateStr,
      dayType: 'training',
      matchDayOffset: 'MD-3',
      durationMin: 90,
      startTime: '09:00',
      endTime: '10:30',
    };

    let compWork: ComplementaryWorkConfig = { ...(existing.complementaryWork || {}) };

    if (presetKey === 'championship_saturday') {
      // Mon (0): Rest / Recovery
      // Tue (1): MD-4 (Upper Body + Core)
      // Wed (2): MD-3 (Lower Body + Mobility)
      // Thu (3): MD-2 (Sauna + Myofascial)
      // Fri (4): MD-1 (Reactivity / Light Mobility)
      // Sat (5): MD (Game + Ice Bath)
      // Sun (6): MD+1 (Folga / Active recovery)
      if (idx === 0) {
        compWork = { iceBath: true, foamRoller: true, notes: 'Recuperação ativa pós-jogo' };
      } else if (idx === 1) {
        compWork = { upperBody: true, core: true, notes: 'Ginásio disponível 45min antes' };
      } else if (idx === 2) {
        compWork = { lowerBody: true, mobility: true, notes: 'Foco em força excêntrica e potência' };
      } else if (idx === 3) {
        compWork = { sauna: true, foamRoller: true, notes: 'Regeneração e libertação miofascial' };
      } else if (idx === 4) {
        compWork = { mobility: true, injuryPrevention: true, notes: 'Ativação e mobilidade dinâmica' };
      } else if (idx === 5) {
        compWork = { iceBath: true, notes: 'Crioterapia imediata pós-jogo' };
      } else if (idx === 6) {
        compWork = { cardioSubmax: true, mobility: true, notes: 'Bicicleta suave 15-20min opcional' };
      }
    } else if (presetKey === 'championship_sunday') {
      // Jogo ao Domingo (idx 6)
      if (idx === 0) {
        compWork = { iceBath: true, foamRoller: true, notes: 'Recuperação do fim de semana anterior' };
      } else if (idx === 1) {
        compWork = { upperBody: true, core: true, notes: 'Força de tronco e pilar central' };
      } else if (idx === 2) {
        compWork = { lowerBody: true, mobility: true, notes: 'Força de membros inferiores e anca' };
      } else if (idx === 3) {
        compWork = { sauna: true, injuryPrevention: true, notes: 'Sauna e prevenção individual' };
      } else if (idx === 4) {
        compWork = { foamRoller: true, notes: 'Libertação fascial' };
      } else if (idx === 5) {
        compWork = { mobility: true, notes: 'Ativação pré-jogo' };
      } else if (idx === 6) {
        compWork = { iceBath: true, notes: 'Protocolo de gelo pós-jogo' };
      }
    } else if (presetKey === 'regenerative') {
      // Regenerativa
      if (idx === 0 || idx === 1) {
        compWork = { iceBath: true, foamRoller: true, sauna: true, notes: 'Descanso e regeneração celular' };
      } else if (idx === 2 || idx === 3) {
        compWork = { mobility: true, core: true, cardioSubmax: true, notes: 'Trabalho cardiovascular suave e mobilidade' };
      } else {
        compWork = { foamRoller: true, injuryPrevention: true };
      }
    }

    result[dateStr] = {
      ...existing,
      complementaryWork: compWork,
      updatedAt: Date.now(),
    };
  });

  return result;
}
