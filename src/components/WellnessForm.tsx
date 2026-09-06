import React, { useState } from 'react';
import { Athlete, MenstrualCyclePhase, MuscleFatigueMap, WellnessEntry } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';
import { MuscleFatigueSelector } from './MuscleFatigueSelector';
import { saveWellnessLocally } from '@/lib/storage';
import { HeartPulse, Moon, Sun, Smile, ShieldAlert, Zap, Stethoscope, Check, AlertCircle, ChevronDown, ChevronUp, Info } from 'lucide-react';

interface WellnessFormProps {
  activeAthlete: Athlete;
  onSubmitSuccess: () => void;
}

export const WellnessForm: React.FC<WellnessFormProps> = ({
  activeAthlete,
  onSubmitSuccess,
}) => {
  const { t } = useLanguage();
  const [menstrualCycle, setMenstrualCycle] = useState<MenstrualCyclePhase>(
    '2ª Semana após a menstruação'
  );
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [sleepDuration, setSleepDuration] = useState<number | null>(null);
  const [mood, setMood] = useState<number | null>(null);
  const [stress, setStress] = useState<number | null>(null);
  const [fatigue, setFatigue] = useState<number | null>(null);
  const [soreness, setSoreness] = useState<number | null>(null);
  const [heavyLegs, setHeavyLegs] = useState<number | null>(null);

  const [muscleFatigue, setMuscleFatigue] = useState<MuscleFatigueMap>({});
  const [needsPhysio, setNeedsPhysio] = useState<boolean>(false);
  const [physioReason, setPhysioReason] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // State to toggle full scale legend visibility per item
  const [expandedLegend, setExpandedLegend] = useState<{ [key: string]: boolean }>({});

  const toggleLegend = (key: string) => {
    setExpandedLegend((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (
      sleepQuality === null ||
      sleepDuration === null ||
      mood === null ||
      stress === null ||
      fatigue === null ||
      soreness === null ||
      heavyLegs === null
    ) {
      setError('Por favor seleciona todas as classificações de 1 a 5 antes de submeter.');
      return;
    }

    if (needsPhysio && !physioReason.trim()) {
      setError('Por favor indica o motivo da ida à fisioterapia.');
      return;
    }

    setIsSubmitting(true);

    const today = new Date().toISOString().split('T')[0];
    const newEntry: WellnessEntry = {
      id: `wel-${Date.now()}`,
      athleteId: activeAthlete.id,
      athleteName: activeAthlete.name,
      date: today,
      menstrualCycle,
      sleepQuality,
      sleepDuration,
      mood,
      stress,
      fatigue,
      soreness,
      heavyLegs,
      wellnessTotal: sleepQuality + sleepDuration + mood + stress + fatigue + soreness + heavyLegs,
      muscleFatigue,
      needsPhysio,
      physioReason: needsPhysio ? physioReason.trim() : undefined,
      createdAt: new Date().toISOString(),
    };

    try {
      await fetch('/api/wellness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry),
      });

      fetch('/api/sync-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'wellness', entry: newEntry }),
      }).catch(() => {});

      saveWellnessLocally(newEntry);
      setIsSubmitting(false);
      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        onSubmitSuccess();
      }, 1800);
    } catch (err) {
      console.warn('Falha no envio API. Guardado localmente.');
      saveWellnessLocally(newEntry);
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onSubmitSuccess();
      }, 1800);
    }
  };

  // Helper for 1-5 circular touch rating with FULL SCALE LEGEND
  const renderRatingGroup = (
    label: string,
    descriptorsKey: keyof typeof t.wellness.descriptors1to5,
    value: number | null,
    onChange: (val: number) => void,
    icon: React.ReactNode
  ) => {
    const descriptors = t.wellness.descriptors1to5[descriptorsKey];
    const currentDescriptor = value !== null && descriptors ? descriptors[(value - 1) as 0 | 1 | 2 | 3 | 4] : 'Seleciona um valor de 1 a 5';
    const isLegendOpen = Boolean(expandedLegend[label]);

    return (
      <div className="space-y-2.5 rounded-xl border border-dark-border bg-dark-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-200">
            {icon}
            <span className="text-sm font-bold">{label}</span>
          </div>
          <span className="text-xs font-extrabold text-brand-lime bg-slate-900 px-2.5 py-0.5 rounded-full border border-brand-lime/30">
            {value !== null ? `${value} / 5` : '- / 5'}
          </span>
        </div>

        {/* 5 Circular touch buttons */}
        <div className="grid grid-cols-5 gap-2 pt-1">
          {[1, 2, 3, 4, 5].map((score) => {
            const isSelected = value === score;
            return (
              <button
                key={score}
                type="button"
                onClick={() => onChange(score)}
                className={`h-12 rounded-xl text-base font-extrabold transition-all active:scale-95 flex items-center justify-center ${
                  isSelected
                    ? score <= 2
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 ring-2 ring-rose-300 scale-105'
                      : score === 3
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/40 ring-2 ring-amber-300 scale-105'
                      : 'bg-brand-lime text-slate-950 shadow-lg shadow-brand-lime/40 ring-2 ring-brand-limeHover scale-105'
                    : 'bg-dark-surface/80 text-slate-300 border border-slate-700/60 hover:bg-slate-700'
                }`}
              >
                {score}
              </button>
            );
          })}
        </div>

        {/* Active Selected Level Box */}
        <div
          className={`rounded-xl border p-2.5 text-xs font-extrabold transition-all ${
            value === null
              ? 'border-slate-700/50 bg-slate-900/40 text-slate-400 italic'
              : value <= 2
              ? 'border-rose-500/40 bg-rose-950/30 text-rose-300'
              : value === 3
              ? 'border-amber-500/40 bg-amber-950/30 text-amber-300'
              : 'border-brand-lime/40 bg-lime-950/20 text-brand-lime'
          }`}
        >
          {currentDescriptor}
        </div>

        {/* Toggleable Full Scale Legend (1 a 5) */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => toggleLegend(label)}
            className="flex items-center space-x-1 text-[11px] font-bold text-slate-400 hover:text-slate-200 transition-all"
          >
            <Info className="h-3.5 w-3.5 text-brand-lime" />
            <span>{isLegendOpen ? 'Ocultar Escala (1 a 5)' : t.wellness.scaleLegendTitle}</span>
            {isLegendOpen ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
          </button>

          {isLegendOpen && descriptors && (
            <div className="mt-2 space-y-1 rounded-xl bg-dark-bg/90 p-3 border border-slate-800 text-[11px] font-semibold animate-fade-in">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`py-1 px-2 rounded-lg transition-all ${
                    value === s
                      ? 'bg-slate-800 text-brand-lime font-bold border-l-2 border-brand-lime'
                      : 'text-slate-300'
                  }`}
                >
                  {descriptors[s - 1]}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 rounded-2xl border border-brand-lime/40 bg-dark-card p-8 text-center shadow-xl animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-lime text-slate-950 shadow-lg shadow-brand-lime/30">
          <Check className="h-8 w-8 stroke-[3]" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-100">{t.wellness.successMessage}</h3>
        <p className="text-xs text-slate-300">
          {activeAthlete.name}
        </p>
      </div>
    );
  }

  const menstrualPhasesOptions = [
    t.wellness.menstrualPhases.menstruation,
    t.wellness.menstrualPhases.week1,
    t.wellness.menstrualPhases.week2,
    t.wellness.menstrualPhases.week3,
    t.wellness.menstrualPhases.irregular,
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-8">
      {/* Active Athlete Welcome Banner */}
      <div className="rounded-xl border border-brand-lime/30 bg-gradient-to-r from-dark-card to-dark-surface p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-brand-lime">
              {t.wellness.title}
            </span>
            <h2 className="text-lg font-black text-slate-100">{activeAthlete.name}</h2>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {new Date().toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* 1. Ciclo Menstrual */}
      <div className="space-y-3 rounded-xl border border-dark-border bg-dark-card p-4 shadow-sm">
        <div className="flex items-center space-x-2 text-slate-200">
          <HeartPulse className="h-5 w-5 text-rose-400" />
          <h3 className="text-sm font-bold">{t.wellness.menstrualCycleTitle}</h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {menstrualPhasesOptions.map((phase) => {
            const isSelected = menstrualCycle === phase;
            return (
              <button
                key={phase}
                type="button"
                onClick={() => setMenstrualCycle(phase as MenstrualCyclePhase)}
                className={`rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-rose-500 text-white font-extrabold shadow-md shadow-rose-500/30 ring-1 ring-rose-400 scale-105'
                    : 'bg-dark-surface text-slate-300 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                {phase}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Escalas de Bem-Estar Geral */}
      <div className="space-y-3">
        {renderRatingGroup(
          t.wellness.sleepQuality,
          'sleepQuality',
          sleepQuality,
          setSleepQuality,
          <Moon className="h-4 w-4 text-indigo-400" />
        )}

        {renderRatingGroup(
          t.wellness.sleepDuration,
          'sleepDuration',
          sleepDuration,
          setSleepDuration,
          <Sun className="h-4 w-4 text-amber-400" />
        )}

        {renderRatingGroup(
          t.wellness.mood,
          'mood',
          mood,
          setMood,
          <Smile className="h-4 w-4 text-emerald-400" />
        )}

        {renderRatingGroup(
          t.wellness.stress,
          'stress',
          stress,
          setStress,
          <ShieldAlert className="h-4 w-4 text-cyan-400" />
        )}

        {renderRatingGroup(
          t.wellness.fatigue,
          'fatigue',
          fatigue,
          setFatigue,
          <Zap className="h-4 w-4 text-brand-lime" />
        )}

        {renderRatingGroup(
          t.wellness.soreness,
          'soreness',
          soreness,
          setSoreness,
          <HeartPulse className="h-4 w-4 text-orange-400" />
        )}

        {renderRatingGroup(
          t.wellness.heavyLegs,
          'heavyLegs',
          heavyLegs,
          setHeavyLegs,
          <Zap className="h-4 w-4 text-purple-400" />
        )}
      </div>

      {/* 3. Fadiga Específica por Grupo Muscular */}
      <MuscleFatigueSelector value={muscleFatigue} onChange={setMuscleFatigue} />

      {/* 4. Encaminhamento para Fisioterapia */}
      <div className="space-y-3 rounded-xl border border-dark-border bg-dark-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-200">
            <Stethoscope className="h-5 w-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold">{t.wellness.physioTitle}</h3>
              <p className="text-[11px] text-slate-400">{t.wellness.physioQuestion}</p>
            </div>
          </div>

          <div className="flex rounded-lg bg-dark-bg p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => setNeedsPhysio(false)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                !needsPhysio
                  ? 'bg-slate-700 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.wellness.no}
            </button>
            <button
              type="button"
              onClick={() => setNeedsPhysio(true)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                needsPhysio
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.wellness.yes}
            </button>
          </div>
        </div>

        {needsPhysio && (
          <div className="space-y-1.5 pt-2 animate-fade-in">
            <label className="block text-xs font-bold text-rose-300">
              {t.wellness.physioTitle} *
            </label>
            <textarea
              required
              rows={2}
              placeholder={t.wellness.physioReasonPlaceholder}
              value={physioReason}
              onChange={(e) => setPhysioReason(e.target.value)}
              className="w-full rounded-xl border border-rose-500/50 bg-dark-bg p-3 text-xs font-medium text-slate-100 placeholder-slate-500 focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center space-x-2 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs font-semibold text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-gradient-to-r from-brand-lime to-emerald-400 py-4 text-sm font-extrabold text-slate-950 shadow-xl shadow-brand-lime/25 hover:from-brand-limeHover hover:to-emerald-500 active:scale-98 transition-all disabled:opacity-50"
      >
        {isSubmitting ? t.wellness.submitting : t.wellness.submit}
      </button>
    </form>
  );
};
