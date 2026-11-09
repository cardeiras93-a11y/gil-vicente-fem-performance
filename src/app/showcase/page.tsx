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
  Video,
  X,
  Radio,
  Maximize2,
  Scale,
  Droplet
} from 'lucide-react';

// Fictional mock squad data for privacy and demonstration
const DEMO_SQUAD = [
  { id: 'ath-04', code: 'Atleta #04', pos: 'DC', badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', totalMin: 985, campMin: 720, tacaMin: 180, matches: 12, avgMin: 82.1, status: '100% Apta' },
  { id: 'ath-07', code: 'Atleta #07', pos: 'EX', badgeBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30', totalMin: 915, campMin: 640, tacaMin: 135, matches: 11, avgMin: 83.2, status: '100% Apta' },
  { id: 'ath-10', code: 'Atleta #10', pos: 'MC', badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30', totalMin: 840, campMin: 590, tacaMin: 120, matches: 12, avgMin: 70.0, status: '100% Apta' },
  { id: 'ath-08', code: 'Atleta #08', pos: 'MC', badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30', totalMin: 795, campMin: 520, tacaMin: 90, matches: 10, avgMin: 79.5, status: 'Recuperação' },
  { id: 'ath-02', code: 'Atleta #02', pos: 'LAT', badgeBg: 'bg-sky-500/20 text-sky-400 border-sky-500/30', totalMin: 760, campMin: 510, tacaMin: 80, matches: 10, avgMin: 76.0, status: '100% Apta' },
  { id: 'ath-06', code: 'Atleta #06', pos: 'MC', badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30', totalMin: 690, campMin: 480, tacaMin: 60, matches: 9, avgMin: 76.7, status: '100% Apta' },
  { id: 'ath-03', code: 'Atleta #03', pos: 'LAT', badgeBg: 'bg-sky-500/20 text-sky-400 border-sky-500/30', totalMin: 620, campMin: 410, tacaMin: 45, matches: 8, avgMin: 77.5, status: '100% Apta' },
  { id: 'ath-09', code: 'Atleta #09', pos: 'AV', badgeBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30', totalMin: 540, campMin: 360, tacaMin: 90, matches: 7, avgMin: 77.1, status: '100% Apta' },
  { id: 'ath-01', code: 'Atleta #01 (GR)', pos: 'GR', badgeBg: 'bg-teal-500/20 text-teal-400 border-teal-500/30', totalMin: 360, campMin: 270, tacaMin: 90, matches: 4, avgMin: 90.0, status: '100% Apta' },
];

export default function ShowcasePage() {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentScene, setCurrentScene] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<'9-16' | '1-1' | '16-9'>('9-16');
  const [activeTab, setActiveTab] = useState<'wellness' | 'hydration' | 'rpe' | 'gps' | 'minutes' | 'plan'>('wellness');
  const [recordFeedback, setRecordFeedback] = useState<string | null>(null);

  // Video recording states
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [showMobileModal, setShowMobileModal] = useState<boolean>(false);
  const [cleanMode, setCleanMode] = useState<boolean>(false);

  // Direct phone-only canvas MP4 generator states
  const [isGeneratingPhoneVideo, setIsGeneratingPhoneVideo] = useState<boolean>(false);
  const [generatorProgress, setGeneratorProgress] = useState<number>(0);

  const phoneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 6 Scenes list for full 30s auto-walkthrough (5000ms each = 30 seconds total)
  const SCENES = [
    { id: 0, tab: 'wellness' as const, label: '1. Wellness Matinal', duration: 5000 },
    { id: 1, tab: 'hydration' as const, label: '2. Pesagem & Hidratação', duration: 5000 },
    { id: 2, tab: 'rpe' as const, label: '3. PSE & Carga Interna', duration: 5000 },
    { id: 3, tab: 'gps' as const, label: '4. Rendimento GPS em Jogo', duration: 5000 },
    { id: 4, tab: 'minutes' as const, label: '5. Minutos Competitivos', duration: 5000 },
    { id: 5, tab: 'plan' as const, label: '6. Planeamento Semanal', duration: 5000 },
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

  // Stop screen recording and trigger MP4 download
  const stopRecordingMP4 = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  };

  // Start real in-browser recording and download MP4
  const startRecordingMP4 = async () => {
    try {
      if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        setShowMobileModal(true);
        return;
      }

      // Request screen or window capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser',
          frameRate: 30,
        },
        audio: false,
      });

      // Find compatible video mime type
      const possibleTypes = [
        'video/mp4;codecs=avc1',
        'video/mp4',
        'video/webm;codecs=h264',
        'video/webm;codecs=vp9',
        'video/webm',
      ];
      let mimeType = possibleTypes.find((t) => MediaRecorder.isTypeSupported(t)) || '';

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        // Stop stream video tracks
        stream.getTracks().forEach((track) => track.stop());

        if (chunks.length > 0) {
          // Create Blob and trigger download as MP4
          const blob = new Blob(chunks, { type: mimeType || 'video/mp4' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `gil-vicente-performance-showcase-${aspectRatio === '9-16' ? 'stories-9x16' : 'feed-1x1'}.mp4`;
          document.body.appendChild(link);
          link.click();
          setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }, 1500);

          setRecordFeedback('🎉 Download do vídeo MP4 concluído com sucesso! Pronto a partilhar.');
          setTimeout(() => setRecordFeedback(null), 8000);
        }

        setIsCapturing(false);
        setRecordingSeconds(0);
        setMediaRecorder(null);
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      };

      // Handle user stopping share through browser banner
      stream.getVideoTracks()[0].onended = () => {
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      };

      // Start recording
      recorder.start(250);
      setMediaRecorder(recorder);
      setIsCapturing(true);
      setRecordingSeconds(0);

      // Start presentation from scene 0 in autoplay
      setCurrentScene(0);
      setActiveTab(SCENES[0].tab);
      setIsPlaying(true);

      // Timer counter and auto-stop after 31s
      let elapsed = 0;
      recordingTimerRef.current = setInterval(() => {
        elapsed += 1;
        setRecordingSeconds(elapsed);
        if (elapsed >= 32) {
          if (recorder.state !== 'inactive') {
            recorder.stop();
          }
        }
      }, 1000);

    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        setShowMobileModal(true);
      }
    }
  };

  // Direct canvas-based video generator (Captures ONLY the mobile phone screen, zero popups/screen capture)
  const generateDirectPhoneVideo = async () => {
    try {
      setIsGeneratingPhoneVideo(true);
      setGeneratorProgress(0);

      // Create internal canvas
      const width = 720;
      const height = 1280;
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Load Crest
      const crestImg = new Image();
      crestImg.crossOrigin = 'anonymous';
      crestImg.src = '/gil-vicente-crest.png';
      await new Promise((resolve) => {
        crestImg.onload = resolve;
        crestImg.onerror = resolve;
      });

      // Capture stream directly from canvas (NO screen selection prompt!)
      const stream = canvas.captureStream(30);

      const possibleTypes = [
        'video/mp4;codecs=avc1',
        'video/mp4',
        'video/webm;codecs=h264',
        'video/webm;codecs=vp9',
        'video/webm',
      ];
      let mimeType = possibleTypes.find((t) => MediaRecorder.isTypeSupported(t)) || '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (chunks.length > 0) {
          const blob = new Blob(chunks, { type: mimeType || 'video/mp4' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `gil-vicente-performance-app-mobile-${aspectRatio === '9-16' ? 'stories' : 'feed'}.mp4`;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 1500);

          setRecordFeedback('🎉 Vídeo MP4 (apenas tela do telemóvel) descarregado com sucesso!');
          setTimeout(() => setRecordFeedback(null), 8000);
        }
        setIsGeneratingPhoneVideo(false);
        setGeneratorProgress(0);
      };

      recorder.start(200);

      // Draw helper: rounded rectangle
      const drawRoundRect = (x: number, y: number, w: number, h: number, r: number, fillColor: string, strokeColor?: string) => {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
        if (strokeColor) {
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.restore();
      };

      // Draw static mobile phone frame contents
      const renderPhoneFrame = (sceneIdx: number, sceneProgress: number) => {
        // Background
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, width, height);

        // Subtle gradient background
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#090d16');
        bgGrad.addColorStop(1, '#0e1628');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Mobile Status Bar (Time & battery)
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
        ctx.fillText('09:41', 40, 50);
        ctx.fillText('5G  ● 100%', width - 150, 50);

        // App Mobile Header
        ctx.drawImage(crestImg, 40, 75, 60, 60);

        ctx.fillStyle = '#ef4444';
        ctx.font = '900 18px system-ui, -apple-system, sans-serif';
        ctx.fillText('GIL VICENTE FC', 115, 98);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 24px system-ui, -apple-system, sans-serif';
        ctx.fillText('Performance Hub', 115, 126);

        // Athlete Pill (Top Right)
        drawRoundRect(width - 230, 80, 190, 50, 25, '#111827', '#1f2937');
        ctx.fillStyle = '#38bdf8';
        ctx.font = '900 18px system-ui, sans-serif';
        ctx.fillText('#7 Atleta #07', width - 215, 112);
        drawRoundRect(width - 90, 90, 38, 28, 8, 'rgba(244,63,94,0.2)', 'rgba(244,63,94,0.4)');
        ctx.fillStyle = '#fda4af';
        ctx.font = '900 14px system-ui, sans-serif';
        ctx.fillText('EX', width - 78, 110);

        // Tab navigation buttons (6 tabs)
        const tabs = ['Wellness', 'Pesagem', 'PSE', 'GPS', 'Minutos', 'Plano'];
        const tabWidth = (width - 80) / 6;
        tabs.forEach((tab, i) => {
          const tx = 40 + i * tabWidth;
          const isActive = i === sceneIdx;
          const fill = isActive ? (i === 0 ? '#f43f5e' : i === 1 ? '#06b6d4' : i === 2 ? '#f59e0b' : i === 3 ? '#0284c7' : i === 4 ? '#10b981' : '#a855f7') : '#111827';
          const stroke = isActive ? 'rgba(255,255,255,0.4)' : '#1f2937';
          drawRoundRect(tx + 3, 155, tabWidth - 6, 48, 14, fill, stroke);
          ctx.fillStyle = isActive ? (i === 1 || i === 2 ? '#020617' : '#ffffff') : '#94a3b8';
          ctx.font = '900 14px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(tab, tx + tabWidth / 2, 185);
          ctx.textAlign = 'left';
        });

        // SCENE 0: WELLNESS
        if (sceneIdx === 0) {
          ctx.fillStyle = '#fb7185';
          ctx.font = '900 18px system-ui, sans-serif';
          ctx.fillText('QUESTIONÁRIO MATINAL', 40, 245);

          ctx.fillStyle = '#ffffff';
          ctx.font = '900 30px system-ui, sans-serif';
          ctx.fillText('Estado de Prontidão Diária', 40, 285);

          drawRoundRect(width - 240, 245, 200, 48, 24, 'rgba(16,185,129,0.2)', '#10b981');
          ctx.fillStyle = '#34d399';
          ctx.font = '900 20px system-ui, sans-serif';
          ctx.fillText('Score: 21 / 25 ★', width - 215, 277);

          // Sliders container
          drawRoundRect(40, 320, width - 80, 520, 28, '#0f172a', '#1e293b');

          const items = [
            { icon: '😴', label: 'Qualidade do Sono', val: '4 / 5 (Bom)', pct: 0.8, color: '#34d399' },
            { icon: '⚡', label: 'Nível de Energia', val: '4 / 5 (Elevado)', pct: 0.8, color: '#34d399' },
            { icon: '🦵', label: 'Fadiga Muscular', val: '2 / 5 (Ligeira)', pct: 0.4, color: '#38bdf8' },
            { icon: '🧘', label: 'Nível de Stress', val: '2 / 5 (Baixo)', pct: 0.4, color: '#34d399' },
          ];

          items.forEach((it, idx) => {
            const iy = 370 + idx * 115;
            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold 22px system-ui, sans-serif';
            ctx.fillText(`${it.icon} ${it.label}`, 70, iy);

            ctx.fillStyle = it.color;
            ctx.font = '900 22px system-ui, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(it.val, width - 70, iy);
            ctx.textAlign = 'left';

            // Bar background
            drawRoundRect(70, iy + 16, width - 140, 16, 8, '#1e293b');
            // Progress Bar (animated)
            const curPct = Math.min(it.pct, it.pct * Math.min(1, sceneProgress * 2));
            drawRoundRect(70, iy + 16, (width - 140) * curPct, 16, 8, it.color);
          });

          // Ready Status Banner
          drawRoundRect(40, 870, width - 80, 95, 24, 'rgba(6,78,59,0.5)', '#059669');
          ctx.fillStyle = '#6ee7b7';
          ctx.font = '900 22px system-ui, sans-serif';
          ctx.fillText('✓ Atleta 100% pronta para a intensidade planeada (MD-3)', 70, 928);
        }

        // SCENE 1: PESAGEM & CONTROLO PONDERAL
        else if (sceneIdx === 1) {
          ctx.fillStyle = '#22d3ee';
          ctx.font = '900 18px system-ui, sans-serif';
          ctx.fillText('CONTROLO PONDERAL • BALANÇA', 40, 245);

          ctx.fillStyle = '#ffffff';
          ctx.font = '900 30px system-ui, sans-serif';
          ctx.fillText('Pesagem & Hidratação Diária', 40, 285);

          drawRoundRect(width - 270, 245, 230, 44, 22, 'rgba(6,182,212,0.2)', '#06b6d4');
          ctx.fillStyle = '#22d3ee';
          ctx.font = '900 18px system-ui, sans-serif';
          ctx.fillText('Status: Hidratação Ótima ✓', width - 255, 274);

          // Grid: Peso Pré vs Peso Pós
          drawRoundRect(40, 320, 305, 175, 24, '#0f172a', '#1e293b');
          ctx.fillStyle = '#94a3b8';
          ctx.font = '900 16px system-ui, sans-serif';
          ctx.fillText('PESO PRÉ-TREINO', 65, 360);
          ctx.fillStyle = '#22d3ee';
          ctx.font = '900 48px system-ui, sans-serif';
          ctx.fillText('58.4 kg', 65, 430);
          ctx.fillStyle = '#64748b';
          ctx.font = 'bold 16px system-ui, sans-serif';
          ctx.fillText('Registado às 09:40', 65, 470);

          drawRoundRect(375, 320, 305, 175, 24, '#0f172a', '#1e293b');
          ctx.fillStyle = '#94a3b8';
          ctx.font = '900 16px system-ui, sans-serif';
          ctx.fillText('PESO PÓS-TREINO', 400, 360);
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 48px system-ui, sans-serif';
          ctx.fillText('57.8 kg', 400, 430);
          ctx.fillStyle = '#34d399';
          ctx.font = '900 18px system-ui, sans-serif';
          ctx.fillText('-0.60 kg (-1.03%)', 400, 470);

          // Hydration Stats Box
          drawRoundRect(40, 520, width - 80, 220, 24, '#0f172a', '#1e293b');
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 22px system-ui, sans-serif';
          ctx.fillText('💧 Líquidos Ingeridos no Treino', 65, 570);
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 24px system-ui, sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText('500 ml', width - 65, 570);
          ctx.textAlign = 'left';

          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 22px system-ui, sans-serif';
          ctx.fillText('⚡ Nível de Preservação Hídrica', 65, 630);
          ctx.fillStyle = '#34d399';
          ctx.font = '900 24px system-ui, sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText('92% (Excelente)', width - 65, 630);
          ctx.textAlign = 'left';

          drawRoundRect(65, 665, width - 130, 18, 9, '#1e293b');
          const curHyd = Math.min(0.92, 0.92 * Math.min(1, sceneProgress * 2));
          drawRoundRect(65, 665, (width - 130) * curHyd, 18, 9, '#06b6d4');

          // Protocol card
          drawRoundRect(40, 765, width - 80, 120, 22, 'rgba(6,182,212,0.15)', 'rgba(6,182,212,0.3)');
          ctx.fillStyle = '#22d3ee';
          ctx.font = '900 20px system-ui, sans-serif';
          ctx.fillText('💧 RECOMENDAÇÃO NUTRICIONAL & HÍDRICA', 65, 810);
          ctx.fillStyle = '#cbd5e1';
          ctx.font = 'bold 18px system-ui, sans-serif';
          ctx.fillText('Ingerir ~900 ml de água com eletrólitos nas próximas 2 horas.', 65, 850);
        }

        // SCENE 2: PSE TREINO
        else if (sceneIdx === 2) {
          ctx.fillStyle = '#fbbf24';
          ctx.font = '900 18px system-ui, sans-serif';
          ctx.fillText('PÓS-TREINO • BORG CR-10', 40, 245);

          ctx.fillStyle = '#ffffff';
          ctx.font = '900 30px system-ui, sans-serif';
          ctx.fillText('Perceção Subjetiva de Esforço', 40, 285);

          drawRoundRect(width - 220, 245, 180, 48, 24, '#f59e0b', '#fbbf24');
          ctx.fillStyle = '#020617';
          ctx.font = '900 20px system-ui, sans-serif';
          ctx.fillText('PSE: 6.5 / 10', width - 195, 277);

          // Card Main
          drawRoundRect(40, 320, width - 80, 360, 28, '#0f172a', '#1e293b');
          ctx.fillStyle = '#fbbf24';
          ctx.font = '900 48px system-ui, sans-serif';
          ctx.fillText('6.5 • Moderado / Difícil', 70, 400);

          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 22px system-ui, sans-serif';
          ctx.fillText('Sessão com estímulo de acelerações repetidas e transições.', 70, 450);

          // Grid
          drawRoundRect(70, 500, 270, 140, 20, '#020617', '#1e293b');
          ctx.fillStyle = '#94a3b8';
          ctx.font = '900 16px system-ui, sans-serif';
          ctx.fillText('CARGA DE SESSÃO', 95, 540);
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 36px system-ui, sans-serif';
          ctx.fillText('455 u.a.', 95, 600);

          drawRoundRect(380, 500, 270, 140, 20, '#020617', '#1e293b');
          ctx.fillStyle = '#94a3b8';
          ctx.font = '900 16px system-ui, sans-serif';
          ctx.fillText('GINÁSIO PÓS-TREINO', 405, 540);
          ctx.fillStyle = '#c084fc';
          ctx.font = '900 32px system-ui, sans-serif';
          ctx.fillText('Inferiores ✓', 405, 600);

          // Complaints Card
          drawRoundRect(40, 710, width - 80, 130, 24, '#0f172a', '#1e293b');
          ctx.fillStyle = '#e2e8f0';
          ctx.font = '900 20px system-ui, sans-serif';
          ctx.fillText('QUEIXAS MUSCULARES', 70, 755);
          ctx.fillStyle = '#34d399';
          ctx.font = 'bold 20px system-ui, sans-serif';
          ctx.fillText('Sem queixas articulares (Fadiga normal nos isquios: 2/10) 🦵', 70, 800);
        }

        // SCENE 3: GPS JOGO
        else if (sceneIdx === 3) {
          ctx.fillStyle = '#38bdf8';
          ctx.font = '900 18px system-ui, sans-serif';
          ctx.fillText('JOGO DEMONSTRATIVO • JORNADA EXEMPLO', 40, 245);

          ctx.fillStyle = '#ffffff';
          ctx.font = '900 30px system-ui, sans-serif';
          ctx.fillText('Análise de Rendimento Individual', 40, 285);

          drawRoundRect(width - 250, 245, 210, 44, 22, 'rgba(16,185,129,0.2)', '#10b981');
          ctx.fillStyle = '#34d399';
          ctx.font = '900 18px system-ui, sans-serif';
          ctx.fillText('+65m HI vs Jogo Ant. ⚡', width - 235, 274);

          // Metrics cards
          const metrics = [
            { icon: '🏃', label: 'Distância Total', val: '9 340 m', pct: 0.85, color: '#38bdf8' },
            { icon: '⚡', label: 'Alta Intensidade (>19 km/h)', val: '715 m', pct: 0.78, color: '#34d399' },
            { icon: '🔥', label: 'Sprint Puro (>23 km/h)', val: '192.0 m', pct: 0.72, color: '#fb7185' },
          ];

          metrics.forEach((m, idx) => {
            const my = 330 + idx * 135;
            drawRoundRect(40, my, width - 80, 115, 22, '#0f172a', '#1e293b');

            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold 22px system-ui, sans-serif';
            ctx.fillText(`${m.icon} ${m.label}`, 65, my + 45);

            ctx.fillStyle = '#ffffff';
            ctx.font = '900 28px system-ui, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(m.val, width - 65, my + 45);
            ctx.textAlign = 'left';

            drawRoundRect(65, my + 68, width - 130, 16, 8, '#1e293b');
            const curPct = Math.min(m.pct, m.pct * Math.min(1, sceneProgress * 2));
            drawRoundRect(65, my + 68, (width - 130) * curPct, 16, 8, m.color);
          });

          // Bottom Grid
          drawRoundRect(40, 755, 305, 130, 22, '#0f172a', '#1e293b');
          ctx.fillStyle = '#94a3b8';
          ctx.font = '900 16px system-ui, sans-serif';
          ctx.fillText('VELOCIDADE MÁXIMA', 65, 795);
          ctx.fillStyle = '#fbbf24';
          ctx.font = '900 36px system-ui, sans-serif';
          ctx.fillText('27.4 km/h', 65, 850);

          drawRoundRect(375, 755, 305, 130, 22, '#0f172a', '#1e293b');
          ctx.fillStyle = '#94a3b8';
          ctx.font = '900 16px system-ui, sans-serif';
          ctx.fillText('AÇÕES (>3m/s²)', 400, 795);
          ctx.fillStyle = '#c084fc';
          ctx.font = '900 30px system-ui, sans-serif';
          ctx.fillText('138 ações', 400, 850);
        }

        // SCENE 4: MINUTOS
        else if (sceneIdx === 4) {
          ctx.fillStyle = '#34d399';
          ctx.font = '900 18px system-ui, sans-serif';
          ctx.fillText('HISTÓRICO DE ÉPOCA', 40, 245);

          ctx.fillStyle = '#ffffff';
          ctx.font = '900 30px system-ui, sans-serif';
          ctx.fillText('Minutos Oficiais do Plantel', 40, 285);

          drawRoundRect(width - 240, 245, 200, 44, 22, '#1e3a8a', '#3b82f6');
          ctx.fillStyle = '#93c5fd';
          ctx.font = '900 18px system-ui, sans-serif';
          ctx.fillText('13 Jogos Registados', width - 225, 274);

          // Top Player Card
          drawRoundRect(40, 330, width - 80, 140, 24, '#0f172a', '#1e293b');
          ctx.fillStyle = '#94a3b8';
          ctx.font = '900 18px system-ui, sans-serif';
          ctx.fillText('ATLETA #07 • MINUTOS TOTAIS', 70, 375);
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 44px system-ui, sans-serif';
          ctx.fillText('915 min', 70, 435);

          ctx.fillStyle = '#34d399';
          ctx.font = 'bold 20px system-ui, sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText('640 min Liga', width - 70, 390);
          ctx.fillStyle = '#fbbf24';
          ctx.fillText('135 min Taça', width - 70, 430);
          ctx.textAlign = 'left';

          // Squad list
          const squad = [
            { pos: 'DC', num: '#1', code: 'Atleta #04', min: '985 min' },
            { pos: 'EX', num: '#2', code: 'Atleta #07', min: '915 min', highlight: true },
            { pos: 'MC', num: '#3', code: 'Atleta #10', min: '840 min' },
            { pos: 'MC', num: '#4', code: 'Atleta #08', min: '795 min' },
            { pos: 'LAT', num: '#5', code: 'Atleta #02', min: '760 min' },
            { pos: 'MC', num: '#6', code: 'Atleta #06', min: '690 min' },
          ];

          squad.forEach((s, idx) => {
            const sy = 500 + idx * 72;
            drawRoundRect(40, sy, width - 80, 60, 16, s.highlight ? 'rgba(30,58,138,0.4)' : '#0f172a', s.highlight ? '#3b82f6' : '#1e293b');

            ctx.fillStyle = '#64748b';
            ctx.font = '900 18px system-ui, sans-serif';
            ctx.fillText(s.num, 65, sy + 38);

            drawRoundRect(100, sy + 14, 52, 32, 8, '#1e293b');
            ctx.fillStyle = '#38bdf8';
            ctx.font = '900 15px system-ui, sans-serif';
            ctx.fillText(s.pos, 112, sy + 36);

            ctx.fillStyle = s.highlight ? '#ffffff' : '#cbd5e1';
            ctx.font = 'bold 20px system-ui, sans-serif';
            ctx.fillText(s.code, 175, sy + 38);

            ctx.fillStyle = '#ffffff';
            ctx.font = '900 20px system-ui, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(s.min, width - 65, sy + 38);
            ctx.textAlign = 'left';
          });
        }

        // SCENE 5: MICROCICLO
        else if (sceneIdx === 5) {
          ctx.fillStyle = '#c084fc';
          ctx.font = '900 18px system-ui, sans-serif';
          ctx.fillText('MICROCICLO 21 • 18/03 A 24/03', 40, 245);

          ctx.fillStyle = '#ffffff';
          ctx.font = '900 30px system-ui, sans-serif';
          ctx.fillText('Planeamento Semanal de Cargas', 40, 285);

          drawRoundRect(width - 240, 245, 200, 44, 22, '#f59e0b', '#fbbf24');
          ctx.fillStyle = '#020617';
          ctx.font = '900 17px system-ui, sans-serif';
          ctx.fillText('⚡ SEMPRE PÓS-TREINO', width - 230, 273);

          // Week days
          const days = [
            { day: 'TER 19/03 • MD-5', act: '⚽ Treino de Campo (10:00 - 11:30)', gym: '🏋️ Ginásio Inferiores', color: '#38bdf8' },
            { day: 'QUA 20/03 • MD-4', act: '⚽ Treino de Campo (10:00 - 11:30)', gym: '🏋️ Ginásio Superiores', color: '#c084fc' },
            { day: 'QUI 21/03 • MD-3', act: '⚽ Treino de Campo (10:00 - 11:15)', gym: '⚡ Alta Velocidade', color: '#38bdf8' },
            { day: 'DOM 24/03 • MD', act: '🏆 JORNADA COMPETITIVA (15:00)', gym: 'JOGO OFICIAL', color: '#34d399', isMatch: true },
          ];

          days.forEach((d, idx) => {
            const dy = 340 + idx * 135;
            drawRoundRect(40, dy, width - 80, 115, 22, d.isMatch ? 'rgba(6,78,59,0.3)' : '#0f172a', d.isMatch ? '#10b981' : '#1e293b');

            ctx.fillStyle = d.color;
            ctx.font = '900 22px system-ui, sans-serif';
            ctx.fillText(d.day, 65, dy + 42);

            ctx.fillStyle = d.isMatch ? '#ffffff' : '#cbd5e1';
            ctx.font = 'bold 20px system-ui, sans-serif';
            ctx.fillText(d.act, 65, dy + 82);

            drawRoundRect(width - 250, dy + 22, 190, 40, 12, '#1e293b');
            ctx.fillStyle = d.color;
            ctx.font = '900 15px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(d.gym, width - 155, dy + 47);
            ctx.textAlign = 'left';
          });

          // Club Moto
          ctx.fillStyle = '#ef4444';
          ctx.font = '900 24px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('💪 #NinguémPáraEstaCorrente • Gil Vicente FC', width / 2, 950);
          ctx.textAlign = 'left';
        }

        // Bottom Safe Area / PWA bar
        drawRoundRect(40, height - 90, width - 80, 55, 18, '#0b1120', '#1e293b');
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 18px system-ui, sans-serif';
        ctx.fillText('Gil Vicente FC Performance Hub', 65, height - 55);
        ctx.fillStyle = '#34d399';
        ctx.font = '900 18px system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('● Online • PWA', width - 65, height - 55);
        ctx.textAlign = 'left';
      };

      // 6 scenes x 150 frames = 900 frames (30 seconds total at 30fps)
      const framesPerScene = 150;
      const totalScenes = 6;
      const totalFrames = totalScenes * framesPerScene;

      let currentFrame = 0;

      const renderNextFrame = () => {
        if (currentFrame >= totalFrames) {
          recorder.stop();
          return;
        }

        const sceneIdx = Math.floor(currentFrame / framesPerScene);
        const progressInScene = (currentFrame % framesPerScene) / framesPerScene;

        renderPhoneFrame(sceneIdx, progressInScene);

        currentFrame += 1;
        setGeneratorProgress(Math.round((currentFrame / totalFrames) * 100));

        // Use fast frame dispatching
        setTimeout(renderNextFrame, 10);
      };

      renderNextFrame();

    } catch (err) {
      console.error('Error generating direct canvas phone video:', err);
      setIsGeneratingPhoneVideo(false);
    }
  };

  return (
    <div className={`min-h-screen bg-[#070b12] text-slate-100 flex flex-col items-center justify-start ${cleanMode ? 'p-1 justify-center' : 'p-3 sm:p-6'} antialiased selection:bg-brand-lime selection:text-slate-950 transition-all`}>
      
      {/* Floating Recording Banner when recording */}
      {isCapturing && (
        <div className="fixed top-4 z-50 bg-red-950/95 border-2 border-red-500 text-white px-4 sm:px-6 py-2.5 rounded-2xl shadow-[0_10px_40px_rgba(239,68,68,0.5)] flex items-center gap-3 sm:gap-5 backdrop-blur-md animate-bounce-short ring-2 ring-red-500/30">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs font-black uppercase tracking-wider text-red-100">
              A Gravar Vídeo MP4 ({recordingSeconds}s / 31s)
            </span>
          </div>
          <button
            onClick={stopRecordingMP4}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-red-700 text-xs font-black shadow flex items-center gap-1.5 transition-all"
          >
            <Download className="h-4 w-4" /> Parar &amp; Descarregar MP4
          </button>
        </div>
      )}

      {/* Clean Mode Exit Button */}
      {cleanMode && (
        <button
          onClick={() => setCleanMode(false)}
          className="fixed top-3 right-3 z-50 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold shadow-xl flex items-center gap-1.5 backdrop-blur-md"
        >
          <X className="h-3.5 w-3.5" /> Sair do Modo Limpo
        </button>
      )}

      {/* Top Header Controls Bar (Hidden in cleanMode) */}
      {!cleanMode && (
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

            {/* MAIN ACTION: DIRECT PHONE-ONLY MP4 DOWNLOAD (Zero permissions needed) */}
            <button
              onClick={generateDirectPhoneVideo}
              disabled={isGeneratingPhoneVideo}
              className={`px-4 py-2 rounded-xl text-xs font-black shadow-lg flex items-center gap-2 transition-all ${
                isGeneratingPhoneVideo
                  ? 'bg-amber-500 text-slate-950 animate-pulse'
                  : 'bg-gradient-to-r from-red-600 via-rose-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white shadow-[0_0_25px_rgba(225,29,72,0.45)] ring-2 ring-white/30 hover:scale-[1.02]'
              }`}
              title="Descarregar vídeo MP4 de 30s contendo apenas o ecrã do telemóvel (6 cenas com Pesagem)"
            >
              {isGeneratingPhoneVideo ? (
                <>
                  <Radio className="h-4 w-4 animate-spin text-slate-950" />
                  <span>A Gerar Vídeo 30s ({generatorProgress}%)...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Descarregar Vídeo 30s (Apenas Telemóvel)</span>
                </>
              )}
            </button>

            {/* SECONDARY ACTION: BROWSER SCREEN RECORDER */}
            <button
              onClick={isCapturing ? stopRecordingMP4 : startRecordingMP4}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isCapturing
                  ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse ring-2 ring-red-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
              }`}
              title="Gravar a janela completa do navegador"
            >
              {isCapturing ? (
                <>
                  <Radio className="h-3.5 w-3.5 animate-spin text-white" />
                  <span>Parar ({recordingSeconds}s)</span>
                </>
              ) : (
                <>
                  <Video className="h-3.5 w-3.5" />
                  <span>Gravar Ecrã</span>
                </>
              )}
            </button>

            {/* Mobile / Screen Recording Guidance */}
            <button
              onClick={() => setShowMobileModal(true)}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
              title="Como Gravar no Telemóvel"
            >
              <Smartphone className="h-4 w-4" />
            </button>

            {/* Clean mode button */}
            <button
              onClick={() => setCleanMode(true)}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
              title="Modo Ecrã Limpo (Apenas o Telemóvel)"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </header>
      )}

      {/* Hidden Rendering Canvas for direct phone-only export */}
      <canvas ref={canvasRef} style={{ display: 'none' }} width={720} height={1280} />

      {/* Generation Progress Modal */}
      {isGeneratingPhoneVideo && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl text-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg animate-pulse">
              <Download className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">A Renderizar Vídeo MP4 (30s)</h3>
              <p className="text-xs text-slate-400 mt-1">Apenas o ecrã do telemóvel &bull; 6 Cenas (com Pesagem)</p>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-red-500 via-rose-500 to-emerald-400 rounded-full transition-all duration-150"
                  style={{ width: `${generatorProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-400">
                <span>Progresso: {generatorProgress}%</span>
                <span>30 Segundos &bull; 30 FPS MP4</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              O ficheiro <strong className="text-white">gil-vicente-performance-app-mobile-stories.mp4</strong> será descarregado automaticamente dentro de momentos!
            </p>
          </div>
        </div>
      )}

      {/* Toast Notice */}
      {recordFeedback && (
        <div className="w-full max-w-md mb-4 p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs text-center font-bold shadow-xl animate-fade-in flex items-center justify-center gap-2">
          <span>{recordFeedback}</span>
        </div>
      )}

      {/* Progress Timeline Scenes Bar (Hidden in cleanMode) */}
      {!cleanMode && (
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
      )}

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
                onClick={() => setActiveTab('hydration')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                  activeTab === 'hydration' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Scale className="h-3 w-3" /> Pesagem
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
                      Score: 21 / 25 ★
                    </span>
                  </div>

                  {/* 5 Wellness Sliders Preview */}
                  <div className="space-y-2 bg-slate-900/70 p-3 rounded-2xl border border-slate-800">
                    <div>
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-400">😴 Qualidade do Sono</span>
                        <span className="text-emerald-400 font-black">4 / 5 (Bom)</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full w-[80%]" />
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
                        <span className="text-emerald-400 font-black">2 / 5 (Baixo)</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full w-[40%]" />
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

              {/* SCENE 2: PESAGEM & HIDRATAÇÃO */}
              {activeTab === 'hydration' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">Controlo Ponderal &bull; Balança</span>
                      <h2 className="text-sm font-black text-white">Pesagem &amp; Hidratação Diária</h2>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      Status: Hidratação Ótima ✓
                    </span>
                  </div>

                  {/* Dual Weight Cards: Pré vs Pós Treino */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 text-left space-y-1">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Peso Pré-Treino</span>
                      <div className="text-xl font-black text-cyan-400">58.4 <span className="text-xs text-slate-400 font-normal">kg</span></div>
                      <span className="text-[9px] text-slate-500 block">Registado às 09:40</span>
                    </div>

                    <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 text-left space-y-1">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Peso Pós-Treino</span>
                      <div className="text-xl font-black text-white">57.8 <span className="text-xs text-slate-400 font-normal">kg</span></div>
                      <span className="text-[9px] text-emerald-400 font-bold block">-0.60 kg (-1.03%)</span>
                    </div>
                  </div>

                  {/* Hydration Stats Box */}
                  <div className="bg-slate-900/70 p-3 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-400">💧 Líquidos Ingeridos no Treino</span>
                      <span className="text-white font-black">500 ml</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-400">⚡ Nível de Preservação Hídrica</span>
                      <span className="text-emerald-400 font-black">92% (Excelente)</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full w-[92%]" />
                    </div>
                  </div>

                  {/* Recovery Protocol Recommendation */}
                  <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center space-x-2 text-cyan-300 text-xs font-bold">
                    <span className="text-base">💧</span>
                    <span>Recomendação: Ingerir ~900 ml de água com eletrólitos nas próximas 2 horas.</span>
                  </div>
                </div>
              )}

              {/* SCENE 3: PSE & RPE */}
              {activeTab === 'rpe' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Pós-Treino &bull; Borg CR-10</span>
                      <h2 className="text-sm font-black text-white">Perceção Subjetiva de Esforço</h2>
                    </div>
                    <span className="text-xs font-black px-2 py-1 rounded-full bg-amber-400 text-slate-950">
                      PSE: 6.5 / 10
                    </span>
                  </div>

                  <div className="bg-slate-900/70 p-3.5 rounded-2xl border border-slate-800 text-center space-y-2">
                    <div className="text-2xl font-black text-amber-400">6.5 &bull; Moderado / Difícil</div>
                    <p className="text-[10px] text-slate-400">Sessão com estímulo de acelerações repetidas e transições rápidas.</p>
                    
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-left">
                      <div className="bg-slate-950/60 p-2 rounded-xl">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">Carga de Sessão</span>
                        <span className="text-xs font-black text-white">455 u.a.</span>
                      </div>
                      <div className="bg-slate-950/60 p-2 rounded-xl">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">Ginásio Pós-Treino</span>
                        <span className="text-xs font-black text-purple-400">Inferiores ✓</span>
                      </div>
                    </div>
                  </div>

                  {/* Body Map Preview */}
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black uppercase text-slate-300">Queixas Musculares</span>
                      <p className="text-[10px] text-emerald-400 font-bold">Sem queixas articulares (Fadiga normal nos isquiotibiais: 2/10)</p>
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
                      <span className="text-[10px] font-black uppercase text-sky-400 tracking-wider">Jogo Demonstrativo &bull; Jornada Exemplo</span>
                      <h2 className="text-sm font-black text-white">Análise de Rendimento Individual</h2>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      +65m HI vs Jogo Ant. ⚡
                    </span>
                  </div>

                  {/* Metrics Cards */}
                  <div className="space-y-2">
                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-400">🏃 Distância Total</span>
                        <span className="text-white font-black">9 340 m</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-sky-400 rounded-full w-[85%]" />
                      </div>
                    </div>

                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-400">⚡ Alta Intensidade (&gt;19 km/h)</span>
                        <span className="text-emerald-400 font-black">715 m</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full w-[78%]" />
                      </div>
                    </div>

                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-400">🔥 Sprint Puro (&gt;23 km/h)</span>
                        <span className="text-rose-400 font-black">192.0 m</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full w-[72%]" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">Velocidade Máx.</span>
                        <span className="text-xs font-black text-amber-400">27.4 km/h</span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">Ações (&gt;3m/s²)</span>
                        <span className="text-xs font-black text-purple-400">138 ações (61 ACC + 77 DEC)</span>
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
                      <h2 className="text-sm font-black text-white">Minutos de Jogo Fictícios</h2>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-blue-900/60 text-blue-300">
                      13 Jogos Registados
                    </span>
                  </div>

                  {/* Top Stats of Active Athlete */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Atleta #07 &bull; Minutos Totais</div>
                      <div className="text-xl font-black text-white">915 <span className="text-xs text-slate-400 font-normal">min</span></div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] text-emerald-400 font-bold">640 min Liga</div>
                      <div className="text-[9px] text-amber-400 font-bold">135 min Taça</div>
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
                      <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider">Microciclo 21 &bull; 18/03 a 24/03</span>
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
                        <div className="text-[11px] font-black text-white">TER 19/03 &bull; MD-5</div>
                        <div className="text-[10px] text-slate-300 font-bold">⚽ Treino de Campo (10:00 - 11:30)</div>
                      </div>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded bg-blue-900/80 text-blue-200">
                        🏋️ Ginásio Inferiores
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl border border-purple-500/30 bg-purple-950/20 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-black text-white">QUA 20/03 &bull; MD-4</div>
                        <div className="text-[10px] text-slate-300 font-bold">⚽ Treino de Campo (10:00 - 11:30)</div>
                      </div>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded bg-purple-900/80 text-purple-200">
                        🏋️ Ginásio Superiores
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl border border-sky-500/30 bg-sky-950/20 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-black text-white">QUI 21/03 &bull; MD-3</div>
                        <div className="text-[10px] text-slate-300 font-bold">⚽ Treino de Campo (10:00 - 11:15)</div>
                      </div>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded bg-sky-900/80 text-sky-200">
                        ⚡ Alta Velocidade
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/30 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-black text-emerald-300">DOM 24/03 &bull; MD</div>
                        <div className="text-[10px] text-white font-black">🏆 JORNADA COMPETITIVA (15:00)</div>
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
      {!cleanMode && (
        <div className="mt-6 flex items-center space-x-3 text-xs">
          <Link
            href="/"
            className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>← Voltar à Aplicação Principal</span>
          </Link>
        </div>
      )}

      {/* Mobile Recording Guidance Modal */}
      {showMobileModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 text-slate-100 relative">
            <button
              onClick={() => setShowMobileModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-red-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                <Video className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Como Gravar &amp; Descarregar em MP4</h3>
                <p className="text-xs text-slate-400">Guia rápido para Telemóvel e Computador</p>
              </div>
            </div>

            <div className="space-y-3 text-xs bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
              <div className="space-y-1">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <span>💻 No Computador (Mac / Windows):</span>
                </div>
                <p className="text-slate-300 pl-4">
                  Basta clicar no botão <strong className="text-white">"Descarregar Vídeo MP4"</strong> no topo e escolher este separador. O sistema grava os 31 segundos de todas as 5 cenas e inicia o download automático do ficheiro <strong>.mp4</strong>!
                </p>
              </div>

              <div className="border-t border-slate-800/80 pt-2.5 space-y-1">
                <div className="font-bold text-amber-400 flex items-center gap-1.5">
                  <span>📱 No Telemóvel (iPhone / Android):</span>
                </div>
                <p className="text-slate-300 pl-4">
                  1. Desliza para abrir a <strong className="text-white">Central de Controlo</strong> e ativa a <strong className="text-white">Gravação de Ecrã</strong> (ícone circular).<br />
                  2. Clica no botão <strong className="text-white">"Ativar Modo Ecrã Limpo"</strong> abaixo.<br />
                  3. O showreel corre sozinho com as 5 cenas em alta definição.<br />
                  4. Quando terminar, pára a gravação: o vídeo fica <strong>guardado na Galeria em MP4 1080p/4K</strong>, pronto a publicar no Instagram Stories, LinkedIn ou X!
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <button
                onClick={() => {
                  setShowMobileModal(false);
                  setCleanMode(true);
                  handleReset();
                }}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <Maximize2 className="h-4 w-4" /> Ativar Modo Ecrã Limpo
              </button>
              <button
                onClick={() => setShowMobileModal(false)}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
