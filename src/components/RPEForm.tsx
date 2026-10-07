import React, { useState, useEffect } from 'react';
import { Athlete, MuscleFatigueMap, RPEEntry } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';
import { BORG_SCALE } from '@/lib/data';
import { MuscleFatigueSelector } from './MuscleFatigueSelector';
import { saveRPELocally, getRPELocally, getStoredTrainingSessions, isSubmissionPastDeadline } from '@/lib/storage';
import { secureFetch } from '@/lib/authGuard';
import { translateTextToPortuguese } from '@/lib/translationUtils';
import { Dumbbell, Activity, Check, AlertCircle, MessageSquare, Info, ChevronDown, ChevronUp, Lock, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface RPEFormProps {
  activeAthlete: Athlete;
  onSubmitSuccess: () => void;
}

export const RPEForm: React.FC<RPEFormProps> = ({
  activeAthlete,
  onSubmitSuccess,
}) => {
  const { t } = useLanguage();
  const [physicalDemand, setPhysicalDemand] = useState<number | null>(null);
  const [postFatigue, setPostFatigue] = useState<number | null>(null);
  const [muscleFatigue, setMuscleFatigue] = useState<MuscleFatigueMap>({});
  const [comments, setComments] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [allowEdit, setAllowEdit] = useState<boolean>(false);

  const [showBorgLegend, setShowBorgLegend] = useState<boolean>(false);
  const [showFatigueLegend, setShowFatigueLegend] = useState<boolean>(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const localEntries = getRPELocally(activeAthlete.id);
  const existingToday = localEntries.find((e) => e.date === todayStr);

  const [deadlineCheck, setDeadlineCheck] = useState(() =>
    isSubmissionPastDeadline(todayStr, 'rpe', activeAthlete.id)
  );

  const [submittedLateNotice, setSubmittedLateNotice] = useState<{
    deadlineTime: string;
  } | null>(null);

  useEffect(() => {
    const updateCheck = () => {
      setDeadlineCheck(isSubmissionPastDeadline(todayStr, 'rpe', activeAthlete.id));
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
      setPhysicalDemand(existingToday.physicalDemand ?? null);
      setPostFatigue(existingToday.postFatigue ?? null);
      setMuscleFatigue(existingToday.muscleFatigue || {});
      setComments(existingToday.comments || '');
    }
    setAllowEdit(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (physicalDemand === null || postFatigue === null) {
      setError('Por favor seleciona a exigência física do treino e o nível de fadiga pós-treino.');
      return;
    }

    setIsSubmitting(true);

    const today = new Date().toISOString().split('T')[0];
    const sessions = getStoredTrainingSessions();
    const sessionDurationMin = sessions[today]?.durationMin || 90;
    const matchDayOffset = sessions[today]?.matchDayOffset || 'MD-3';
    const translatedComments = comments.trim() ? translateTextToPortuguese(comments.trim()) : undefined;

    const currentDeadlineCheck = isSubmissionPastDeadline(today, 'rpe', activeAthlete.id);
    if (currentDeadlineCheck.hasDeadline && currentDeadlineCheck.isPast && currentDeadlineCheck.strictBlock) {
      setError(`O horário limite (${currentDeadlineCheck.deadlineTime}) já expirou hoje. A submissão está bloqueada pela equipa técnica.`);
      setIsSubmitting(false);
      return;
    }
    const isLate = currentDeadlineCheck.hasDeadline && currentDeadlineCheck.isPast;

    const newEntry: RPEEntry = {
      id: existingToday ? existingToday.id : `rpe-${Date.now()}`,
      athleteId: activeAthlete.id,
      athleteName: activeAthlete.name,
      date: today,
      matchDayOffset,
      physicalDemand,
      sessionDurationMin,
      postFatigue,
      muscleFatigue,
      preWorkoutPlans: [],
      comments: translatedComments,
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
      await secureFetch('/api/rpe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry),
      });

      secureFetch('/api/sync-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'rpe', entry: newEntry }),
      }).catch(() => {});

      saveRPELocally(newEntry);
      setIsSubmitting(false);
      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        onSubmitSuccess();
      }, redirectDelay);
    } catch (err) {
      console.warn('Falha na API. Guardado localmente.');
      saveRPELocally(newEntry);
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onSubmitSuccess();
      }, redirectDelay);
    }
  };

  const selectedBorgObj = physicalDemand !== null ? (BORG_SCALE.find((b) => b.value === physicalDemand) || BORG_SCALE[5]) : null;
  const borgDescriptorText = physicalDemand !== null
    ? (t.rpe.borgDescriptors[physicalDemand as keyof typeof t.rpe.borgDescriptors] || (selectedBorgObj ? selectedBorgObj.label : ''))
    : 'Seleciona a Exigência Física (1 a 10)';
  const borgColorClass = selectedBorgObj ? selectedBorgObj.color : 'border-slate-700/50 bg-slate-900/40 text-slate-400 italic';

  const fatigueDescriptorText = postFatigue !== null
    ? t.rpe.fatigueDescriptors[postFatigue as keyof typeof t.rpe.fatigueDescriptors]
    : 'Seleciona o Nível de Fadiga Pós-Treino (1 a 10)';
  const fatigueColorClass =
    postFatigue === null
      ? 'border-slate-700/50 bg-slate-900/40 text-slate-400 italic'
      : postFatigue <= 3
      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
      : postFatigue <= 6
      ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
      : 'border-rose-500/40 bg-rose-500/10 text-rose-400';

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 rounded-2xl border border-brand-cyan/40 bg-dark-card p-6 sm:p-8 text-center shadow-xl animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-cyan text-slate-950 shadow-lg shadow-brand-cyan/30">
          <Check className="h-8 w-8 stroke-[3]" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-100">{t.rpe.successMessage}</h3>
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
              O formulário de PSE foi submetido após a hora limite ({submittedLateNotice.deadlineTime}). De acordo com o regulamento de equipa, o registo foi assinalado por atraso.
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
      <div className="rounded-2xl border border-cyan-500/40 bg-dark-card p-6 shadow-xl space-y-5 animate-fade-in">
        <div className="flex items-center space-x-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Check className="h-6 w-6 stroke-[3]" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">
              PSE (RPE) Concluído Hoje
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
            <span className="text-slate-400">Esforço do Treino (Borg):</span>
            <span className="font-black text-brand-cyan text-base">
              {existingToday.physicalDemand} / 10
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Fadiga Pós-Treino:</span>
            <span className="font-black text-amber-400 text-sm">
              {existingToday.postFatigue} / 10
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

        <div className="pt-2">
          <button
            type="button"
            onClick={handleEditClick}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 active:scale-[0.99] flex items-center justify-center space-x-2"
          >
            <span>✏️ Rever ou Atualizar Respostas</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-8">
      {/* Header Banner */}
      <div className="rounded-xl border border-brand-cyan/30 bg-gradient-to-r from-dark-card to-dark-surface p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-brand-cyan">
              {t.rpe.title}
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
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
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
                Tens autorização de administrador para submeter o registo de PSE mesmo após o horário limite ({deadlineCheck.deadlineTime}).
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

      {/* 1. Exigência Física do Treino (Escala Borg CR10) */}
      <div className="space-y-4 rounded-xl border border-dark-border bg-dark-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-200">
            <Dumbbell className="h-5 w-5 text-brand-cyan" />
            <h3 className="text-sm font-bold">{t.rpe.borgTitle}</h3>
          </div>
          <span className="text-xs font-black text-brand-cyan bg-dark-bg px-3 py-1 rounded-full border border-brand-cyan/30">
            {physicalDemand !== null ? `${physicalDemand} / 10` : '- / 10'}
          </span>
        </div>

        {/* Selected Descriptor Highlight */}
        <div className={`rounded-xl border p-3.5 transition-all ${borgColorClass}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider">
              {borgDescriptorText}
            </span>
          </div>
        </div>

        {/* 10 Borg Touch Buttons */}
        <div className="grid grid-cols-5 gap-2 pt-1">
          {BORG_SCALE.map((item) => {
            const isSelected = physicalDemand === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setPhysicalDemand(item.value)}
                className={`h-12 rounded-xl text-base font-black transition-all active:scale-95 flex items-center justify-center ${
                  isSelected
                    ? item.value <= 2
                      ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300 scale-105 shadow-md'
                      : item.value <= 4
                      ? 'bg-cyan-400 text-slate-950 ring-2 ring-cyan-200 scale-105 shadow-md'
                      : item.value <= 6
                      ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-200 scale-105 shadow-md'
                      : item.value <= 8
                      ? 'bg-orange-500 text-white ring-2 ring-orange-300 scale-105 shadow-md'
                      : 'bg-rose-600 text-white ring-2 ring-rose-300 scale-105 shadow-md'
                    : 'bg-dark-surface text-slate-300 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                {item.value}
              </button>
            );
          })}
        </div>

        {/* Full Borg CR10 Scale Legend Toggle */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowBorgLegend(!showBorgLegend)}
            className="flex items-center space-x-1 text-[11px] font-bold text-slate-400 hover:text-slate-200 transition-all"
          >
            <Info className="h-3.5 w-3.5 text-brand-cyan" />
            <span>{showBorgLegend ? 'Ocultar Escala Borg CR10' : 'Ver Escala Completa Borg CR10'}</span>
            {showBorgLegend ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
          </button>

          {showBorgLegend && (
            <div className="mt-2 space-y-1 rounded-xl bg-dark-bg/90 p-3 border border-slate-800 text-[11px] font-semibold animate-fade-in">
              {BORG_SCALE.map((b) => (
                <div
                  key={b.value}
                  className={`py-1 px-2 rounded-lg transition-all ${
                    physicalDemand === b.value
                      ? 'bg-slate-800 text-brand-cyan font-bold border-l-2 border-brand-cyan'
                      : 'text-slate-300'
                  }`}
                >
                  {t.rpe.borgDescriptors[b.value as keyof typeof t.rpe.borgDescriptors]}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Nível de Fadiga Geral Pós-Treino (1 a 10) */}
      <div className="space-y-4 rounded-xl border border-dark-border bg-dark-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-200">
            <Activity className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-bold">{t.rpe.postFatigueTitle}</h3>
          </div>
          <span className="text-xs font-black text-amber-400 bg-dark-bg px-3 py-1 rounded-full border border-amber-400/30">
            {postFatigue !== null ? `${postFatigue} / 10` : '- / 10'}
          </span>
        </div>

        {/* Selected Descriptor Highlight */}
        <div className={`rounded-xl border p-3.5 transition-all ${fatigueColorClass}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider">
              {fatigueDescriptorText}
            </span>
          </div>
        </div>

        {/* 10 Touch Buttons */}
        <div className="grid grid-cols-5 gap-2 pt-1">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => {
            const isSelected = postFatigue === val;
            return (
              <button
                key={val}
                type="button"
                onClick={() => setPostFatigue(val)}
                className={`h-12 rounded-xl text-base font-black transition-all active:scale-95 flex items-center justify-center ${
                  isSelected
                    ? val <= 3
                      ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300 scale-105 shadow-md'
                      : val <= 6
                      ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-200 scale-105 shadow-md'
                      : 'bg-rose-600 text-white ring-2 ring-rose-300 scale-105 shadow-md'
                    : 'bg-dark-surface text-slate-300 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                {val}
              </button>
            );
          })}
        </div>

        {/* Full Fatigue Scale Legend Toggle */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowFatigueLegend(!showFatigueLegend)}
            className="flex items-center space-x-1 text-[11px] font-bold text-slate-400 hover:text-slate-200 transition-all"
          >
            <Info className="h-3.5 w-3.5 text-amber-400" />
            <span>
              {showFatigueLegend
                ? (t.header.langName === 'English' ? 'Hide Fatigue Scale' : 'Ocultar Escala de Fadiga')
                : t.rpe.scaleFatigueLegendTitle}
            </span>
            {showFatigueLegend ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
          </button>

          {showFatigueLegend && (
            <div className="mt-2 space-y-1 rounded-xl bg-dark-bg/90 p-3 border border-slate-800 text-[11px] font-semibold animate-fade-in">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => (
                <div
                  key={val}
                  className={`py-1 px-2 rounded-lg transition-all ${
                    postFatigue === val
                      ? 'bg-slate-800 text-amber-400 font-bold border-l-2 border-amber-400'
                      : 'text-slate-300'
                  }`}
                >
                  {t.rpe.fatigueDescriptors[val as keyof typeof t.rpe.fatigueDescriptors]}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Fadiga Muscular Localizada Pós-Treino (Dual View Body Chart) */}
      <MuscleFatigueSelector value={muscleFatigue} onChange={setMuscleFatigue} />

      {/* 4. Comentários Adicionais */}

      {/* 5. Comentários Adicionais */}
      <div className="space-y-2 rounded-xl border border-dark-border bg-dark-card p-4 shadow-sm">
        <div className="flex items-center space-x-2 text-slate-200">
          <MessageSquare className="h-5 w-5 text-indigo-400" />
          <h3 className="text-sm font-bold">{t.rpe.commentsTitle}</h3>
        </div>
        <textarea
          rows={3}
          placeholder={t.rpe.commentsPlaceholder}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-dark-bg p-3 text-xs font-medium text-slate-100 placeholder-slate-500 focus:border-brand-cyan focus:outline-none"
        />
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
        className="w-full rounded-xl bg-gradient-to-r from-brand-cyan to-blue-500 py-4 text-sm font-extrabold text-slate-950 shadow-xl shadow-brand-cyan/25 hover:from-cyan-400 hover:to-blue-600 active:scale-98 transition-all disabled:opacity-50"
      >
        {isSubmitting
          ? t.rpe.submitting
          : deadlineCheck.requireApproval
          ? 'Submeter Questionário (Sujeito a Validação)'
          : t.rpe.submit}
      </button>
    </form>
  );
};
