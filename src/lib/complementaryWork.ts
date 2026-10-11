// Utility for Weekly Complementary / Extra-Training Work & WhatsApp Sharing
// Gil Vicente FC — Futebol Feminino

import { TrainingSessionInfo, MatchDayOffset, ComplementaryWorkOptions, ComplementaryWorkConfig } from './types';

export interface ComplementaryWorkItem {
  id: string;
  key: keyof ComplementaryWorkOptions;
  label: string;
  shortLabel: string;
  labelEn?: string;
  shortLabelEn?: string;
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
    shortLabel: 'Superiores',
    shortLabelEn: 'Upper Body',
    category: 'gym',
    icon: '💪',
    description: 'Puxadas, empurres e cintura escapular',
    badgeClass: 'bg-indigo-950/70 border-indigo-500/40 text-indigo-300',
  },
  {
    id: 'lowerBody',
    key: 'lowerBody',
    label: 'Membros Inferiores (Força / Potência)',
    shortLabel: 'Inferiores',
    shortLabelEn: 'Lower Body',
    category: 'gym',
    icon: '🏋️‍♂️',
    description: 'Força, potência e prevenção isquiotibiais/quadricípites',
    badgeClass: 'bg-violet-950/70 border-violet-500/40 text-violet-300',
  },
  {
    id: 'core',
    key: 'core',
    label: 'Core & Estabilidade Lombo-Pélvica',
    shortLabel: 'Core',
    shortLabelEn: 'Core',
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
    shortLabelEn: 'Ice Bath',
    category: 'recovery',
    icon: '🧊',
    description: 'Crioterapia de imersão pós-esforço intenso',
    badgeClass: 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300',
  },
  {
    id: 'sauna',
    key: 'sauna',
    label: 'Sauna / Banhos de Contraste',
    shortLabel: 'Sauna',
    shortLabelEn: 'Sauna',
    category: 'recovery',
    icon: '🧖‍♀️',
    description: 'Regeneração vascular e relaxamento muscular',
    badgeClass: 'bg-amber-950/70 border-amber-500/40 text-amber-300',
  },
  {
    id: 'cardioSubmax',
    key: 'cardioSubmax',
    label: 'Cardio Regenerativo Submáximo',
    shortLabel: 'Cardio Suave',
    shortLabelEn: 'Easy Cardio',
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
    shortLabel: 'Mobilidade',
    shortLabelEn: 'Mobility',
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
    shortLabelEn: 'Foam Rolling',
    category: 'mobility',
    icon: '🌀',
    description: 'Auto-massagem de isquiotibiais, gémeos e banda iliotibial',
    badgeClass: 'bg-rose-950/70 border-rose-500/40 text-rose-300',
  },
  {
    id: 'injuryPrevention',
    key: 'injuryPrevention',
    label: 'Prevenção Específica Individual',
    shortLabel: 'Prevenção',
    shortLabelEn: 'Prevention',
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

// Format weekday in English
const WEEKDAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAY_NAMES_UPPER_EN = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export function getDayNameEn(dateStr: string, uppercase = false): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const idx = date.getDay();
  return uppercase ? WEEKDAY_NAMES_UPPER_EN[idx] : WEEKDAY_NAMES_EN[idx];
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

// Generate formatted WhatsApp message text (English by default as requested)
export function generateWhatsAppWeeklyPlanText(params: {
  microcycleTitle?: string;
  weekDates: string[];
  sessions: Record<string, TrainingSessionInfo>;
  teamName?: string;
  generalNotes?: string;
  lang?: 'en' | 'pt';
}): string {
  const {
    microcycleTitle,
    weekDates,
    sessions,
    teamName = 'GIL VICENTE FC — WOMEN\'S FOOTBALL U15',
    generalNotes,
    lang = 'en',
  } = params;

  const isEn = lang !== 'pt';
  const defaultTitle = isEn ? 'WEEKLY MICROCYCLE' : 'MICROCICLO SEMANAL';
  const title = (microcycleTitle && microcycleTitle.trim()) || defaultTitle;

  const lines: string[] = [];

  lines.push(`🔴🔵 *${teamName}*`);
  if (isEn) {
    lines.push(`📅 *WEEKLY SCHEDULE • EXTRA TRAINING (ALWAYS POST-TRAINING)* • _${title.toUpperCase()}_`);
    lines.push(`═══════════════════════════════════`);
    lines.push('');
    lines.push('Hello team! Here is our weekly training & recovery schedule.');
    lines.push('⚡ *IMPORTANT NOTICE:* All complementary work (gym, mobility & recovery) must be completed *ALWAYS POST-TRAINING*.');
    lines.push('');
  } else {
    lines.push(`📅 *PLANEAMENTO SEMANAL • EXTRA-TREINO (SEMPRE PÓS-TREINO)* • _${title.toUpperCase()}_`);
    lines.push(`═══════════════════════════════════`);
    lines.push('');
    lines.push('Olá equipa! Segue o planeamento da semana.');
    lines.push('⚡ *ATENÇÃO:* O trabalho complementar (ginásio, mobilidade e recuperação) é para ser realizado *SEMPRE PÓS-TREINO*.');
    lines.push('');
  }

  weekDates.forEach((dateStr) => {
    const s = sessions[dateStr];
    const dayName = isEn ? getDayNameEn(dateStr, true) : getDayNamePt(dateStr, true);
    const dateFormatted = formatDatePtShort(dateStr);
    const offset = s?.matchDayOffset || '';
    const offsetTag = offset ? ` • ${offset}` : '';

    // Day Header
    lines.push(`🗓️ *${dayName} (${dateFormatted})${offsetTag}*`);

    // Main Activity
    const dayType = s?.dayType || 'rest';
    if (dayType === 'match') {
      let matchCat = '';
      if (isEn) {
        matchCat = s?.matchCategory === 'friendly' ? 'Friendly Match' : s?.matchCategory === 'cup' ? 'Cup Match' : 'Championship Match';
      } else {
        matchCat = s?.matchCategory === 'friendly' ? 'Jogo Treino' : s?.matchCategory === 'cup' ? 'Taça de Portugal' : 'Campeonato Nacional';
      }
      const timeStr = s?.startTime ? (isEn ? ` at ${s.startTime}` : ` às ${s.startTime}`) : '';
      const locStr = s?.locationTime ? ` (${s.locationTime})` : '';
      lines.push(isEn ? `🏆 *MATCH DAY* — ${matchCat}${timeStr}${locStr}` : `🏆 *DIA DE JOGO* — ${matchCat}${timeStr}${locStr}`);
    } else if (dayType === 'rest') {
      lines.push(isEn ? `🏖️ *Rest Day / Recovery*` : `🏖️ *Dia de Folga / Recuperação*`);
    } else {
      let timeStr = '';
      if (s?.startTime && s?.endTime) {
        timeStr = isEn ? `From ${s.startTime} to ${s.endTime}` : `Das ${s.startTime} às ${s.endTime}`;
      } else if (s?.startTime) {
        timeStr = isEn ? `Starts at ${s.startTime}` : `Início às ${s.startTime}`;
      } else {
        timeStr = isEn ? 'Schedule TBA' : 'Horário a confirmar';
      }
      const locStr = s?.locationTime ? ` • ${s.locationTime}` : '';
      lines.push(isEn ? `⚽ *Pitch Training:* ${timeStr}${locStr}` : `⚽ *Treino de Campo:* ${timeStr}${locStr}`);
    }

    // Complementary work (Always post-training)
    const comp = s?.complementaryWork;
    if (comp && hasAnyComplementaryWork(comp)) {
      const activeItems = getActiveComplementaryItems(comp);
      const gymItems = activeItems.filter((i) => i.category === 'gym');
      const recItems = activeItems.filter((i) => i.category === 'recovery');
      const mobItems = activeItems.filter((i) => i.category === 'mobility');

      const extraWorkHeader = dayType === 'match'
        ? (isEn ? `⚡ *Post-Match Recovery:*` : `⚡ *Recuperação Pós-Jogo:*`)
        : dayType === 'rest'
        ? (isEn ? `⚡ *Recovery Work:*` : `⚡ *Trabalho de Recuperação:*`)
        : (isEn ? `⚡ *Post-Training Work:*` : `⚡ *Trabalho Pós-Treino:*`);
      lines.push(extraWorkHeader);
      if (gymItems.length > 0) {
        const list = gymItems.map((i) => (isEn ? i.shortLabelEn || i.shortLabel : i.shortLabel)).join(', ');
        lines.push(isEn ? `  🏋️ *Gym (Post-Training):* ${list}` : `  🏋️ *Ginásio (Pós-Treino):* ${list}`);
      }
      if (recItems.length > 0) {
        const list = recItems.map((i) => (isEn ? i.shortLabelEn || i.shortLabel : i.shortLabel)).join(', ');
        lines.push(isEn ? `  🧊 *Recovery:* ${list}` : `  🧊 *Recuperação:* ${list}`);
      }
      if (mobItems.length > 0) {
        const list = mobItems.map((i) => (isEn ? i.shortLabelEn || i.shortLabel : i.shortLabel)).join(', ');
        lines.push(isEn ? `  🧘‍♀️ *Mobility:* ${list}` : `  🧘‍♀️ *Mobilidade:* ${list}`);
      }
      if (comp.notes && comp.notes.trim()) {
        lines.push(`  💬 _"${comp.notes.trim()}"_`);
      }
    } else {
      if (dayType === 'rest') {
        lines.push(isEn ? `💤 _Focus on passive rest, hydration and good nutrition._` : `💤 _Foco em repouso passivo, hidratação e boa alimentação._`);
      }
    }

    lines.push('');
  });

  if (generalNotes && generalNotes.trim()) {
    lines.push(isEn ? `📌 *COACHING STAFF GENERAL NOTE:*` : `📌 *NOTA GERAL DA EQUIPA TÉCNICA:*`);
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
    const existing = result[dateStr];
    let dayType = existing?.dayType;
    let offset = existing?.matchDayOffset;

    let compWork: ComplementaryWorkConfig = { ...(existing?.complementaryWork || {}) };

    if (presetKey === 'championship_saturday') {
      if (idx === 0) {
        compWork = { iceBath: true, foamRoller: true, notes: 'Recuperação pós-jogo' };
        if (!dayType) dayType = 'training';
      } else if (idx === 1) {
        compWork = { upperBody: true, core: true, notes: 'Ginásio pós-treino (tronco e core)' };
        if (!dayType) dayType = 'training';
      } else if (idx === 2) {
        compWork = { lowerBody: true, mobility: true, notes: 'Ginásio pós-treino (força excêntrica e potência)' };
        if (!dayType) dayType = 'training';
      } else if (idx === 3) {
        compWork = { sauna: true, foamRoller: true, notes: 'Regeneração e libertação miofascial pós-treino' };
        if (!dayType) dayType = 'training';
      } else if (idx === 4) {
        compWork = { mobility: true, injuryPrevention: true, notes: 'Mobilidade dinâmica e prevenção pós-treino' };
        if (!dayType) dayType = 'training';
      } else if (idx === 5) {
        // Saturday: Match Day
        compWork = { iceBath: true, notes: 'Crioterapia imediata pós-jogo' };
        dayType = 'match';
        offset = 'MD';
      } else if (idx === 6) {
        // Sunday: Rest Day (Folga pós-jogo)
        compWork = { cardioSubmax: true, mobility: true, notes: 'Folga / Regeneração opcional' };
        dayType = 'rest';
        offset = 'MD+1';
      }
    } else if (presetKey === 'championship_sunday') {
      if (idx === 0) {
        compWork = { iceBath: true, foamRoller: true, notes: 'Recuperação pós-jogo' };
        dayType = 'rest';
        offset = 'MD+1';
      } else if (idx === 1) {
        compWork = { upperBody: true, core: true, notes: 'Ginásio pós-treino (tronco e pilar central)' };
        if (!dayType) dayType = 'training';
      } else if (idx === 2) {
        compWork = { lowerBody: true, mobility: true, notes: 'Ginásio pós-treino (membros inferiores e anca)' };
        if (!dayType) dayType = 'training';
      } else if (idx === 3) {
        compWork = { sauna: true, injuryPrevention: true, notes: 'Sauna e prevenção pós-treino' };
        if (!dayType) dayType = 'training';
      } else if (idx === 4) {
        compWork = { foamRoller: true, notes: 'Libertação fascial pós-treino' };
        if (!dayType) dayType = 'training';
      } else if (idx === 5) {
        compWork = { mobility: true, notes: 'Mobilidade e ativação pós-treino' };
        if (!dayType) dayType = 'training';
      } else if (idx === 6) {
        // Sunday: Match Day
        compWork = { iceBath: true, notes: 'Protocolo de gelo imediato pós-jogo' };
        dayType = 'match';
        offset = 'MD';
      }
    } else if (presetKey === 'regenerative') {
      // Regenerativa
      if (idx === 0 || idx === 6) {
        dayType = 'rest';
        offset = 'MD-3';
        compWork = { iceBath: true, foamRoller: true, sauna: true, notes: 'Descanso e regeneração celular' };
      } else if (idx === 2 || idx === 3) {
        if (!dayType) dayType = 'training';
        compWork = { mobility: true, core: true, cardioSubmax: true, notes: 'Trabalho cardiovascular suave e mobilidade' };
      } else {
        if (!dayType) dayType = 'training';
        compWork = { foamRoller: true, injuryPrevention: true };
      }
    }

    const finalDayType = dayType || (idx === 6 ? 'rest' : 'training');

    result[dateStr] = {
      ...(existing || {}),
      date: dateStr,
      durationMin: existing?.durationMin || 90,
      startTime: existing?.startTime || (finalDayType === 'match' ? '10:00' : '09:00'),
      endTime: existing?.endTime || (finalDayType === 'match' ? '11:30' : '10:30'),
      dayType: finalDayType,
      matchDayOffset: offset || existing?.matchDayOffset || (finalDayType === 'match' ? 'MD' : 'MD-3'),
      complementaryWork: compWork,
      updatedAt: Date.now(),
    };
  });

  return result;
}
