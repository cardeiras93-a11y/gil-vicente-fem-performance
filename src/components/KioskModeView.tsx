'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Athlete, WellnessEntry, RPEEntry, HydrationEntry } from '@/lib/types';
import {
  getAthleteAvatar,
  saveHydrationLocally,
  getHydrationLocally,
  getDynamicAthletes
} from '@/lib/storage';
import { calculateHydrationStatus } from '@/lib/data';
import { secureFetch } from '@/lib/authGuard';
import { WellnessForm } from '@/components/WellnessForm';
import { RPEForm } from '@/components/RPEForm';
import {
  Scale, HeartPulse, Dumbbell, ArrowLeft, Search, CheckCircle2,
  Clock, Check, ChevronRight, Sparkles, AlertCircle, RefreshCw,
  User, Users, Delete, Maximize, Minimize, Tablet, SunMedium
} from 'lucide-react';

interface KioskModeViewProps {
  onClose: () => void;
  athletes?: Athlete[];
  wellnessList: WellnessEntry[];
  rpeList: RPEEntry[];
  hydrationList: HydrationEntry[];
}

export type KioskMode = 'all' | 'quick_weight' | 'wellness' | 'rpe';

export const KioskModeView: React.FC<KioskModeViewProps> = ({
  onClose,
  athletes: initialAthletes,
  wellnessList,
  rpeList,
  hydrationList,
}) => {
  const [athletes, setAthletes] = useState<Athlete[]>(() => initialAthletes || getDynamicAthletes());
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [kioskMode, setKioskMode] = useState<KioskMode>('all');
  const [activeFormType, setActiveFormType] = useState<'weight' | 'wellness' | 'rpe' | null>(null);

  // Search & Position filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [positionFilter, setPositionFilter] = useState<'all' | 'GR' | 'DEF' | 'MED' | 'AV'>('all');

  // Quick weight keypad state
  const [weightStage, setWeightStage] = useState<'pre' | 'post'>('pre');
  const [weightInputStr, setWeightInputStr] = useState<string>('60.0');
  const [isSubmittingWeight, setIsSubmittingWeight] = useState<boolean>(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Tablet Optimization: Wake Lock state (keeps tablet display always awake in balneário)
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);

  // Tablet Optimization: Native Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Inactivity auto-reset timer (60s countdown)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const todayStr = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Haptic feedback & audio feedback for touch interaction on tablets
  const triggerHaptic = (ms: number = 15) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(ms);
      }
    } catch {}
  };

  const playTapBeep = () => {
    try {
      if (typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          gain.gain.setValueAtTime(0.03, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.04);
        }
      }
    } catch {}
  };

  // Screen Wake Lock API: Keeps tablet screen ON indefinitely while in Kiosk mode
  useEffect(() => {
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      try {
        if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
          setWakeLockActive(true);
          wakeLock.addEventListener('release', () => {
            setWakeLockActive(false);
          });
        }
      } catch {
        setWakeLockActive(false);
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, []);

  // Fullscreen event listener (iPadOS / iOS 16.4+ & Android)
  useEffect(() => {
    const checkFullscreen = () => {
      const isDocFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isDocFs);
    };

    document.addEventListener('fullscreenchange', checkFullscreen);
    document.addEventListener('webkitfullscreenchange', checkFullscreen);
    return () => {
      document.removeEventListener('fullscreenchange', checkFullscreen);
      document.removeEventListener('webkitfullscreenchange', checkFullscreen);
    };
  }, []);

  const toggleFullscreen = async () => {
    triggerHaptic(20);
    try {
      if (!isFullscreen) {
        const el = document.documentElement as any;
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
          await el.webkitRequestFullscreen();
        } else if (el.mozRequestFullScreen) {
          await el.mozRequestFullScreen();
        } else if (el.msRequestFullscreen) {
          await el.msRequestFullscreen();
        }
      } else {
        const doc = document as any;
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      }
    } catch {}
  };

  const resetInactivityTimer = () => {
    setSecondsRemaining(60);
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    if (selectedAthlete) {
      countdownIntervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setSelectedAthlete(null);
            setActiveFormType(null);
            return 60;
          }
          return prev - 1;
        });
      }, 1000);

      inactivityTimerRef.current = setTimeout(() => {
        setSelectedAthlete(null);
        setActiveFormType(null);
      }, 60000);
    }
  };

  useEffect(() => {
    const handleUserActivity = () => resetInactivityTimer();
    window.addEventListener('touchstart', handleUserActivity, { passive: true });
    window.addEventListener('click', handleUserActivity, { passive: true });
    window.addEventListener('keydown', handleUserActivity, { passive: true });

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
    };
  }, [selectedAthlete]);

  // Keep athletes list up to date
  useEffect(() => {
    const handleUpdate = () => {
      setAthletes(getDynamicAthletes());
    };
    window.addEventListener('femperf_data_updated', handleUpdate);
    return () => window.removeEventListener('femperf_data_updated', handleUpdate);
  }, []);

  // Filter athletes
  const filteredAthletes = useMemo(() => {
    return athletes.filter((a) => {
      if (a.isActive === false) return false;
      const matchSearch =
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(a.jerseyNumber || '').includes(searchQuery);

      if (!matchSearch) return false;

      if (positionFilter === 'all') return true;
      const pos = (a.position || '').toUpperCase();
      if (positionFilter === 'GR') return pos.includes('GR') || pos.includes('GUARDA');
      if (positionFilter === 'DEF') return pos.includes('DC') || pos.includes('LAT') || pos.includes('DEF') || pos.includes('CENTRAL');
      if (positionFilter === 'MED') return pos.includes('MED') || pos.includes('VOL') || pos.includes('MEIO');
      if (positionFilter === 'AV') return pos.includes('AV') || pos.includes('EXT') || pos.includes('PL') || pos.includes('ATA');
      return true;
    });
  }, [athletes, searchQuery, positionFilter]);

  // Status mapping for today
  const athleteTodayStatus = useMemo(() => {
    const map: Record<string, {
      wellness: boolean;
      preWeight: number | null;
      postWeight: number | null;
      rpe: number | null;
    }> = {};

    athletes.forEach((ath) => {
      const wel = wellnessList.some((w) => w.athleteId === ath.id && w.date === todayStr);
      const hyd = hydrationList.find((h) => h.athleteId === ath.id && h.date === todayStr);
      const rpe = rpeList.find((r) => r.athleteId === ath.id && r.date === todayStr);

      map[ath.id] = {
        wellness: wel,
        preWeight: hyd && hyd.preWeight > 0 ? hyd.preWeight : null,
        postWeight: hyd && hyd.postWeight > 0 ? hyd.postWeight : null,
        rpe: rpe && rpe.physicalDemand > 0 ? rpe.physicalDemand : null,
      };
    });

    return map;
  }, [athletes, wellnessList, hydrationList, rpeList, todayStr]);

  // Overall today counts
  const todayCounts = useMemo(() => {
    const total = athletes.filter((a) => a.isActive !== false).length || 1;
    let welCount = 0;
    let preCount = 0;
    let postCount = 0;
    let rpeCount = 0;

    Object.values(athleteTodayStatus).forEach((st) => {
      if (st.wellness) welCount++;
      if (st.preWeight !== null) preCount++;
      if (st.postWeight !== null) postCount++;
      if (st.rpe !== null) rpeCount++;
    });

    return { total, welCount, preCount, postCount, rpeCount };
  }, [athletes, athleteTodayStatus]);

  // Handle selecting an athlete
  const handleSelectAthlete = (athlete: Athlete) => {
    triggerHaptic(15);
    playTapBeep();
    setSelectedAthlete(athlete);
    resetInactivityTimer();

    const st = athleteTodayStatus[athlete.id];
    const currentHour = new Date().getHours();

    // Smart default for weight stage: if pre is already done or afternoon, default to post
    if (st?.preWeight !== null || currentHour >= 13) {
      setWeightStage('post');
      const fallbackWeight = st?.postWeight || (st?.preWeight ? Number((st.preWeight - 0.7).toFixed(1)) : 60.0);
      setWeightInputStr(fallbackWeight.toString());
    } else {
      setWeightStage('pre');
      const fallbackWeight = st?.preWeight || 61.0;
      setWeightInputStr(fallbackWeight.toString());
    }

    if (kioskMode === 'quick_weight') {
      setActiveFormType('weight');
    } else if (kioskMode === 'wellness') {
      setActiveFormType('wellness');
    } else if (kioskMode === 'rpe') {
      setActiveFormType('rpe');
    } else {
      setActiveFormType(null); // will show choices
    }
  };

  // Quick weight keypad controls
  const handleKeypadPress = (val: string) => {
    triggerHaptic(12);
    playTapBeep();

    if (val === 'backspace') {
      if (weightInputStr.length <= 1) {
        setWeightInputStr('0');
      } else {
        setWeightInputStr((prev) => prev.slice(0, -1));
      }
      return;
    }

    if (val === '.') {
      if (!weightInputStr.includes('.')) {
        setWeightInputStr((prev) => `${prev}.`);
      }
      return;
    }

    if (weightInputStr === '0' || weightInputStr === '0.0') {
      setWeightInputStr(val);
      return;
    }

    // Maximum 5 chars (e.g. 102.5)
    if (weightInputStr.length < 5) {
      setWeightInputStr((prev) => `${prev}${val}`);
    }
  };

  const handleAdjustWeightDelta = (delta: number) => {
    triggerHaptic(10);
    playTapBeep();
    const current = parseFloat(weightInputStr.replace(',', '.')) || 60.0;
    const nextVal = Math.max(30, Math.min(120, Number((current + delta).toFixed(1))));
    setWeightInputStr(nextVal.toString());
  };

  // Submit quick weight
  const handleSubmitQuickWeight = async () => {
    if (!selectedAthlete) return;
    triggerHaptic(30);
    playTapBeep();

    const parsedWeight = parseFloat(weightInputStr.replace(',', '.'));
    if (isNaN(parsedWeight) || parsedWeight <= 30 || parsedWeight >= 150) {
      alert('Por favor insere um peso válido (entre 30 kg e 150 kg).');
      return;
    }

    setIsSubmittingWeight(true);
    const nowIso = new Date().toISOString();
    const hydEntries = getHydrationLocally(selectedAthlete.id);
    const existing = hydEntries.find((h) => h.date === todayStr);

    let updatedEntry: HydrationEntry;

    if (weightStage === 'pre') {
      const hasPost = existing && Number(existing.postWeight) > 0;
      const postVal = hasPost ? Number(existing.postWeight) : 0;
      const fluidsVal = hasPost ? Number(existing.fluidsIntake || 0.5) : 0;
      const calc = hasPost ? calculateHydrationStatus(parsedWeight, postVal, fluidsVal, 'pt') : null;

      updatedEntry = {
        id: existing?.id || `hyd-${todayStr}-${selectedAthlete.id}`,
        athleteId: selectedAthlete.id,
        athleteName: selectedAthlete.name,
        date: todayStr,
        durationMin: existing?.durationMin || 90,
        preWeight: parsedWeight,
        postWeight: postVal,
        fluidsIntake: fluidsVal,
        weightLoss: calc ? calc.weightLoss : 0,
        dehydrationRate: calc ? calc.dehydrationRate : 0,
        status: calc ? calc.status : 'Pendente',
        refillNeededLiters: calc ? calc.refillNeededLiters : 0,
        recommendation: calc ? calc.recommendation : 'Peso Pré-treino registado com sucesso.',
        biologicalImpact: calc ? calc.biologicalImpact : 'Aguardando pesagem pós-treino',
        preWeightTime: existing?.preWeightTime || existing?.submittedAtPre || nowIso,
        submittedAtPre: existing?.submittedAtPre || existing?.preWeightTime || nowIso,
        postWeightTime: existing?.postWeightTime,
        submittedAtPost: existing?.submittedAtPost,
        createdAt: existing?.createdAt || nowIso,
      };
    } else {
      let preVal = existing && Number(existing.preWeight) > 0 ? Number(existing.preWeight) : 0;
      if (!preVal) {
        preVal = Number((parsedWeight + 0.8).toFixed(1));
      }
      const fluidsVal = Number(existing?.fluidsIntake || 0.5);
      const calc = calculateHydrationStatus(preVal, parsedWeight, fluidsVal, 'pt');

      updatedEntry = {
        id: existing?.id || `hyd-${todayStr}-${selectedAthlete.id}`,
        athleteId: selectedAthlete.id,
        athleteName: selectedAthlete.name,
        date: todayStr,
        durationMin: existing?.durationMin || 90,
        preWeight: preVal,
        postWeight: parsedWeight,
        fluidsIntake: fluidsVal,
        weightLoss: calc.weightLoss,
        dehydrationRate: calc.dehydrationRate,
        status: calc.status,
        refillNeededLiters: calc.refillNeededLiters,
        recommendation: calc.recommendation,
        biologicalImpact: calc.biologicalImpact,
        preWeightTime: existing?.preWeightTime,
        submittedAtPre: existing?.submittedAtPre,
        postWeightTime: existing?.postWeightTime || nowIso,
        submittedAtPost: existing?.submittedAtPost || nowIso,
        createdAt: existing?.createdAt || nowIso,
      };
    }

    saveHydrationLocally(updatedEntry);

    try {
      secureFetch('/api/hydration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedEntry),
      }).catch(() => {});

      secureFetch('/api/sync-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: weightStage === 'pre' ? 'hydration_pre' : 'hydration_post',
          entry: updatedEntry,
        }),
      }).catch(() => {});
    } catch {}

    setIsSubmittingWeight(false);
    triggerSuccess(`✓ Peso ${weightStage === 'pre' ? 'Pré-treino' : 'Pós-treino'} (${parsedWeight} kg) de ${selectedAthlete.name} gravado!`);
  };

  const triggerSuccess = (msg: string) => {
    triggerHaptic(40);
    setFeedbackSuccess(msg);
    setTimeout(() => {
      setFeedbackSuccess(null);
      setSelectedAthlete(null);
      setActiveFormType(null);
    }, 1800);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-slate-950 text-slate-100 selection:bg-brand-lime selection:text-slate-950 overflow-hidden font-sans select-none touch-manipulation overscroll-none"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      {/* Top Kiosk Header Optimized for Tablets (iOS & Android) */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5 bg-slate-900 border-b border-slate-800 shrink-0 shadow-xl">
        <div className="flex items-center space-x-3">
          <img
            src="/gil-vicente-crest.png"
            alt="Gil Vicente FC"
            className="h-9 w-9 sm:h-11 sm:w-11 md:h-12 md:w-12 object-contain drop-shadow"
          />
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm md:text-base font-black tracking-wider text-slate-100 uppercase">
                Gil Vicente FC
              </span>
              <span className="text-[10px] sm:text-xs font-black uppercase px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30">
                Quiosque Balneário
              </span>
              {/* Tablet indicator */}
              <span className="hidden md:inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                <Tablet className="h-3 w-3 text-cyan-400" />
                <span>Tablet Mode</span>
              </span>
              {/* Wake Lock Active Badge */}
              {wakeLockActive && (
                <span className="hidden lg:inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Ecrã Sempre Ativo</span>
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium hidden sm:block">
              {new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Mode Selector in Header */}
        <div className="flex items-center bg-dark-bg p-1 rounded-xl border border-slate-800 text-xs font-bold space-x-1">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              setKioskMode('all');
              if (selectedAthlete) setActiveFormType(null);
            }}
            className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all text-xs sm:text-sm font-black cursor-pointer ${
              kioskMode === 'all'
                ? 'bg-brand-lime text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🎯 Todos
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              setKioskMode('quick_weight');
              if (selectedAthlete) setActiveFormType('weight');
            }}
            className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all text-xs sm:text-sm font-black cursor-pointer ${
              kioskMode === 'quick_weight'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚖️ Balança
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              setKioskMode('wellness');
              if (selectedAthlete) setActiveFormType('wellness');
            }}
            className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all text-xs sm:text-sm font-black cursor-pointer ${
              kioskMode === 'wellness'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ☀️ Wellness
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              setKioskMode('rpe');
              if (selectedAthlete) setActiveFormType('rpe');
            }}
            className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all text-xs sm:text-sm font-black cursor-pointer ${
              kioskMode === 'rpe'
                ? 'bg-brand-cyan text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚡ PSE
          </button>
        </div>

        {/* Right Action Buttons: Fullscreen & Exit */}
        <div className="flex items-center space-x-2">
          {/* Fullscreen Toggle (Android / iPadOS) */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex items-center space-x-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-2.5 sm:px-3.5 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
            title={isFullscreen ? 'Sair de Ecrã Inteiro' : 'Modo Ecrã Inteiro'}
          >
            {isFullscreen ? (
              <>
                <Minimize className="h-4 w-4 text-cyan-400" />
                <span className="hidden md:inline">Janela</span>
              </>
            ) : (
              <>
                <Maximize className="h-4 w-4 text-cyan-400" />
                <span className="hidden md:inline">Ecrã Inteiro</span>
              </>
            )}
          </button>

          {/* Exit Kiosk Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic(15);
              onClose();
            }}
            className="flex items-center space-x-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-3 sm:px-4 py-2 text-xs font-black text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
            title="Regressar ao painel de administração"
          >
            <ArrowLeft className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="hidden sm:inline">Voltar ao Admin</span>
            <span className="sm:hidden">Sair</span>
          </button>
        </div>
      </header>

      {/* Success Fullscreen Overlay with Quick Transition */}
      {feedbackSuccess && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-slate-950/90 backdrop-blur-md animate-fade-in p-6">
          <div className="flex flex-col items-center justify-center space-y-4 max-w-md w-full bg-slate-900 border-2 border-emerald-500/60 p-8 rounded-3xl shadow-2xl text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40 animate-bounce">
              <Check className="h-10 w-10 stroke-[3]" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-100 uppercase tracking-wide">
              Registo Efetuado!
            </h3>
            <p className="text-sm sm:text-base font-bold text-emerald-300">
              {feedbackSuccess}
            </p>
            <span className="text-xs text-slate-400 pt-2 block">
              A preparar o ecrã para a próxima atleta...
            </span>
          </div>
        </div>
      )}

      {/* Main Content Area: Smooth scrolling with safe padding */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 no-scrollbar">
        {!selectedAthlete ? (
          /* STATE 1: ATHLETE SELECTION GRID */
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
            {/* Quick Overview Strip (Responsive for Tablets) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5">
              <div className="bg-slate-900/90 border border-amber-500/30 p-3 sm:p-4 rounded-2xl flex items-center space-x-3.5 shadow-sm">
                <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <HeartPulse className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wide block">☀️ Wellness</span>
                  <span className="text-lg sm:text-xl font-black text-slate-100">
                    {todayCounts.welCount} <span className="text-xs text-slate-500 font-bold">/ {todayCounts.total}</span>
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-cyan-500/30 p-3 sm:p-4 rounded-2xl flex items-center space-x-3.5 shadow-sm">
                <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <Scale className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wide block">⚖️ Peso Pré</span>
                  <span className="text-lg sm:text-xl font-black text-slate-100">
                    {todayCounts.preCount} <span className="text-xs text-slate-500 font-bold">/ {todayCounts.total}</span>
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-blue-500/30 p-3 sm:p-4 rounded-2xl flex items-center space-x-3.5 shadow-sm">
                <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Scale className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wide block">⚖️ Peso Pós</span>
                  <span className="text-lg sm:text-xl font-black text-slate-100">
                    {todayCounts.postCount} <span className="text-xs text-slate-500 font-bold">/ {todayCounts.total}</span>
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-purple-500/30 p-3 sm:p-4 rounded-2xl flex items-center space-x-3.5 shadow-sm">
                <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <Dumbbell className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wide block">⚡ PSE (Pós)</span>
                  <span className="text-lg sm:text-xl font-black text-slate-100">
                    {todayCounts.rpeCount} <span className="text-xs text-slate-500 font-bold">/ {todayCounts.total}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90 p-3 sm:p-4 rounded-2xl border border-slate-800 shadow-md">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou número..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-xs sm:text-sm font-bold text-slate-100 focus:border-red-500 focus:outline-none placeholder:text-slate-500"
                />
              </div>

              <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
                {(['all', 'GR', 'DEF', 'MED', 'AV'] as const).map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => {
                      triggerHaptic(10);
                      setPositionFilter(pos);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                      positionFilter === pos
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {pos === 'all' ? 'Todas' : pos === 'GR' ? 'Guarda-Redes' : pos === 'DEF' ? 'Defesas' : pos === 'MED' ? 'Médias' : 'Avançadas'}
                  </button>
                ))}
              </div>
            </div>

            {/* Instruction banner */}
            <div className="text-center py-1">
              <h2 className="text-base sm:text-lg font-black text-slate-100 uppercase tracking-wide">
                👇 Toca na tua fotografia para preencher
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                {kioskMode === 'quick_weight' ? 'Modo Balança Rápida ativo • Pré ou Pós-treino' : kioskMode === 'wellness' ? 'Modo Só Wellness ativo' : kioskMode === 'rpe' ? 'Modo Só PSE ativo' : 'Escolhe o teu perfil e seleciona o questionário ou balança'}
              </p>
            </div>

            {/* Athletes Grid Optimized for Tablets (iPad & Android) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {filteredAthletes.map((athlete) => {
                const customAvatar = getAthleteAvatar(athlete.id) || athlete.avatarUrl;
                const status = athleteTodayStatus[athlete.id];
                const allDone = status?.wellness && status?.preWeight !== null && status?.postWeight !== null && status?.rpe !== null;

                const initials = athlete.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2);

                return (
                  <button
                    key={athlete.id}
                    type="button"
                    onClick={() => handleSelectAthlete(athlete)}
                    className={`group relative flex flex-col items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all text-center cursor-pointer min-h-[155px] sm:min-h-[175px] active:scale-95 ${
                      allDone
                        ? 'bg-slate-900/95 border-emerald-500/50 hover:border-emerald-400 shadow-md'
                        : 'bg-slate-900/70 border-slate-800 hover:border-amber-500/60 hover:bg-slate-900 shadow-sm'
                    }`}
                  >
                    {/* Top jersey number & position badge */}
                    <div className="w-full flex items-center justify-between mb-1.5">
                      <span className="text-[10px] sm:text-xs font-black text-slate-300 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                        #{athlete.jerseyNumber || '—'}
                      </span>
                      <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase">
                        {athlete.position || ''}
                      </span>
                    </div>

                    {/* Athlete Avatar */}
                    <div className="relative my-1">
                      {customAvatar ? (
                        <img
                          src={customAvatar}
                          alt={athlete.name}
                          className="h-16 w-16 sm:h-18 sm:w-18 md:h-20 md:w-20 rounded-full object-cover border-2 border-slate-700 group-hover:border-amber-400 transition-all shadow-md"
                        />
                      ) : (
                        <div className="h-16 w-16 sm:h-18 sm:w-18 md:h-20 md:w-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-base font-black text-slate-200 group-hover:border-amber-400">
                          {initials}
                        </div>
                      )}
                      {allDone && (
                        <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-emerald-500 rounded-full flex items-center justify-center text-slate-950 font-black shadow-md border-2 border-slate-900">
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    {/* Athlete Name */}
                    <span className="font-extrabold text-xs sm:text-sm text-slate-100 truncate w-full mt-1.5 group-hover:text-amber-300 transition-colors">
                      {athlete.name}
                    </span>

                    {/* Status icons row with high contrast */}
                    <div className="flex items-center justify-center gap-1.5 mt-2 w-full pt-2 border-t border-slate-800 text-[10px] sm:text-[11px]">
                      <span
                        title={status?.wellness ? 'Wellness: Preenchido' : 'Wellness: Em falta'}
                        className={`px-1.5 py-0.5 rounded font-bold ${
                          status?.wellness ? 'text-amber-400 bg-amber-500/10' : 'text-slate-600 bg-slate-800/60'
                        }`}
                      >
                        ☀️ {status?.wellness ? '✓' : '—'}
                      </span>
                      <span
                        title={status?.preWeight !== null ? `Pré: ${status.preWeight}kg` : 'Pré: Em falta'}
                        className={`px-1.5 py-0.5 rounded font-bold ${
                          status?.preWeight !== null ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-600 bg-slate-800/60'
                        }`}
                      >
                        ⚖️ {status?.preWeight !== null ? `${status.preWeight}` : '—'}
                      </span>
                      <span
                        title={status?.rpe !== null ? `PSE: ${status.rpe}/10` : 'PSE: Em falta'}
                        className={`px-1.5 py-0.5 rounded font-bold ${
                          status?.rpe !== null ? 'text-purple-400 bg-purple-500/10' : 'text-slate-600 bg-slate-800/60'
                        }`}
                      >
                        ⚡ {status?.rpe !== null ? `${status.rpe}` : '—'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* STATE 2: ATHLETE FILLING SCREEN */
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 animate-fade-in">
            {/* Athlete Selected Header Banner with Inactivity Timer */}
            <div className="flex items-center justify-between p-3.5 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="flex items-center space-x-3.5">
                {(() => {
                  const avatar = getAthleteAvatar(selectedAthlete.id) || selectedAthlete.avatarUrl;
                  const initials = selectedAthlete.name.split(' ').map((n) => n[0]).join('').substring(0, 2);
                  return avatar ? (
                    <img
                      src={avatar}
                      alt={selectedAthlete.name}
                      className="h-12 w-12 sm:h-16 sm:w-16 rounded-full object-cover border-2 border-red-500/60 shadow"
                    />
                  ) : (
                    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-black text-base text-slate-200">
                      {initials}
                    </div>
                  );
                })()}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-base sm:text-xl font-black text-slate-100">
                      {selectedAthlete.name}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-md font-black bg-slate-800 text-slate-300 border border-slate-700">
                      #{selectedAthlete.jerseyNumber || '—'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 mt-0.5">
                    <p className="text-xs sm:text-sm text-slate-400 font-semibold">
                      {selectedAthlete.position || 'Jogadora'} &bull; Gil Vicente FC
                    </p>
                    <span className="hidden sm:inline-flex items-center space-x-1 text-[10px] text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded">
                      <Clock className="h-3 w-3" />
                      <span>Auto-regresso em {secondsRemaining}s</span>
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  setSelectedAthlete(null);
                  setActiveFormType(null);
                }}
                className="flex items-center space-x-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shadow border border-slate-700"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Trocar Atleta</span>
              </button>
            </div>

            {/* Mode: Selection of form (if in 'all' mode and none clicked) */}
            {activeFormType === null && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {/* 1. Balança / Pesagem */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(15);
                    playTapBeep();
                    setActiveFormType('weight');
                  }}
                  className="flex flex-col items-center justify-between p-6 sm:p-8 rounded-3xl border-2 border-cyan-500/40 bg-slate-900/90 hover:bg-cyan-950/30 hover:border-cyan-400 active:scale-98 transition-all text-center space-y-4 group cursor-pointer shadow-xl"
                >
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Scale className="h-8 w-8 sm:h-10 sm:w-10 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-black text-slate-100 uppercase">
                      1. Balança / Pesagem
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      Registo rápido de Peso Pré ou Pós-Treino
                    </p>
                  </div>
                  <span className="text-xs font-black text-cyan-300 bg-cyan-500/10 px-3 py-1.5 rounded-full border border-cyan-500/30">
                    {athleteTodayStatus[selectedAthlete.id]?.preWeight ? `Pré: ${athleteTodayStatus[selectedAthlete.id]?.preWeight} kg` : 'Registar Peso'}
                  </span>
                </button>

                {/* 2. Wellness */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(15);
                    playTapBeep();
                    setActiveFormType('wellness');
                  }}
                  className="flex flex-col items-center justify-between p-6 sm:p-8 rounded-3xl border-2 border-amber-500/40 bg-slate-900/90 hover:bg-amber-950/30 hover:border-amber-400 active:scale-98 transition-all text-center space-y-4 group cursor-pointer shadow-xl"
                >
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <HeartPulse className="h-8 w-8 sm:h-10 sm:w-10 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-black text-slate-100 uppercase">
                      2. Questionário Wellness
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      Sono, fadiga, humor, dor e ciclo menstrual
                    </p>
                  </div>
                  <span className="text-xs font-black text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/30">
                    {athleteTodayStatus[selectedAthlete.id]?.wellness ? '✓ Já Preenchido' : 'Preencher Agora'}
                  </span>
                </button>

                {/* 3. PSE / RPE */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(15);
                    playTapBeep();
                    setActiveFormType('rpe');
                  }}
                  className="flex flex-col items-center justify-between p-6 sm:p-8 rounded-3xl border-2 border-purple-500/40 bg-slate-900/90 hover:bg-purple-950/30 hover:border-purple-400 active:scale-98 transition-all text-center space-y-4 group cursor-pointer shadow-xl"
                >
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Dumbbell className="h-8 w-8 sm:h-10 sm:w-10 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-black text-slate-100 uppercase">
                      3. Questionário PSE
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      Perceção de esforço após o treino ou jogo
                    </p>
                  </div>
                  <span className="text-xs font-black text-purple-300 bg-purple-500/10 px-3 py-1.5 rounded-full border border-purple-500/30">
                    {athleteTodayStatus[selectedAthlete.id]?.rpe ? `✓ PSE: ${athleteTodayStatus[selectedAthlete.id]?.rpe}/10` : 'Preencher Agora'}
                  </span>
                </button>
              </div>
            )}

            {/* FORM 1: FAST DIGITAL SCALE KEYPAD (Optimized for Tablets in Landscape & Portrait) */}
            {activeFormType === 'weight' && (
              <div className="bg-slate-900/95 border border-cyan-500/40 p-4 sm:p-6 md:p-8 rounded-3xl shadow-2xl space-y-5 md:space-y-0 md:grid md:grid-cols-2 md:gap-8 md:items-start animate-fade-in max-w-4xl mx-auto">
                {/* Column 1: Display & Controls */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <Scale className="h-5 w-5 text-cyan-400" />
                      <span className="text-sm sm:text-base font-black text-slate-100 uppercase">
                        Balança Digital
                      </span>
                    </div>
                    {kioskMode === 'all' && (
                      <button
                        type="button"
                        onClick={() => setActiveFormType(null)}
                        className="text-xs sm:text-sm text-slate-400 hover:text-slate-200 underline font-bold cursor-pointer"
                      >
                        Outras Opções
                      </button>
                    )}
                  </div>

                  {/* Stage selector: Pré vs Pós */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(10);
                        setWeightStage('pre');
                      }}
                      className={`py-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer active:scale-95 ${
                        weightStage === 'pre'
                          ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ⚖️ Peso Pré-Treino
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(10);
                        setWeightStage('post');
                      }}
                      className={`py-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer active:scale-95 ${
                        weightStage === 'post'
                          ? 'bg-blue-600 text-white shadow-md font-black'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ⚖️ Peso Pós-Treino
                    </button>
                  </div>

                  {/* Digital Scale Display */}
                  <div className="bg-slate-950 border-2 border-cyan-500/40 rounded-3xl p-5 sm:p-6 text-center space-y-1 shadow-inner">
                    <span className="text-xs font-black text-cyan-400 uppercase tracking-widest block">
                      {weightStage === 'pre' ? 'À Entrada do Treino' : 'À Saída do Treino'}
                    </span>
                    <div className="flex items-baseline justify-center space-x-2 py-2">
                      <span className="font-mono text-5xl sm:text-6xl md:text-7xl font-black text-cyan-300 tracking-tight">
                        {weightInputStr}
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-cyan-400">kg</span>
                    </div>
                    {athleteTodayStatus[selectedAthlete.id]?.preWeight !== null && weightStage === 'post' && (
                      <span className="text-xs text-slate-400 font-bold block pt-1">
                        Peso Pré registado hoje: <strong className="text-slate-200">{athleteTodayStatus[selectedAthlete.id]?.preWeight} kg</strong>
                      </span>
                    )}
                  </div>

                  {/* Quick Deltas */}
                  <div className="flex items-center justify-center gap-2">
                    {[-0.5, -0.1, 0.1, 0.5].map((delta) => (
                      <button
                        key={delta}
                        type="button"
                        onClick={() => handleAdjustWeightDelta(delta)}
                        className="flex-1 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 font-black text-xs sm:text-sm border border-slate-700 shadow-sm active:scale-95 cursor-pointer"
                      >
                        {delta > 0 ? `+${delta}` : delta}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Column 2: Keypad and Submit */}
                <div className="space-y-4">
                  {/* Touch Numeric Keypad with large targets for fingers */}
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'].map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleKeypadPress(key)}
                        className="py-3.5 sm:py-4 md:py-5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 active:bg-cyan-900/40 text-xl sm:text-2xl md:text-3xl font-black text-slate-100 border border-slate-700 shadow flex items-center justify-center transition-all cursor-pointer active:scale-95"
                      >
                        {key === 'backspace' ? <Delete className="h-6 w-6 sm:h-7 sm:w-7 text-rose-400" /> : key}
                      </button>
                    ))}
                  </div>

                  {/* Submit Weight Button */}
                  <button
                    type="button"
                    onClick={handleSubmitQuickWeight}
                    disabled={isSubmittingWeight}
                    className="w-full py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-black text-base sm:text-lg shadow-xl shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400 active:scale-98 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingWeight ? (
                      <RefreshCw className="h-6 w-6 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-6 w-6 stroke-[3]" />
                        <span>Gravar Peso {weightStage === 'pre' ? 'Pré' : 'Pós'} ({weightInputStr} kg)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* FORM 2: WELLNESS FORM */}
            {activeFormType === 'wellness' && (
              <div className="bg-slate-900/90 border border-amber-500/30 p-4 sm:p-6 md:p-8 rounded-3xl shadow-2xl animate-fade-in max-w-4xl mx-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <HeartPulse className="h-5 w-5 text-amber-400" />
                    <span className="text-sm sm:text-base font-black text-slate-100 uppercase">
                      Questionário Wellness • {selectedAthlete.name}
                    </span>
                  </div>
                  {kioskMode === 'all' && (
                    <button
                      type="button"
                      onClick={() => setActiveFormType(null)}
                      className="text-xs sm:text-sm text-slate-400 hover:text-slate-200 underline font-bold cursor-pointer"
                    >
                      Outras Opções
                    </button>
                  )}
                </div>

                <WellnessForm
                  activeAthlete={selectedAthlete}
                  onSubmitSuccess={() => triggerSuccess(`✓ Wellness de ${selectedAthlete.name} registado com sucesso!`)}
                />
              </div>
            )}

            {/* FORM 3: RPE FORM */}
            {activeFormType === 'rpe' && (
              <div className="bg-slate-900/90 border border-purple-500/30 p-4 sm:p-6 md:p-8 rounded-3xl shadow-2xl animate-fade-in max-w-4xl mx-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <Dumbbell className="h-5 w-5 text-purple-400" />
                    <span className="text-sm sm:text-base font-black text-slate-100 uppercase">
                      Questionário PSE (Perceção de Esforço) • {selectedAthlete.name}
                    </span>
                  </div>
                  {kioskMode === 'all' && (
                    <button
                      type="button"
                      onClick={() => setActiveFormType(null)}
                      className="text-xs sm:text-sm text-slate-400 hover:text-slate-200 underline font-bold cursor-pointer"
                    >
                      Outras Opções
                    </button>
                  )}
                </div>

                <RPEForm
                  activeAthlete={selectedAthlete}
                  onSubmitSuccess={() => triggerSuccess(`✓ PSE de ${selectedAthlete.name} registado com sucesso!`)}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
