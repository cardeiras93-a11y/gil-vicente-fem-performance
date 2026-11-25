import { MobilityPlan, AthletePlanAssignment, Athlete } from './types';
import { secureFetch } from './authGuard';
import { isGoalkeeper } from './data';

export const MOBILITY_PLANS_KEY = 'femperf_mobility_plans_v5';
export const ATHLETE_PLAN_ASSIGNMENTS_KEY = 'femperf_athlete_plan_assignments_v8';
export const MOBILITY_DAILY_COMPLETIONS_KEY = 'femperf_mobility_daily_completions_v3';

export const DEFAULT_GK_MOBILITY_PLAN: MobilityPlan = {
  id: 'mobility-gk-pre-training',
  titlePt: 'Plano de Mobilidade Pré-Treino — Específico Guarda-Redes (GR)',
  titleEn: 'Pre-Training Mobility Plan — Goalkeepers (GK) Specific',
  categoryPt: 'GUARDA-REDES • MOBILIDADE PRÉ-TREINO',
  categoryEn: 'GOALKEEPERS • PRE-TRAINING MOBILITY',
  targetPosition: 'GR',
  durationMinutes: 20,
  warmupPt: 'Ativação Cardiovascular Ligeira (3 min): Skips no sítio, deslocamentos laterais defensivos curtos e rotações dinâmicas de braços.',
  warmupEn: 'Light Cardiovascular Activation (3 min): On-spot skips, short defensive lateral shuffles, and dynamic arm circles.',
  finisherPt: 'Prontidão Específica (2 min): 3 quedas laterais controladas de joelhos para cada lado + simulação de alcance alto.',
  finisherEn: 'Specific Readiness (2 min): 3 controlled kneeling side dives each side + high aerial reach simulation.',
  blocks: [
    {
      id: 'block-01',
      number: '01',
      titlePt: 'CINTURA ESCAPULAR & COLUNA TORÁCICA (ALCANCE AÉREO)',
      titleEn: 'SHOULDER GIRDLE & THORACIC SPINE (AERIAL REACH)',
      durationMinutes: 5,
      exercises: [
        {
          id: 'ex-1-1',
          namePt: '1.1 Rotação Torácica & Alcance Superior c/ Banda',
          nameEn: '1.1 Thoracic Rotation & Overhead Reach w/ Band',
          seriesRepsPt: '2x 8 reps / lado',
          seriesRepsEn: '2x 8 reps / side',
          restPt: 'Repouso: 20s',
          restEn: 'Rest: 20s',
          descriptionPt: 'Meio-ajoelhado segurando banda ancorada. Roda o tronco para o lado da perna avançada abrindo o peito e estende o braço ao teto.',
          descriptionEn: 'Half-kneeling holding anchored band. Rotate torso towards lead leg opening chest and extend arm towards ceiling.',
          drawingKey: 'rotation-band-reach',
        },
        {
          id: 'ex-1-2',
          namePt: '1.2 Passagens de Ombros e Peitoral c/ Banda (Dislocates)',
          nameEn: '1.2 Shoulder Dislocates & Chest Opening w/ Band',
          seriesRepsPt: '2x 10 reps',
          seriesRepsEn: '2x 10 reps',
          restPt: 'Repouso: 20s',
          restEn: 'Rest: 20s',
          descriptionPt: 'De pé, pega na banda com pegada larga e braços esticados. Passa a banda por cima da cabeça até às costas de forma fluida.',
          descriptionEn: 'Standing, wide grip on band with straight arms. Fluidly pass band overhead all the way behind back without arching lower spine.',
          drawingKey: 'shoulder-dislocates-band',
        },
      ],
    },
    {
      id: 'block-02',
      number: '02',
      titlePt: 'CÁPSULA DA ANCA & ADUTORES (ABERTURA LATERAL & QUEDA)',
      titleEn: 'HIP CAPSULE & ADDUCTORS (LATERAL OPENING & DIVE)',
      durationMinutes: 5,
      exercises: [
        {
          id: 'ex-2-1',
          namePt: '2.1 Agachamento Cossack c/ Banda (Mobilidade Adutora)',
          nameEn: '2.1 Cossack Squat w/ Band (Adductor Mobility)',
          seriesRepsPt: '2x 6-8 reps / lado',
          seriesRepsEn: '2x 6-8 reps / side',
          restPt: 'Repouso: 20s',
          restEn: 'Rest: 20s',
          descriptionPt: 'Pés afastados com banda de suporte. Desce a bacia lateralmente sobre um calcanhar, mantendo a outra perna esticada c/ ponta do pé para cima.',
          descriptionEn: 'Wide stance with support band. Lower hips laterally over one heel, keeping other leg straight with toes pointing upward.',
          drawingKey: 'cossack-squat-band',
        },
        {
          id: 'ex-2-2',
          namePt: '2.2 Transições 90/90 de Anca c/ Alcance Dinâmico',
          nameEn: '2.2 90/90 Hip Transitions w/ Dynamic Reach',
          seriesRepsPt: '2x 6 reps / lado',
          seriesRepsEn: '2x 6 reps / side',
          restPt: 'Repouso: 20s',
          restEn: 'Rest: 20s',
          descriptionPt: 'Sentada em 90/90 (rotação externa e interna). Transita suavemente a bacia de um lado para o outro, projetando o peito no alcance.',
          descriptionEn: 'Seated in 90/90 position (external and internal rotation). Smoothly switch hips side to side, projecting chest forward into reach.',
          drawingKey: 'hip-90-90-reach',
        },
      ],
    },
    {
      id: 'block-03',
      number: '03',
      titlePt: 'TORNOZELO & BASE DE QUEDA (DORSIFLEXÃO & PRONTIDÃO)',
      titleEn: 'ANKLE & DIVE BASE (DORSIFLEXION & READINESS)',
      durationMinutes: 5,
      exercises: [
        {
          id: 'ex-3-1',
          namePt: '3.1 Mobilização de Dorsiflexão do Tornozelo c/ Banda',
          nameEn: '3.1 Ankle Dorsiflexion Mobilization w/ Band',
          seriesRepsPt: '2x 10 pulsos / lado',
          seriesRepsEn: '2x 10 pulses / side',
          restPt: 'Repouso: 20s',
          restEn: 'Rest: 20s',
          descriptionPt: 'Meio-ajoelhado com banda a tracionar o tálus para trás. Avança o joelho sobre o 2º dedo sem descolar o calcanhar do solo.',
          descriptionEn: 'Half-kneeling with band pulling talus posterior. Drive knee over 2nd toe keeping heel firmly glued to floor.',
          drawingKey: 'ankle-dorsiflexion-band',
        },
        {
          id: 'ex-3-2',
          namePt: '3.2 Passo Lateral em Base de Queda c/ Mini-Banda',
          nameEn: '3.2 Lateral Step in Goalkeeper Set Stance w/ Mini-Band',
          seriesRepsPt: '2x 8 reps / lado',
          seriesRepsEn: '2x 8 reps / side',
          restPt: 'Repouso: 20s',
          restEn: 'Rest: 20s',
          descriptionPt: 'Mini-banda acima dos joelhos em base de guarda-redes (joelhos fletidos, tronco reativo). Passos laterais curtos em tensão constante.',
          descriptionEn: 'Mini-band above knees in keeper ready position (knees flexed, active torso). Short lateral steps maintaining continuous band tension.',
          drawingKey: 'lateral-step-band',
        },
      ],
    },
    {
      id: 'block-04',
      number: '04',
      titlePt: 'ESTABILIDADE ESCAPULOTORÁCICA & CADEIA CRUZADA',
      titleEn: 'SCAPULOTHORACIC STABILITY & CROSS-CHAIN',
      durationMinutes: 5,
      exercises: [
        {
          id: 'ex-4-1',
          namePt: '4.1 Deslize de Braços em W-Y na Parede c/ Mini-Banda',
          nameEn: '4.1 Wall W-Y Forearm Slides w/ Mini-Band',
          seriesRepsPt: '2x 8-10 reps',
          seriesRepsEn: '2x 8-10 reps',
          restPt: 'Repouso: 20s',
          restEn: 'Rest: 20s',
          descriptionPt: 'Mini-banda nos pulsos mantendo tensão lateral. Desliza os antebraços na parede desde a posição "W" até à extensão total em "Y".',
          descriptionEn: 'Mini-band on wrists with outward tension. Slide forearms up wall from "W" position into full overhead "Y" extension.',
          drawingKey: 'wall-wy-slides-band',
        },
        {
          id: 'ex-4-2',
          namePt: '4.2 Pássaro-Cão Dinâmico c/ Banda Cruzada (Bird-Dog)',
          nameEn: '4.2 Dynamic Bird-Dog w/ Cross Band',
          seriesRepsPt: '2x 8 reps / lado',
          seriesRepsEn: '2x 8 reps / side',
          restPt: 'Repouso: 20s',
          restEn: 'Rest: 20s',
          descriptionPt: 'Em quatro apoios com banda presa na mão e pé opostos. Estende simultaneamente braço e perna contrários sem oscilar a lombar.',
          descriptionEn: 'Quadruped position with band connecting opposite hand and foot. Simultaneously extend opposite arm and leg keeping core and spine rigid.',
          drawingKey: 'bird-dog-cross-band',
        },
      ],
    },
  ],
};

