import React, { useState, useEffect } from 'react';
import { Athlete, MenstrualCyclePhase, MuscleFatigueMap, WellnessEntry, HydrationEntry } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';
import { MuscleFatigueSelector } from './MuscleFatigueSelector';
import { saveWellnessLocally, getWellnessLocally, saveHydrationLocally, getHydrationLocally, isSubmissionPastDeadline } from '@/lib/storage';
import { secureFetch } from '@/lib/authGuard';
import { normalizeMenstrualCycleToPortuguese, translateTextToPortuguese } from '@/lib/translationUtils';
import { HeartPulse, Moon, Sun, Smile, ShieldAlert, Zap, Stethoscope, Check, AlertCircle, ChevronDown, ChevronUp, Info, Lock, Clock, AlertTriangle, CheckCircle2, Scale, Sparkles, RefreshCw } from 'lucide-react';

interface WellnessFormProps {
  activeAthlete: Athlete;
  onSubmitSuccess: () => void;
}

export const WellnessForm: React.FC<WellnessFormProps> = ({
  activeAthlete,
  onSubmitSuccess,
}) => {
  const { t } = useLanguage();
  const [menstrualCycle, setMenstrualCycle] = useState<MenstrualCyclePhase | null>(null);
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
  const [allowEdit, setAllowEdit] = useState<boolean>(false);

  // State to toggle full scale legend visibility per item
  const [expandedLegend, setExpandedLegend] = useState<{ [key: string]: boolean }>({});

  const todayStr = new Date().toISOString().split('T')[0];
  const localEntries = getWellnessLocally(activeAthlete.id);
  const existingToday = localEntries.find((e) => e.date === todayStr);

  const [deadlineCheck, setDeadlineCheck] = useState(() =>
    isSubmissionPastDeadline(todayStr, 'wellness', activeAthlete.id)
  );

  const [submittedLateNotice, setSubmittedLateNotice] = useState<{
    deadlineTime: string;
  } | null>(null);

  // Morning Weight state
  const [morningWeight, setMorningWeight] = useState<string>('62.5');
  const [todayHydration, setTodayHydration] = useState<HydrationEntry | null>(null);
  const [quickWeightFeedback, setQuickWeightFeedback] = useState<string | null>(null);
  const [isSavingQuickWeight, setIsSavingQuickWeight] = useState<boolean>(false);

  const syncHydrationWeight = () => {
    const hydEntries = getHydrationLocally(activeAthlete.id);
    const todayH = hydEntries.find((h) => h.date === todayStr);
    setTodayHydration(todayH || null);

    if (todayH && Number(todayH.preWeight) > 0) {
      setMorningWeight(todayH.preWeight.toString());
    } else if (existingToday?.morningWeight) {
      setMorningWeight(existingToday.morningWeight.toString());
    } else if (hydEntries.length > 0 && Number(hydEntries[0].preWeight) > 0) {
      setMorningWeight(hydEntries[0].preWeight.toString());
    } else {
      setMorningWeight('62.5');
    }
  };

  useEffect(() => {
    syncHydrationWeight();
    secureFetch(`/api/hydration?athleteId=${activeAthlete.id}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && Array.isArray(resData.data) && resData.data.length > 0) {
          resData.data.forEach((item: HydrationEntry) => {
            saveHydrationLocally(item);
          });
          syncHydrationWeight();
        }
      })
      .catch(() => {});
  }, [activeAthlete.id, todayStr]);

  const adjustWeight = (delta: number) => {
    const current = parseFloat((morningWeight || '62.0').replace(',', '.')) || 62.0;
    const updated = Math.max(30, Number((current + delta).toFixed(2)));
    setMorningWeight(updated.toString());
  };

  const saveMorningWeightToHydration = async (weightVal: number) => {
    if (!weightVal || weightVal <= 0) return null;
    const nowIso = new Date().toISOString();
    const hydEntries = getHydrationLocally(activeAthlete.id);
    const existingH = hydEntries.find((h) => h.date === todayStr);

    const partialEntry: HydrationEntry = {
      id: existingH?.id || `hyd-${todayStr}-${activeAthlete.id}`,
      athleteId: activeAthlete.id,
      athleteName: activeAthlete.name,
      date: todayStr,
      durationMin: existingH?.durationMin || 90,
      preWeight: weightVal,
      postWeight: existingH?.postWeight || 0,
      fluidsIntake: existingH?.fluidsIntake || 0,
      weightLoss: existingH?.weightLoss || 0,
      dehydrationRate: existingH?.dehydrationRate || 0,
      status: existingH?.status || 'Pendente',
      refillNeededLiters: existingH?.refillNeededLiters || 0,
      recommendation: existingH?.recommendation || 'Peso Matinal / Pré-Treino registado. Conclui no final do treino.',
      biologicalImpact: existingH?.biologicalImpact || 'Aguardando pesagem pós-treino',
      preWeightTime: existingH?.preWeightTime || existingH?.submittedAtPre || nowIso,
      submittedAtPre: existingH?.submittedAtPre || existingH?.preWeightTime || nowIso,
      postWeightTime: existingH?.postWeightTime || undefined,
      submittedAtPost: existingH?.submittedAtPost || undefined,
      createdAt: existingH?.createdAt || nowIso,
    };

    saveHydrationLocally(partialEntry);

    try {
      await secureFetch('/api/hydration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partialEntry),
      });
    } catch {}

    try {
      secureFetch('/api/sync-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'hydration_pre', entry: partialEntry }),
      }).catch(() => {});
    } catch {}

    setTodayHydration(partialEntry);
    return partialEntry;
  };

  useEffect(() => {
    const updateCheck = () => {
      setDeadlineCheck(isSubmissionPastDeadline(todayStr, 'wellness', activeAthlete.id));
    };
    updateCheck();
    const interval = setInterval(updateCheck, 10000);
    window.addEventListener('femperf_credentials_updated', updateCheck);
    window.addEventListener('femperf_data_updated', updateCheck);
    return () => {
      clearInterval(interval);
      window.removeEventListener('femperf_credentials_updated', updateCheck);
      window.removeEventListener('femperf_data_updated', updateCheck);
    };
  }, [todayStr, activeAthlete.id]);

  const handleEditClick = () => {
    if (existingToday) {
      setMenstrualCycle((existingToday.menstrualCycle as MenstrualCyclePhase) || null);
      setSleepQuality(existingToday.sleepQuality ?? null);
      setSleepDuration(existingToday.sleepDuration ?? null);
      setMood(existingToday.mood ?? null);
      setStress(existingToday.stress ?? null);
      setFatigue(existingToday.fatigue ?? null);
      setSoreness(existingToday.soreness ?? null);
      setHeavyLegs(existingToday.heavyLegs ?? null);
      setMuscleFatigue(existingToday.muscleFatigue || {});
      setNeedsPhysio(!!existingToday.needsPhysio);
      setPhysioReason(existingToday.physioReason || '');
      if (todayHydration?.preWeight) {
        setMorningWeight(todayHydration.preWeight.toString());
      } else if (existingToday.morningWeight) {
        setMorningWeight(existingToday.morningWeight.toString());
      }
    }
    setAllowEdit(true);
  };

  const toggleLegend = (key: string) => {
    setExpandedLegend((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (
      menstrualCycle === null ||
      sleepQuality === null ||
      sleepDuration === null ||
      mood === null ||
      stress === null ||
      fatigue === null ||
      soreness === null ||
      heavyLegs === null
    ) {
      setError('Por favor seleciona a fase do ciclo menstrual e todas as classificações de 1 a 5 antes de submeter.');
      return;
    }

    if (needsPhysio && !physioReason.trim()) {
      setError('Por favor indica o motivo da ida à fisioterapia.');
      return;
    }

    setIsSubmitting(true);

    const today = new Date().toISOString().split('T')[0];
    const normalizedCycle = normalizeMenstrualCycleToPortuguese(menstrualCycle);
    const translatedReason = needsPhysio && physioReason.trim() ? translateTextToPortuguese(physioReason.trim()) : undefined;

    const currentDeadlineCheck = isSubmissionPastDeadline(today, 'wellness', activeAthlete.id);
    if (currentDeadlineCheck.hasDeadline && currentDeadlineCheck.isPast && currentDeadlineCheck.strictBlock) {
      setError(`O horário limite (${currentDeadlineCheck.deadlineTime}) já expirou hoje. A submissão está bloqueada pela equipa técnica.`);
      setIsSubmitting(false);
      return;
    }
    const isLate = currentDeadlineCheck.hasDeadline && currentDeadlineCheck.isPast;

    const parsedWeight = parseFloat((morningWeight || '').replace(',', '.'));
    const validWeight = !isNaN(parsedWeight) && parsedWeight > 0 ? parsedWeight : undefined;

    if (validWeight) {
      await saveMorningWeightToHydration(validWeight);
    }

    const newEntry: WellnessEntry = {
      id: existingToday ? existingToday.id : `wel-${Date.now()}`,
      athleteId: activeAthlete.id,
      athleteName: activeAthlete.name,
      date: today,
      menstrualCycle: normalizedCycle,
      sleepQuality,
      sleepDuration,
      mood,
      stress,
      fatigue,
      soreness,
      heavyLegs,
      wellnessTotal: sleepQuality + sleepDuration + mood + stress + fatigue + soreness + heavyLegs,
      morningWeight: validWeight,
      muscleFatigue,
      needsPhysio,
      isLate: existingToday ? (existingToday.isLate || isLate) : (isLate || undefined),
      isAuthorizedLate: currentDeadlineCheck.isAuthorizedLate,
      approvalStatus: currentDeadlineCheck.isAuthorizedLate
        ? 'approved'
        : (currentDeadlineCheck.requireApproval ? 'pending' : (existingToday?.approvalStatus || 'approved')),
      submittedAt: existingToday?.submittedAt || new Date().toISOString(),
      createdAt: existingToday?.createdAt || new Date().toISOString(),
    };

    const isLatePending = Boolean(currentDeadlineCheck.requireApproval);
    if (isLatePending) {
      setSubmittedLateNotice({ deadlineTime: currentDeadlineCheck.deadlineTime });
    } else {
      setSubmittedLateNotice(null);
    }

    const redirectDelay = isLatePending ? 4500 : 1800;

    try {
      await secureFetch('/api/wellness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry),
      });

      secureFetch('/api/sync-sheets', {
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
      }, redirectDelay);
    } catch (err) {
      console.warn('Falha no envio API. Guardado localmente.');
      saveWellnessLocally(newEntry);
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onSubmitSuccess();
      }, redirectDelay);
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
      <div className="flex flex-col items-center justify-center space-y-4 rounded-2xl border border-brand-lime/40 bg-dark-card p-6 sm:p-8 text-center shadow-xl animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-lime text-slate-950 shadow-lg shadow-brand-lime/30">
          <Check className="h-8 w-8 stroke-[3]" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-100">{t.wellness.successMessage}</h3>
        <p className="text-xs text-slate-300">
          {activeAthlete.name}
        </p>

        {submittedLateNotice && (
          <div className="mt-2 w-full max-w-sm rounded-xl bg-amber-500/15 border border-amber-500/40 p-4 text-left space-y-2.5 animate-fade-in shadow-md">
            <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs">
              <Clock className="h-4 w-4 shrink-0 text-amber-400" />
              <span>Aviso: Submissão Fora de Horas</span>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              O questionário foi submetido após a hora limite ({submittedLateNotice.deadlineTime}). De acordo com o regulamento de equipa, o registo foi assinalado por atraso.
            </p>
            <p className="text-[11px] text-amber-200/80 leading-relaxed">
              A tua submissão ficou a aguardar validação da equipa técnica, que irá analisar a situação.
            </p>
            <button
              type="button"
              onClick={() => {
                setIsSuccess(false);
                onSubmitSuccess();
              }}
              className="w-full mt-1 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors cursor-pointer"
            >
              Compreendi
            </button>
          </div>
        )}
      </div>
    );
  }

  if (existingToday && !allowEdit) {
    return (
      <div className="rounded-2xl border border-emerald-500/40 bg-dark-card p-6 shadow-xl space-y-5 animate-fade-in">
        <div className="flex items-center space-x-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Check className="h-6 w-6 stroke-[3]" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
              Wellness Concluído Hoje
            </span>
            <h2 className="text-lg font-black text-slate-100">{activeAthlete.name}</h2>
          </div>
        </div>

        <div className="rounded-xl bg-slate-900/80 p-4 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Data de registo:</span>
            <span className="font-bold text-slate-200">{existingToday.date}</span>
          </div>
          {existingToday.submittedAt && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Hora de submissão:</span>
              <span className="font-bold text-slate-200">
                {new Date(existingToday.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Pontuação Total:</span>
            <span className="font-black text-brand-lime text-base">
              {existingToday.wellnessTotal} / 35
            </span>
          </div>
          {existingToday.approvalStatus === 'pending' ? (
            <div className="rounded-xl bg-amber-500/15 border border-amber-500/40 p-3 space-y-1.5 text-xs text-amber-200">
              <div className="flex items-center space-x-2 text-amber-300 font-bold">
                <Clock className="h-4 w-4 text-amber-400 shrink-0 animate-pulse" />
                <span>Submissão Fora de Horas • Aguarda Validação</span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                Preencheste este questionário após o horário limite. A submissão ficou registada fora de horas e a equipa técnica irá analisar o teu envio.
              </p>
            </div>
          ) : existingToday.approvalStatus === 'rejected' ? (
            <div className="rounded-xl bg-rose-500/15 border border-rose-500/40 p-3 space-y-1.5 text-xs text-rose-200">
              <div className="flex items-center space-x-2 text-rose-300 font-bold">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>Submissão Não Aceite pela Equipa Técnica</span>
              </div>
              <p className="text-[11px] text-rose-200/90 leading-relaxed">
                A submissão fora de horas não foi aceite pela equipa técnica e ficou registada como não conforme.
              </p>
            </div>
          ) : existingToday.isAuthorizedLate ? (
            <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/40 p-3 space-y-1.5 text-xs text-emerald-200">
              <div className="flex items-center space-x-2 text-emerald-300 font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Autorização Especial de Submissão</span>
              </div>
              <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                Submetido com autorização prévia da equipa técnica.
              </p>
            </div>
          ) : existingToday.isLate ? (
            <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/40 p-3 space-y-1.5 text-xs text-emerald-200">
              <div className="flex items-center space-x-2 text-emerald-300 font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Submissão Aprovada pela Equipa Técnica</span>
              </div>
              <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                A tua submissão fora de horas foi validada com sucesso pela equipa técnica.
              </p>
            </div>
          ) : null}
        </div>

        {/* Card Dedicado de Registo / Atualização do Peso Matinal */}
        <div className="rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 via-dark-surface to-dark-card p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Scale className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                  Peso Matinal de Hoje ({todayStr})
                </span>
                <h4 className="text-xs font-bold text-slate-200">
                  {todayHydration && Number(todayHydration.preWeight) > 0
                    ? `Peso registado: ${todayHydration.preWeight} kg`
                    : 'Ainda não registaste o peso matinal hoje'}
                </h4>
              </div>
            </div>

            {todayHydration && Number(todayHydration.preWeight) > 0 ? (
              <span className="text-xs font-black text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
                ✅ {todayHydration.preWeight} kg
              </span>
            ) : (
              <span className="text-xs font-black text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-500/30 animate-pulse">
                ⚠️ Pendente
              </span>
            )}
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => adjustWeight(-0.5)}
                className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-black text-slate-300 hover:bg-slate-700 active:scale-95"
              >
                -0.5
              </button>
              <button
                type="button"
                onClick={() => adjustWeight(-0.1)}
                className="rounded-xl bg-slate-800 px-2.5 py-2 text-xs font-black text-slate-300 hover:bg-slate-700 active:scale-95"
              >
                -0.1
              </button>
              <input
                type="text"
                inputMode="decimal"
                value={morningWeight}
                onChange={(e) => setMorningWeight(e.target.value)}
                placeholder="62.5"
                className="w-full text-center rounded-xl border border-cyan-500/40 bg-dark-bg p-2.5 text-lg font-black text-cyan-300 focus:border-cyan-400 focus:outline-none tracking-wider"
              />
              <button
                type="button"
                onClick={() => adjustWeight(0.1)}
                className="rounded-xl bg-slate-800 px-2.5 py-2 text-xs font-black text-slate-300 hover:bg-slate-700 active:scale-95"
              >
                +0.1
              </button>
              <button
                type="button"
                onClick={() => adjustWeight(0.5)}
                className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-black text-slate-300 hover:bg-slate-700 active:scale-95"
              >
                +0.5
              </button>
            </div>

            <button
              type="button"
              disabled={isSavingQuickWeight}
              onClick={async () => {
                const num = parseFloat((morningWeight || '').replace(',', '.'));
                if (num > 0) {
                  setIsSavingQuickWeight(true);
                  await saveMorningWeightToHydration(num);
                  setIsSavingQuickWeight(false);
                  setQuickWeightFeedback(`✅ Peso matinal de ${num} kg registado com sucesso!`);
                  setTimeout(() => setQuickWeightFeedback(null), 5000);
                }
              }}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all shadow-md active:scale-98"
            >
              <Scale className="h-4 w-4" />
              <span>
                {isSavingQuickWeight
                  ? 'A guardar...'
                  : todayHydration && Number(todayHydration.preWeight) > 0
                  ? 'Atualizar Peso Matinal'
                  : 'Gravar Peso Matinal Agora'}
              </span>
            </button>

            {quickWeightFeedback && (
              <div className="flex items-center justify-center space-x-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold animate-fade-in">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{quickWeightFeedback}</span>
              </div>
            )}
          </div>
        </div>

        <div className="pt-2">
          {deadlineCheck.hasDeadline && deadlineCheck.isPast && deadlineCheck.strictBlock ? (
            <div className="w-full text-center text-xs font-semibold text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center justify-center space-x-1.5">
              <Lock className="h-4 w-4 text-slate-400" />
              <span>Edição do questionário fechada após as {deadlineCheck.deadlineTime}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleEditClick}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 active:scale-[0.99] flex items-center justify-center space-x-2"
            >
              <span>✏️ Rever ou Atualizar Respostas</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!existingToday && deadlineCheck.hasDeadline && deadlineCheck.isPast && deadlineCheck.strictBlock) {
    return (
      <div className="rounded-2xl border border-rose-500/40 bg-dark-card p-6 space-y-4 shadow-xl animate-fade-in">
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-lg shadow-rose-500/10">
            <Lock className="h-7 w-7 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
              Horário Limite Ultrapassado
            </span>
            <h2 className="text-lg font-black text-slate-100">Questionário Wellness Fechado</h2>
            <p className="text-xs text-slate-300 max-w-sm mx-auto mt-1">
              A hora limite para o preenchimento do Wellness ({deadlineCheck.deadlineTime}) já expirou hoje.
            </p>
          </div>
        </div>

        {/* Card Dedicado para registar o Peso Matinal mesmo com Wellness fechado */}
        <div className="rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 via-dark-surface to-dark-card p-4 space-y-3 shadow-md text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Scale className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                  Registar Peso Matinal ({todayStr})
                </span>
                <h4 className="text-xs font-bold text-slate-200">
                  {todayHydration && Number(todayHydration.preWeight) > 0
                    ? `Peso registado: ${todayHydration.preWeight} kg`
                    : 'Podes registar o teu peso matinal aqui:'}
                </h4>
              </div>
            </div>

            {todayHydration && Number(todayHydration.preWeight) > 0 ? (
              <span className="text-xs font-black text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
                ✅ {todayHydration.preWeight} kg
              </span>
            ) : (
              <span className="text-xs font-black text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-500/30 animate-pulse">
                ⚠️ Pendente
              </span>
            )}
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => adjustWeight(-0.5)}
                className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-black text-slate-300 hover:bg-slate-700 active:scale-95"
              >
                -0.5
              </button>
              <button
                type="button"
                onClick={() => adjustWeight(-0.1)}
                className="rounded-xl bg-slate-800 px-2.5 py-2 text-xs font-black text-slate-300 hover:bg-slate-700 active:scale-95"
              >
                -0.1
              </button>
              <input
                type="text"
                inputMode="decimal"
                value={morningWeight}
                onChange={(e) => setMorningWeight(e.target.value)}
                placeholder="62.5"
                className="w-full text-center rounded-xl border border-cyan-500/40 bg-dark-bg p-2.5 text-lg font-black text-cyan-300 focus:border-cyan-400 focus:outline-none tracking-wider"
              />
              <button
                type="button"
                onClick={() => adjustWeight(0.1)}
                className="rounded-xl bg-slate-800 px-2.5 py-2 text-xs font-black text-slate-300 hover:bg-slate-700 active:scale-95"
              >
                +0.1
              </button>
              <button
                type="button"
                onClick={() => adjustWeight(0.5)}
                className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-black text-slate-300 hover:bg-slate-700 active:scale-95"
              >
                +0.5
              </button>
            </div>

            <button
              type="button"
              disabled={isSavingQuickWeight}
              onClick={async () => {
                const num = parseFloat((morningWeight || '').replace(',', '.'));
                if (num > 0) {
                  setIsSavingQuickWeight(true);
                  await saveMorningWeightToHydration(num);
                  setIsSavingQuickWeight(false);
                  setQuickWeightFeedback(`✅ Peso matinal de ${num} kg registado com sucesso!`);
                  setTimeout(() => setQuickWeightFeedback(null), 5000);
                }
              }}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all shadow-md active:scale-98"
            >
              <Scale className="h-4 w-4" />
              <span>
                {isSavingQuickWeight
                  ? 'A guardar...'
                  : todayHydration && Number(todayHydration.preWeight) > 0
                  ? 'Atualizar Peso Matinal'
                  : 'Gravar Peso Matinal Agora'}
              </span>
            </button>

            {quickWeightFeedback && (
              <div className="flex items-center justify-center space-x-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold animate-fade-in">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{quickWeightFeedback}</span>
              </div>
            )}
          </div>
        </div>
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
          <div className="flex flex-col items-end space-y-1">
            <span className="text-xs font-semibold text-slate-400">
              {new Date().toLocaleDateString()}
            </span>
            {deadlineCheck.hasDeadline && !deadlineCheck.isPast && (
              <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${
                deadlineCheck.minutesRemaining !== undefined && deadlineCheck.minutesRemaining <= 30
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}>
                <Clock className="h-3 w-3" />
                <span>
                  {deadlineCheck.minutesRemaining !== undefined && deadlineCheck.minutesRemaining <= 30
                    ? `Faltam ${deadlineCheck.minutesRemaining} min (${deadlineCheck.deadlineTime})`
                    : `Limite: ${deadlineCheck.deadlineTime}`}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Deadline Warning / Special Authorization Banner */}
      {deadlineCheck.hasDeadline && deadlineCheck.isPast && !deadlineCheck.strictBlock && (
        deadlineCheck.isAuthorizedLate ? (
          <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/40 p-3.5 flex items-start space-x-2.5 text-xs text-emerald-300 animate-fade-in shadow-sm">
            <span className="text-base shrink-0">🔓</span>
            <div className="space-y-0.5">
              <span className="font-extrabold text-emerald-200">Autorização Especial da Equipa Técnica</span>
              <p className="text-[11px] text-emerald-200/90 leading-snug">
                Tens autorização de administrador para submeter o questionário mesmo após o horário limite ({deadlineCheck.deadlineTime}).
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3.5 flex items-start space-x-2.5 text-xs text-amber-300 animate-fade-in shadow-sm">
            <Clock className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-extrabold text-amber-200">
                {deadlineCheck.requireApproval
                  ? `Preenchimento Fora do Prazo`
                  : `Atenção: Submissão após o horário limite (${deadlineCheck.deadlineTime})`}
              </span>
              <p className="text-[11px] text-amber-200/80 leading-snug">
                {deadlineCheck.requireApproval
                  ? `A hora limite era às ${deadlineCheck.deadlineTime}. Podes preencher o formulário normalmente. A equipa técnica irá validar o teu registo.`
                  : 'O preenchimento ainda é permitido, mas a tua resposta ficará registada como enviada com atraso.'}
              </p>
            </div>
          </div>
        )
      )}

      {/* 1. Ciclo Menstrual */}
      <div className="space-y-3 rounded-xl border border-dark-border bg-dark-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-200">
            <HeartPulse className="h-5 w-5 text-rose-400" />
            <h3 className="text-sm font-bold">{t.wellness.menstrualCycleTitle}</h3>
          </div>
          <span className="text-xs font-extrabold text-rose-400 bg-slate-900 px-2.5 py-0.5 rounded-full border border-rose-500/30">
            {menstrualCycle ? menstrualCycle : '-'}
          </span>
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

      {/* 2. Peso Matinal (kg) */}
      <div className="space-y-3 rounded-xl border border-cyan-500/40 bg-dark-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-200">
            <Scale className="h-5 w-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100">Peso Matinal (kg)</h3>
              <p className="text-[11px] text-slate-400">Ao acordar em jejum • Sincroniza com o controlo ponderal</p>
            </div>
          </div>
          <span className="text-xs font-black text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-full border border-cyan-500/30">
            {morningWeight ? `${morningWeight} kg` : '- kg'}
          </span>
        </div>

        <div className="space-y-2 pt-1">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => adjustWeight(-0.5)}
              className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-black text-slate-300 hover:bg-slate-700 active:scale-95"
            >
              -0.5
            </button>
            <button
              type="button"
              onClick={() => adjustWeight(-0.1)}
              className="rounded-xl bg-slate-800 px-2.5 py-2 text-xs font-black text-slate-300 hover:bg-slate-700 active:scale-95"
            >
              -0.1
            </button>
            <input
              type="text"
              inputMode="decimal"
              value={morningWeight}
              onChange={(e) => setMorningWeight(e.target.value)}
              placeholder="ex: 62.5"
              className="w-full text-center rounded-xl border border-cyan-500/40 bg-dark-bg p-2.5 text-lg font-black text-cyan-300 focus:border-cyan-400 focus:outline-none tracking-wider"
            />
            <button
              type="button"
              onClick={() => adjustWeight(0.1)}
              className="rounded-xl bg-slate-800 px-2.5 py-2 text-xs font-black text-slate-300 hover:bg-slate-700 active:scale-95"
            >
              +0.1
            </button>
            <button
              type="button"
              onClick={() => adjustWeight(0.5)}
              className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-black text-slate-300 hover:bg-slate-700 active:scale-95"
            >
              +0.5
            </button>
          </div>
        </div>
      </div>

      {/* 3. Escalas de Bem-Estar Geral */}
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
        {isSubmitting
          ? t.wellness.submitting
          : deadlineCheck.requireApproval
          ? 'Submeter Questionário (Sujeito a Validação)'
          : t.wellness.submit}
      </button>
    </form>
  );
};
