'use client';

import React, { useState, useEffect } from 'react';
import { Athlete } from '@/lib/types';
import {
  AthleteNutritionRecord,
  getNutritionForAthlete,
  getStatusStyle,
  SKF_THRESHOLDS,
  NutritionStatusLevel,
} from '@/lib/nutritionData';
import {
  Scale,
  TrendingDown,
  TrendingUp,
  Target,
  Award,
  Info,
  ShieldCheck,
  Activity,
  Calendar,
  Sparkles,
  Flame,
  Apple,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface AthleteNutritionCardProps {
  athlete: Athlete | null;
}

export const AthleteNutritionCard: React.FC<AthleteNutritionCardProps> = ({ athlete }) => {
  const [record, setRecord] = useState<AthleteNutritionRecord | null>(null);

  const loadData = () => {
    if (!athlete) {
      setRecord(null);
      return;
    }
    const rec = getNutritionForAthlete(athlete.id, athlete.name);
    setRecord(rec);
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('femperf_nutrition_updated', handleUpdate);
    return () => {
      window.removeEventListener('femperf_nutrition_updated', handleUpdate);
    };
  }, [athlete]);

  if (!athlete) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-dark-card p-6 text-center text-slate-400">
        <Scale className="mx-auto h-8 w-8 text-slate-600 mb-2" />
        <p className="text-sm font-semibold">Nenhuma jogadora selecionada.</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-dark-card p-6 text-center space-y-3">
        <Scale className="mx-auto h-8 w-8 text-amber-500 mb-1" />
        <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">
          Avaliação Nutricional &bull; {athlete.name}
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Ainda não constam registos antropométricos para o teu perfil na base de dados de performance. Solicita a inclusão da tua ficha ao departamento de nutrição/performance.
        </p>
      </div>
    );
  }

  // Current November (or latest) evaluation
  const nov = record.history.november;
  const out = record.history.october;
  const set = record.history.september;
  const ago = record.history.august;

  const currentWeight = nov?.weight ?? record.augustWeightKg;
  const targetWeight = record.targetWeightKg;
  const weightDiff = currentWeight - targetWeight;
  const currentFatPct = nov?.fatMassPct !== undefined ? nov.fatMassPct * 100 : record.augustFatMassPct * 100;
  const currentMuscleKg = nov?.muscleMassKg ?? record.augustMuscleMassKg;
  const currentSkf = nov?.skf ?? null;
  const currentStatus: NutritionStatusLevel = nov?.status ?? 'Adequada';
  const statusStyle = getStatusStyle(currentStatus);

  // Compute Delta (Ago vs Nov)
  const initialSkf = ago?.skf ?? null;
  const skfDelta = initialSkf !== null && currentSkf !== null ? currentSkf - initialSkf : null;

  const months = [
    { label: 'Agosto', data: ago },
    { label: 'Setembro', data: set },
    { label: 'Outubro', data: out },
    { label: 'Novembro', data: nov, isCurrent: true },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              <Apple className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  {record.position} &bull; GIL VICENTE FC
                </span>
                <span className="flex items-center text-[10px] font-bold text-slate-400">
                  <ShieldCheck className="h-3 w-3 text-emerald-400 mr-1" />
                  Acesso Pessoal Privado
                </span>
              </div>
              <h2 className="text-lg font-black text-white tracking-tight mt-0.5">
                {record.fullName}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 shadow-sm ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}>
              <Activity className="h-3.5 w-3.5" />
              <span>Status: {currentStatus}</span>
            </div>
          </div>
        </div>

        {/* Height and General info strip */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
          <div className="flex items-center space-x-1">
            <span className="text-slate-500 font-bold">Estatura:</span>
            <span className="font-mono font-extrabold text-white">{record.heightCm} cm</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-slate-500 font-bold">Última Avaliação:</span>
            <span className="font-mono font-extrabold text-emerald-400">Novembro 2026</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-slate-500 font-bold">Meta Clube:</span>
            <span className="font-mono font-extrabold text-emerald-300">∑8SKF ≤ 80.0 mm</span>
          </div>
        </div>
      </div>

      {/* Body Composition KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Peso Atual */}
        <div className="rounded-2xl border border-slate-800 bg-dark-card p-3.5 flex flex-col justify-between hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Peso Atual</span>
            <Scale className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-white font-mono">
              {currentWeight.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-slate-400">kg</span>
          </div>
          <div className="mt-1 text-[11px] font-semibold text-slate-400">
            Base Ago: {record.augustWeightKg.toFixed(1)} kg
          </div>
        </div>

        {/* Peso Alvo & Diferencial */}
        <div className="rounded-2xl border border-slate-800 bg-dark-card p-3.5 flex flex-col justify-between hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Peso Alvo</span>
            <Target className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-cyan-300 font-mono">
              {targetWeight.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-slate-400">kg</span>
          </div>
          <div className="mt-1 flex items-center space-x-1">
            {Math.abs(weightDiff) < 0.1 ? (
              <span className="inline-flex items-center text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3 mr-0.5" /> No Alvo
              </span>
            ) : weightDiff > 0 ? (
              <span className="inline-flex items-center text-[10px] font-extrabold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                <TrendingUp className="h-3 w-3 mr-0.5" /> +{weightDiff.toFixed(1)} kg do alvo
              </span>
            ) : (
              <span className="inline-flex items-center text-[10px] font-extrabold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
                <TrendingDown className="h-3 w-3 mr-0.5" /> {weightDiff.toFixed(1)} kg do alvo
              </span>
            )}
          </div>
        </div>

        {/* % Massa Gorda */}
        <div className="rounded-2xl border border-slate-800 bg-dark-card p-3.5 flex flex-col justify-between hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>% Massa Gorda</span>
            <Flame className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-rose-300 font-mono">
              {currentFatPct.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-slate-400">%</span>
          </div>
          <div className="mt-1 text-[11px] font-semibold text-slate-400">
            Fórmula Faulkner / ISAK
          </div>
        </div>

        {/* Massa Muscular */}
        <div className="rounded-2xl border border-slate-800 bg-dark-card p-3.5 flex flex-col justify-between hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Massa Muscular</span>
            <Sparkles className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-indigo-300 font-mono">
              {currentMuscleKg.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-slate-400">kg</span>
          </div>
          <div className="mt-1 text-[11px] font-semibold text-slate-400">
            Massa magra ativa
          </div>
        </div>
      </div>

      {/* ∑8SKF Progress & Timeline */}
      <div className="rounded-2xl border border-slate-800 bg-dark-card p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
              Evolução Temporal
            </span>
            <h3 className="text-sm sm:text-base font-black text-white flex items-center space-x-2">
              <span>Somatório 8 Pregas Cutâneas (∑8SKF)</span>
              <Award className="h-4 w-4 text-amber-400" />
            </h3>
          </div>
          {skfDelta !== null && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Evolução Ago &rarr; Nov:</span>
              <span
                className={`px-2.5 py-1 rounded-xl font-mono text-xs font-black flex items-center space-x-1 ${
                  skfDelta <= 0
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {skfDelta <= 0 ? (
                  <TrendingDown className="h-3.5 w-3.5 mr-0.5" />
                ) : (
                  <TrendingUp className="h-3.5 w-3.5 mr-0.5" />
                )}
                <span>
                  {skfDelta > 0 ? `+${skfDelta.toFixed(1)}` : skfDelta.toFixed(1)} mm
                </span>
              </span>
            </div>
          )}
        </div>

        {/* 4-Month Step Visualizer */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {months.map((m) => {
            const val = m.data?.skf;
            const status = m.data?.status ?? 'Adequada';
            const style = getStatusStyle(status);

            return (
              <div
                key={m.label}
                className={`rounded-xl p-3 border transition-all ${
                  m.isCurrent
                    ? 'border-emerald-500/50 bg-emerald-950/20 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                    : 'border-slate-800/90 bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                  <span className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3 text-slate-500" />
                    <span className={m.isCurrent ? 'text-emerald-400 font-black' : ''}>
                      {m.label}
                    </span>
                  </span>
                  {m.isCurrent && (
                    <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                      Atual
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-baseline space-x-1">
                  {val !== undefined && val !== null ? (
                    <>
                      <span className="text-xl font-black font-mono text-white">
                        {val.toFixed(1)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">mm</span>
                    </>
                  ) : (
                    <span className="text-sm font-bold text-slate-500 italic">Sem dados</span>
                  )}
                </div>

                {val !== undefined && val !== null && (
                  <div className="mt-2">
                    <span
                      className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded border ${style.bg} ${style.border} ${style.text}`}
                    >
                      {status}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Club Guidelines Legend */}
        <div className="rounded-xl border border-slate-800/90 bg-slate-950/60 p-3 text-xs space-y-2">
          <div className="flex items-center space-x-1.5 text-slate-300 font-extrabold text-[11px]">
            <Info className="h-3.5 w-3.5 text-cyan-400" />
            <span>Escala Canónica ISAK &bull; Gil Vicente FC:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
            <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 font-semibold flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
              <span>Adequada: &le; 80.0 mm</span>
            </div>
            <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-300 font-semibold flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
              <span>Atenção: 80.1 &ndash; 90.0 mm</span>
            </div>
            <div className="p-2 rounded-lg bg-orange-950/30 border border-orange-500/30 text-orange-300 font-semibold flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-orange-400 shrink-0" />
              <span>Alerta: 90.1 &ndash; 100.0 mm</span>
            </div>
            <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 font-semibold flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-400 shrink-0" />
              <span>Risco: &gt; 100.0 mm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Recommendations Card */}
      <div className="rounded-2xl border border-slate-800 bg-dark-card p-4 sm:p-5 space-y-3">
        <div className="flex items-center space-x-2 text-white font-extrabold text-sm border-b border-slate-800/80 pb-2.5">
          <Apple className="h-4 w-4 text-emerald-400" />
          <span>Recomendações Nutricionais & Performance</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
          <div className="rounded-xl border border-slate-800/90 bg-slate-900/50 p-3 space-y-1.5">
            <span className="text-[11px] font-black uppercase text-emerald-400 flex items-center space-x-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Janela de Recuperação</span>
            </span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Consumir 20 a 25g de proteína de alto valor biológico nos 30 a 45 minutos seguintes ao treino de campo ou ginásio para maximizar a síntese proteica muscular.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800/90 bg-slate-900/50 p-3 space-y-1.5">
            <span className="text-[11px] font-black uppercase text-cyan-400 flex items-center space-x-1">
              <Activity className="h-3.5 w-3.5" />
              <span>Hidratação Individualizada</span>
            </span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Monitoriza o teu peso na aba <strong className="text-cyan-300">3. Pesagem</strong> antes e depois do treino para repores 150% do líquido perdido por cada quilo corporal eliminado.
            </p>
          </div>
        </div>

        {record.notes && (
          <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
            <span className="font-extrabold block text-amber-300 mb-1">Nota da Equipa Técnica:</span>
            {record.notes}
          </div>
        )}
      </div>
    </div>
  );
};