import { ALL_NINE_PLANS } from './generatedGymPlans';
import {
  ANAMNESE_PREVENTION_PLANS,
  DEFAULT_ANAMNESE_ASSIGNMENTS,
  isExcludedFromAutoPlans,
} from './anamnesePlans';

export { isExcludedFromAutoPlans };

export const INITIAL_MOBILITY_PLANS: MobilityPlan[] = [
  ...ANAMNESE_PREVENTION_PLANS,
  ...ALL_NINE_PLANS,
];

// Default assignments: Anamnese clinical assignments + Goalkeepers baseline mobility plan
export const DEFAULT_PLAN_ASSIGNMENTS: Record<string, AthletePlanAssignment> = {
  ...DEFAULT_ANAMNESE_ASSIGNMENTS,
  'pos_GR_mobilidade_pre_treino_gr': {
    id: 'pos_GR_mobilidade_pre_treino_gr',
    targetType: 'position',
    targetId: 'GR',
    targetName: 'Todas as Guarda-Redes (GR)',
    planId: 'mobilidade_pre_treino_gr',
    assignedAt: '2026-10-19T00:00:00.000Z',
    assignedBy: 'Sistema',
    active: true,
    notes: 'Plano base específico para a posição de Guarda-Redes antes do treino.',
  },
  'athlete_ath-2_mobilidade_pre_treino_gr': {
    id: 'athlete_ath-2_mobilidade_pre_treino_gr',
    targetType: 'athlete',
    targetId: 'ath-2',
    targetName: 'CAROL',
    planId: 'mobilidade_pre_treino_gr',
    assignedAt: '2026-10-19T00:00:00.000Z',
    assignedBy: 'Sistema',
    active: true,
    notes: 'Plano base específico para a posição de Guarda-Redes antes do treino.',
  },
  'athlete_ath-7_mobilidade_pre_treino_gr': {
    id: 'athlete_ath-7_mobilidade_pre_treino_gr',
    targetType: 'athlete',
    targetId: 'ath-7',
    targetName: 'LAURA PATRÍCIO',
    planId: 'mobilidade_pre_treino_gr',
    assignedAt: '2026-10-19T00:00:00.000Z',
    assignedBy: 'Sistema',
    active: true,
    notes: 'Plano base específico para a posição de Guarda-Redes antes do treino.',
  },
  'athlete_ath-9_mobilidade_pre_treino_gr': {
    id: 'athlete_ath-9_mobilidade_pre_treino_gr',
    targetType: 'athlete',
    targetId: 'ath-9',
    targetName: 'LUANA MACEDO',
    planId: 'mobilidade_pre_treino_gr',
    assignedAt: '2026-10-19T00:00:00.000Z',
    assignedBy: 'Sistema',
    active: true,
    notes: 'Plano base específico para a posição de Guarda-Redes antes do treino.',
  },
  'athlete_ath-26_mobilidade_pre_treino_gr': {
    id: 'athlete_ath-26_mobilidade_pre_treino_gr',
    targetType: 'athlete',
    targetId: 'ath-26',
    targetName: 'PAYTON',
    planId: 'mobilidade_pre_treino_gr',
    assignedAt: '2026-10-19T00:00:00.000Z',
    assignedBy: 'Sistema',
    active: true,
    notes: 'Plano base específico para a posição de Guarda-Redes antes do treino.',
  },
};

