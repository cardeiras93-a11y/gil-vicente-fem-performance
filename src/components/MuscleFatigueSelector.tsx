import React, { useState } from 'react';
import { MuscleFatigueMap } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';
import { Activity, X, RotateCcw } from 'lucide-react';

interface MuscleFatigueSelectorProps {
  value: MuscleFatigueMap;
  onChange: (newValue: MuscleFatigueMap) => void;
}

export const MuscleFatigueSelector: React.FC<MuscleFatigueSelectorProps> = ({
  value,
  onChange,
}) => {
  const { t } = useLanguage();
  const [selectedMuscleModal, setSelectedMuscleModal] = useState<string | null>(null);

  const getScore = (muscle: string) => value[muscle] || 1;

  const handleScoreChange = (muscle: string, score: number) => {
    onChange({
      ...value,
      [muscle]: score,
    });
  };

  // Segments for Vista Anterior (Frente)
  const anteriorSegments = [
    { id: 'Pescoço (Frente)', label: 'Pescoço', shortLabel: 'Pes', cx: 100, cy: 38, r: 11 },
    { id: 'Ombro Direito', label: 'Ombro D', shortLabel: 'Omb', cx: 62, cy: 56, r: 13 },
    { id: 'Ombro Esquerdo', label: 'Ombro E', shortLabel: 'Omb', cx: 138, cy: 56, r: 13 },
    { id: 'Peitoral', label: 'Peitoral', shortLabel: 'Peit', cx: 100, cy: 75, r: 14 },
    { id: 'Abdominal', label: 'Abdominal', shortLabel: 'Abd', cx: 100, cy: 110, r: 14 },
    { id: 'Braço Direito', label: 'Braço D', shortLabel: 'Bra', cx: 44, cy: 84, r: 11 },
    { id: 'Braço Esquerdo', label: 'Braço E', shortLabel: 'Bra', cx: 156, cy: 84, r: 11 },
    { id: 'Antebraço Direito', label: 'Antebraço D', shortLabel: 'Ant', cx: 32, cy: 116, r: 10 },
    { id: 'Antebraço Esquerdo', label: 'Antebraço E', shortLabel: 'Ant', cx: 168, cy: 116, r: 10 },
    { id: 'Mão Direita', label: 'Mão D', shortLabel: 'Mão', cx: 22, cy: 142, r: 9 },
    { id: 'Mão Esquerda', label: 'Mão E', shortLabel: 'Mão', cx: 178, cy: 142, r: 9 },
    { id: 'Púbis', label: 'Púbis', shortLabel: 'Púb', cx: 100, cy: 142, r: 12 },
    { id: 'Adutores (D/E)', label: 'Adutores', shortLabel: 'Adu', cx: 100, cy: 172, r: 12 },
    { id: 'Quadríceps Direito', label: 'Quad D', shortLabel: 'Qua', cx: 78, cy: 178, r: 15 },
    { id: 'Quadríceps Esquerdo', label: 'Quad E', shortLabel: 'Qua', cx: 122, cy: 178, r: 15 },
    { id: 'Joelho Direito', label: 'Joelho D', shortLabel: 'Joe', cx: 78, cy: 220, r: 12 },
    { id: 'Joelho Esquerdo', label: 'Joelho E', shortLabel: 'Joe', cx: 122, cy: 220, r: 12 },
    { id: 'Tíbia / Gémeos D', label: 'Gémeos D', shortLabel: 'Gém', cx: 78, cy: 258, r: 12 },
    { id: 'Tíbia / Gémeos E', label: 'Gémeos E', shortLabel: 'Gém', cx: 122, cy: 258, r: 12 },
    { id: 'Pé Direito', label: 'Pé D', shortLabel: 'Pé', cx: 78, cy: 295, r: 10 },
    { id: 'Pé Esquerdo', label: 'Pé E', shortLabel: 'Pé', cx: 122, cy: 295, r: 10 },
  ];

  // Segments for Vista Posterior (Costas)
  const posteriorSegments = [
    { id: 'Cervical / Trapézio', label: 'Cervical', shortLabel: 'Cer', cx: 100, cy: 38, r: 11 },
    { id: 'Ombro Post. D', label: 'Ombro D', shortLabel: 'Omb', cx: 62, cy: 56, r: 13 },
    { id: 'Ombro Post. E', label: 'Ombro E', shortLabel: 'Omb', cx: 138, cy: 56, r: 13 },
    { id: 'Dorsal / Costas Sup.', label: 'Dorsal', shortLabel: 'Dor', cx: 100, cy: 82, r: 16 },
    { id: 'Lombar', label: 'Lombar', shortLabel: 'Lomb', cx: 100, cy: 118, r: 15 },
    { id: 'Tríceps D', label: 'Tríceps D', shortLabel: 'Tri', cx: 44, cy: 84, r: 11 },
    { id: 'Tríceps E', label: 'Tríceps E', shortLabel: 'Tri', cx: 156, cy: 84, r: 11 },
    { id: 'Antebraço Post. D', label: 'Antebraço D', shortLabel: 'Ant', cx: 32, cy: 116, r: 10 },
    { id: 'Antebraço Post. E', label: 'Antebraço E', shortLabel: 'Ant', cx: 168, cy: 116, r: 10 },
    { id: 'Mão Post. D', label: 'Mão D', shortLabel: 'Mão', cx: 22, cy: 142, r: 9 },
    { id: 'Mão Post. E', label: 'Mão E', shortLabel: 'Mão', cx: 178, cy: 142, r: 9 },
    { id: 'Glúteo / Abdutores D', label: 'Glúteo D', shortLabel: 'Glú', cx: 78, cy: 150, r: 15 },
    { id: 'Glúteo / Abdutores E', label: 'Glúteo E', shortLabel: 'Glú', cx: 122, cy: 150, r: 15 },
    { id: 'Ísquiotibiais Direito', label: 'Ísquios D', shortLabel: 'Ísq', cx: 78, cy: 192, r: 15 },
    { id: 'Ísquiotibiais Esquerdo', label: 'Ísquios E', shortLabel: 'Ísq', cx: 122, cy: 192, r: 15 },
    { id: 'Gémeos Post. Direito', label: 'Gémeos D', shortLabel: 'Gém', cx: 78, cy: 250, r: 13 },
    { id: 'Gémeos Post. Esquerdo', label: 'Gémeos E', shortLabel: 'Gém', cx: 122, cy: 250, r: 13 },
    { id: 'Calcanhar / Aquiles D', label: 'Aquiles D', shortLabel: 'Aqui', cx: 78, cy: 292, r: 10 },
    { id: 'Calcanhar / Aquiles E', label: 'Aquiles E', shortLabel: 'Aqui', cx: 122, cy: 292, r: 10 },
  ];

  const allSegments = [...anteriorSegments, ...posteriorSegments];
  const activeCount = allSegments.filter((seg) => getScore(seg.id) > 1).length;

  return (
    <div className="space-y-4 rounded-2xl border border-dark-border bg-dark-card p-4 shadow-xl">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-brand-lime" />
          <div>
            <h3 className="font-extrabold text-sm text-slate-100 uppercase">{t.wellness.muscleFatigueTitle}</h3>
            <p className="text-[10px] text-slate-400">{t.bodyChart.selectInstruction}</p>
          </div>
        </div>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => onChange({})}
            className="flex items-center space-x-1 rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:text-rose-400"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Repor</span>
          </button>
        )}
      </div>

      {activeCount > 0 && (
        <div className="rounded-xl bg-amber-950/40 border border-amber-500/40 p-2.5 text-center text-xs font-extrabold text-amber-300">
          {activeCount} zone(s) selected
        </div>
      )}

      {/* DUAL ANATOMICAL SILHOUETTES: ANTERIOR (FRENTE) + POSTERIOR (COSTAS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {/* 1. VISTA ANTERIOR (FRENTE) */}
        <div className="flex flex-col items-center space-y-2 rounded-2xl bg-dark-bg/90 border border-slate-800 p-3.5 shadow-inner">
          <span className="text-xs font-black uppercase tracking-wider text-brand-lime bg-slate-900 px-3 py-1 rounded-full border border-brand-lime/30">
            {t.bodyChart.anteriorView}
          </span>

          <div className="relative w-full max-w-[200px]">
            <svg viewBox="0 0 200 320" className="w-full h-auto max-h-[300px] drop-shadow-md">
              {/* Head & Neck */}
              <circle cx="100" cy="20" r="14" fill="#1e293b" stroke="#475569" strokeWidth="2" />
              {/* Chest / Torso */}
              <path d="M 68 46 Q 100 40 132 46 L 126 150 Q 100 155 74 150 Z" fill="#1e293b" stroke="#475569" strokeWidth="2" />
              {/* Arms */}
              <path d="M 62 48 L 40 90 L 22 142" stroke="#334155" strokeWidth="12" strokeLinecap="round" fill="none" />
              <path d="M 138 48 L 160 90 L 178 142" stroke="#334155" strokeWidth="12" strokeLinecap="round" fill="none" />
              {/* Legs */}
              <path d="M 78 150 L 76 230 L 76 295" stroke="#334155" strokeWidth="16" strokeLinecap="round" fill="none" />
              <path d="M 122 150 L 124 230 L 124 295" stroke="#334155" strokeWidth="16" strokeLinecap="round" fill="none" />

              {/* Anterior Segment Nodes */}
              {anteriorSegments.map((seg) => {
                const score = getScore(seg.id);
                const isFatigued = score > 1;

                return (
                  <g key={seg.id} className="cursor-pointer" onClick={() => setSelectedMuscleModal(seg.id)}>
                    <circle
                      cx={seg.cx}
                      cy={seg.cy}
                      r={seg.r}
                      className={`transition-all duration-200 ${
                        isFatigued
                          ? score <= 4
                            ? 'fill-amber-400 stroke-amber-200 stroke-2 animate-pulse shadow-lg'
                            : 'fill-rose-500 stroke-rose-200 stroke-2 animate-bounce shadow-lg'
                          : 'fill-slate-800/90 stroke-slate-600 hover:fill-brand-lime/50 hover:stroke-brand-lime'
                      }`}
                    />
                    <text
                      x={seg.cx}
                      y={seg.cy + 3.5}
                      textAnchor="middle"
                      className={`text-[8.5px] font-black pointer-events-none ${
                        isFatigued ? 'fill-slate-950' : 'fill-slate-300'
                      }`}
                    >
                      {score > 1 ? score : seg.shortLabel}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* 2. VISTA POSTERIOR (COSTAS) */}
        <div className="flex flex-col items-center space-y-2 rounded-2xl bg-dark-bg/90 border border-slate-800 p-3.5 shadow-inner">
          <span className="text-xs font-black uppercase tracking-wider text-brand-cyan bg-slate-900 px-3 py-1 rounded-full border border-brand-cyan/30">
            {t.bodyChart.posteriorView}
          </span>

          <div className="relative w-full max-w-[200px]">
            <svg viewBox="0 0 200 320" className="w-full h-auto max-h-[300px] drop-shadow-md">
              {/* Head & Spine Silhouette */}
              <circle cx="100" cy="20" r="14" fill="#1e293b" stroke="#475569" strokeWidth="2" />
              {/* Back / Torso */}
              <path d="M 68 46 Q 100 40 132 46 L 126 150 Q 100 155 74 150 Z" fill="#1e293b" stroke="#475569" strokeWidth="2" />
              {/* Spine Line Indicator */}
              <line x1="100" y1="46" x2="100" y2="140" stroke="#334155" strokeWidth="2" strokeDasharray="3,3" />
              {/* Arms Back */}
              <path d="M 62 48 L 40 90 L 22 142" stroke="#334155" strokeWidth="12" strokeLinecap="round" fill="none" />
              <path d="M 138 48 L 160 90 L 178 142" stroke="#334155" strokeWidth="12" strokeLinecap="round" fill="none" />
              {/* Legs Back */}
              <path d="M 78 150 L 76 230 L 76 295" stroke="#334155" strokeWidth="16" strokeLinecap="round" fill="none" />
              <path d="M 122 150 L 124 230 L 124 295" stroke="#334155" strokeWidth="16" strokeLinecap="round" fill="none" />

              {/* Posterior Segment Nodes */}
              {posteriorSegments.map((seg) => {
                const score = getScore(seg.id);
                const isFatigued = score > 1;

                return (
                  <g key={seg.id} className="cursor-pointer" onClick={() => setSelectedMuscleModal(seg.id)}>
                    <circle
                      cx={seg.cx}
                      cy={seg.cy}
                      r={seg.r}
                      className={`transition-all duration-200 ${
                        isFatigued
                          ? score <= 4
                            ? 'fill-amber-400 stroke-amber-200 stroke-2 animate-pulse shadow-lg'
                            : 'fill-rose-500 stroke-rose-200 stroke-2 animate-bounce shadow-lg'
                          : 'fill-slate-800/90 stroke-slate-600 hover:fill-brand-cyan/50 hover:stroke-brand-cyan'
                      }`}
                    />
                    <text
                      x={seg.cx}
                      y={seg.cy + 3.5}
                      textAnchor="middle"
                      className={`text-[8.5px] font-black pointer-events-none ${
                        isFatigued ? 'fill-slate-950' : 'fill-slate-300'
                      }`}
                    >
                      {score > 1 ? score : seg.shortLabel}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Selected Segments Summary Badges */}
      {activeCount > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
            Zonas com Dor Assinalada:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {allSegments
              .filter((seg) => getScore(seg.id) > 1)
              .map((seg) => {
                const score = getScore(seg.id);
                return (
                  <button
                    key={seg.id}
                    type="button"
                    onClick={() => setSelectedMuscleModal(seg.id)}
                    className={`flex items-center space-x-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition-all ${
                      score <= 4
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    <span>{seg.id}</span>
                    <span className="rounded-full bg-slate-950 px-1.5 py-0.2 text-[10px] font-black text-white">
                      {score}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* Touch Modal for 1-10 Muscle Intensity Score */}
      {selectedMuscleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-xs rounded-2xl border border-brand-lime/40 bg-dark-card p-5 shadow-2xl space-y-4 text-center">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-brand-lime">
                Pontuar Dor / Fadiga
              </span>
              <button
                type="button"
                onClick={() => setSelectedMuscleModal(null)}
                className="rounded-full p-1 text-slate-400 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h3 className="text-base font-extrabold text-slate-100">{selectedMuscleModal}</h3>

            <div className="text-xs font-bold text-amber-400">
              Nível Selecionado: {getScore(selectedMuscleModal)} / 10
            </div>

            <div className="grid grid-cols-5 gap-2 pt-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => {
                const isSelected = getScore(selectedMuscleModal) === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      handleScoreChange(selectedMuscleModal, val);
                      setSelectedMuscleModal(null);
                    }}
                    className={`h-11 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center ${
                      isSelected
                        ? val === 1
                          ? 'bg-slate-700 text-slate-100 ring-2 ring-slate-400'
                          : val <= 4
                          ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 scale-105 shadow-md'
                          : 'bg-rose-600 text-white ring-2 ring-rose-400 scale-105 shadow-md'
                        : 'bg-dark-surface text-slate-300 border border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {val}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                handleScoreChange(selectedMuscleModal, 1);
                setSelectedMuscleModal(null);
              }}
              className="w-full rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700"
            >
              Sem Dor / Repor para 1
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
