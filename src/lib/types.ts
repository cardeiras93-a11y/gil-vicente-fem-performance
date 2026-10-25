export type AthletePosition = 'GR' | 'Campo';

export interface Athlete {
  id: string;
  name: string;
  position?: AthletePosition;
  jerseyNumber?: number | string;
  avatarUrl?: string;
  pin?: string;
  isActive?: boolean;
}

export type MenstrualCyclePhase =
  | 'Menstruação'
  | '1ª Semana após a menstruação'
  | '2ª Semana após a menstruação'
  | '3ª Semana após a menstruação'
  | 'Menstruação irregular';

export interface MuscleFatigueMap {
  [muscleGroup: string]: number; // 1 to 10
}

export type MatchDayOffset = 'MD-6' | 'MD-5' | 'MD-4' | 'MD-3' | 'MD-2' | 'MD-1' | 'MD' | 'MD+1' | 'MD+2';

export interface WellnessEntry {
  id: string;
  athleteId: string;
  athleteName: string;
  date: string;
  matchDayOffset?: MatchDayOffset;
  menstrualCycle: MenstrualCyclePhase;
  sleepQuality: number; // 1-5
  sleepDuration: number; // 1-5
  mood: number; // 1-5
  stress: number; // 1-5
  fatigue: number; // 1-5
  soreness: number; // 1-5
  heavyLegs: number; // 1-5
  wellnessTotal?: number; // Sum of the 7 variables (7 to 35)
  morningWeight?: number; // Morning body weight in kg
  muscleFatigue: MuscleFatigueMap;
  needsPhysio: boolean;
  physioReason?: string;
  isLate?: boolean;
  isAuthorizedLate?: boolean;
  approvalStatus?: SubmissionApprovalStatus;
  keepFine?: boolean; // When approved late: if true, fine remains; if false, fine is waived
  reviewedAt?: string;
  reviewedBy?: string;
  submittedAt?: string;
  createdAt: string;
}

export type SubmissionApprovalStatus = 'approved' | 'pending' | 'rejected';

export interface RPEEntry {
  id: string;
  athleteId: string;
  athleteName: string;
  date: string;
  matchDayOffset?: MatchDayOffset;
  sessionType?: 'field' | 'gym_lower'; // 'field' = treino de campo regular, 'gym_lower' = ginásio de equipa membros inferiores
  sessionDurationMin?: number;
  physicalDemand: number; // Borg CR10 (1-10)
  postFatigue: number; // 1-10
  muscleFatigue: MuscleFatigueMap;
  preWorkoutPlans: string[];
  comments?: string;
  isLate?: boolean;
  isAuthorizedLate?: boolean;
  approvalStatus?: SubmissionApprovalStatus;
  keepFine?: boolean; // When approved late: if true, fine remains; if false, fine is waived
  reviewedAt?: string;
  reviewedBy?: string;
  submittedAt?: string;
  createdAt: string;
}

export type HydrationStatus = 'Adequada' | 'Atenção' | 'Alerta' | 'Pendente';

export interface HydrationEntry {
  id: string;
  athleteId: string;
  athleteName: string;
  date: string;
  durationMin?: number;
  preWeight: number; // kg
  postWeight: number; // kg
  fluidsIntake: number; // Liters
  weightLoss: number; // kg
  dehydrationRate: number; // %
  status: HydrationStatus;
  refillNeededLiters: number; // L
  recommendation: string;
  biologicalImpact: string;
  preWeightTime?: string; // HH:mm or ISO timestamp when pre-weight was recorded
  postWeightTime?: string; // HH:mm or ISO timestamp when post-weight was recorded
  submittedAtPre?: string;
  submittedAtPost?: string;
  createdAt: string;
}

export interface TrainingDayConfig {
  date: string; // YYYY-MM-DD
  isTrainingDay: boolean;
  notes?: string;
}

export interface IndividualFineExemption {
  id: string; // e.g. `${athleteId}_${date}_${type}`
  athleteId: string;
  athleteName: string;
  date: string; // YYYY-MM-DD
  type: 'wellness' | 'rpe' | 'hydration' | 'all';
  reason?: string;
  waivedAt: string; // ISO date
}

export interface FailedDateDetail {
  date: string;
  missingWellness: boolean;
  wellnessReason?: 'not_submitted' | 'late_pending' | 'late_rejected' | 'late_approved_fined';
  missingRpe: boolean;
  rpeReason?: 'not_submitted' | 'late_pending' | 'late_rejected' | 'late_approved_fined';
  missingHydration: boolean;
  subtotalFines: number;
}

export interface AthleteComplianceReport {
  athleteId: string;
  athleteName: string;
  missingWellnessCount: number;
  missingRpeCount: number;
  missingHydrationCount: number;
  totalFails: number;
  totalFineEuros: number;
  failedDates: FailedDateDetail[];
  waivedFines?: IndividualFineExemption[];
}

export type AthleteTrainingStatus = 'normal' | 'conditioned' | 'injured' | 'absent';

export interface AthleteSessionStatus {
  athleteId: string;
  athleteName: string;
  status: AthleteTrainingStatus;
  notes?: string;
}

export interface ComplementaryWorkOptions {
  upperBody?: boolean; // Membros Superiores & Tronco
  lowerBody?: boolean; // Membros Inferiores (Força / Potência)
  core?: boolean; // Core & Estabilidade Lombo-Pélvica
  iceBath?: boolean; // Banho de Gelo / Crioterapia
  sauna?: boolean; // Sauna / Banhos de Contraste
  cardioSubmax?: boolean; // Cardio Submáximo Regenerativo (<120 bpm)
  mobility?: boolean; // Mobilidade Ativa & Flexibilidade
  foamRoller?: boolean; // Libertação Miofascial (Rolo de Espuma)
  injuryPrevention?: boolean; // Prevenção Específica Individual
}