export const PLAN_HTML_MAP: Record<string, string> = {
  // Planos de Ginásio & Mobilidade Geral
  'competitivo_maquinas_pesos_livres': '/planos/plano_competitivo_maquinas_pesos_livres.html',
  'competitivo_ginasio_potencia': '/planos/plano_competitivo_forca_ginasio.html',
  'competitivo_ginasio_potencia_v2': '/planos/plano_competitivo_forca_ginasio_v2.html',
  'competitivo_ginasio_potencia_v3': '/planos/plano_competitivo_forca_ginasio_v3.html',
  'competitivo_ginasio_maquinas': '/planos/plano_competitivo_forca_ginasio_maquinas.html',
  'membros_superiores_pre_competitivo': '/planos/plano_superiores_forca_pre_competitivo.html',
  'forca_posterior_ginasio_controlo': '/planos/plano_forca_posterior_ginasio_sobrecarga.html',
  'alongamentos_lombar_15min': '/planos/plano_alongamentos_lombar_15min.html',
  'reforco_mobilidade_lombar_bandas': '/planos/plano_reforco_mobilidade_lombar_bandas.html',
  'joelho_posterior_casa': '/planos/plano_reforco_joelho_cadeia_posterior_casa.html',
  'tibiotarsica_banda_pt': '/planos/plano_tibiotarsica_banda_casa.html',
  'patelar_gemeos_pt': '/planos/plano_patelar_gemeos_md1.html',
  'adutores_quad_joelho_pt': '/planos/plano_adutores_joelho_md1.html',
  'mobilidade_pre_treino_gr': '/planos/plano_mobilidade_pre_treino_gr.html',
  'contusao_quadricep_estimulo_mi': '/planos/plano_contusao_quadricep_estimulo_mi.html',
  'reforco_joelho_hiperextensao_carlota': '/planos/plano_reforco_joelho_hiperextensao_carlota.html',
  'ativacao_maria_malta_bandas': '/planos/plano_ativacao_maria_malta_bandas.html',
  'ativacao_izzy_tendao_aquiles': '/planos/plano_ativacao_izzy_tendao_aquiles.html',
  'recuperacao_quadricep_casa_carol': '/planos/plano_recuperacao_quadricep_casa_carol.html',

  // Planos Preventivos Anamnese (Dossiês dedicados ou seção no dossiê global)
  'plan_indiv_ath-1_carlota': '/planos/plano_reforco_joelho_hiperextensao_carlota.html',
  'plan_indiv_ath-10_magui': '/planos/plano_individual_magui.html',
  'plan_indiv_ath-11_malta': '/planos/plano_ativacao_maria_malta_bandas.html',
  'plan_indiv_ath-28_izzy': '/planos/plano_ativacao_izzy_tendao_aquiles.html',
  'prev_joelho_lca_menisco': '/planos/plano_anamnese_preventivo_plantel.html#prev_joelho_lca_menisco',
  'prev_tornozelo_sindesmose_peroneais': '/planos/plano_anamnese_preventivo_plantel.html#prev_tornozelo_sindesmose_peroneais',
  'prev_isquios_quads_excentrico': '/planos/plano_anamnese_preventivo_plantel.html#prev_isquios_quads_excentrico',
  'prev_rotuliano_patelar_bipartida': '/planos/plano_rotuliano_gemelos_md1.html',
  'prev_adutores_virilha_copenhagen': '/planos/plano_adutores_joelho_md1.html',
  'prev_ombro_cotovelo_cervical': '/planos/plano_anamnese_preventivo_plantel.html#prev_ombro_cotovelo_cervical',
  'prev_core_anti_rotacao_extensao': '/planos/plano_reforco_mobilidade_lombar_bandas.html',
};

