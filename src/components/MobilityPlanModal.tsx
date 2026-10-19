'use client';

import React, { useState, useEffect } from 'react';
import { MobilityPlan, Athlete } from '@/lib/types';
import { ExerciseIllustration } from './ExerciseIllustration';
import { useLanguage } from '@/context/LanguageContext';
import {
  isMobilityCompletedToday,
  toggleMobilityCompletedToday,
} from '@/lib/mobilityPlans';
import {
  X,
  Clock,
  Zap,
  Flame,
  CheckCircle2,
  Sparkles,
  Share2,
  Printer,
  ChevronRight,
  ShieldCheck,
  Dumbbell,
  Globe,
} from 'lucide-react';

interface MobilityPlanModalProps {
  plan: MobilityPlan | null;
  athlete?: Athlete | null;
  isOpen: boolean;
  onClose: () => void;
  initialLang?: 'pt' | 'en';
}

export const MobilityPlanModal: React.FC<MobilityPlanModalProps> = ({
  plan,
  athlete,
  isOpen,
  onClose,
  initialLang,
}) => {
  const { language: globalLang } = useLanguage();
  const [lang, setLang] = useState<'pt' | 'en'>(initialLang || (globalLang === 'en' ? 'en' : 'pt'));
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (initialLang) {
      setLang(initialLang);
    } else {
      setLang(globalLang === 'en' ? 'en' : 'pt');
    }
  }, [initialLang, globalLang, isOpen]);

  useEffect(() => {
    if (athlete && plan && isOpen) {
      setIsCompleted(isMobilityCompletedToday(athlete.id, plan.id));
    }
  }, [athlete, plan, isOpen]);

  if (!isOpen || !plan) return null;

  const isEn = lang === 'en';

  const handleToggleComplete = () => {
    if (!athlete || !plan) return;
    const newState = toggleMobilityCompletedToday(athlete.id, plan.id);
    setIsCompleted(newState);
    if (newState) {
      setFeedback(isEn ? '✓ Marked as completed today!' : '✓ Marcado como concluído hoje!');
    } else {
      setFeedback(isEn ? 'Marked as not completed' : 'Desmarcado');
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-5xl my-auto rounded-3xl border border-slate-700/80 bg-gradient-to-b from-slate-900 via-dark-card to-dark-bg p-3.5 sm:p-6 shadow-2xl space-y-4 max-h-[94vh] flex flex-col">
        {/* Top Control Bar: Language Switcher, Print, Close */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
              <Globe className="h-3.5 w-3.5 text-cyan-400" />
              <span>Idioma / Language:</span>
            </span>
            <div className="flex items-center rounded-xl bg-slate-800 p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setLang('pt')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                  lang === 'pt'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🇵🇹 PT
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                  lang === 'en'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🇬🇧 EN
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              title={isEn ? 'Print or save PDF' : 'Imprimir ou guardar PDF'}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-bold transition-all flex items-center space-x-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isEn ? 'Print / PDF' : 'Imprimir'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Poster Body */}
        <div className="overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {/* Main Poster Header */}
          <div className="rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-950/60 via-dark-card to-dark-card p-3.5 sm:p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="relative flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-dark-card p-1.5 border border-red-500/50 shadow-md">
                  <img
                    src="/gil-vicente-crest.png"
                    alt="Gil Vicente FC"
                    className="h-10 w-10 sm:h-11 sm:w-11 object-contain drop-shadow"
                  />
                </div>
                <div>
                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-300">
                    GIL VICENTE FUTEBOL CLUBE • ÉPOCA 2026/2027 • {isEn ? 'NATIONAL II DIVISION' : 'CAMPEONATO NACIONAL II DIVISÃO FEMININA'}
                  </p>
                  <h2 className="text-sm sm:text-lg md:text-xl font-black text-slate-100 uppercase tracking-tight mt-0.5">
                    {isEn ? plan.titleEn : plan.titlePt}
                  </h2>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-500/20 text-teal-300 border border-teal-500/40 uppercase">
                      <ShieldCheck className="h-3 w-3" />
                      <span>{isEn ? plan.categoryEn : plan.categoryPt}</span>
                    </span>
                    {athlete && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                        👤 {athlete.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Duration Badge */}
              <div className="flex sm:flex-col items-center justify-center bg-dark-bg/90 border border-slate-700/80 px-4 py-2 sm:py-2.5 rounded-2xl shadow-inner shrink-0 self-start sm:self-auto space-x-2 sm:space-x-0">
                <span className="text-xl sm:text-2xl font-black text-brand-lime leading-none">
                  {plan.durationMinutes} MIN
                </span>
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                  {isEn ? 'DURATION' : 'DURAÇÃO'}
                </span>
              </div>
            </div>
          </div>

          {/* Warmup & Finisher Strips */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {/* Warm-up */}
            <div className="rounded-xl border border-sky-500/40 bg-sky-950/20 p-2.5 sm:p-3 flex items-start space-x-2.5">
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-sky-500 text-slate-950 text-[10px] font-black uppercase shrink-0 shadow-sm">
                <Zap className="h-3 w-3" />
                <span>{isEn ? 'WARM-UP' : 'AQUECIMENTO'}</span>
              </span>
              <p className="text-xs text-sky-200/90 font-medium leading-relaxed">
                {isEn ? plan.warmupEn : plan.warmupPt}
              </p>
            </div>

            {/* Finisher */}
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-2.5 sm:p-3 flex items-start space-x-2.5">
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[10px] font-black uppercase shrink-0 shadow-sm">
                <Flame className="h-3 w-3" />
                <span>{isEn ? 'FINISHER' : 'FINISHER FINAL'}</span>
              </span>
              <p className="text-xs text-rose-200/90 font-medium leading-relaxed">
                {isEn ? plan.finisherEn : plan.finisherPt}
              </p>
            </div>
          </div>

          {/* 4 Blocks of Exercises */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {plan.blocks.map((block) => (
              <div
                key={block.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 sm:p-4 space-y-3 shadow-md hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                {/* Block Header */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-lg bg-brand-cyan text-slate-950 text-[11px] font-black shrink-0">
                      {block.number}
                    </span>
                    <h3 className="text-xs sm:text-[13px] font-black text-slate-100 uppercase tracking-tight line-clamp-1">
                      {isEn ? block.titleEn : block.titlePt}
                    </h3>
                  </div>
                  <span className="text-[10px] font-extrabold text-cyan-400 flex items-center space-x-1 shrink-0 bg-cyan-950/50 px-2 py-0.5 rounded-md border border-cyan-800/50">
                    <Clock className="h-3 w-3" />
                    <span>{block.durationMinutes} MIN</span>
                  </span>
                </div>

                {/* Exercises in Block */}
                <div className="space-y-3">
                  {block.exercises.map((ex) => (
                    <div
                      key={ex.id}
                      className="rounded-xl border border-slate-800/80 bg-dark-card/90 p-2.5 sm:p-3 space-y-2 hover:border-slate-700 transition-all"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                        {/* Dynamic SVG Vector Drawing */}
                        <div className="sm:col-span-5 rounded-lg bg-slate-950/70 border border-slate-800/60 p-1 flex items-center justify-center overflow-hidden">
                          <ExerciseIllustration drawingKey={ex.drawingKey} />
                        </div>

                        {/* Exercise Details */}
                        <div className="sm:col-span-7 space-y-1.5">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="text-xs font-black text-slate-100 leading-tight">
                              {isEn ? ex.nameEn : ex.namePt}
                            </h4>
                            <span className="text-[10px] font-black text-brand-lime bg-lime-500/10 border border-lime-500/30 px-2 py-0.5 rounded-full shrink-0">
                              {isEn ? ex.seriesRepsEn : ex.seriesRepsPt}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
                            {isEn ? ex.descriptionEn : ex.descriptionPt}
                          </p>

                          <div className="flex items-center space-x-1 text-[10px] font-bold text-slate-400">
                            <Clock className="h-3 w-3 text-amber-400 shrink-0" />
                            <span>{isEn ? ex.restEn : ex.restPt}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer with Completion Action */}
        <div className="border-t border-slate-800 pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 font-medium">
            {feedback && (
              <span className="text-emerald-400 font-bold animate-fade-in flex items-center space-x-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>{feedback}</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {athlete && (
              <button
                type="button"
                onClick={handleToggleComplete}
                className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-md active:scale-95 ${
                  isCompleted
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30 border border-emerald-500'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <CheckCircle2 className={`h-4 w-4 ${isCompleted ? 'text-white' : 'text-slate-400'}`} />
                <span>
                  {isCompleted
                    ? (isEn ? '✓ Completed Today' : '✓ Concluído Hoje')
                    : (isEn ? 'Mark as Completed' : 'Marcar como Feito Hoje')}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 active:scale-95 text-center"
            >
              {isEn ? 'Close' : 'Fechar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
