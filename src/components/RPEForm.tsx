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

  // Identifica se hoje há Ginásio de Equipa: Membros Inferiores programado
  const [sessionsMap, setSessionsMap] = useState<Record<string, any>>(() => getStoredTrainingSessions());
  const todaySession = sessionsMap[todayStr];
  const hasGymLower = Boolean(todaySession?.complementaryWork?.lowerBody);

  // Sessão ativa: 'field' (Treino de Campo) ou 'gym_lower' (Ginásio Membros Inferiores)
  const [sessionType, setSessionType] = useState<'field' | 'gym_lower'>('field');

  const [fieldEntry, setFieldEntry] = useState<RPEEntry | null>(() => {
    const localEntries = getRPELocally(activeAthlete.id);
    return localEntries.find((e) => e.date === todayStr && (e.sessionType || 'field') === 'field') || null;
  });

  const [gymEntry, setGymEntry] = useState<RPEEntry | null>(() => {
    const localEntries = getRPELocally(activeAthlete.id);
    return localEntries.find((e) => e.date === todayStr && e.sessionType === 'gym_lower') || null;
  });

  const existingActive = sessionType === 'gym_lower' ? gymEntry : fieldEntry;

  const [deadlineCheck, setDeadlineCheck] = useState(() =>
    isSubmissionPastDeadline(todayStr, 'rpe', activeAthlete.id)
  );

  useEffect(() => {
    const refreshData = () => {
      const allSessions = getStoredTrainingSessions();
      setSessionsMap(allSessions);

      const localEntries = getRPELocally(activeAthlete.id);
      const foundField = localEntries.find((e) => e.date === todayStr && (e.sessionType || 'field') === 'field') || null;
      const foundGym = localEntries.find((e) => e.date === todayStr && e.sessionType === 'gym_lower') || null;
      setFieldEntry(foundField);
      setGymEntry(foundGym);
      setDeadlineCheck(isSubmissionPastDeadline(todayStr, 'rpe', activeAthlete.id));
    };

    refreshData();

    // Sincronização direta com Supabase
    secureFetch(`/api/rpe?athleteId=${activeAthlete.id}&t=${Date.now()}`)
      .then((res) => res.json())
      .then((resData) => {
        const items = resData?.entries || resData?.data;
        if (Array.isArray(items) && items.length > 0) {
          items.forEach((item: RPEEntry) => {
            saveRPELocally(item);
          });
          refreshData();
        }
      })
      .catch(() => {});

    const interval = setInterval(refreshData, 5000);
    window.addEventListener('femperf_credentials_updated', refreshData);
    window.addEventListener('femperf_data_updated', refreshData);
    return () => {
      clearInterval(interval);
      window.removeEventListener('femperf_credentials_updated', refreshData);
      window.removeEventListener('femperf_data_updated', refreshData);
    };
  }, [todayStr, activeAthlete.id]);

  const handleSelectSessionType = (type: 'field' | 'gym_lower') => {
    setSessionType(type);
    setAllowEdit(false);
    setError('');
    const target = type === 'gym_lower' ? gymEntry : fieldEntry;
    if (target) {
      setPhysicalDemand(target.physicalDemand ?? null);
      setPostFatigue(target.postFatigue ?? null);
      setMuscleFatigue(target.muscleFatigue || {});
      setComments(target.comments || '');
    } else {
      setPhysicalDemand(null);
      setPostFatigue(null);
      setMuscleFatigue({});
      setComments('');
    }
  };

  const handleEditClick = () => {
    if (existingActive) {
      setPhysicalDemand(existingActive.physicalDemand ?? null);
      setPostFatigue(existingActive.postFatigue ?? null);
      setMuscleFatigue(existingActive.muscleFatigue || {});
      setComments(existingActive.comments || '');
    }
    setAllowEdit(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (physicalDemand === null || postFatigue === null) {
      setError(
        sessionType === 'gym_lower'
          ? 'Por favor seleciona a exigência física do ginásio e o nível de fadiga muscular.'
          : 'Por favor seleciona a exigência física do treino e o nível de fadiga pós-treino.'
      );
      return;
    }

    setIsSubmitting(true);

    const today = new Date().toISOString().split('T')[0];
    const sessions = getStoredTrainingSessions();
    const currSession = sessions[today];
    const targetSessionType = hasGymLower ? sessionType : 'field';
    const targetExisting = targetSessionType === 'gym_lower' ? gymEntry : fieldEntry;
    const sessionDurationMin = targetSessionType === 'gym_lower' ? (currSession?.gymDurationMin || 45) : (currSession?.durationMin || 90);
    const matchDayOffset = currSession?.matchDayOffset || 'MD-3';
    const translatedComments = comments.trim() ? translateTextToPortuguese(comments.trim()) : undefined;

    const currentDeadlineCheck = isSubmissionPastDeadline(today, 'rpe', activeAthlete.id);
    const isSubmissionLate = Boolean(
      currentDeadlineCheck.hasDeadline &&
      currentDeadlineCheck.isPast &&
      !currentDeadlineCheck.isAuthorizedLate
    );
    const isLate = targetExisting ? (targetExisting.isLate ?? isSubmissionLate) : isSubmissionLate;
    const isAuthorizedLate = Boolean(currentDeadlineCheck.isAuthorizedLate || targetExisting?.isAuthorizedLate);
    const keepFine = isAuthorizedLate ? false : (targetExisting?.keepFine !== undefined ? targetExisting.keepFine : isLate);

    const newEntry: RPEEntry = {
      id: targetExisting ? targetExisting.id : `rpe-${activeAthlete.id}-${today}-${targetSessionType}`,
      athleteId: activeAthlete.id,
      athleteName: activeAthlete.name,
      date: today,
      sessionType: targetSessionType,
      matchDayOffset,
      physicalDemand,
      sessionDurationMin,
      postFatigue,
      muscleFatigue,
      preWorkoutPlans: [],
      comments: translatedComments,
      isLate,
      isAuthorizedLate,
      keepFine,
      approvalStatus: 'approved',
      submittedAt: targetExisting?.submittedAt || new Date().toISOString(),
      createdAt: targetExisting?.createdAt || new Date().toISOString(),
    };

    const redirectDelay = 1800;

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
        // Se preencheu Campo e ainda tem Ginásio pendente, comuta para o Ginásio
        if (targetSessionType === 'field' && hasGymLower && !gymEntry) {
          handleSelectSessionType('gym_lower');
        } else {
          onSubmitSuccess();
        }
      }, redirectDelay);
    } catch (err) {
      console.warn('Falha na API. Guardado localmente.');
      saveRPELocally(newEntry);
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        if (targetSessionType === 'field' && hasGymLower && !gymEntry) {
          handleSelectSessionType('gym_lower');
        } else {
          onSubmitSuccess();
        }
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
      <div className={`flex flex-col items-center justify-center space-y-4 rounded-2xl border p-6 sm:p-8 text-center shadow-xl animate-fade-in ${
        sessionType === 'gym_lower'
          ? 'border-purple-500/40 bg-purple-950/20'
          : 'border-brand-cyan/40 bg-dark-card'
      }`}>
        <div className={`flex h-16 w-16 items-center justify-center rounded-full text-slate-950 shadow-lg ${
          sessionType === 'gym_lower'
            ? 'bg-purple-400 shadow-purple-500/30'
            : 'bg-brand-cyan shadow-brand-cyan/30'
        }`}>
          <Check className="h-8 w-8 stroke-[3]" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-100">
          {sessionType === 'gym_lower'
            ? 'PSE Ginásio (MMII) Guardada!'
            : hasGymLower
            ? 'PSE Treino de Campo Guardada!'
            : t.rpe.successMessage}
        </h3>
        <p className="text-xs text-slate-300">
          {activeAthlete.name} &bull; {sessionType === 'gym_lower' ? 'Força & Potência MMII' : 'Treino de Campo'}
        </p>
        {sessionType === 'field' && hasGymLower && !gymEntry && (
          <p className="text-[11px] font-bold text-purple-300 animate-pulse bg-purple-950/60 border border-purple-500/30 px-3 py-1.5 rounded-xl">
            A comutar para a PSE de Ginásio (MMII)...
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* OPÇÃO 2: CARTÕES SEPARADOS DE SESSÃO QUANDO HÁ GINÁSIO DE EQUIPA MMII */}
      {hasGymLower && (
        <div className="rounded-2xl bg-dark-card border border-purple-500/40 p-3 sm:p-4 shadow-xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-950/90 border border-purple-500/50 text-base shadow-sm">
                🏋️‍♀️
              </span>
              <div>
                <h3 className="text-xs font-black uppercase text-purple-200 tracking-tight">
                  Ginásio de Equipa &bull; Membros Inferiores
                </h3>
                <p className="text-[10px] text-slate-400">
                  Dia com 2 avaliações separadas: após o campo e após o ginásio.
                </p>
              </div>
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 shrink-0">
              2 PSEs Separadas
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-0.5">
            {/* Cartão 1: PSE Treino de Campo */}
            <button
              type="button"
              onClick={() => handleSelectSessionType('field')}
              className={`flex flex-col p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                sessionType === 'field'
                  ? 'border-brand-cyan bg-cyan-950/40 ring-2 ring-brand-cyan/40 shadow-lg'
                  : 'border-slate-800 bg-slate-900/70 hover:bg-slate-800/70 opacity-90'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-lg">⚽</span>
                {fieldEntry ? (
                  <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-md flex items-center space-x-1">
                    <Check className="h-2.5 w-2.5 inline" />
                    <span>Borg {fieldEntry.physicalDemand}/10</span>
                  </span>
                ) : (
                  <span className="text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md animate-pulse">
                    Pendente
                  </span>
                )}
              </div>
              <span className="text-xs font-black text-slate-100">1. Treino de Campo</span>
              <span className="text-[10px] text-slate-400 mt-0.5 font-medium">
                {todaySession?.startTime && todaySession?.endTime ? `${todaySession.startTime} - ${todaySession.endTime}` : 'Campo / Relvado'}
              </span>
            </button>

            {/* Cartão 2: PSE Ginásio MMII */}
            <button
              type="button"
              onClick={() => handleSelectSessionType('gym_lower')}
              className={`flex flex-col p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                sessionType === 'gym_lower'
                  ? 'border-purple-400 bg-purple-950/40 ring-2 ring-purple-500/40 shadow-lg'
                  : 'border-slate-800 bg-slate-900/70 hover:bg-slate-800/70 opacity-90'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-lg">🏋️‍♀️</span>
                {gymEntry ? (
                  <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-md flex items-center space-x-1">
                    <Check className="h-2.5 w-2.5 inline" />
                    <span>Borg {gymEntry.physicalDemand}/10</span>
                  </span>
                ) : (
                  <span className="text-[9px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-md animate-pulse">
                    Pendente
                  </span>
                )}
              </div>
              <span className="text-xs font-black text-slate-100">2. Ginásio MMII</span>
              <span className="text-[10px] text-purple-300/90 mt-0.5 font-bold flex items-center space-x-1">
                <Clock className="h-2.5 w-2.5 inline" />
                <span>Fim: {todaySession?.gymEndTime || '11:30'}</span>
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ESTADO CONCLUÍDO DA SESSÃO SELECIONADA */}
      {existingActive && !allowEdit ? (
        <div className={`rounded-2xl border p-6 shadow-xl space-y-5 animate-fade-in ${
          sessionType === 'gym_lower'
            ? 'border-purple-500/40 bg-dark-card'
            : 'border-cyan-500/40 bg-dark-card'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
                sessionType === 'gym_lower'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 text-xl'
                  : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
              }`}>
                {sessionType === 'gym_lower' ? '🏋️‍♀️' : <Check className="h-6 w-6 stroke-[3]" />}
              </div>
              <div>
                <span className={`text-[10px] uppercase font-bold tracking-wider ${
                  sessionType === 'gym_lower' ? 'text-purple-300' : 'text-cyan-400'
                }`}>
                  {sessionType === 'gym_lower' ? 'PSE Ginásio (MMII) Concluída' : 'PSE Treino de Campo Concluída'}
                </span>
                <h2 className="text-lg font-black text-slate-100">{activeAthlete.name}</h2>
              </div>
            </div>

            {hasGymLower && (
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-md border ${
                sessionType === 'gym_lower'
                  ? 'bg-purple-950/80 border-purple-500/40 text-purple-200'
                  : 'bg-slate-900 border-slate-800 text-cyan-300'
              }`}>
                {sessionType === 'gym_lower' ? '🏋️ Força MMII' : '⚽ Campo'}
              </span>
            )}
          </div>

          <div className="rounded-xl bg-slate-900/80 p-4 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Data de registo:</span>
              <span className="font-bold text-slate-200">{existingActive.date}</span>
            </div>
            {existingActive.submittedAt && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Hora de submissão:</span>
                <span className="font-bold text-slate-200">
                  {new Date(existingActive.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">
                {sessionType === 'gym_lower' ? 'Exigência de Força MMII (Borg):' : 'Esforço do Treino (Borg):'}
              </span>
              <span className={`font-black text-base ${
                sessionType === 'gym_lower' ? 'text-purple-300' : 'text-brand-cyan'
              }`}>
                {existingActive.physicalDemand} / 10
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">
                {sessionType === 'gym_lower' ? 'Fadiga Muscular Pós-Ginásio:' : 'Fadiga Pós-Treino:'}
              </span>
              <span className="font-black text-amber-400 text-sm">
                {existingActive.postFatigue} / 10
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleEditClick}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>✏️ Rever ou Atualizar Respostas</span>
            </button>
          </div>
        </div>
      ) : (
        /* FORMULÁRIO DE PREENCHIMENTO */
        <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
          {/* Header Banner */}
          <div className={`rounded-xl border p-4 shadow-md ${
            sessionType === 'gym_lower'
              ? 'border-purple-500/40 bg-gradient-to-r from-purple-950/40 to-dark-surface'
              : 'border-brand-cyan/30 bg-gradient-to-r from-dark-card to-dark-surface'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-[10px] uppercase font-bold tracking-wider ${
                  sessionType === 'gym_lower' ? 'text-purple-300' : 'text-brand-cyan'
                }`}>
                  {sessionType === 'gym_lower'
                    ? 'PSE GINÁSIO — MEMBROS INFERIORES'
                    : hasGymLower
                    ? 'PSE TREINO DE CAMPO'
                    : t.rpe.title}
                </span>
                <h2 className="text-lg font-black text-slate-100">{activeAthlete.name}</h2>
              </div>
              <div className="flex flex-col items-end space-y-1">
                <span className="text-xs font-semibold text-slate-400">
                  {new Date().toLocaleDateString()}
                </span>
                {sessionType === 'gym_lower' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black border bg-purple-500/20 text-purple-300 border-purple-500/40 flex items-center space-x-1">
                    <Clock className="h-3 w-3 inline text-purple-400" />
                    <span>Fim do Ginásio: {todaySession?.gymEndTime || '11:30'}</span>
                  </span>
                ) : deadlineCheck.hasDeadline && !deadlineCheck.isPast ? (
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
                ) : null}
              </div>
            </div>
          </div>

          {/* Editing Mode Banner */}
          {allowEdit && existingActive && (
            <div className="rounded-xl bg-cyan-500/15 border border-cyan-500/40 p-3.5 flex items-center justify-between text-xs text-cyan-200 animate-fade-in shadow-sm">
              <div className="flex items-center space-x-2">
                <span className="text-base shrink-0">✏️</span>
                <div>
                  <span className="font-extrabold text-cyan-100">Modo de Edição Ativo</span>
                  <p className="text-[11px] text-cyan-200/80">Podes alterar a tua avaliação de esforço/fadiga e guardar novamente.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAllowEdit(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-bold text-[11px] transition-all cursor-pointer shrink-0"
              >
                Cancelar Edição
              </button>
            </div>
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
        className={`w-full rounded-xl py-4 text-sm font-extrabold text-slate-950 shadow-xl active:scale-98 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2 ${
          sessionType === 'gym_lower'
            ? 'bg-gradient-to-r from-purple-400 to-indigo-400 hover:from-purple-300 hover:to-indigo-300 shadow-purple-500/25'
            : 'bg-gradient-to-r from-brand-cyan to-blue-500 hover:from-cyan-400 hover:to-blue-600 shadow-brand-cyan/25'
        }`}
      >
        {isSubmitting ? (
          <span>{t.rpe.submitting}</span>
        ) : allowEdit ? (
          <span>💾 Guardar Alterações da PSE ({sessionType === 'gym_lower' ? 'Ginásio MMII' : 'Campo'})</span>
        ) : deadlineCheck.requireApproval ? (
          <span>Submeter Questionário (Sujeito a Validação)</span>
        ) : (
          <span>
            {sessionType === 'gym_lower'
              ? 'Submeter PSE Ginásio (MMII)'
              : hasGymLower
              ? 'Submeter PSE Treino de Campo'
              : t.rpe.submit}
          </span>
        )}
      </button>
    </form>
    )}
    </div>
  );
};