export function getPlanHtmlUrl(planId: string): string {
  if (PLAN_HTML_MAP[planId]) return PLAN_HTML_MAP[planId];
  if (planId.startsWith('plan_indiv_') || planId.startsWith('prev_')) {
    return '/planos/plano_anamnese_preventivo_plantel.html';
  }
  return '/planos/biblioteca_planos_gil_vicente_fc.html';
}

function enrichPlanWithHtml(plan: MobilityPlan): MobilityPlan {
  if (plan.htmlUrl) return plan;
  return { ...plan, htmlUrl: getPlanHtmlUrl(plan.id) };
}

export function getStoredMobilityPlans(): MobilityPlan[] {
  if (typeof window === 'undefined') return INITIAL_MOBILITY_PLANS.map(enrichPlanWithHtml);
  try {
    const raw = localStorage.getItem(MOBILITY_PLANS_KEY) ||
      localStorage.getItem('femperf_mobility_plans_v4') ||
      localStorage.getItem('femperf_mobility_plans_v3') ||
      localStorage.getItem('femperf_mobility_plans_v1');

    const planMap = new Map<string, MobilityPlan>();
    INITIAL_MOBILITY_PLANS.forEach((p) => planMap.set(p.id, enrichPlanWithHtml(p)));

    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.forEach((p: MobilityPlan) => {
          if (p && p.id && p.id !== 'mobility-gk-pre-training') {
            const existing = planMap.get(p.id);
            const merged = existing ? { ...p, ...existing } : p;
            planMap.set(p.id, enrichPlanWithHtml(merged));
          }
        });
      }
    }
    return Array.from(planMap.values());
  } catch {
    return INITIAL_MOBILITY_PLANS.map(enrichPlanWithHtml);
  }
}

export function saveMobilityPlan(plan: MobilityPlan): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getStoredMobilityPlans();
    const idx = current.findIndex((p) => p.id === plan.id);
    const updatedPlan = enrichPlanWithHtml({ ...plan, updatedAt: new Date().toISOString() });

    let updatedList: MobilityPlan[];
    if (idx !== -1) {
      updatedList = [...current];
      updatedList[idx] = updatedPlan;
    } else {
      updatedList = [...current, updatedPlan];
    }

    localStorage.setItem(MOBILITY_PLANS_KEY, JSON.stringify(updatedList));
    localStorage.setItem('femperf_mobility_plans_v5', JSON.stringify(updatedList));
    localStorage.setItem('femperf_mobility_plans_v4', JSON.stringify(updatedList));
    localStorage.setItem('femperf_mobility_plans_v3', JSON.stringify(updatedList));
    localStorage.setItem('femperf_mobility_plans_v1', JSON.stringify(updatedList));

    secureFetch('/api/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobilityPlans: updatedList }),
    }).catch(() => {});

    window.dispatchEvent(new Event('femperf_mobility_plans_updated'));
    window.dispatchEvent(new Event('femperf_credentials_updated'));
  } catch (e) {
    console.error('Erro ao guardar plano de mobilidade:', e);
  }
}

/**
 * Merges two assignment maps using timestamp (assignedAt) resolution.
 * The more recently assigned or modified item ALWAYS wins.
 */
export function mergeAssignments(
  older: Record<string, AthletePlanAssignment>,
  newer: Record<string, AthletePlanAssignment>
): Record<string, AthletePlanAssignment> {
  const result: Record<string, AthletePlanAssignment> = { ...older };
  for (const [key, item] of Object.entries(newer)) {
    if (!item) continue;
    const existing = result[key];
    if (!existing) {
      result[key] = item;
      continue;
    }
    const existingTime = existing.assignedAt ? new Date(existing.assignedAt).getTime() : 0;
    const incomingTime = item.assignedAt ? new Date(item.assignedAt).getTime() : 0;
    if (incomingTime >= existingTime) {
      result[key] = item;
    }
  }
  return result;
}

export function getStoredAthletePlanAssignments(): Record<string, AthletePlanAssignment> {
  if (typeof window === 'undefined') return { ...DEFAULT_PLAN_ASSIGNMENTS };
  try {
    let raw = localStorage.getItem(ATHLETE_PLAN_ASSIGNMENTS_KEY);
    if (!raw) raw = localStorage.getItem('femperf_athlete_plan_assignments_v7');
    if (!raw) raw = localStorage.getItem('femperf_athlete_plan_assignments_v6');
    if (!raw) raw = localStorage.getItem('femperf_athlete_plan_assignments_v5');
    if (!raw) raw = localStorage.getItem('femperf_athlete_plan_assignments_v4');
    if (!raw) raw = localStorage.getItem('femperf_athlete_plan_assignments_v3');
    if (!raw) raw = localStorage.getItem('femperf_athlete_plan_assignments_v1');

    if (!raw) return { ...DEFAULT_PLAN_ASSIGNMENTS };
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      // User modifications in localStorage take precedence over baseline defaults
      return mergeAssignments(DEFAULT_PLAN_ASSIGNMENTS, parsed);
    }
    return { ...DEFAULT_PLAN_ASSIGNMENTS };
  } catch {
    return { ...DEFAULT_PLAN_ASSIGNMENTS };
  }
}

