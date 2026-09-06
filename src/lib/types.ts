export interface Athlete {
  id: string;
  name: string;
  avatarUrl?: string;
  pin?: string;
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
  muscleFatigue: MuscleFatigueMap;
  needsPhysio: boolean;
  physioReason?: string;
  createdAt: string;
}

export interface RPEEntry {
  id: string;
  athleteId: string;
  athleteName: string;
  date: string;
  matchDayOffset?: MatchDayOffset;
  sessionDurationMin?: number;
  physicalDemand: number; // Borg CR10 (1-10)
  postFatigue: number; // 1-10
  muscleFatigue: MuscleFatigueMap;
  preWorkoutPlans: string[];
  comments?: string;
  createdAt: string;
}

export type HydrationStatus = 'Adequada' | 'Atenção' | 'Alerta';

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
  createdAt: string;
}

export interface TrainingDayConfig {
  date: string; // YYYY-MM-DD
  isTrainingDay: boolean;
  notes?: string;
}

export interface FailedDateDetail {
  date: string;
  missingWellness: boolean;
  missingRpe: boolean;
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
}

export type AthleteTrainingStatus = 'normal' | 'conditioned' | 'injured' | 'absent';

export interface AthleteSessionStatus {
  athleteId: string;
  athleteName: string;
  status: AthleteTrainingStatus;
  notes?: string;
}

export interface TrainingSessionInfo {
  date: string; // YYYY-MM-DD
  dayType: 'training' | 'match' | 'rest';
  matchDayOffset: MatchDayOffset;
  startTime?: string; // HH:mm (e.g. "10:00")
  endTime?: string; // HH:mm (e.g. "11:30")
  durationMin: number; // Calculated automatically from startTime and endTime
  tempStart?: number; // °C (e.g. 21.0)
  tempEnd?: number; // °C (e.g. 26.5)
  tempDelta?: number; // °C calculated automatically (tempEnd - tempStart)
  locationTime?: string;
  focusNotes?: string;
  athleteStatuses?: Record<string, AthleteSessionStatus>;
}