export interface ComplementaryWorkConfig extends ComplementaryWorkOptions {
  notes?: string;
}

export interface TrainingSessionInfo {
  date: string; // YYYY-MM-DD
  dayType: 'training' | 'match' | 'rest';
  matchCategory?: 'friendly' | 'championship' | 'cup';
  matchDayOffset: MatchDayOffset;
  startTime?: string; // HH:mm (e.g. "09:00")
  endTime?: string; // HH:mm (e.g. "10:30")
  durationMin: number; // Calculated automatically from startTime and endTime
  tempStart?: number; // °C (e.g. 21.0)
  tempEnd?: number; // °C (e.g. 26.5)
  tempDelta?: number; // °C calculated automatically (tempEnd - tempStart)
  locationTime?: string;
  focusNotes?: string;
  complementaryWork?: ComplementaryWorkConfig; // Extra-training & recovery assignments
  athleteStatuses?: Record<string, AthleteSessionStatus>;
  customDeadline?: string; // General HH:mm override for this date's session
  customDeadlineWellness?: string; // Specific Wellness HH:mm override
  customDeadlineRpe?: string; // Specific PSE (RPE) HH:mm override
  updatedAt?: number; // Epoch timestamp (ms) of last modification
}

export interface QuestionnaireDeadlinesConfig {
  enabled: boolean;
  mode: 'fixed' | 'relative_to_session';
  // General fallbacks
  defaultRegularTime: string; // e.g. "08:15"
  defaultMatchTime: string; // e.g. "12:00"
  relativeMinutesBeforeSession: number; // e.g. 60
  strictBlock: boolean; // true: blocks submission; false: allows late with warning
  allowLateWithApproval?: boolean; // When true, late submissions are allowed but placed in 'pending' review for coach approval
  applyToWellness: boolean;
  applyToRpe: boolean;
  applyToHydration: boolean;

  // Specific per-questionnaire default settings:
  wellnessRegularTime?: string; // e.g. "08:15"
  wellnessMatchTime?: string; // e.g. "12:00"
  wellnessRelativeMinutesBefore?: number; // e.g. 60

  rpeRegularTime?: string; // e.g. "14:00"
  rpeMatchTime?: string; // e.g. "18:30"
  rpeRelativeMinutesAfter?: number; // e.g. 90 (minutes after session end)

  // Per-date custom deadlines:
  customDateDeadlines?: Record<string, string>; // legacy/general map of "YYYY-MM-DD" -> "HH:mm"
  customDateDeadlinesWellness?: Record<string, string>; // map of "YYYY-MM-DD" -> "HH:mm"
  customDateDeadlinesRpe?: Record<string, string>; // map of "YYYY-MM-DD" -> "HH:mm"

  // Special Admin authorizations for specific athletes to submit after the deadline:
  // Key format: athleteId (permanent) OR `${athleteId}_${date}` (date-specific)
  athleteLateAuthorizations?: Record<string, LateSubmissionAuthorization>;
}

export interface LateSubmissionAuthorization {
  athleteId: string;
  athleteName: string;
  date?: string; // YYYY-MM-DD. If omitted/empty, authorization applies to all dates (permanent)
  questionnaireType?: 'all' | 'wellness' | 'rpe' | 'hydration'; // default 'all'
  grantedAt: string; // ISO string
  grantedBy?: string; // e.g. "Admin"
  notes?: string;
}

export interface MobilityExercise {
  id: string;
  namePt: string;
  nameEn: string;
  seriesRepsPt: string; // e.g. "2x 8 reps / lado"
  seriesRepsEn: string; // e.g. "2x 8 reps / side"
  restPt: string; // e.g. "Repouso: 20s"
  restEn: string; // e.g. "Rest: 20s"
  descriptionPt: string;
  descriptionEn: string;
  drawingKey?: string; // e.g. "rotation-band-reach"
  imageSrc?: string; // e.g. "/exercises/squat_band_trunk_rotation_pro.svg"
}

export interface MobilityBlock {
  id: string;
  number: string; // e.g. "01", "02", "03", "04"
  titlePt: string;
  titleEn: string;
  durationMinutes: number; // e.g. 5
  durationTextPt?: string; // e.g. "10 MIN"
  durationTextEn?: string;
  exercises: MobilityExercise[];
}

export interface MobilityPlan {
  id: string;
  titlePt: string;
  titleEn: string;
  categoryPt: string;
  categoryEn: string;
  group?: 'superiores' | 'inferiores' | 'all' | string;
  groupBadgePt?: string;
  groupBadgeEn?: string;
  seasonLinePt?: string;
  seasonLineEn?: string;
  targetPosition?: 'GR' | 'Campo' | 'all' | string;
  durationMinutes: number;
  durationTextPt?: string;
  durationTextEn?: string;
  warmupPt: string;
  warmupEn: string;
  finisherPt: string;
  finisherEn: string;
  blocks: MobilityBlock[];
  updatedAt?: string;
}

export interface AthletePlanAssignment {
  id: string;
  targetType: 'athlete' | 'position' | 'all';
  targetId: string; // athleteId (e.g. 'ath-14') or position ('GR') or 'all'
  targetName?: string;
  planId: string;
  assignedAt: string;
  assignedBy?: string;
  active: boolean;
  notes?: string;
}