export async function saveAthletePlanAssignments(assignments: Record<string, AthletePlanAssignment>): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    // 1. Immediately persist synchronously to client localStorage across all version keys
    localStorage.setItem(ATHLETE_PLAN_ASSIGNMENTS_KEY, JSON.stringify(assignments));
    localStorage.setItem('femperf_athlete_plan_assignments_v7', JSON.stringify(assignments));
    localStorage.setItem('femperf_athlete_plan_assignments_v6', JSON.stringify(assignments));
    localStorage.setItem('femperf_athlete_plan_assignments_v5', JSON.stringify(assignments));
    localStorage.setItem('femperf_athlete_plan_assignments_v4', JSON.stringify(assignments));
    localStorage.setItem('femperf_athlete_plan_assignments_v3', JSON.stringify(assignments));
    localStorage.setItem('femperf_athlete_plan_assignments_v1', JSON.stringify(assignments));

    window.dispatchEvent(new Event('femperf_mobility_plans_updated'));
    window.dispatchEvent(new Event('femperf_credentials_updated'));

    // 2. Persist to cloud server & Supabase
    const res = await secureFetch('/api/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ athletePlanAssignments: assignments }),
    });
    return res.ok;
  } catch (e) {
    console.error('Erro ao guardar atribuições de planos:', e);
    return false;
  }
}

/**
 * Automatically and bidirectionally synchronizes the entire mobility & gym library
 * with the cloud (/api/credentials & Supabase), ensuring:
 * 1. All canonical 53+ plans from the codebase exist in both cloud and client.
 * 2. Coach customizations and assignments are permanently preserved.
 * 3. Fresh cloud plans and assignments are immediately written to all storage versions.
 * 4. Events are broadcast to all components and devices in real-time.
 */
let isSyncingLibrary = false;
let lastSyncTimestamp = 0;

export async function syncMobilityLibraryWithCloud(force: boolean = false): Promise<{
  success: boolean;
  plansCount: number;
  assignmentsCount: number;
}> {
  if (typeof window === 'undefined') {
    return { success: false, plansCount: INITIAL_MOBILITY_PLANS.length, assignmentsCount: 0 };
  }

  // Throttle automatic background syncs to once every 10s unless forced
  const now = Date.now();
  if (!force && now - lastSyncTimestamp < 10000) {
    const plans = getStoredMobilityPlans();
    const asgns = getStoredAthletePlanAssignments();
    return { success: true, plansCount: plans.length, assignmentsCount: Object.keys(asgns).length };
  }

  if (isSyncingLibrary) {
    const plans = getStoredMobilityPlans();
    const asgns = getStoredAthletePlanAssignments();
    return { success: true, plansCount: plans.length, assignmentsCount: Object.keys(asgns).length };
  }

  isSyncingLibrary = true;
  lastSyncTimestamp = now;

  try {
    const res = await secureFetch(`/api/credentials?sync_plans=true&t=${now}`, {
      cache: 'no-store',
    });
    const json = await res.json();

    if (!json.success || !json.data) {
      isSyncingLibrary = false;
      const plans = getStoredMobilityPlans();
      const asgns = getStoredAthletePlanAssignments();
      return { success: false, plansCount: plans.length, assignmentsCount: Object.keys(asgns).length };
    }

    const cloudPlans: MobilityPlan[] = Array.isArray(json.data.mobilityPlans) ? json.data.mobilityPlans : [];
    const cloudAssignments: Record<string, AthletePlanAssignment> =
      typeof json.data.athletePlanAssignments === 'object' && json.data.athletePlanAssignments !== null
        ? json.data.athletePlanAssignments
        : {};

    // 1. Merge Plans: All INITIAL_MOBILITY_PLANS are seeded, enriched with HTML URL,
    // combined with any custom or cloud plans
    const planMap = new Map<string, MobilityPlan>();
    INITIAL_MOBILITY_PLANS.forEach((p) => planMap.set(p.id, enrichPlanWithHtml(p)));

    cloudPlans.forEach((cp) => {
      if (cp && cp.id && cp.id !== 'mobility-gk-pre-training') {
        const local = planMap.get(cp.id);
        const merged = local ? { ...cp, ...local } : cp;
        planMap.set(cp.id, enrichPlanWithHtml(merged));
      }
    });

    const mergedPlans = Array.from(planMap.values());

    // 2. Merge Assignments: DEFAULT_PLAN_ASSIGNMENTS -> cloudAssignments -> localAssignments
    // Timestamp resolution guarantees that recent user actions on this device are NEVER overwritten by stale cloud data!
    const localAssignments = getStoredAthletePlanAssignments();
    let mergedAssignments = mergeAssignments(DEFAULT_PLAN_ASSIGNMENTS, cloudAssignments);
    mergedAssignments = mergeAssignments(mergedAssignments, localAssignments);

    // 3. Save to all client storage keys
    localStorage.setItem(MOBILITY_PLANS_KEY, JSON.stringify(mergedPlans));
    localStorage.setItem('femperf_mobility_plans_v5', JSON.stringify(mergedPlans));
    localStorage.setItem('femperf_mobility_plans_v4', JSON.stringify(mergedPlans));
    localStorage.setItem('femperf_mobility_plans_v3', JSON.stringify(mergedPlans));
    localStorage.setItem('femperf_mobility_plans_v1', JSON.stringify(mergedPlans));

    localStorage.setItem(ATHLETE_PLAN_ASSIGNMENTS_KEY, JSON.stringify(mergedAssignments));
    localStorage.setItem('femperf_athlete_plan_assignments_v7', JSON.stringify(mergedAssignments));
    localStorage.setItem('femperf_athlete_plan_assignments_v6', JSON.stringify(mergedAssignments));
    localStorage.setItem('femperf_athlete_plan_assignments_v5', JSON.stringify(mergedAssignments));
    localStorage.setItem('femperf_athlete_plan_assignments_v4', JSON.stringify(mergedAssignments));
    localStorage.setItem('femperf_athlete_plan_assignments_v3', JSON.stringify(mergedAssignments));
    localStorage.setItem('femperf_athlete_plan_assignments_v1', JSON.stringify(mergedAssignments));

    // 4. If Cloud was lacking assignments or canonical plans, push back to Cloud
    const assignmentsDifferent = JSON.stringify(cloudAssignments) !== JSON.stringify(mergedAssignments);
    const cloudMissingPlans = cloudPlans.length < mergedPlans.length;

    if (assignmentsDifferent || cloudMissingPlans) {
      await secureFetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athletePlanAssignments: mergedAssignments,
        }),
      }).catch((e) => console.warn('Falha no auto-seed de atribuições para a nuvem:', e));
    }

    // 5. Broadcast update event so all UI components re-render immediately
    window.dispatchEvent(new Event('femperf_mobility_plans_updated'));
    window.dispatchEvent(new Event('femperf_credentials_updated'));

    isSyncingLibrary = false;
    return {
      success: true,
      plansCount: mergedPlans.length,
      assignmentsCount: Object.keys(mergedAssignments).length,
    };
  } catch (err) {
    console.warn('Erro ao sincronizar biblioteca de planos com a nuvem:', err);
    isSyncingLibrary = false;
    const plans = getStoredMobilityPlans();
    const asgns = getStoredAthletePlanAssignments();
    return { success: false, plansCount: plans.length, assignmentsCount: Object.keys(asgns).length };
  }
}

