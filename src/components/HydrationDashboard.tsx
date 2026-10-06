'use client';

import React, { useState, useEffect } from 'react';
import { Athlete, HydrationEntry, HydrationStatus } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';
import { calculateHydrationStatus } from '@/lib/data';
import { saveHydrationLocally, getHydrationLocally, formatSubmissionTime } from '@/lib/storage';
import { secureFetch } from '@/lib/authGuard';
import { getTodayLocalDateStr } from '@/lib/reminderUtils';
import {
  Droplet, AlertTriangle, CheckCircle, Scale, ChevronDown, ChevronUp,
  Activity, Plus, History, Check, ArrowRight, Sparkles, RefreshCw, Pencil, Clock
} from 'lucide-react';

interface HydrationDashboardProps {
  activeAthlete: Athlete;
}

export const HydrationDashboard: React.FC<HydrationDashboardProps> = ({ activeAthlete }) => {
  const { language, t } = useLanguage();
  const [preWeight, setPreWeight] = useState<string>('62.5');
  const [postWeight, setPostWeight] = useState<string>('61.6');
  const [fluidsIntake, setFluidsIntake] = useState<string>('0.5');
  const [durationMin, setDurationMin] = useState<string>('90');

  // Step state: 'pre' (before training) | 'post' (after training) | 'completed' (both done)
  const [step, setStep] = useState<'pre' | 'post' | 'completed'>('pre');
  const [savedPreWeight, setSavedPreWeight] = useState<number | null>(null);

  const [currentResult, setCurrentResult] = useState<HydrationEntry | null>(null);
  const [history, setHistory] = useState<HydrationEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const todayStr = getTodayLocalDateStr();

  const [activeSubTab, setActiveSubTab] = useState<'pre' | 'post'>('pre');

  // Initialize and detect athlete state for today on mount
  useEffect(() => {
    let isMounted = true;

    const syncAndApplyData = (list: HydrationEntry[]) => {
      if (!isMounted) return;
      setHistory(list);

      const todayEntry = list.find((item) => item.date === todayStr);

      if (todayEntry) {
        if (Number(todayEntry.postWeight) > 0) {
          // Both pre and post completed
          const calc = calculateHydrationStatus(
            todayEntry.preWeight,
            todayEntry.postWeight,
            todayEntry.fluidsIntake,
            language
          );
          setCurrentResult({
            ...todayEntry,
            recommendation: calc.recommendation,
            biologicalImpact: calc.biologicalImpact,
          });
          setPreWeight(todayEntry.preWeight.toString());
          setPostWeight(todayEntry.postWeight.toString());
          setSavedPreWeight(Number(todayEntry.preWeight));
          setStep('completed');
          setActiveSubTab('post');
        } else {
          // Pre-weight saved, waiting for post-weight
          setSavedPreWeight(Number(todayEntry.preWeight));
          setPreWeight(todayEntry.preWeight.toString());
          setPostWeight((Number(todayEntry.preWeight) - 0.8).toFixed(2));
          setStep('post');
          setActiveSubTab('post');
        }
      } else if (list.length > 0) {
        const last = list[0];
        setPreWeight(last.preWeight.toString());
        setPostWeight((Number(last.preWeight) - 0.8).toFixed(2));
        setSavedPreWeight(null);
        setStep('pre');
        setActiveSubTab('pre');
      } else {
        setSavedPreWeight(null);
        setStep('pre');
        setActiveSubTab('pre');
      }
    };

    // 1. Initial render from local storage
    const initialList = getHydrationLocally(activeAthlete.id);
    syncAndApplyData(initialList);

    // 2. Async fetch from Supabase to sync remote entries
    secureFetch(`/api/hydration?athleteId=${activeAthlete.id}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && Array.isArray(resData.data) && resData.data.length > 0) {
          resData.data.forEach((item: HydrationEntry) => {
            saveHydrationLocally(item);
          });
          const updatedList = getHydrationLocally(activeAthlete.id);
          syncAndApplyData(updatedList);
        }
      })
      .catch(() => {});

    const handleDataUpdate = () => {
      const updatedList = getHydrationLocally(activeAthlete.id);
      syncAndApplyData(updatedList);
    };

    window.addEventListener('femperf_data_updated', handleDataUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('femperf_data_updated', handleDataUpdate);
    };
  }, [activeAthlete.id, language, todayStr]);

  const parseNum = (val: string | number): number => {
    if (val === null || val === undefined) return 0;
    const str = val.toString().trim().replace(',', '.');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  };

  // Adjust numeric input by delta
  const adjustValue = (field: 'pre' | 'post', delta: number) => {
    if (field === 'pre') {
      const current = parseNum(preWeight) || 62.0;
      const updated = Math.max(30, Number((current + delta).toFixed(2)));
      setPreWeight(updated.toString());
      if (savedPreWeight !== null) setSavedPreWeight(updated);
    } else {
      const current = parseNum(postWeight) || 61.0;
      const updated = Math.max(30, Number((current + delta).toFixed(2)));
      setPostWeight(updated.toString());
    }
  };

  // Submit Stage 1: Pre-Training Weight (À Chegada)
  const handlePreWeightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pre = parseNum(preWeight);
    if (pre <= 0) return;

    setIsSubmitting(true);
    const nowIso = new Date().toISOString();
    const partialEntry: HydrationEntry = {
      id: `hyd-${todayStr}-${activeAthlete.id}`,
      athleteId: activeAthlete.id,
      athleteName: activeAthlete.name,
      date: todayStr,
      durationMin: 90,
      preWeight: pre,
      postWeight: 0,
      fluidsIntake: 0,
      weightLoss: 0,
      dehydrationRate: 0,
      status: 'Pendente',
      refillNeededLiters: 0,
      recommendation: 'Peso Pré-Treino registado. Conclui a pesagem no final do treino.',
      biologicalImpact: 'Aguardando pesagem pós-treino',
      preWeightTime: nowIso,
      submittedAtPre: nowIso,
      createdAt: nowIso,
    };

    saveHydrationLocally(partialEntry);

    secureFetch('/api/hydration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partialEntry),
    }).catch(() => {});

    secureFetch('/api/sync-sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'hydration_pre', entry: partialEntry }),
    }).catch(() => {});

    setSavedPreWeight(pre);
    setPostWeight((pre - 0.8).toFixed(2));
    setStep('post');
    setActiveSubTab('post');
    setIsSubmitting(false);

    setFeedbackMsg(`✅ Peso Pré-Treino de ${pre} kg registado! Podes agora realizar o teu treino. Volta aqui no final da sessão para a pesagem pós-treino.`);
    setTimeout(() => setFeedbackMsg(null), 6000);
  };

  // Submit Stage 2: Post-Training Weight (À Saída)
  const handlePostWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const post = parseNum(postWeight);
    const fluids = parseNum(fluidsIntake || '0.5');
    const dur = parseInt(durationMin || '90', 10);

    if (post <= 0) return;

    // 1. Get today's pre-weight for this athlete from state or local storage
    const list = getHydrationLocally(activeAthlete.id);
    const todayEntry = list.find((item) => item.date === todayStr);

    let pre = savedPreWeight || parseNum(preWeight);
    if (!pre || pre <= 0) {
      if (todayEntry && Number(todayEntry.preWeight) > 0) {
        pre = Number(todayEntry.preWeight);
      }
    }

    // 2. Fallback if no pre-weight was recorded beforehand
    if (!pre || pre <= 0) {
      pre = Number((post + 0.8).toFixed(2));
    }

    setIsSubmitting(true);
    const calc = calculateHydrationStatus(pre, post, fluids, language);
    const nowIso = new Date().toISOString();

    const fullEntry: HydrationEntry = {
      id: `hyd-${todayStr}-${activeAthlete.id}`,
      athleteId: activeAthlete.id,
      athleteName: activeAthlete.name,
      date: todayStr,
      durationMin: dur,
      preWeight: pre,
      postWeight: post,
      fluidsIntake: fluids,
      weightLoss: calc.weightLoss,
      dehydrationRate: calc.dehydrationRate,
      status: calc.status,
      refillNeededLiters: calc.refillNeededLiters,
      recommendation: calc.recommendation,
      biologicalImpact: calc.biologicalImpact,
      preWeightTime: todayEntry?.preWeightTime || todayEntry?.submittedAtPre || todayEntry?.createdAt || nowIso,
      submittedAtPre: todayEntry?.submittedAtPre || todayEntry?.preWeightTime || todayEntry?.createdAt || nowIso,
      postWeightTime: nowIso,
      submittedAtPost: nowIso,
      createdAt: todayEntry?.createdAt || nowIso,
    };

    saveHydrationLocally(fullEntry);

    try {
      await secureFetch('/api/hydration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullEntry),
      });
    } catch (err) {
      console.error('Erro no envio API pós-treino:', err);
    }

    try {
      secureFetch('/api/sync-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'hydration', entry: fullEntry }),
      }).catch(() => {});
    } catch {}

    const updatedList = getHydrationLocally(activeAthlete.id);
    setHistory(updatedList);
    setCurrentResult(fullEntry);
    setSavedPreWeight(pre);
    setStep('completed');
    setIsSubmitting(false);

    setFeedbackMsg(`🏆 Pesagem Pós-Treino concluída com sucesso! Perda: ${calc.weightLoss} kg | Taxa: ${calc.dehydrationRate}% | Reposição: ${calc.refillNeededLiters.toFixed(2)} L.`);
    setTimeout(() => setFeedbackMsg(null), 6000);
  };

  const getStatusBadge = (status: HydrationStatus) => {
    switch (status) {
      case 'Adequada':
        return (
          <span className="inline-flex items-center space-x-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-extrabold text-emerald-400 border border-emerald-500/40 shadow-sm">
            <CheckCircle className="h-4 w-4" />
            <span>{t.hydration.statusAdequate}</span>
          </span>
        );
      case 'Atenção':
        return (
          <span className="inline-flex items-center space-x-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-extrabold text-amber-400 border border-amber-500/40 shadow-sm animate-pulse">
            <AlertTriangle className="h-4 w-4" />
            <span>{t.hydration.statusCaution}</span>
          </span>
        );
      case 'Alerta':
        return (
          <span className="inline-flex items-center space-x-1.5 rounded-full bg-rose-600/30 px-3 py-1 text-xs font-extrabold text-rose-300 border border-rose-500/60 shadow-sm animate-bounce">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <span>{t.hydration.statusAlert}</span>
          </span>
        );
      case 'Pendente':
        return (
          <span className="inline-flex items-center space-x-1.5 rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-extrabold text-cyan-300 border border-cyan-500/40 shadow-sm">
            <Scale className="h-4 w-4" />
            <span>Pendente</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header Banner */}
      <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-dark-card via-cyan-950/20 to-dark-surface p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/30">
              <Scale className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-cyan-400">
                Registo de Hidratação na Aplicação
              </span>
              <h2 className="text-base font-black text-slate-100">{activeAthlete.name}</h2>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-extrabold text-cyan-300 block">{new Date().toLocaleDateString()}</span>
            <span className="text-[10px] text-slate-400 font-bold">
              {savedPreWeight !== null && step === 'completed'
                ? 'Concluído'
                : savedPreWeight !== null
                ? 'Pré-Treino Registado'
                : 'Pendente'}
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation for Pre vs Post Weigh-in */}
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-dark-surface p-1 border border-slate-800">
        <button
          type="button"
          onClick={() => setActiveSubTab('pre')}
          className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-extrabold transition-all ${
            activeSubTab === 'pre'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scale className="h-4 w-4" />
          <span>1. Pesagem PRÉ-Treino</span>
          {savedPreWeight !== null && <span className="ml-1 text-[10px]">✅</span>}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('post')}
          className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-extrabold transition-all ${
            activeSubTab === 'post'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Droplet className="h-4 w-4" />
          <span>2. Pesagem PÓS-Treino</span>
          {step === 'completed' && <span className="ml-1 text-[10px]">✅</span>}
        </button>
      </div>

      {feedbackMsg && (
        <div className="flex items-center space-x-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs font-extrabold text-emerald-300 animate-fade-in">
          <Sparkles className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* STAGE 1: Pre-Training Weight (À Chegada) */}
      {activeSubTab === 'pre' && (
        <form onSubmit={handlePreWeightSubmit} className="space-y-5 rounded-2xl border border-cyan-500/50 bg-dark-card p-5 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2 text-cyan-400">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 text-slate-950 text-xs font-black">1</span>
              <h3 className="text-sm font-black uppercase tracking-wide">ETAPA 1: À Chegada (Pré-Treino)</h3>
            </div>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
              Antes de treinar
            </span>
          </div>

          <p className="text-xs text-slate-300 font-medium">
            Subir para a balança no balneário e introduzir o peso em kg antes do aquecimento.
          </p>

          <div className="space-y-2 rounded-xl border border-slate-800 bg-dark-surface/80 p-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-extrabold text-slate-200">
                Peso Pré-Treino (kg) *
              </label>
              <span className="text-xs font-extrabold text-cyan-400">{preWeight} kg</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => adjustValue('pre', -0.5)}
                className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-black text-slate-300 hover:bg-slate-700 active:scale-95"
              >
                -0.5
              </button>
              <button
                type="button"
                onClick={() => adjustValue('pre', -0.1)}
                className="rounded-xl bg-slate-800 px-2.5 py-2 text-xs font-black text-slate-300 hover:bg-slate-700 active:scale-95"
              >
                -0.1
              </button>

              <input
                type="text"
                inputMode="decimal"
                required
                value={preWeight}
                onChange={(e) => setPreWeight(e.target.value)}
                className="w-full text-center rounded-xl border border-slate-700 bg-dark-bg p-3 text-xl font-black text-cyan-300 focus:border-cyan-400 focus:outline-none tracking-wider"
              />

              <button
                type="button"
                onClick={() => adjustValue('pre', 0.1)}
                className="rounded-xl bg-slate-800 px-2.5 py-2 text-xs font-black text-slate-300 hover:bg-slate-700 active:scale-95"
              >
                +0.1
              </button>
              <button
                type="button"
                onClick={() => adjustValue('pre', 0.5)}
                className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-black text-slate-300 hover:bg-slate-700 active:scale-95"
              >
                +0.5
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center space-x-2 rounded-xl bg-cyan-500 py-3.5 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/30 hover:bg-cyan-400 active:scale-98 transition-all"
          >
            <span>{isSubmitting ? 'A Guardar...' : 'Guardar Peso Pré-Treino (À Chegada)'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      )}

      {/* STAGE 2: Post-Training Weight (À Saída) */}
      {activeSubTab === 'post' && (
        <form onSubmit={handlePostWeightSubmit} className="space-y-5 rounded-2xl border border-amber-500/50 bg-dark-card p-5 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2 text-amber-400">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-slate-950 text-xs font-black">2</span>
              <h3 className="text-sm font-black uppercase tracking-wide">ETAPA 2: À Saída (Pós-Treino)</h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
              No final da sessão
            </span>
          </div>

          {/* Pre-Weight Read-Only Display in Stage 2 */}
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/30 p-3.5 flex items-center justify-between shadow-inner">
            <div className="flex items-center space-x-2.5">
              <CheckCircle className="h-5 w-5 text-cyan-400 shrink-0" />
              <div>
                <p className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider">Peso Pré-Treino Registado (À Chegada)</p>
                <p className="text-[10px] text-slate-400">Gravado na etapa 1 — Não editável</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-cyan-300">{savedPreWeight && savedPreWeight > 0 ? savedPreWeight : (parseNum(preWeight) || '—')} kg</span>
            </div>
          </div>

          {/* Post-Weight Editable Field */}
          <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-extrabold text-amber-300">
                2. Peso Pós-Treino (kg) — À Saída *
              </label>
              <span className="text-xs font-extrabold text-amber-400">{postWeight} kg</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => adjustValue('post', -0.5)}
                className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-black text-slate-300 hover:bg-slate-700 active:scale-95"
              >
                -0.5
              </button>
              <button
                type="button"
                onClick={() => adjustValue('post', -0.1)}
                className="rounded-xl bg-slate-800 px-2.5 py-2 text-xs font-black text-slate-300 hover:bg-slate-700 active:scale-95"
              >
                -0.1
              </button>

              <input
                type="text"
                inputMode="decimal"
                required
                value={postWeight}
                onChange={(e) => setPostWeight(e.target.value)}
                className="w-full text-center rounded-xl border border-amber-500/40 bg-dark-bg p-2.5 text-lg font-black text-amber-300 focus:border-amber-400 focus:outline-none tracking-wider"
              />

              <button
                type="button"
                onClick={() => adjustValue('post', 0.1)}
                className="rounded-xl bg-slate-800 px-2.5 py-2 text-xs font-black text-slate-300 hover:bg-slate-700 active:scale-95"
              >
                +0.1
              </button>
              <button
                type="button"
                onClick={() => adjustValue('post', 0.5)}
                className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-black text-slate-300 hover:bg-slate-700 active:scale-95"
              >
                +0.5
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Líquidos Ingeridos no Treino (L)
              </label>
              <input
                type="number"
                step="0.1"
                value={fluidsIntake}
                onChange={(e) => setFluidsIntake(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-dark-bg p-3 text-sm font-bold text-slate-100 focus:border-amber-400 focus:outline-none text-center"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Duração do Treino (min)
              </label>
              <input
                type="number"
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-dark-bg p-3 text-sm font-bold text-slate-100 focus:border-amber-400 focus:outline-none text-center"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center space-x-2 rounded-xl bg-amber-500 py-3.5 text-xs font-black text-slate-950 shadow-lg shadow-amber-500/30 hover:bg-amber-400 active:scale-98 transition-all"
          >
            <Check className="h-4 w-4" />
            <span>{isSubmitting ? 'A Calcular Hidratação...' : 'Concluir Pesagem & Ver Recomendações'}</span>
          </button>
        </form>
      )}

      {/* COMPLETED STATE: Display Full Analysis */}
      {step === 'completed' && currentResult && (
        <div className="space-y-4 animate-fade-in">
          <div
            className={`rounded-2xl border p-5 shadow-2xl transition-all ${
              currentResult.status === 'Adequada'
                ? 'border-emerald-500/40 bg-gradient-to-b from-dark-card to-emerald-950/20'
                : currentResult.status === 'Atenção'
                ? 'border-amber-500/50 bg-gradient-to-b from-dark-card to-amber-950/20'
                : 'border-rose-500/60 bg-gradient-to-b from-dark-card to-rose-950/30'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center space-x-2">
                <Droplet className="h-6 w-6 text-cyan-400 fill-cyan-400/20" />
                <div>
                  <span className="text-xs uppercase font-extrabold tracking-wider text-slate-300 block">
                    Pesagem de Hoje Concluída
                  </span>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5 flex-wrap mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-cyan-400" />
                      <span>Pré: <strong className="text-slate-200">{currentResult.preWeight} kg</strong> ({formatSubmissionTime(currentResult.preWeightTime || currentResult.submittedAtPre || currentResult.createdAt)})</span>
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-amber-400" />
                      <span>Pós: <strong className="text-slate-200">{currentResult.postWeight} kg</strong> ({formatSubmissionTime(currentResult.postWeightTime || currentResult.submittedAtPost || currentResult.createdAt)})</span>
                    </span>
                    <span className="text-amber-400 font-bold">(-{currentResult.weightLoss} kg)</span>
                  </div>
                </div>
              </div>
              {getStatusBadge(currentResult.status)}
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="rounded-xl border border-slate-800 bg-dark-bg/80 p-3.5 text-center">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  {t.hydration.dehydrationRate}
                </span>
                <span
                  className={`text-2xl font-black ${
                    currentResult.dehydrationRate < 1.0
                      ? 'text-emerald-400'
                      : currentResult.dehydrationRate <= 2.0
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {currentResult.dehydrationRate}%
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  ({currentResult.weightLoss.toFixed(2)} kg {t.hydration.weightLoss})
                </span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-dark-bg/80 p-3.5 text-center">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  {t.hydration.refillNeeded}
                </span>
                <span className="text-2xl font-black text-cyan-400">
                  {currentResult.refillNeededLiters.toFixed(2)} L
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  (150% da perda de massa)
                </span>
              </div>
            </div>

            {/* Detailed Medical Recommendation */}
            <div className="space-y-3 border-t border-slate-800/80 pt-4">
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3 text-xs">
                <span className="font-extrabold text-cyan-300 block mb-1">
                  {t.hydration.actionRequired}
                </span>
                <p className="text-slate-200 leading-relaxed font-medium">
                  {currentResult.recommendation}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-dark-bg/60 p-3 text-xs">
                <span className="font-extrabold text-slate-400 block mb-1">
                  {t.hydration.biologicalImpact}
                </span>
                <p className="text-slate-300 font-medium">{currentResult.biologicalImpact}</p>
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setPreWeight(currentResult.preWeight.toString());
                  setPostWeight(currentResult.postWeight.toString());
                  setFluidsIntake(currentResult.fluidsIntake.toString());
                  setSavedPreWeight(currentResult.preWeight);
                  setStep('post');
                }}
                className="flex items-center space-x-1.5 text-xs font-bold text-cyan-300 hover:text-cyan-200 bg-cyan-500/20 border border-cyan-500/40 px-3.5 py-2 rounded-xl transition-all active:scale-95"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>✏️ Editar Pesagem de Hoje</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History List for Active Athlete */}
      {history.length > 0 && (
        <div className="space-y-3 rounded-2xl border border-slate-800 bg-dark-card p-4">
          <div className="flex items-center space-x-2 text-slate-300 border-b border-slate-800 pb-2">
            <History className="h-4 w-4 text-cyan-400" />
            <h3 className="text-xs font-extrabold uppercase">{t.hydration.history}</h3>
          </div>

          <div className="space-y-2">
            {history.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-dark-bg p-3 text-xs"
              >
                <div>
                  <span className="font-bold text-slate-200 block">{item.date}</span>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                    <span>Pré: <strong className="text-slate-300">{item.preWeight} kg</strong> ({formatSubmissionTime(item.preWeightTime || item.submittedAtPre || item.createdAt)})</span>
                    <span>&rarr;</span>
                    <span>{item.postWeight > 0 ? <>Pós: <strong className="text-slate-300">{item.postWeight} kg</strong> ({formatSubmissionTime(item.postWeightTime || item.submittedAtPost || item.createdAt)})</> : 'Aguardando Pós'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-cyan-400 block">{item.dehydrationRate}%</span>
                  <span className="text-[10px] text-slate-400">{item.refillNeededLiters} L reposição</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
