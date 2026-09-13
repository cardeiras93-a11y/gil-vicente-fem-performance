import { MenstrualCyclePhase, HydrationStatus } from './types';

// Helper dictionary to normalize menstrual cycle phases to Portuguese
export function normalizeMenstrualCycleToPortuguese(phase?: string | null): MenstrualCyclePhase {
  if (!phase) return 'Menstruação irregular';
  const lower = phase.toLowerCase().trim();

  if (
    lower.includes('1st week') ||
    lower.includes('week 1') ||
    lower.includes('semaine 1') ||
    lower.includes('1a semana') ||
    lower.includes('1ª semana') ||
    lower.includes('1ère semaine') ||
    lower.includes('1er semana')
  ) {
    return '1ª Semana após a menstruação';
  }
  if (
    lower.includes('2nd week') ||
    lower.includes('week 2') ||
    lower.includes('semaine 2') ||
    lower.includes('2a semana') ||
    lower.includes('2ª semana') ||
    lower.includes('2ème semaine') ||
    lower.includes('2da semana')
  ) {
    return '2ª Semana após a menstruação';
  }
  if (
    lower.includes('3rd week') ||
    lower.includes('week 3') ||
    lower.includes('semaine 3') ||
    lower.includes('3a semana') ||
    lower.includes('3ª semana') ||
    lower.includes('3ème semaine') ||
    lower.includes('3ra semana')
  ) {
    return '3ª Semana após a menstruação';
  }
  if (lower.includes('irreg')) {
    return 'Menstruação irregular';
  }
  if (
    lower.includes('menstrua') ||
    lower.includes('period') ||
    lower.includes('règles') ||
    lower.includes('regla')
  ) {
    return 'Menstruação';
  }

  return phase as MenstrualCyclePhase;
}

// Normalize Hydration status to Portuguese
export function normalizeHydrationStatusToPortuguese(status?: string | null): HydrationStatus {
  if (!status) return 'Pendente';
  const lower = status.toLowerCase().trim();
  if (lower.includes('adequat') || lower.includes('adecuad') || lower.includes('good') || lower.includes('ok')) {
    return 'Adequada';
  }
  if (lower.includes('atten') || lower.includes('atenc') || lower.includes('atención') || lower.includes('warn')) {
    return 'Atenção';
  }
  if (lower.includes('alert') || lower.includes('danger') || lower.includes('urg')) {
    return 'Alerta';
  }
  return 'Pendente';
}