export function assignPlanToTarget(
  targetType: 'athlete' | 'position' | 'all',
  targetId: string,
  planId: string,
  targetName?: string,
  notes?: string
): void {
  const current = { ...getStoredAthletePlanAssignments() };
  const id = `${targetType}_${targetId}_${planId}`;
  current[id] = {
    id,
    targetType,
    targetId,
    targetName: targetName || targetId,
    planId,
    assignedAt: new Date().toISOString(),
    assignedBy: 'Treinador',
    active: true,
    notes,
  };
  saveAthletePlanAssignments(current);
}

export function unassignPlan(assignmentId: string): void {
  const current = { ...getStoredAthletePlanAssignments() };
  if (current[assignmentId]) {
    current[assignmentId].active = false;
    current[assignmentId].assignedAt = new Date().toISOString();
  }
  saveAthletePlanAssignments(current);
}

export function toggleAthletePlanAssignment(
  athleteId: string,
  athleteName: string,
  planId: string,
  forceState?: boolean
): Record<string, AthletePlanAssignment> {
  const current = { ...getStoredAthletePlanAssignments() };
  const id = `athlete_${athleteId}_${planId}`;

  let isCurrentlyActive = false;
  if (current[id] !== undefined) {
    isCurrentlyActive = Boolean(current[id].active);
  } else {
    const posActive = Boolean(current[`pos_GR_${planId}`]?.active) || Boolean(current[`pos_Campo_${planId}`]?.active);
    const allActive = Boolean(current[`all_all_${planId}`]?.active);
    isCurrentlyActive = posActive || allActive;
  }

  const nextActive = forceState !== undefined ? forceState : !isCurrentlyActive;
  const nowIso = new Date().toISOString();

  // If setting to inactive (removing), ensure ALL legacy/candidate keys for this athlete & plan are deactivated
  if (!nextActive) {
    const cleanUpper = (athleteName || '').trim().toUpperCase();
    for (const [key, asgn] of Object.entries(current)) {
      if (asgn && asgn.planId === planId && asgn.targetType === 'athlete') {
        const matchesTarget = asgn.targetId === athleteId ||
          (asgn.targetName && asgn.targetName.trim().toUpperCase() === cleanUpper);
        if (matchesTarget) {
          current[key] = {
            ...asgn,
            active: false,
            assignedAt: nowIso,
            assignedBy: 'Treinador',
          };
        }
      }
    }
  }

  current[id] = {
    id,
    targetType: 'athlete',
    targetId: athleteId,
    targetName: athleteName,
    planId,
    assignedAt: nowIso,
    assignedBy: 'Treinador',
    active: nextActive,
  };

  saveAthletePlanAssignments(current);
  return current;
}

