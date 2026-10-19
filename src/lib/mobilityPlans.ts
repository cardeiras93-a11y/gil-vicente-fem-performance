import { MobilityPlan, AthletePlanAssignment, Athlete } from './types';
import { secureFetch } from './authGuard';
import { isGoalkeeper } from './data';

export const MOBILITY_PLANS_KEY = 'femperf_mobility_plans_v1';
export const ATHLETE_PLAN_ASSIGNMENTS_KEY = 'femperf_athlete_plan_assignments_v1';
export const MOBILITY_DAILY_COMPLETIONS_KEY = 'femperf_mobility_daily_completions_v1';

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

export const INITIAL_MOBILITY_PLANS: MobilityPlan[] = [
  ...ALL_NINE_PLANS,
  // Alias for backward compatibility
  {
    ...(ALL_NINE_PLANS.find((p) => p.id === 'mobilidade_pre_treino_gr') || DEFAULT_GK_MOBILITY_PLAN),
    id: 'mobility-gk-pre-training',
  },
];

// Default assignments: automatic link for all Goalkeepers
export const DEFAULT_PLAN_ASSIGNMENTS: Record<string, AthletePlanAssignment> = {
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
};

export function getStoredMobilityPlans(): MobilityPlan[] {
  if (typeof window === 'undefined') return INITIAL_MOBILITY_PLANS;
  try {
    const raw = localStorage.getItem(MOBILITY_PLANS_KEY);
    if (!raw) return INITIAL_MOBILITY_PLANS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const planMap = new Map<string, MobilityPlan>();
      INITIAL_MOBILITY_PLANS.forEach((p) => planMap.set(p.id, p));
      parsed.forEach((p: MobilityPlan) => {
        if (p && p.id) planMap.set(p.id, p);
      });
      return Array.from(planMap.values());
    }
    return INITIAL_MOBILITY_PLANS;
  } catch {
    return INITIAL_MOBILITY_PLANS;
  }
}

export function saveMobilityPlan(plan: MobilityPlan): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getStoredMobilityPlans();
    const idx = current.findIndex((p) => p.id === plan.id);
    const updatedPlan = { ...plan, updatedAt: new Date().toISOString() };

    let updatedList: MobilityPlan[];
    if (idx !== -1) {
      updatedList = [...current];
      updatedList[idx] = updatedPlan;
    } else {
      updatedList = [...current, updatedPlan];
    }

    localStorage.setItem(MOBILITY_PLANS_KEY, JSON.stringify(updatedList));

    // Push to cloud via credentials endpoint for guaranteed multi-device sync
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

export function getStoredAthletePlanAssignments(): Record<string, AthletePlanAssignment> {
  if (typeof window === 'undefined') return DEFAULT_PLAN_ASSIGNMENTS;
  try {
    const raw = localStorage.getItem(ATHLETE_PLAN_ASSIGNMENTS_KEY);
    if (!raw) return DEFAULT_PLAN_ASSIGNMENTS;
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
    return DEFAULT_PLAN_ASSIGNMENTS;
  } catch {
    return DEFAULT_PLAN_ASSIGNMENTS;
  }
}

export function saveAthletePlanAssignments(assignments: Record<string, AthletePlanAssignment>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ATHLETE_PLAN_ASSIGNMENTS_KEY, JSON.stringify(assignments));

    secureFetch('/api/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ athletePlanAssignments: assignments }),
    }).catch((err) => console.error('Erro ao sincronizar atribuições com nuvem:', err));

    window.dispatchEvent(new Event('femperf_mobility_plans_updated'));
    window.dispatchEvent(new Event('femperf_credentials_updated'));
  } catch (e) {
    console.error('Erro ao guardar atribuições de planos:', e);
  }
}

export function assignPlanToTarget(
  targetType: 'athlete' | 'position' | 'all',
  targetId: string,
  planId: string,
  targetName?: string,
  notes?: string
): void {
  const current = getStoredAthletePlanAssignments();
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
  const current = getStoredAthletePlanAssignments();
  if (current[assignmentId]) {
    current[assignmentId].active = false;
  }
  saveAthletePlanAssignments(current);
}

