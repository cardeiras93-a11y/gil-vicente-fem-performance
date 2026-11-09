'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Share2,
  ShieldCheck,
  Smartphone,
  Monitor,
  HeartPulse,
  Dumbbell,
  Clock,
  Zap,
  TrendingUp,
  Activity,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Flame,
  Award,
  Video
} from 'lucide-react';

// Anonymized mock squad data for privacy
const DEMO_SQUAD = [
  { id: 'ath-04', code: 'Atleta #04', pos: 'DC', badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', totalMin: 1471, campMin: 473, tacaMin: 90, matches: 16, avgMin: 91.9, status: '100% Apta' },
  { id: 'ath-07', code: 'Atleta #07', pos: 'EX', badgeBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30', totalMin: 1302, campMin: 418, tacaMin: 60, matches: 16, avgMin: 81.4, status: '100% Apta' },
  { id: 'ath-10', code: 'Atleta #10', pos: 'MC', badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30', totalMin: 1276, campMin: 404, tacaMin: 91, matches: 17, avgMin: 75.1, status: '100% Apta' },
  { id: 'ath-08', code: 'Atleta #08', pos: 'MC', badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30', totalMin: 1270, campMin: 278, tacaMin: 182, matches: 15, avgMin: 84.7, status: 'Recuperação' },
  { id: 'ath-02', code: 'Atleta #02', pos: 'LAT', badgeBg: 'bg-sky-500/20 text-sky-400 border-sky-500/30', totalMin: 1267, campMin: 441, tacaMin: 0, matches: 15, avgMin: 84.5, status: '100% Apta' },
  { id: 'ath-06', code: 'Atleta #06', pos: 'MC', badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30', totalMin: 1244, campMin: 356, tacaMin: 91, matches: 17, avgMin: 73.2, status: '100% Apta' },
  { id: 'ath-03', code: 'Atleta #03', pos: 'LAT', badgeBg: 'bg-sky-500/20 text-sky-400 border-sky-500/30', totalMin: 1211, campMin: 296, tacaMin: 136, matches: 16, avgMin: 75.7, status: '100% Apta' },
  { id: 'ath-09', code: 'Atleta #09', pos: 'AV', badgeBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30', totalMin: 1110, campMin: 303, tacaMin: 137, matches: 15, avgMin: 74.0, status: '100% Apta' },
  { id: 'ath-01', code: 'Atleta #01 (GR)', pos: 'GR', badgeBg: 'bg-teal-500/20 text-teal-400 border-teal-500/30', totalMin: 278, campMin: 188, tacaMin: 90, matches: 3, avgMin: 92.7, status: '100% Apta' },
];

export default function ShowcasePage() {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentScene, setCurrentScene] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<'9-16' | '1-1' | '16-9'>('9-16');
  const [activeTab, setActiveTab] = useState<'wellness' | 'rpe' | 'gps' | 'minutes' | 'plan'>('wellness');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordFeedback, setRecordFeedback] = useState<string | null>(null);

  const phoneRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Scenes list for auto-walkthrough
  const SCENES = [
    { id: 0, tab: 'wellness' as const, label: '1. Wellness Matinal', duration: 6000 },
    { id: 1, tab: 'rpe' as const, label: '2. PSE & Carga Interna', duration: 6000 },
    { id: 2, tab: 'gps' as const, label: '3. Rendimento GPS em Jogo', duration: 7000 },
    { id: 3, tab: 'minutes' as const, label: '4. Minutos Competitivos', duration: 6000 },
    { id: 4, tab: 'plan' as const, label: '5. Planeamento Semanal', duration: 6000 },
  ];

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const currentDuration = SCENES[currentScene]?.duration || 6000;
    timerRef.current = setTimeout(() => {
      setCurrentScene((prev) => {
        const next = (prev + 1) % SCENES.length;
        setActiveTab(SCENES[next].tab);
        return next;
      });
    }, currentDuration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentScene]);

  const handleSelectScene = (index: number) => {
    setCurrentScene(index);
    setActiveTab(SCENES[index].tab);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentScene(0);
    setActiveTab('wellness');
    setIsPlaying(true);
  };

  // Video recording simulation / capture guidance
  const handleRecordVideo = () => {
    setRecordFeedback('💡 Dica: Inicia a gravação de ecrã do teu telemóvel ou computador agora! O showcase corre sozinho a 30fps.');
    setIsPlaying(true);
    setCurrentScene(0);
    setActiveTab('wellness');
    setTimeout(() => setRecordFeedback(null), 8000);
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col items-center justify-start p-3 sm:p-6 antialiased selection:bg-brand-lime selection:text-slate-950">
      
      {/* Top Header Controls Bar */}
      <header className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-6">
        <div className="flex items-center space-x-3.5">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-red-600 to-blue-900 p-1 flex items-center justify-center shadow-lg ring-2 ring-red-500/20">
            <img src="/gil-vicente-crest.png" alt="Gil Vicente FC" className="h-9 w-9 object-contain" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase text-red-500 tracking-wider">Gil Vicente FC &bull; Feminino</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Modo Demonstração &bull; 100% Anónimo
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
              Showcase de Apresentação da App (LinkedIn, Stories &amp; X)
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Aspect ratio buttons */}
          <div className="flex items-center bg-slate-900/90 rounded-xl border border-slate-800 p-1">
            <button
              onClick={() => setAspectRatio('9-16')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                aspectRatio === '9-16' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Formato Vertical para Stories (9:16)"
            >
              <Smartphone className="h-3.5 w-3.5" /> Stories (9:16)
            </button>
            <button
              onClick={() => setAspectRatio('1-1')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                aspectRatio === '1-1' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Formato Quadrado para Feed / Carrossel (1:1)"
            >
              <Monitor className="h-3.5 w-3.5" /> Quadrado (1:1)
            </button>
          </div>

          {/* Play/Pause */}
          <button
            onClick={handleTogglePlay}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
            }`}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
            <span>{isPlaying ? 'Pausar' : 'Reproduzir'}</span>
          </button>

          <button
            onClick={handleReset}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
            title="Reiniciar Showreel"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={handleRecordVideo}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg flex items-center gap-1.5 transition-all"
          >
            <Video className="h-4 w-4" />
            <span>Gravar Ecrã</span>
          </button>
        </div>
      </header>

      {/* Toast Notice */}
      {recordFeedback && (
        <div className="w-full max-w-md mb-4 p-3 rounded-xl bg-indigo-950/90 border border-indigo-500/40 text-indigo-200 text-xs text-center font-bold shadow-xl animate-fade-in">
          {recordFeedback}
        </div>
      )}

      {/* Progress Timeline Scenes Bar */}
      <div className="w-full max-w-5xl mb-6 flex flex-wrap gap-2 justify-center">
        {SCENES.map((scene, idx) => (
          <button
            key={scene.id}
            onClick={() => handleSelectScene(idx)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              currentScene === idx
                ? 'bg-blue-600/30 border-blue-500 text-blue-200 shadow-md ring-1 ring-blue-400'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${currentScene === idx ? 'bg-blue-400 animate-pulse' : 'bg-slate-600'}`} />
            <span>{scene.label}</span>
          </button>
        ))}
      </div>

      {/* Center Phone Mockup Showcase Frame */}
      <div className="w-full flex justify-center items-center py-2">
        <div
          ref={phoneRef}
          style={{
            width: aspectRatio === '9-16' ? '390px' : aspectRatio === '1-1' ? '460px' : '720px',
            height: aspectRatio === '9-16' ? '820px' : aspectRatio === '1-1' ? '680px' : '520px',
            maxHeight: '90vh',
          }}
          className="relative bg-slate-950 rounded-[44px] p-3.5 border-[6px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(200,16,46,0.15)] overflow-hidden flex flex-col transition-all duration-500 ring-1 ring-white/10"
        >
          {/* Dynamic Island / Notch */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 h-5 w-28 bg-black rounded-full z-50 flex items-center justify-between px-2.5 shadow-inner">
            <div className="h-2 w-2 rounded-full bg-slate-900 ring-1 ring-white/10" />
            <div className="h-2.5 w-2.5 rounded-full bg-slate-950 border border-slate-800" />
          </div>

          {/* Internal Mobile App Screen Wrapper */}
          <div className="w-full h-full rounded-[34px] bg-[#090d16] overflow-y-auto flex flex-col text-slate-100 select-none hide-scrollbar pt-6">
            
            {/* App Mobile Header */}
            <div className="px-4 py-2 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-[#090d16]/95 sticky top-0 z-40 backdrop-blur-md">
              <div className="flex items-center space-x-2">
                <img src="/gil-vicente-crest.png" alt="GVFC" className="h-7 w-7 object-contain" />
                <div>
                  <span className="text-[10px] font-black uppercase text-red-500 block leading-tight">Gil Vicente FC</span>
                  <span className="text-[11px] font-black text-white block leading-tight">Performance Hub</span>
                </div>
              </div>

              {/* Anonymized Active Athlete Pill */}
              <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-2 py-1 rounded-full">
                <div className="h-4 w-4 rounded-full bg-blue-600/30 text-blue-400 text-[9px] font-black flex items-center justify-center">
                  #7
                </div>
                <span className="text-[10px] font-bold text-slate-300">Atleta #07</span>
                <span className="text-[8px] font-black px-1 py-0.2 rounded bg-rose-500/20 text-rose-300">EX</span>
              </div>
            </div>

            {/* App Nav Tabs Strip */}
            <div className="px-3 py-2 bg-slate-950/60 border-b border-slate-900 flex items-center gap-1 overflow-x-auto shrink-0">
              <button
                onClick={() => setActiveTab('wellness')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                  activeTab === 'wellness' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <HeartPulse className="h-3 w-3" /> Wellness
              </button>
              <button
                onClick={() => setActiveTab('rpe')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                  activeTab === 'rpe' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Dumbbell className="h-3 w-3" /> PSE Treino
              </button>
              <button
                onClick={() => setActiveTab('gps')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                  activeTab === 'gps' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="h-3 w-3" /> GPS Jogo
              </button>
              <button
                onClick={() => setActiveTab('minutes')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                  activeTab === 'minutes' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Clock className="h-3 w-3" /> Minutos
              </button>
              <button
                onClick={() => setActiveTab('plan')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                  activeTab === 'plan' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="h-3 w-3" /> Microciclo
              </button>
            </div>

            {/* DYNAMIC SCENE CONTENT */}
            <div className="p-4 flex-1 space-y-4">
              
              {/* SCENE 1: WELLNESS */}
              {activeTab === 'wellness' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider">Questionário Matinal</span>
                      <h2 className="text-sm font-black text-white">Estado de Prontidão Diária</h2>
                    </div>
                    <span className="text-xs font-black px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Score: 23 / 25 ★
                    </span>
                  </div>

                  {/* 5 Wellness Sliders Preview */}
                  <div className="space-y-2 bg-slate-900/70 p-3 rounded-2xl border border-slate-800">
                    <div>
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-400">😴 Qualidade do Sono</span>
                        <span className="text-emerald-400 font-black">5 / 5 (Muito Bom)</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full w-full" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-400">⚡ Nível de Energia</span>
                        <span className="text-emerald-400 font-black">4 / 5 (Elevado)</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full w-[80%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-400">🦵 Fadiga Muscular</span>
                        <span className="text-sky-400 font-black">2 / 5 (Ligeira)</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-sky-400 rounded-full w-[40%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-400">🧘 Nível de Stress</span>
                        <span className="text-emerald-400 font-black">1 / 5 (Mínimo)</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full w-[20%]" />
                      </div>
                    </div>
                  </div>

                  {/* Ready to train badge */}
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center space-x-2 text-emerald-300 text-xs font-bold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Atleta 100% pronta para a intensidade planeada (MD-3)</span>
                  </div>
                </div>
              )}

              {/* SCENE 2: PSE & RPE */}
              {activeTab === 'rpe' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Pós-Treino &bull; Borg CR-10</span>
                      <h2 className="text-sm font-black text-white">Perceção Subjetiva de Esforço</h2>
                    </div>
                    <span className="text-xs font-black px-2 py-1 rounded-full bg-amber-400 text-slate-950">
                      PSE: 7 / 10
                    </span>
                  </div>

                  <div className="bg-slate-900/70 p-3.5 rounded-2xl border border-slate-800 text-center space-y-2">
                    <div className="text-2xl font-black text-amber-400">7.0 &bull; Muito Difícil</div>
                    <p className="text-[10px] text-slate-400">Sessão com elevada carga mecânica excêntrica e sprints de alta velocidade.</p>
                    
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-left">
                      <div className="bg-slate-950/60 p-2 rounded-xl">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">Carga de Sessão</span>
                        <span className="text-xs font-black text-white">630 u.a.</span>
                      </div>
                      <div className="bg-slate-950/60 p-2 rounded-xl">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">Ginásio Pós-Treino</span>
                        <span className="text-xs font-black text-purple-400">Realizado ✓</span>
                      </div>
                    </div>
                  </div>

                  {/* Body Map Preview */}
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black uppercase text-slate-300">Queixas Musculares</span>
                      <p className="text-[10px] text-emerald-400 font-bold">Sem queixas articulares (Apenas fadiga normal)</p>
                    </div>
                    <span className="text-xl">🦵</span>
                  </div>
                </div>
              )}

              {/* SCENE 3: GPS JOGO */}
              {activeTab === 'gps' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-sky-400 tracking-wider">Jogo Oficial &bull; II Divisão</span>
                      <h2 className="text-sm font-black text-white">Análise de Rendimento Individual</h2>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      +409m HI vs Jogo Ant. ⚡
                    </span>
                  </div>

                  {/* Metrics Cards */}
                  <div className="space-y-2">
                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-400">🏃 Distância Total</span>
                        <span className="text-white font-black">10 295 m</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-sky-400 rounded-full w-[94%]" />
                      </div>
                    </div>

                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-400">⚡ Alta Intensidade (&gt;19 km/h)</span>
                        <span className="text-emerald-400 font-black">919 m</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full w-[92%]" />
                      </div>
                    </div>

                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-400">🔥 Sprint Puro (&gt;23 km/h)</span>
                        <span className="text-rose-400 font-black">275.0 m</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full w-[85%]" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">Velocidade Máx.</span>
                        <span className="text-xs font-black text-amber-400">26.8 km/h</span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">Ações (&gt;3m/s²)</span>
                        <span className="text-xs font-black text-purple-400">171 ações</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SCENE 4: MINUTOS */}
              {activeTab === 'minutes' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Histórico de Época</span>
                      <h2 className="text-sm font-black text-white">Minutos de Jogo Oficiais</h2>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-blue-900/60 text-blue-300">
                      17 Jogos Registados
                    </span>
                  </div>

                  {/* Top Stats of Active Athlete */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Atleta #07 &bull; Minutos Totais</div>
                      <div className="text-xl font-black text-white">1 302 <span className="text-xs text-slate-400 font-normal">min</span></div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] text-emerald-400 font-bold">418 min Liga</div>
                      <div className="text-[9px] text-amber-400 font-bold">60 min Taça</div>
                    </div>
                  </div>

                  {/* Anonymized Squad Table */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Quadro de Minutagem do Plantel</span>
                    <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                      {DEMO_SQUAD.map((ath, idx) => (
                        <div
                          key={ath.id}
                          className={`flex items-center justify-between p-2 rounded-xl border text-[11px] ${
                            ath.id === 'ath-07'
                              ? 'bg-blue-950/40 border-blue-500/50 text-white font-bold'
                              : 'bg-slate-900/50 border-slate-850 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] text-slate-500 font-black w-4">{idx + 1}</span>
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${ath.badgeBg}`}>{ath.pos}</span>
                            <span>{ath.code}</span>
                          </div>
                          <div className="font-black text-right">
                            <span>{ath.totalMin} min</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SCENE 5: PLANO MICROCICLO */}
              {activeTab === 'plan' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider">Microciclo 14</span>
                      <h2 className="text-sm font-black text-white">Planeamento Semanal de Cargas</h2>
                    </div>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                      ⚡ SEMPRE PÓS-TREINO
                    </span>
                  </div>

                  {/* Days Cards Sample */}
                  <div className="space-y-1.5">
                    <div className="p-2.5 rounded-xl border border-blue-500/30 bg-blue-950/20 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-black text-white">TER 10/11 &bull; MD-5</div>
                        <div className="text-[10px] text-slate-300 font-bold">⚽ Treino de Campo (09:00 - 10:30)</div>
                      </div>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded bg-blue-900/80 text-blue-200">
                        🏋️ Ginásio Inferiores
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl border border-purple-500/30 bg-purple-950/20 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-black text-white">QUA 11/11 &bull; MD-4</div>
                        <div className="text-[10px] text-slate-300 font-bold">⚽ Treino de Campo (09:00 - 10:30)</div>
                      </div>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded bg-purple-900/80 text-purple-200">
                        🏋️ Ginásio Superiores
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/30 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-black text-emerald-300">DOM 15/11 &bull; MD</div>
                        <div className="text-[10px] text-white font-black">🏆 TAÇA DE PORTUGAL (15:00)</div>
                      </div>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded bg-emerald-500 text-slate-950">
                        JOGO OFICIAL
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 text-center text-[10px] font-black text-red-500 flex items-center justify-center space-x-1">
                    <span>💪</span>
                    <span>#NinguémPáraEstaCorrente &bull; Gil Vicente FC</span>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Safe Area / App Nav Footer */}
            <div className="px-4 py-2 bg-slate-950 border-t border-slate-900 shrink-0 flex items-center justify-between text-[10px] text-slate-500">
              <span>Gil Vicente FC Performance Hub</span>
              <span className="text-emerald-400 font-bold">Online &bull; PWA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Link to Main App */}
      <div className="mt-6 flex items-center space-x-3 text-xs">
        <Link
          href="/"
          className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <span>← Voltar à Aplicação Principal</span>
        </Link>
      </div>
    </div>
  );
}