export function togglePositionPlanAssignment(
  position: 'GR' | 'Campo',
  planId: string,
  athletesList: Athlete[],
  forceState?: boolean
): Record<string, AthletePlanAssignment> {
  const current = { ...getStoredAthletePlanAssignments() };
  const posKey = `pos_${position}_${planId}`;
  const isCurrentlyActive = Boolean(current[posKey]?.active);
  const nextActive = forceState !== undefined ? forceState : !isCurrentlyActive;
  const nowIso = new Date().toISOString();

  current[posKey] = {
    id: posKey,
    targetType: 'position',
    targetId: position,
    targetName: position === 'GR' ? 'Todas as Guarda-Redes (GR)' : 'Todas as Jogadoras de Campo',
    planId,
    assignedAt: nowIso,
    assignedBy: 'Treinador',
    active: nextActive,
  };

  athletesList.forEach((ath) => {
    const isThisPos = position === 'GR'
      ? (ath.position === 'GR' || isGoalkeeper(ath.name))
      : (ath.position !== 'GR' && !isGoalkeeper(ath.name));

    if (isThisPos) {
      const athKey = `athlete_${ath.id}_${planId}`;
      current[athKey] = {
        id: athKey,
        targetType: 'athlete',
        targetId: ath.id,
        targetName: ath.name,
        planId,
        assignedAt: nowIso,
        assignedBy: 'Treinador',
        active: nextActive,
      };
    }
  });

  saveAthletePlanAssignments(current);
  return current;
}

export function toggleAllSquadPlanAssignment(
  planId: string,
  athletesList: Athlete[],
  forceState?: boolean
): Record<string, AthletePlanAssignment> {
  const current = { ...getStoredAthletePlanAssignments() };
  const allKey = `all_all_${planId}`;
  const isCurrentlyActive = Boolean(current[allKey]?.active);
  const nextActive = forceState !== undefined ? forceState : !isCurrentlyActive;
  const nowIso = new Date().toISOString();

  current[allKey] = {
    id: allKey,
    targetType: 'all',
    targetId: 'all',
    targetName: 'Todo o Plantel (Campo + GR)',
    planId,
    assignedAt: nowIso,
    assignedBy: 'Treinador',
    active: nextActive,
  };

  athletesList.forEach((ath) => {
    const athKey = `athlete_${ath.id}_${planId}`;
    current[athKey] = {
      id: athKey,
      targetType: 'athlete',
      targetId: ath.id,
      targetName: ath.name,
      planId,
      assignedAt: nowIso,
      assignedBy: 'Treinador',
      active: nextActive,
    };
  });

  saveAthletePlanAssignments(current);
  return current;
}

export function getCandidateAthleteIds(athlete: Athlete | null): string[] {
  if (!athlete) return [];
  const ids = new Set<string>();
  if (athlete.id) {
    ids.add(athlete.id);
    ids.add(athlete.id.toLowerCase());
  }
  const cleanName = (athlete.name || '').trim().toUpperCase();
  if (cleanName === 'IZZY' || cleanName.includes('IZZY') || athlete.id === 'ath-28' || athlete.id === 'ath-custom-1790842877064') {
    ids.add('ath-28');
    ids.add('ath-custom-1790842877064');
    ids.add('IZZY');
    ids.add('izzy');
  }
  return Array.from(ids);
}

/**
 * Returns all active plans assigned to an athlete (direct athlete match, position match, or 'all').
 * The coach's deliberate assignment or removal ALWAYS takes absolute priority.
 */
