'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Copy,
  Check,
  Share2,
  Calendar,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Sun,
  Moon,
  Info,
} from 'lucide-react';
import { TrainingSessionInfo } from '../lib/types';
import {
  COMPLEMENTARY_WORK_ITEMS,
  getActiveComplementaryItems,
  getDayNamePt,
  getDayNameEn,
  formatDatePtShort,
  hasAnyComplementaryWork,
  generateWhatsAppWeeklyPlanText,
} from '../lib/complementaryWork';

interface WeeklyPlanExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  microcycleTitle: string;
  weekDates: string[];
  sessions: Record<string, TrainingSessionInfo>;
  weeklyTeamNotes?: string;
  initialLang?: 'en' | 'pt';
}

export const WeeklyPlanExportModal: React.FC<WeeklyPlanExportModalProps> = ({
  isOpen,
  onClose,
  microcycleTitle,
  weekDates,
  sessions,
  weeklyTeamNotes = '',
  initialLang = 'en',
}) => {
  const [lang, setLang] = useState<'en' | 'pt'>(initialLang);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [copyImageSuccess, setCopyImageSuccess] = useState(false);
  const [copyTextSuccess, setCopyTextSuccess] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const isEn = lang === 'en';
  const isDark = theme === 'dark';

  const defaultTitle = isEn ? 'Weekly Microcycle Plan' : 'Planeamento do Microciclo Semanal';
  const effectiveTitle = (microcycleTitle && microcycleTitle.trim()) || defaultTitle;
  const startDateStr = weekDates[0] ? formatDatePtShort(weekDates[0]) : '';
  const endDateStr = weekDates[6] ? formatDatePtShort(weekDates[6]) : '';

  // Trigger browser print (PDF export)
  const handlePrint = () => {
    window.print();
  };

  // Generate high-resolution PNG using HTML5 Canvas
  const generateCanvasImage = async (): Promise<Blob | null> => {
    const width = 1600;
    const height = 1120;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Background styling
    if (isDark) {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#090d16');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Subtle decorative glows
      ctx.fillStyle = 'rgba(200, 16, 46, 0.08)'; // GVFC Red glow top left
      ctx.beginPath();
      ctx.arc(100, 100, 300, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(14, 116, 144, 0.08)'; // Cyan glow bottom right
      ctx.beginPath();
      ctx.arc(width - 150, height - 150, 350, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, width, height);
    }

    // Top Brand Bar (Red & Blue GVFC)
    const brandGrad = ctx.createLinearGradient(0, 0, width, 0);
    brandGrad.addColorStop(0, '#C8102E');
    brandGrad.addColorStop(0.65, '#002B49');
    brandGrad.addColorStop(1, '#C8102E');
    ctx.fillStyle = brandGrad;
    ctx.fillRect(0, 0, width, 12);

    // Header Content
    const headerY = 55;

    // Subtitle / Club Tag
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = isDark ? '#f87171' : '#b91c1c';
    ctx.letterSpacing = '1px';
    ctx.fillText('🔴🔵 GIL VICENTE FC  •  FUTEBOL FEMININO  •  DEPARTAMENTO DE PERFORMANCE', 60, headerY);

    // Title
    ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
    ctx.fillText(effectiveTitle.toUpperCase(), 60, headerY + 45);

    // Dates range
    ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
    const datesLabel = isEn
      ? `Week: ${startDateStr} to ${endDateStr} (Monday – Sunday)`
      : `Semana: ${startDateStr} a ${endDateStr} (Segunda a Domingo)`;
    ctx.fillText(datesLabel, 60, headerY + 75);

    // Post-training mandatory pill on header right
    const pillX = width - 420;
    const pillY = headerY + 12;
    ctx.fillStyle = isDark ? 'rgba(234, 88, 12, 0.15)' : '#ffedd5';
    ctx.strokeStyle = isDark ? 'rgba(249, 115, 22, 0.6)' : '#ea580c';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, 360, 48, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font = '900 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = isDark ? '#fdba74' : '#c2410c';
    ctx.fillText(
      isEn ? '⚡ ALWAYS POST-TRAINING WORK' : '⚡ TRABALHO SEMPRE PÓS-TREINO',
      pillX + 30,
      pillY + 30
    );

    // Notice banner under header
    const bannerY = headerY + 105;
    ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.7)' : '#e2e8f0';
    ctx.strokeStyle = isDark ? 'rgba(100, 116, 139, 0.3)' : '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(60, bannerY, width - 120, 38, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = isDark ? '#cbd5e1' : '#334155';
    const noticeText = isEn
      ? '📌 IMPORTANT: All complementary gym, mobility and recovery protocols must be performed ALWAYS AFTER pitch training.'
      : '📌 AVISO: Todo o trabalho complementar de ginásio, mobilidade e recuperação é realizado SEMPRE APÓS o treino de campo.';
    ctx.fillText(noticeText, 80, bannerY + 24);

    // 7 Days Grid: 7 columns
    const gridY = bannerY + 55;
    const gridHeight = 670;
    const totalW = width - 120;
    const gap = 14;
    const colW = (totalW - gap * 6) / 7;

    weekDates.forEach((dateStr, idx) => {
      const colX = 60 + idx * (colW + gap);
      const s = sessions[dateStr];
      const dayType = s?.dayType || 'rest';
      const offset = s?.matchDayOffset || '';
      const dayName = isEn ? getDayNameEn(dateStr, true) : getDayNamePt(dateStr, true);
      const shortDayName = dayName.slice(0, 3);
      const dateFmt = formatDatePtShort(dateStr);

      // Card Background
      let cardBg = isDark ? '#111827' : '#ffffff';
      let cardBorder = isDark ? '#1f2937' : '#e2e8f0';

      if (dayType === 'match') {
        cardBg = isDark ? 'rgba(6, 78, 59, 0.25)' : '#ecfdf5';
        cardBorder = isDark ? '#059669' : '#10b981';
      } else if (dayType === 'rest') {
        cardBg = isDark ? 'rgba(30, 41, 59, 0.3)' : '#f1f5f9';
        cardBorder = isDark ? '#334155' : '#cbd5e1';
      }

      ctx.fillStyle = cardBg;
      ctx.strokeStyle = cardBorder;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(colX, gridY, colW, gridHeight, 14);
      ctx.fill();
      ctx.stroke();

      // Top Day Header strip inside card
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
      ctx.beginPath();
      ctx.roundRect(colX, gridY, colW, 60, [14, 14, 0, 0]);
      ctx.fill();

      // Day Title & Date
      ctx.font = '900 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.fillText(`${shortDayName} ${dateFmt}`, colX + 12, gridY + 28);

      // MatchDayOffset badge or Day Type tag
      if (offset) {
        ctx.fillStyle = dayType === 'match' ? '#10b981' : isDark ? '#3b82f6' : '#2563eb';
        ctx.beginPath();
        ctx.roundRect(colX + 12, gridY + 36, 60, 18, 6);
        ctx.fill();

        ctx.font = '900 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(offset, colX + 22, gridY + 49);
      }

      let contentY = gridY + 80;

      // Primary Session Box
      ctx.font = '800 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      if (dayType === 'match') {
        ctx.fillStyle = isDark ? '#34d399' : '#059669';
        ctx.fillText(isEn ? '🏆 MATCH DAY' : '🏆 DIA DE JOGO', colX + 12, contentY);
        contentY += 18;

        const cat = s?.matchCategory;
        const catStr = cat === 'cup' ? (isEn ? 'Cup Match' : 'Taça') : cat === 'friendly' ? (isEn ? 'Friendly' : 'Treino') : (isEn ? 'Championship' : 'Campeonato');
        ctx.font = '600 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = isDark ? '#a7f3d0' : '#065f46';
        ctx.fillText(catStr, colX + 12, contentY);
        contentY += 18;

        if (s?.startTime) {
          ctx.font = '700 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
          ctx.fillText(`🕒 ${s.startTime}`, colX + 12, contentY);
          contentY += 20;
        }
      } else if (dayType === 'rest') {
        ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
        ctx.fillText(isEn ? '🏖️ REST DAY' : '🏖️ FOLGA', colX + 12, contentY);
        contentY += 20;

        ctx.font = 'italic 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = isDark ? '#64748b' : '#94a3b8';
        ctx.fillText(isEn ? 'Recovery & Sleep' : 'Descanso ativo', colX + 12, contentY);
        contentY += 24;
      } else {
        // Pitch Training
        ctx.fillStyle = isDark ? '#60a5fa' : '#2563eb';
        ctx.fillText(isEn ? '⚽ PITCH TRAINING' : '⚽ TREINO CAMPO', colX + 12, contentY);
        contentY += 20;

        if (s?.startTime) {
          ctx.font = '800 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
          const timeText = s.endTime ? `${s.startTime} - ${s.endTime}` : s.startTime;
          ctx.fillText(`🕒 ${timeText}`, colX + 12, contentY);
          contentY += 20;
        }

        if (s?.locationTime) {
          ctx.font = '500 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
          const shortLoc = s.locationTime.split('-')[0].trim().slice(0, 18);
          ctx.fillText(`📍 ${shortLoc}`, colX + 12, contentY);
          contentY += 18;
        }
      }

      // Divider line inside card
      contentY += 8;
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
      ctx.beginPath();
      ctx.moveTo(colX + 12, contentY);
      ctx.lineTo(colX + colW - 12, contentY);
      ctx.stroke();
      contentY += 16;

      // Complementary Work Section (Post-training)
      ctx.font = '900 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = isDark ? '#c084fc' : '#7e22ce';
      ctx.fillText(isEn ? '⚡ POST-TRAINING' : '⚡ PÓS-TREINO', colX + 12, contentY);
      contentY += 18;

      const comp = s?.complementaryWork;
      const activeItems = getActiveComplementaryItems(comp);

      if (activeItems.length > 0) {
        activeItems.forEach((item) => {
          if (contentY > gridY + gridHeight - 70) return; // Prevent card overflow

          const label = isEn ? item.shortLabelEn || item.shortLabel : item.shortLabel;
          const isGym = item.category === 'gym';
          const isRec = item.category === 'recovery';

          // Pill background
          let pillBg = isDark ? 'rgba(79, 70, 229, 0.2)' : '#e0e7ff';
          let pillText = isDark ? '#a5b4fc' : '#3730a3';
          if (isRec) {
            pillBg = isDark ? 'rgba(6, 182, 212, 0.2)' : '#cffafe';
            pillText = isDark ? '#67e8f9' : '#0e7490';
          } else if (!isGym && !isRec) {
            pillBg = isDark ? 'rgba(20, 184, 166, 0.2)' : '#ccfbf1';
            pillText = isDark ? '#5eead4' : '#0f766e';
          }

          ctx.fillStyle = pillBg;
          ctx.beginPath();
          ctx.roundRect(colX + 10, contentY - 12, colW - 20, 24, 6);
          ctx.fill();

          ctx.font = '700 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillStyle = pillText;
          const truncated = label.length > 17 ? label.slice(0, 16) + '…' : label;
          ctx.fillText(`${item.icon} ${truncated}`, colX + 14, contentY + 4);
          contentY += 28;
        });
      } else {
        ctx.font = 'italic 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = isDark ? '#475569' : '#94a3b8';
        ctx.fillText(isEn ? 'No extra work' : 'Sem complementar', colX + 12, contentY);
        contentY += 20;
      }

      // Notes inside day card if present
      if (comp?.notes && comp.notes.trim()) {
        const note = comp.notes.trim();
        ctx.font = 'italic 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = isDark ? '#a855f7' : '#6b21a8';
        const shortNote = note.length > 25 ? `"${note.slice(0, 24)}…"` : `"${note}"`;
        ctx.fillText(shortNote, colX + 12, gridY + gridHeight - 20);
      }
    });

    // General Coaching Staff Notes Footer Box
    const footerY = gridY + gridHeight + 18;
    if (weeklyTeamNotes && weeklyTeamNotes.trim()) {
      ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.8)' : '#f1f5f9';
      ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.2)' : '#cbd5e1';
      ctx.beginPath();
      ctx.roundRect(60, footerY, width - 120, 52, 10);
      ctx.fill();
      ctx.stroke();

      ctx.font = '900 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = isDark ? '#fbbf24' : '#b45309';
      ctx.fillText(isEn ? '📌 COACHING STAFF NOTE:' : '📌 NOTA DA EQUIPA TÉCNICA:', 76, footerY + 22);

      ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
      const cleanNote = weeklyTeamNotes.trim().length > 130 ? weeklyTeamNotes.trim().slice(0, 127) + '...' : weeklyTeamNotes.trim();
      ctx.fillText(cleanNote, 76, footerY + 40);
    }

    // Bottom Watermark & Club Motto
    const bottomY = height - 25;
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = isDark ? '#64748b' : '#94a3b8';
    ctx.fillText('💪 #NinguémPáraEstaCorrente  •  GIL VICENTE FC', 60, bottomY);

    ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = isDark ? '#475569' : '#cbd5e1';
    ctx.fillText('Gil Vicente FC Performance System', width - 280, bottomY);

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  };

  // Download High-Resolution Image (PNG)
  const handleDownloadImage = async () => {
    try {
      setIsExportingImage(true);
      const blob = await generateCanvasImage();
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GVFC-Semana-${startDateStr.replace('/', '-')}-${isEn ? 'EN' : 'PT'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating image:', err);
    } finally {
      setIsExportingImage(false);
    }
  };

  // Copy Image to Clipboard
  const handleCopyImage = async () => {
    try {
      setIsExportingImage(true);
      const blob = await generateCanvasImage();
      if (!blob) return;

      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopyImageSuccess(true);
        setTimeout(() => setCopyImageSuccess(false), 2500);
      } else {
        // Fallback to file download if clipboard.write(image) not supported
        handleDownloadImage();
      }
    } catch (err) {
      console.error('Error copying image:', err);
      handleDownloadImage();
    } finally {
      setIsExportingImage(false);
    }
  };

  // Copy WhatsApp text message
  const handleCopyWhatsAppText = () => {
    const text = generateWhatsAppWeeklyPlanText({
      microcycleTitle,
      weekDates,
      sessions,
      generalNotes: weeklyTeamNotes,
      lang,
    });
    navigator.clipboard.writeText(text);
    setCopyTextSuccess(true);
    setTimeout(() => setCopyTextSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      {/* Printable styles injected dynamically */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #weekly-plan-poster, #weekly-plan-poster * {
            visibility: visible !important;
          }
          #weekly-plan-poster {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            min-height: 100vh !important;
            margin: 0 !important;
            padding: 12px !important;
            border: none !important;
            border-radius: 0 !important;
            background: ${isDark ? '#0a0e1a' : '#ffffff'} !important;
            color: ${isDark ? '#f8fafc' : '#0f172a'} !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-6xl rounded-2xl border border-slate-700 bg-dark-bg shadow-2xl flex flex-col max-h-[96vh] overflow-hidden my-auto animate-fade-in">
        {/* Top Control Bar (No Print) */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 bg-dark-card px-4 py-3 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-xl">📄</span>
            <div>
              <h3 className="text-sm font-black uppercase text-slate-100 flex items-center space-x-2">
                <span>Poster & Documento da Semana</span>
                <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-500/30">
                  Pronto a Partilhar
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Visualização profissional para enviar às jogadoras via PDF, Imagem PNG ou WhatsApp.
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Language Switcher */}
            <div className="flex items-center rounded-xl bg-slate-900 border border-slate-700 p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  isEn ? 'bg-purple-600 text-white shadow font-extrabold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🇬🇧 EN
              </button>
              <button
                type="button"
                onClick={() => setLang('pt')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  !isEn ? 'bg-purple-600 text-white shadow font-extrabold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🇵🇹 PT
              </button>
            </div>

            {/* Dark / Light Toggle */}
            <button
              type="button"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-white text-xs font-bold transition-all"
              title="Alternar tema de apresentação / impressão"
            >
              {isDark ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-indigo-400" />}
              <span className="hidden sm:inline">{isDark ? 'Tema Claro' : 'Tema Escuro'}</span>
            </button>

            {/* Print / Save PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-blue-500/40 bg-blue-950/60 hover:bg-blue-900/70 text-blue-200 text-xs font-extrabold transition-all shadow active:scale-98 cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 text-blue-300" />
              <span>Guardar PDF / Imprimir</span>
            </button>

            {/* Download PNG Button */}
            <button
              type="button"
              disabled={isExportingImage}
              onClick={handleDownloadImage}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-purple-500/40 bg-purple-950/60 hover:bg-purple-900/70 text-purple-200 text-xs font-extrabold transition-all shadow active:scale-98 cursor-pointer disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5 text-purple-300" />
              <span>Descarregar PNG</span>
            </button>

            {/* Copy Image Button */}
            <button
              type="button"
              disabled={isExportingImage}
              onClick={handleCopyImage}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-200 text-xs font-extrabold transition-all shadow active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {copyImageSuccess ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-emerald-400" />}
              <span>{copyImageSuccess ? 'Copiada!' : 'Copiar Imagem'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Container for the Visual Poster */}
        <div className="overflow-y-auto p-3 sm:p-6 flex-1 bg-slate-950/50">
          <div
            id="weekly-plan-poster"
            ref={posterRef}
            className={`w-full max-w-5xl mx-auto rounded-2xl border transition-all shadow-2xl p-4 sm:p-7 space-y-5 ${
              isDark
                ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-slate-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Top Brand Accent Stripe */}
            <div className="h-2 w-full rounded-full bg-gradient-to-r from-red-600 via-blue-900 to-red-600 shadow-sm" />

            {/* Club Header & Microcycle Identification */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-700/40">
              <div className="flex items-center space-x-3.5">
                {/* Crest */}
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-blue-900 p-1 shadow-lg ring-2 ring-red-500/30">
                  <img
                    src="/gil-vicente-crest.png"
                    alt="Gil Vicente FC"
                    className="h-12 w-12 object-contain filter drop-shadow"
                    onError={(e) => {
                      // Fallback icon if image fails
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-black tracking-wider uppercase text-red-500">
                      Gil Vicente FC • Futebol Feminino
                    </span>
                    <span className="text-slate-500">&bull;</span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase">
                      Performance &amp; Saúde
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
                    {effectiveTitle}
                  </h1>
                  <p className="text-xs text-slate-400 flex items-center space-x-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    <span>
                      {isEn ? 'Week' : 'Semana'}: <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>{startDateStr}</strong> {isEn ? 'to' : 'a'} <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>{endDateStr}</strong> ({isEn ? 'Monday to Sunday' : 'Segunda a Domingo'})
                    </span>
                  </p>
                </div>
              </div>

              {/* Mandatory Post-Training Notice Pill */}
              <div className="self-start md:self-auto flex items-center space-x-2 rounded-xl border border-amber-500/40 bg-amber-950/20 px-3.5 py-2 text-amber-300 shadow-sm">
                <span className="text-lg">⚡</span>
                <div className="text-left">
                  <div className="text-[11px] font-black uppercase tracking-wider text-amber-200">
                    {isEn ? 'ALWAYS POST-TRAINING' : 'SEMPRE PÓS-TREINO'}
                  </div>
                  <div className="text-[10px] text-amber-300/80">
                    {isEn ? 'All complementary gym & recovery work' : 'Todo o trabalho complementar de ginásio e recuperação'}
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-banner Notice */}
            <div className={`flex items-center space-x-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold ${
              isDark ? 'bg-slate-900/80 border border-slate-800 text-slate-300' : 'bg-slate-100 border border-slate-200 text-slate-700'
            }`}>
              <Info className="h-4 w-4 text-cyan-400 shrink-0" />
              <span>
                {isEn
                  ? 'Mandatory instruction: All gym, mobility and cold plunge sessions must be completed always after pitch training.'
                  : 'Instrução obrigatória: Todas as sessões de ginásio, mobilidade e banho de gelo são realizadas sempre após o treino de campo.'}
              </span>
            </div>

            {/* 7-Days Visual Schedule Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-2.5">
              {weekDates.map((dateStr) => {
                const s = sessions[dateStr];
                const dayType = s?.dayType || 'rest';
                const dayName = isEn ? getDayNameEn(dateStr, true) : getDayNamePt(dateStr, true);
                const shortDay = dayName.slice(0, 3);
                const dateFmt = formatDatePtShort(dateStr);
                const offset = s?.matchDayOffset;
                const comp = s?.complementaryWork;
                const activeItems = getActiveComplementaryItems(comp);

                // Styling variations per day type
                let cardClass = isDark
                  ? 'border-slate-800 bg-slate-900/60'
                  : 'border-slate-200 bg-slate-50/70';

                if (dayType === 'match') {
                  cardClass = isDark
                    ? 'border-emerald-500/60 bg-emerald-950/20 ring-1 ring-emerald-500/30'
                    : 'border-emerald-400 bg-emerald-50/70 ring-1 ring-emerald-400/30';
                } else if (dayType === 'rest') {
                  cardClass = isDark
                    ? 'border-slate-800 bg-slate-950/40 opacity-90'
                    : 'border-slate-200 bg-slate-100/50';
                }

                return (
                  <div
                    key={dateStr}
                    className={`rounded-xl border p-3 flex flex-col justify-between space-y-2.5 transition-all shadow-sm ${cardClass}`}
                  >
                    {/* Day Card Header */}
                    <div>
                      <div className="flex items-center justify-between border-b pb-1.5 border-slate-700/30">
                        <div>
                          <span className="text-[12px] font-black uppercase">
                            {shortDay}
                          </span>
                          <span className="ml-1 text-[11px] font-bold text-slate-400">
                            {dateFmt}
                          </span>
                        </div>

                        {offset && (
                          <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                            dayType === 'match'
                              ? 'bg-emerald-500 text-slate-950 font-black'
                              : 'bg-blue-900/80 text-blue-200 border border-blue-500/40'
                          }`}>
                            {offset}
                          </span>
                        )}
                      </div>

                      {/* Primary Activity (Match / Training / Rest) */}
                      <div className="pt-2">
                        {dayType === 'match' ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center space-x-1 text-[11px] font-black text-emerald-400 uppercase">
                              <span>🏆</span>
                              <span>{isEn ? 'Match Day' : 'Jogo'}</span>
                            </span>
                            <div className="text-[10px] font-bold text-emerald-300/90">
                              {s?.matchCategory === 'cup'
                                ? (isEn ? 'Cup Match' : 'Taça')
                                : s?.matchCategory === 'friendly'
                                ? (isEn ? 'Friendly' : 'Treino')
                                : (isEn ? 'Championship' : 'Campeonato')}
                            </div>
                            {s?.startTime && (
                              <div className="text-[11px] font-black text-slate-100 flex items-center space-x-1">
                                <Clock className="h-3 w-3 text-emerald-400" />
                                <span>{s.startTime}</span>
                              </div>
                            )}
                          </div>
                        ) : dayType === 'rest' ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-slate-400 uppercase">
                              <span>🏖️</span>
                              <span>{isEn ? 'Rest Day' : 'Folga'}</span>
                            </span>
                            <p className="text-[9px] text-slate-500 italic">
                              {isEn ? 'Recovery & Sleep' : 'Recuperação & Sono'}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center space-x-1 text-[11px] font-black text-blue-400 uppercase">
                              <span>⚽</span>
                              <span>{isEn ? 'Pitch Training' : 'Treino Campo'}</span>
                            </span>
                            {s?.startTime && (
                              <div className="text-[11px] font-black text-slate-200 flex items-center space-x-1">
                                <Clock className="h-3 w-3 text-cyan-400" />
                                <span>{s.startTime}{s.endTime ? ` - ${s.endTime}` : ''}</span>
                              </div>
                            )}
                            {s?.locationTime && (
                              <p className="text-[9px] text-slate-400 truncate" title={s.locationTime}>
                                📍 {s.locationTime.split('-')[0].trim()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Post-Training Complementary Work Section */}
                    <div className="border-t pt-2 border-slate-700/30 space-y-1.5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center space-x-1 text-[9px] font-black uppercase tracking-wider text-purple-400 pb-0.5">
                          <span>⚡</span>
                          <span>{isEn ? 'Post-Training' : 'Pós-Treino'}</span>
                        </div>

                        {activeItems.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {activeItems.map((item) => (
                              <div
                                key={item.id}
                                className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${item.badgeClass}`}
                              >
                                <span>{item.icon}</span>
                                <span className="truncate">
                                  {isEn ? item.shortLabelEn || item.shortLabel : item.shortLabel}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[9px] text-slate-500 italic py-1">
                            {isEn ? 'No extra work' : 'Sem complementar'}
                          </div>
                        )}
                      </div>

                      {/* Day Notes */}
                      {comp?.notes && comp.notes.trim() && (
                        <div className="border-t pt-1 border-purple-500/20 text-[9px] text-purple-300 italic">
                          &quot;{comp.notes.trim()}&quot;
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* General Staff Note */}
            {weeklyTeamNotes && weeklyTeamNotes.trim() && (
              <div className={`p-3.5 rounded-xl border flex items-start space-x-3 ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-300'
              }`}>
                <span className="text-xl shrink-0">📋</span>
                <div className="space-y-0.5">
                  <h4 className="text-[11px] font-black uppercase text-amber-400">
                    {isEn ? 'Coaching Staff General Note' : 'Nota Geral da Equipa Técnica'}
                  </h4>
                  <p className="text-xs font-medium text-slate-200">
                    {weeklyTeamNotes.trim()}
                  </p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t pt-3 text-[11px] text-slate-500 border-slate-700/40">
              <span className="font-extrabold text-red-500 flex items-center space-x-1">
                <span>💪</span>
                <span>#NinguémPáraEstaCorrente • Gil Vicente FC</span>
              </span>

              <span className="text-[10px]">
                {isEn ? 'Generated by GVFC Female Performance System' : 'Gerado pelo Sistema de Performance Feminina GVFC'}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions Bar (No Print) */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800 bg-dark-card px-4 py-3 shrink-0">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span>
              {isEn
                ? 'Tip: You can print as PDF or copy the image to paste directly into WhatsApp Web!'
                : 'Dica: Podes guardar em PDF ou copiar a imagem para colar diretamente no WhatsApp Web!'}
            </span>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleCopyWhatsAppText}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-200 text-xs font-bold transition-all"
            >
              {copyTextSuccess ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Share2 className="h-3.5 w-3.5 text-emerald-300" />}
              <span>{copyTextSuccess ? 'Texto Copiado!' : 'Copiar Texto WhatsApp'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