export function toggleAthletePlanAssignment(
  athleteId: string,
  athleteName: string,
  planId: string,
  forceState?: boolean
): boolean {
  const current = getStoredAthletePlanAssignments();
  const id = `athlete_${athleteId}_${planId}`;

  let isCurrentlyActive = false;
  if (current[id] !== undefined) {
    isCurrentlyActive = Boolean(current[id].active);
  } else {
    // If not set directly, check position or all
    const posActive = Boolean(current[`pos_GR_${planId}`]?.active) || Boolean(current[`pos_Campo_${planId}`]?.active);
    const allActive = Boolean(current[`all_all_${planId}`]?.active);
    isCurrentlyActive = posActive || allActive;
  }

  const nextActive = forceState !== undefined ? forceState : !isCurrentlyActive;

  current[id] = {
    id,
    targetType: 'athlete',
    targetId: athleteId,
    targetName: athleteName,
    planId,
    assignedAt: new Date().toISOString(),
    assignedBy: 'Treinador',
    active: nextActive,
  };

  saveAthletePlanAssignments(current);
  return nextActive;
}

export function togglePositionPlanAssignment(
  position: 'GR' | 'Campo',
  planId: string,
  athletesList: Athlete[],
  forceState?: boolean
): boolean {
  const current = getStoredAthletePlanAssignments();
  const posKey = `pos_${position}_${planId}`;
  const isCurrentlyActive = Boolean(current[posKey]?.active);
  const nextActive = forceState !== undefined ? forceState : !isCurrentlyActive;

  current[posKey] = {
    id: posKey,
    targetType: 'position',
    targetId: position,
    targetName: position === 'GR' ? 'Todas as Guarda-Redes (GR)' : 'Todas as Jogadoras de Campo',
    planId,
    assignedAt: new Date().toISOString(),
    assignedBy: 'Treinador',
    active: nextActive,
  };

  // Sync every athlete in that position so their individual checkboxes update consistently
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
        assignedAt: new Date().toISOString(),
        assignedBy: 'Treinador',
        active: nextActive,
      };
    }
  });

  saveAthletePlanAssignments(current);
  return nextActive;
}

export function toggleAllSquadPlanAssignment(
  planId: string,
  athletesList: Athlete[],
  forceState?: boolean
): boolean {
  const current = getStoredAthletePlanAssignments();
  const allKey = `all_all_${planId}`;
  const isCurrentlyActive = Boolean(current[allKey]?.active);
  const nextActive = forceState !== undefined ? forceState : !isCurrentlyActive;

  current[allKey] = {
    id: allKey,
    targetType: 'all',
    targetId: 'all',
    targetName: 'Todo o Plantel',
    planId,
    assignedAt: new Date().toISOString(),
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
      assignedAt: new Date().toISOString(),
      assignedBy: 'Treinador',
      active: nextActive,
    };
  });

  saveAthletePlanAssignments(current);
  return nextActive;
}

/**
 * Returns all active plans assigned to an athlete (direct athlete match, position match, or 'all').
 */
export function getPlansForAthlete(athlete: Athlete | null): MobilityPlan[] {
  if (!athlete) return [];
  const allPlans = getStoredMobilityPlans();
  const assignments = getStoredAthletePlanAssignments();

  const isGk = athlete.position === 'GR' || (athlete.name ? isGoalkeeper(athlete.name) : false);
  const position = isGk ? 'GR' : 'Campo';

  const seenIds = new Set<string>();

  return allPlans.filter((plan) => {
    if (plan.id === 'mobility-gk-pre-training') return false;

    // 1. Direct explicit athlete assignment takes priority
    const direct = assignments[`athlete_${athlete.id}_${plan.id}`];
    if (direct !== undefined) {
      if (direct.active && !seenIds.has(plan.id)) {
        seenIds.add(plan.id);
        return true;
      }
      return false; // Explicitly removed / unassigned by coach
    }

    // 2. Position assignment
    const posAsgn = assignments[`pos_${position}_${plan.id}`];
    if (posAsgn !== undefined && posAsgn.active) {
      if (!seenIds.has(plan.id)) {
        seenIds.add(plan.id);
        return true;
      }
      return false;
    }

    // 3. All-squad assignment
    const allAsgn = assignments[`all_all_${plan.id}`];
    if (allAsgn !== undefined && allAsgn.active) {
      if (!seenIds.has(plan.id)) {
        seenIds.add(plan.id);
        return true;
      }
      return false;
    }

    return false;
  });
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
    return Boolean(parsed[`${athleteId}_${planId}_${dStr}`]);
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
    } else {
      delete parsed[key];
    }
    localStorage.setItem(MOBILITY_DAILY_COMPLETIONS_KEY, JSON.stringify(parsed));
    window.dispatchEvent(new Event('femperf_mobility_completed'));
    return nextState;
  } catch {
    return false;
  }
}