export function getPlansForAthlete(athlete: Athlete | null): MobilityPlan[] {
  if (!athlete) return [];
  const allPlans = getStoredMobilityPlans();
  const assignments = getStoredAthletePlanAssignments();

  const isGk = athlete.position === 'GR' || (athlete.name ? isGoalkeeper(athlete.name) : false);
  const position = isGk ? 'GR' : 'Campo';
  const cleanName = (athlete.name || '').trim().toUpperCase();
  const candidateIds = getCandidateAthleteIds(athlete);
  const isIzzy = cleanName.includes('IZZY') || candidateIds.includes('ath-28') || candidateIds.includes('ath-custom-1790842877064');

  const seenIds = new Set<string>();

  const assignedPlans = allPlans.filter((plan) => {
    if (plan.id === 'mobility-gk-pre-training') return false;

    // 1. Check for deliberate explicit REMOVAL (active === false):
    // If the coach removed this plan for this athlete, it MUST NEVER BE RETURNED.
    let explicitlyDisabled = false;
    for (const candId of candidateIds) {
      const match = assignments[`athlete_${candId}_${plan.id}`];
      if (match !== undefined && match.active === false) {
        explicitlyDisabled = true;
        break;
      }
    }

    if (!explicitlyDisabled && cleanName) {
      for (const asgn of Object.values(assignments)) {
        if (
          asgn &&
          asgn.planId === plan.id &&
          asgn.targetType === 'athlete' &&
          asgn.active === false
        ) {
          const matchId = candidateIds.includes(asgn.targetId);
          const matchName = asgn.targetName && asgn.targetName.trim().toUpperCase() === cleanName;
          if (matchId || matchName) {
            explicitlyDisabled = true;
            break;
          }
        }
      }
    }

    if (explicitlyDisabled) {
      return false; // DELIBERATELY REMOVED BY COACH. Never show.
    }

    // 2. Check for deliberate explicit DIRECT ASSIGNMENT (active === true):
    let directActive = false;
    for (const candId of candidateIds) {
      const match = assignments[`athlete_${candId}_${plan.id}`];
      if (match !== undefined && match.active === true) {
        directActive = true;
        break;
      }
    }

    if (!directActive && cleanName) {
      for (const asgn of Object.values(assignments)) {
        if (
          asgn &&
          asgn.planId === plan.id &&
          asgn.targetType === 'athlete' &&
          asgn.active === true
        ) {
          const matchId = candidateIds.includes(asgn.targetId);
          const matchName = asgn.targetName && asgn.targetName.trim().toUpperCase() === cleanName;
          if (matchId || matchName) {
            directActive = true;
            break;
          }
        }
      }
    }

    if (directActive) {
      if (!seenIds.has(plan.id)) {
        seenIds.add(plan.id);
        return true;
      }
      return false;
    }

    // 3. Position assignment (e.g. Campo or GR):
    const posAsgn = assignments[`pos_${position}_${plan.id}`];
    if (posAsgn !== undefined && posAsgn.active === true) {
      if (!seenIds.has(plan.id)) {
        seenIds.add(plan.id);
        return true;
      }
      return false;
    }

    // 4. All-squad assignment:
    const allAsgn = assignments[`all_all_${plan.id}`];
    if (allAsgn !== undefined && allAsgn.active === true) {
      if (!seenIds.has(plan.id)) {
        seenIds.add(plan.id);
        return true;
      }
      return false;
    }

    return false;
  });

  // Fallback for Goalkeepers: Always ensure the GK mobility plan is included unless explicitly disabled
  if (isGk && !seenIds.has('mobilidade_pre_treino_gr')) {
    let directGkDisabled = false;
    for (const candId of candidateIds) {
      const direct = assignments[`athlete_${candId}_mobilidade_pre_treino_gr`];
      if (direct && direct.active === false) {
        directGkDisabled = true;
        break;
      }
    }
    if (!directGkDisabled) {
      const gkPlan = allPlans.find((p) => p.id === 'mobilidade_pre_treino_gr');
      if (gkPlan) {
        assignedPlans.unshift(gkPlan);
        seenIds.add(gkPlan.id);
      }
    }
  }

  // Prioritize dedicated individual plans so they always appear first and default selected!
  assignedPlans.sort((a, b) => {
    const aIsIzzy = isIzzy && (a.id === 'plan_indiv_ath-28_izzy' || a.id === 'ativacao_izzy_tendao_aquiles' || a.id.includes('izzy'));
    const bIsIzzy = isIzzy && (b.id === 'plan_indiv_ath-28_izzy' || b.id === 'ativacao_izzy_tendao_aquiles' || b.id.includes('izzy'));
    if (aIsIzzy && !bIsIzzy) return -1;
    if (!aIsIzzy && bIsIzzy) return 1;

    const aIsIndiv = a.id.startsWith('plan_indiv_') || candidateIds.some((cid) => a.id.includes(cid)) ? 1 : 0;
    const bIsIndiv = b.id.startsWith('plan_indiv_') || candidateIds.some((cid) => b.id.includes(cid)) ? 1 : 0;
    return bIsIndiv - aIsIndiv;
  });

  return assignedPlans;
}

/**
 * Daily completion tracking per athlete
 */
export function isMobilityCompletedToday(athleteId: string, planId: string, dateStr?: string): boolean {
  if (typeof window === 'undefined') return false;
  const dStr = dateStr || new Date().toISOString().split('T')[0];
  try {
    const raw = localStorage.getItem(MOBILITY_DAILY_COMPLETIONS_KEY);
    if (!raw) return false;
    const parsed: Record<string, boolean> = JSON.parse(raw);
    if (parsed[`${athleteId}_${planId}_${dStr}`]) return true;
    if (athleteId === 'ath-28' && parsed[`ath-custom-1790842877064_${planId}_${dStr}`]) return true;
    if (athleteId === 'ath-custom-1790842877064' && parsed[`ath-28_${planId}_${dStr}`]) return true;
    return false;
  } catch {
    return false;
  }
}

export function toggleMobilityCompletedToday(athleteId: string, planId: string, dateStr?: string): boolean {
  if (typeof window === 'undefined') return false;
  const dStr = dateStr || new Date().toISOString().split('T')[0];
  const key = `${athleteId}_${planId}_${dStr}`;
  try {
    const raw = localStorage.getItem(MOBILITY_DAILY_COMPLETIONS_KEY);
    const parsed: Record<string, boolean> = raw ? JSON.parse(raw) : {};
    const nextState = !parsed[key];
    if (nextState) {
      parsed[key] = true;
      if (athleteId === 'ath-28') parsed[`ath-custom-1790842877064_${planId}_${dStr}`] = true;
      if (athleteId === 'ath-custom-1790842877064') parsed[`ath-28_${planId}_${dStr}`] = true;
    } else {
      delete parsed[key];
      if (athleteId === 'ath-28') delete parsed[`ath-custom-1790842877064_${planId}_${dStr}`];
      if (athleteId === 'ath-custom-1790842877064') delete parsed[`ath-28_${planId}_${dStr}`];
    }
    localStorage.setItem(MOBILITY_DAILY_COMPLETIONS_KEY, JSON.stringify(parsed));
    window.dispatchEvent(new Event('femperf_mobility_completed'));
    return nextState;
  } catch {
    return false;
  }
}
