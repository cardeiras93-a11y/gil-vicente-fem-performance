'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getStoredTrainingSessions } from '@/lib/storage';
import { TrainingSessionInfo } from '@/lib/types';
import {
  COMPLEMENTARY_WORK_ITEMS,
  hasAnyComplementaryWork,
  getActiveComplementaryItems,
  getWeekDates,
  getDayNamePt,
  formatDatePtShort,
} from '@/lib/complementaryWork';
import { Dumbbell, Calendar, ChevronDown, ChevronUp, Sparkles, CheckCircle2, Info, FileText } from 'lucide-react';
import { WeeklyPlanExportModal } from './WeeklyPlanExportModal';

interface AthleteComplementaryWorkCardProps {
  currentDate?: string; // YYYY-MM-DD (defaults to today)
}

export const AthleteComplementaryWorkCard: React.FC<AthleteComplementaryWorkCardProps> = ({
  currentDate,
}) => {
  const [sessions, setSessions] = useState<Record<string, TrainingSessionInfo>>({});
  const [showFullWeek, setShowFullWeek] = useState(false);
  const [showPosterModal, setShowPosterModal] = useState(false);

  const todayStr = useMemo(() => {
    if (currentDate) return currentDate;
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [currentDate]);

  useEffect(() => {
    const load = () => {
      setSessions(getStoredTrainingSessions());
    };
    load();
    window.addEventListener('femperf_data_updated', load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener('femperf_data_updated', load);
      window.removeEventListener('storage', load);
    };
  }, []);

  const todaySession = sessions[todayStr];
  const todayComp = todaySession?.complementaryWork;
  const hasTodayWork = hasAnyComplementaryWork(todayComp);
  const activeTodayItems = useMemo(() => getActiveComplementaryItems(todayComp), [todayComp]);

  const weekDates = useMemo(() => getWeekDates(todayStr), [todayStr]);

  // Check if any day in the week has complementary work configured
  const hasAnyWeekWork = useMemo(() => {
    return weekDates.some((d) => hasAnyComplementaryWork(sessions[d]?.complementaryWork));
  }, [weekDates, sessions]);

  // If there's neither today work nor any work planned for the week and day is not set, we still show a compact card
  const todayDayType = todaySession?.dayType || 'training';

  return (
    <div className="rounded-2xl border border-slate-800 bg-dark-card p-4 space-y-3.5 shadow-lg relative overflow-hidden animate-fade-in">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300">
            <Dumbbell className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-black uppercase text-slate-100">
                Trabalho Complementar & Recuperação
              </h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wide">
                ⚡ Sempre Pós-Treino
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              {getDayNamePt(todayStr)} ({formatDatePtShort(todayStr)}) • {todaySession?.matchDayOffset || 'MD'}
            </p>
          </div>
        </div>

        {/* Toggle Full Week Button */}
        <button
          type="button"
          onClick={() => setShowFullWeek(!showFullWeek)}
          className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-extrabold rounded-xl border border-slate-700 bg-slate-900/80 text-slate-300 hover:text-white hover:border-slate-500 transition-all cursor-pointer"
        >
          <Calendar className="h-3 w-3 text-purple-400" />
          <span>{showFullWeek ? 'Fechar Semana' : 'Ver Semana'}</span>
          {showFullWeek ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {/* Mandatory Post-Training Notice */}
      <div className="flex items-center space-x-2 p-2 px-3 rounded-xl border border-amber-500/40 bg-amber-950/20 text-amber-300 text-[11px] font-bold">
        <span className="text-sm shrink-0">⚡</span>
        <span>Este trabalho complementar deve ser realizado <strong>SEMPRE APÓS O TREINO</strong> de campo.</span>
      </div>

      {/* Today's Prescriptions */}
      <div className="space-y-2.5">
        {hasTodayWork ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {activeTodayItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start space-x-2.5 p-2.5 rounded-xl border transition-all ${item.badgeClass}`}
                >
                  <span className="text-lg shrink-0 leading-none">{item.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black leading-tight text-white">{item.shortLabel}</p>
                    <p className="text-[10px] text-slate-300/80 leading-snug line-clamp-2 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {todayComp?.notes && (
              <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-2.5 flex items-start space-x-2">
                <Info className="h-3.5 w-3.5 text-purple-400 shrink-0 mt-0.5" />
                <p className="text-xs text-purple-200 font-medium italic">
                  &quot;{todayComp.notes}&quot;
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="p-3 rounded-xl border border-slate-800 bg-dark-bg/60 text-center space-y-1">
            <p className="text-xs font-extrabold text-slate-300">
              {todayDayType === 'rest'
                ? '🏖️ Dia de Folga — Recuperação Passiva'
                : todayDayType === 'match'
                ? '🏆 Dia de Jogo — Foco Total na Competição'
                : '⚽ Foco no Treino de Campo'}
            </p>
            <p className="text-[11px] text-slate-400">
              Sem trabalho complementar prescrito para hoje. Hidrata-te bem e cumpre o descanso!
            </p>
          </div>
        )}
      </div>

      {/* Expandable Full Week Overview */}
      {showFullWeek && (
        <div className="mt-3 pt-3 border-t border-slate-800 space-y-2.5 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-slate-300 flex items-center space-x-1.5">
              <Calendar className="h-3.5 w-3.5 text-brand-lime" />
              <span>Microciclo Semanal • Trabalho Pós-Treino</span>
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                {formatDatePtShort(weekDates[0])} — {formatDatePtShort(weekDates[6])}
              </span>
              <button
                type="button"
                onClick={() => setShowPosterModal(true)}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-purple-500/40 bg-purple-950/60 hover:bg-purple-900/70 text-purple-200 text-[10px] font-bold transition-all shadow-sm active:scale-98 cursor-pointer"
              >
                <FileText className="h-3 w-3 text-purple-300" />
                <span>Ver Poster</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2">
            {weekDates.map((dateStr) => {
              const isToday = dateStr === todayStr;
              const s = sessions[dateStr];
              const comp = s?.complementaryWork;
              const hasWork = hasAnyComplementaryWork(comp);
              const items = getActiveComplementaryItems(comp);
              const dayType = s?.dayType || 'training';

              return (
                <div
                  key={dateStr}
                  className={`p-2.5 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                    isToday
                      ? 'border-brand-lime bg-brand-lime/10 ring-1 ring-brand-lime shadow-md'
                      : 'border-slate-800 bg-dark-bg/80'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[11px] text-slate-200">
                        {getDayNamePt(dateStr).split('-')[0]}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {formatDatePtShort(dateStr)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {s?.matchDayOffset || (dayType === 'match' ? 'MD' : 'MD-?')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold truncate">
                        {dayType === 'match' ? '🏆 Jogo' : dayType === 'rest' ? '🏖️ Folga' : '⚽ Treino'}
                      </span>
                    </div>

                    {hasWork ? (
                      <div className="space-y-1 pt-1">
                        {items.map((it) => (
                          <div
                            key={it.id}
                            className="flex items-center space-x-1 text-[10px] font-bold text-slate-300"
                          >
                            <span>{it.icon}</span>
                            <span className="truncate">{it.shortLabel}</span>
                          </div>
                        ))}
                        {comp?.notes && (
                          <p className="text-[9px] text-purple-300 italic truncate pt-0.5">
                            &quot;{comp.notes}&quot;
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="pt-2 text-[10px] text-slate-500 italic">
                        {dayType === 'rest' ? 'Descanso' : 'Sem extra'}
                      </div>
                    )}
                  </div>

                  {isToday && (
                    <div className="mt-2 pt-1 border-t border-brand-lime/30 text-center">
                      <span className="text-[9px] font-black text-brand-lime uppercase">
                        📍 Hoje
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Weekly Plan Poster Export Modal */}
      <WeeklyPlanExportModal
        isOpen={showPosterModal}
        onClose={() => setShowPosterModal(false)}
        microcycleTitle="Planeamento Semanal de Extra-Treino"
        weekDates={weekDates}
        sessions={sessions}
        initialLang="pt"
      />
    </div>
  );
};
