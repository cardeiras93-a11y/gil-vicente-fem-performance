import { Athlete, MenstrualCyclePhase, HydrationStatus } from './types';

export const ROSTER_NAMES: string[] = [
  'CARLOTA',
  'CAROL',
  'CARTAXO',
  'CHELSEA',
  'EVA',
  'FAITH',
  'LARA',
  'LAURA',
  'LUANA CORREIA',
  'LUANA MACEDO',
  'MAGUI',
  'MALTA',
  'MANU',
  'MARTHE',
  'MERIVA',
  'NICOLE',
  'PAYTON',
  'RAMOS',
  'RIBEIRO',
  'RITA R.',
  'SARA ALVES',
  'SARA TEIXEIRA',
  'SERENA',
  'SIMÃES',
  'TICHA',
  'TITA',
  'VERÓNICA',
];

export const INITIAL_ATHLETES: Athlete[] = ROSTER_NAMES.map((name, index) => ({
  id: `ath-${index + 1}`,
  name,
}));

export const MENSTRUAL_CYCLE_OPTIONS: MenstrualCyclePhase[] = [
  'Menstruação',
  '1ª Semana após a menstruação',
  '2ª Semana após a menstruação',
  '3ª Semana após a menstruação',
  'Menstruação irregular',
];

export const TRUNK_UPPER_MUSCLES = [
  'Pescoço',
  'Ombro Direito',
  'Ombro Esquerdo',
  'Peitoral',
  'Abdominal',
  'Braço Direito',
  'Braço Esquerdo',
  'Antebraço Direito',
  'Antebraço Esquerdo',
  'Mão Direita',
  'Mão Esquerda',
  'Lombar',
  'Púbis',
];

export const LOWER_LIMB_MUSCLES = [
  'Adutores (D/E)',
  'Abdutores (D/E)',
  'Quadríceps (D/E)',
  'Ísquiotibiais (D/E)',
  'Joelho (D/E)',
  'Gémeos (D/E)',
  'Pé (D/E)',
];

export const ALL_MUSCLE_GROUPS = [...TRUNK_UPPER_MUSCLES, ...LOWER_LIMB_MUSCLES];

export const BORG_SCALE = [
  { value: 1, label: 'Muito Fácil', desc: 'Esforço mínimo / Repouso', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
  { value: 2, label: 'Muito Fácil', desc: 'Aquecimento ligeiro', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
  { value: 3, label: 'Moderado', desc: 'Ritmo confortável', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' },
  { value: 4, label: 'Moderado', desc: 'Respiração ligeiramente acelerada', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' },
  { value: 5, label: 'Difícil', desc: 'Exigente, conversa limitada', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
  { value: 6, label: 'Difícil', desc: 'Treino de intensidade elevada', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
  { value: 7, label: 'Muito Difícil', desc: 'Muito cansativo, exige grande foco', color: 'bg-orange-500/20 text-orange-400 border-orange-500/40' },
  { value: 8, label: 'Muito Difícil', desc: 'Próximo do limite sustentável', color: 'bg-orange-500/20 text-orange-400 border-orange-500/40' },
  { value: 9, label: 'Máximo', desc: 'Quase exaustão total', color: 'bg-rose-600/30 text-rose-400 border-rose-500/50' },
  { value: 10, label: 'Máximo Absolute', desc: 'Esforço extremo / Exaustão', color: 'bg-red-600/40 text-red-300 border-red-500/60' },
];

export const PRE_WORKOUT_TAGS = [
  'Mobilidade Articular',
  'Ativação Muscular',
  'Estabilidade de Core',
  'Prevenção de Lesões (FIFA 11+)',
  'Libertação Miofascial',
  'Exercícios de Força Específica',
];

import { Language } from './i18n';

export function calculateHydrationStatus(preWeight: number, postWeight: number, fluidsIntake: number = 0, language: Language = 'pt') {
  const weightLoss = Math.max(0, +(preWeight - postWeight).toFixed(2));
  const dehydrationRate = +((weightLoss / preWeight) * 100).toFixed(2);
  const refillNeededLiters = +(weightLoss * 1.5).toFixed(2);

  let status: HydrationStatus = 'Adequada';
  let recommendation = '';
  let biologicalImpact = '';

  if (dehydrationRate < 1.0) {
    status = 'Adequada';
    recommendation = language === 'en'
      ? 'Maintain regular hydration and normal water intake throughout the rest of the day.'
      : language === 'fr'
      ? 'Maintenir une hydratation régulière et un apport d\'eau normal le reste de la journée.'
      : 'Manter hidratação regular e ingestão de água normal durante o resto do dia.';
    biologicalImpact = language === 'en'
      ? 'No significant impact on athletic performance or thermoregulatory system.'
      : language === 'fr'
      ? 'Aucun impact significatif sur la performance athlétique ni sur le système thermorégulateur.'
      : 'Sem impacto significativo no rendimento desportivo nem no sistema termorregulador.';
  } else if (dehydrationRate <= 2.0) {
    status = 'Atenção';
    recommendation = language === 'en'
      ? `Immediate post-workout fluid replacement: consume approximately ${refillNeededLiters.toFixed(2)} L of fluids over the next 2 to 4 hours.`
      : language === 'fr'
      ? `Remplacement hydrique immédiat après entraînement : consommer environ ${refillNeededLiters.toFixed(2)} L de liquides dans les 2 à 4 heures.`
      : `Reposição hídrica imediata pós-treino: ingerir aproximadamente ${refillNeededLiters.toFixed(2)} L de fluidos ao longo das próximas 2 a 4 horas.`;
    biologicalImpact = language === 'en'
      ? 'Slight increase in cardiac workload, elevated body temperature, and potential decrease in tactical focus.'
      : language === 'fr'
      ? 'Légère augmentation de la charge cardiaque, élévation de la température corporelle et baisse potentielle de la concentration.'
      : 'Ligeiro aumento do esforço cardíaco, elevação da temperatura corporal e potencial redução da concentração tática.';
  } else {
    status = 'Alerta';
    recommendation = language === 'en'
      ? `MANDATORY Isotonic Sodium Drinks (${refillNeededLiters.toFixed(2)} L) + salty snacks for urgent electrolyte replenishment.`
      : language === 'fr'
      ? `Apport OBLIGATOIRE de Boissons Isotoniques au Sodium (${refillNeededLiters.toFixed(2)} L) + snacks salés pour reconstituer les électrolytes.`
      : `Ingestão OBRIGATÓRIA de Bebidas Isotónicas com Sódio (${refillNeededLiters.toFixed(2)} L) + snacks salgados para repor eletrólitos urgentes.`;
    biologicalImpact = language === 'en'
      ? 'Sharp decline in aerobic capacity, increased muscle cramping, CNS fatigue, and severe delay in recovery.'
      : language === 'fr'
      ? 'Chute brutale de la capacité aérobie, augmentation des crampes musculaires, fatigue du SNC et retard grave dans la récupération.'
      : 'Diminuição acentuada da capacidade aeróbia, aumento de cãibras musculares, fadiga do SNC e atraso grave na recuperação.';
  }

  return {
    weightLoss,
    dehydrationRate,
    status,
    refillNeededLiters,
    recommendation,
    biologicalImpact,
  };
}