// Dictionary to translate free-text physio reasons and comments from EN/FR/ES to Portuguese
export function translateTextToPortuguese(text?: string | null): string {
  if (!text || typeof text !== 'string') return '';
  let result = text.trim();
  if (!result) return '';

  const translations: [RegExp, string][] = [
    // Body parts & locations (EN)
    [/\bleft hamstring\b/gi, 'ísquiotibial esquerdo'],
    [/\bright hamstring\b/gi, 'ísquiotibial direito'],
    [/\bhamstrings?\b/gi, 'ísquiotibiais'],
    [/\bleft knee\b/gi, 'joelho esquerdo'],
    [/\bright knee\b/gi, 'joelho direito'],
    [/\bknees?\b/gi, 'joelho'],
    [/\bleft ankle\b/gi, 'tornozelo esquerdo'],
    [/\bright ankle\b/gi, 'tornozelo direito'],
    [/\bankles?\b/gi, 'tornozelo'],
    [/\bleft calf\b/gi, 'gémeo esquerdo'],
    [/\bright calf\b/gi, 'gémeo direito'],
    [/\bcalves|calf\b/gi, 'gémeos'],
    [/\bleft thigh\b/gi, 'coxa esquerda'],
    [/\bright thigh\b/gi, 'coxa direita'],
    [/\bthighs?\b/gi, 'coxa'],
    [/\bleft groin\b/gi, 'virilha/adutor esquerdo'],
    [/\bright groin\b/gi, 'virilha/adutor direito'],
    [/\bgroin\b/gi, 'virilha/adutores'],
    [/\bquadriceps|quads?\b/gi, 'quadríceps'],
    [/\badductors?\b/gi, 'adutores'],
    [/\babductors?\b/gi, 'abdutores'],
    [/\bleft shoulder\b/gi, 'ombro esquerdo'],
    [/\bright shoulder\b/gi, 'ombro direito'],
    [/\bshoulders?\b/gi, 'ombro'],
    [/\blower back\b/gi, 'zona lombar'],
    [/\bupper back\b/gi, 'costas superiores'],
    [/\bback\b/gi, 'costas'],
    [/\bneck\b/gi, 'pescoço'],
    [/\bhip\b/gi, 'anca'],
    [/\bhips\b/gi, 'ancas'],

    // Common symptoms & pain terms (EN)
    [/\bpain in (the )?/gi, 'dor no/na '],
    [/\bpain\b/gi, 'dor'],
    [/\bsoreness\b/gi, 'dores musculares'],
    [/\bsore\b/gi, 'com dores'],
    [/\btightness\b/gi, 'rigidez/contratura'],
    [/\bstiff(ness)?\b/gi, 'rigidez'],
    [/\bcramps?\b/gi, 'cãibras'],
    [/\bfatigue(d)?\b/gi, 'fadiga'],
    [/\btired\b/gi, 'cansada'],
    [/\bvery tired\b/gi, 'muito cansada'],
    [/\bheavy legs\b/gi, 'pernas pesadas'],
    [/\binjury\b/gi, 'lesão'],
    [/\bswelling|swollen\b/gi, 'inchaço'],
    [/\bsprain\b/gi, 'entorse'],
    [/\bdiscomfort\b/gi, 'desconforto'],
    [/\btreat(ment)?\b/gi, 'tratamento'],
    [/\bphysio(therapy)?\b/gi, 'fisioterapia'],
    [/\bmassage\b/gi, 'massagem'],
    [/\bice\b/gi, 'gelo'],
    [/\bstretching\b/gi, 'alongamento'],

    // Modifiers (EN)
    [/\bleft\b/gi, 'esquerdo/a'],
    [/\bright\b/gi, 'direito/a'],
    [/\bboth\b/gi, 'ambos'],
    [/\bmild\b/gi, 'ligeira'],
    [/\bsevere|intense\b/gi, 'intensa'],
    [/\blittle\b/gi, 'pouco'],
    [/\ba lot\b/gi, 'muito'],

    // French terms
    [/\bdouleur au genou\b/gi, 'dor no joelho'],
    [/\bdouleur à la cuisse\b/gi, 'dor na coxa'],
    [/\bdouleur\b/gi, 'dor'],
    [/\bischio-jambiers?\b/gi, 'ísquiotibiais'],
    [/\bcheville\b/gi, 'tornozelo'],
    [/\bmollet\b/gi, 'gémeos'],
    [/\bépaule\b/gi, 'ombro'],
    [/\bfatigué(e)?\b/gi, 'cansada/fadiga'],
    [/\bcourbatures\b/gi, 'dores musculares'],
    [/\bgauche\b/gi, 'esquerdo/a'],
    [/\bdroit(e)?\b/gi, 'direito/a'],

    // Spanish terms
    [/\bdolor de\b/gi, 'dor de'],
    [/\bdolor en (el|la)?\b/gi, 'dor no/na '],
    [/\bdolor\b/gi, 'dor'],
    [/\brodilla\b/gi, 'joelho'],
    [/\btobillo\b/gi, 'tornozelo'],
    [/\bmuslo\b/gi, 'coxa'],
    [/\bhombro\b/gi, 'ombro'],
    [/\bgemelos?\b/gi, 'gémeos'],
    [/\bisquiotibiales?\b/gi, 'ísquiotibiais'],
    [/\bcansada\b/gi, 'cansada'],
    [/\bizquierda?\b/gi, 'esquerda'],
    [/\bderecha?\b/gi, 'direita'],
  ];

  translations.forEach(([pattern, replacement]) => {
    result = result.replace(pattern, replacement);
  });

  return result;
}
