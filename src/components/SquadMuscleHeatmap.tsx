import React, { useState } from 'react';
import { MuscleFatigueMap } from '@/lib/types';
import { Activity, Users, X, Flame } from 'lucide-react';

interface EntryWithMuscleFatigue {
  id?: string;
  athleteName: string;
  muscleFatigue?: MuscleFatigueMap;
}

interface SquadMuscleHeatmapProps {
  entries: EntryWithMuscleFatigue[];
  date: string;
  title?: string;
}

export const SquadMuscleHeatmap: React.FC<SquadMuscleHeatmapProps> = ({
  entries,
  date,
  title = 'Mapa Coletivo de Queixas Musculares no Plantel',
}) => {
  const [selectedMuscleModal, setSelectedMuscleModal] = useState<string | null>(null);

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

  // Map each muscle segment to affected athletes
  const segmentStats = allSegments.map((seg) => {
    const affected = entries.filter(
      (e) => e.muscleFatigue && (e.muscleFatigue[seg.id] || 0) > 1
    );
    const count = affected.length;
    const scores = affected.map((e) => e.muscleFatigue?.[seg.id] || 0);
    const avgScore = count > 0 ? (scores.reduce((a, b) => a + b, 0) / count).toFixed(1) : '0';
    const maxScore = count > 0 ? Math.max(...scores) : 0;

    return {
      segment: seg,
      count,
      avgScore,
      maxScore,
      affected,
    };
  });

  // Calculate unique athletes with complaints
  const totalAffectedAthletesCount = new Set(
    entries
      .filter((e) => e.muscleFatigue && Object.values(e.muscleFatigue).some((v) => v > 1))
      .map((e) => e.athleteName)
  ).size;

  // Filter top complaints with at least 1 affected athlete
  const topComplaints = segmentStats
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count || Number(b.avgScore) - Number(a.avgScore));

  const selectedStat = selectedMuscleModal
    ? segmentStats.find((s) => s.segment.id === selectedMuscleModal)
    : null;

  return (
    <div className="space-y-5 rounded-2xl border border-brand-lime/30 bg-dark-card p-5 shadow-xl mt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-lime/20 text-brand-lime border border-brand-lime/40">
            <Activity className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wide">
              {title}
            </h3>
            <p className="text-xs text-slate-400">
              Distribuição coletiva de dor e fadiga muscular assinalada nas respostas ({date}).
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-black text-brand-lime bg-slate-900 px-3 py-1.5 rounded-full border border-brand-lime/30 flex items-center space-x-1.5">
            <Users className="h-3.5 w-3.5" />
            <span>{totalAffectedAthletesCount} Jogadoras c/ Queixas</span>
          </span>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl bg-dark-bg/60 p-6 text-center border border-slate-800 text-slate-400 text-xs font-semibold">
          Nenhum registo submetido para calcular o mapa coletivo de queixas musculares nesta data.
        </div>
      ) : (
        <>
          {/* Dual Anatomical Heatmap Silhouettes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* 1. VISTA ANTERIOR (FRENTE) */}
            <div className="flex flex-col items-center space-y-2 rounded-2xl bg-dark-bg/90 border border-slate-800 p-4 shadow-inner">
              <span className="text-xs font-black uppercase tracking-wider text-brand-lime bg-slate-900 px-3 py-1 rounded-full border border-brand-lime/30">
                Vista Anterior (Frente)
              </span>

              <div className="relative w-full max-w-[210px]">
                <svg viewBox="0 0 200 320" className="w-full h-auto max-h-[310px] drop-shadow-md">
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

                  {/* Anterior Nodes */}
                  {anteriorSegments.map((seg) => {
                    const stat = segmentStats.find((s) => s.segment.id === seg.id);
                    const count = stat ? stat.count : 0;
                    const isFatigued = count > 0;

                    return (
                      <g key={seg.id} className="cursor-pointer" onClick={() => setSelectedMuscleModal(seg.id)}>
                        <circle
                          cx={seg.cx}
                          cy={seg.cy}
                          r={seg.r}
                          className={`transition-all duration-200 ${
                            isFatigued
                              ? count === 1
                                ? 'fill-amber-500 stroke-amber-200 stroke-2 animate-pulse shadow-lg'
                                : count === 2
                                ? 'fill-orange-500 stroke-orange-200 stroke-2 animate-bounce shadow-lg'
                                : 'fill-rose-600 stroke-rose-200 stroke-2 animate-bounce shadow-lg'
                              : 'fill-slate-800/90 stroke-slate-600 hover:fill-brand-lime/50 hover:stroke-brand-lime'
                          }`}
                        />
                        <text
                          x={seg.cx}
                          y={seg.cy + 3.5}
                          textAnchor="middle"
                          className={`text-[8.5px] font-black pointer-events-none ${
                            isFatigued ? 'fill-slate-950 font-black' : 'fill-slate-300'
                          }`}
                        >
                          {count > 0 ? count : seg.shortLabel}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* 2. VISTA POSTERIOR (COSTAS) */}
            <div className="flex flex-col items-center space-y-2 rounded-2xl bg-dark-bg/90 border border-slate-800 p-4 shadow-inner">
              <span className="text-xs font-black uppercase tracking-wider text-brand-cyan bg-slate-900 px-3 py-1 rounded-full border border-brand-cyan/30">
                Vista Posterior (Costas)
              </span>

              <div className="relative w-full max-w-[210px]">
                <svg viewBox="0 0 200 320" className="w-full h-auto max-h-[310px] drop-shadow-md">
                  {/* Head & Spine */}
                  <circle cx="100" cy="20" r="14" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                  {/* Back / Torso */}
                  <path d="M 68 46 Q 100 40 132 46 L 126 150 Q 100 155 74 150 Z" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                  {/* Spine Line */}
                  <line x1="100" y1="46" x2="100" y2="140" stroke="#334155" strokeWidth="2" strokeDasharray="3,3" />
                  {/* Arms */}
                  <path d="M 62 48 L 40 90 L 22 142" stroke="#334155" strokeWidth="12" strokeLinecap="round" fill="none" />
                  <path d="M 138 48 L 160 90 L 178 142" stroke="#334155" strokeWidth="12" strokeLinecap="round" fill="none" />
                  {/* Legs */}
                  <path d="M 78 150 L 76 230 L 76 295" stroke="#334155" strokeWidth="16" strokeLinecap="round" fill="none" />
                  <path d="M 122 150 L 124 230 L 124 295" stroke="#334155" strokeWidth="16" strokeLinecap="round" fill="none" />

                  {/* Posterior Nodes */}
                  {posteriorSegments.map((seg) => {
                    const stat = segmentStats.find((s) => s.segment.id === seg.id);
                    const count = stat ? stat.count : 0;
                    const isFatigued = count > 0;

                    return (
                      <g key={seg.id} className="cursor-pointer" onClick={() => setSelectedMuscleModal(seg.id)}>
                        <circle
                          cx={seg.cx}
                          cy={seg.cy}
                          r={seg.r}
                          className={`transition-all duration-200 ${
                            isFatigued
                              ? count === 1
                                ? 'fill-amber-500 stroke-amber-200 stroke-2 animate-pulse shadow-lg'
                                : count === 2
                                ? 'fill-orange-500 stroke-orange-200 stroke-2 animate-bounce shadow-lg'
                                : 'fill-rose-600 stroke-rose-200 stroke-2 animate-bounce shadow-lg'
                              : 'fill-slate-800/90 stroke-slate-600 hover:fill-brand-cyan/50 hover:stroke-brand-cyan'
                          }`}
                        />
                        <text
                          x={seg.cx}
                          y={seg.cy + 3.5}
                          textAnchor="middle"
                          className={`text-[8.5px] font-black pointer-events-none ${
                            isFatigued ? 'fill-slate-950 font-black' : 'fill-slate-300'
                          }`}
                        >
                          {count > 0 ? count : seg.shortLabel}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>

          {/* Ranking of Active Complaints */}
          {topComplaints.length > 0 ? (
            <div className="space-y-2 pt-3 border-t border-slate-800">
              <span className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center space-x-1.5">
                <Flame className="h-4 w-4 text-rose-400" />
                <span>Ranking de Queixas Musculares no Plantel ({topComplaints.length} Grupos Musculares Assinalados):</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {topComplaints.map((item) => (
                  <button
                    key={item.segment.id}
                    type="button"
                    onClick={() => setSelectedMuscleModal(item.segment.id)}
                    className="flex items-center justify-between rounded-xl bg-dark-bg/90 p-2.5 border border-slate-800 hover:border-brand-lime/50 transition-all text-left"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-100 block">{item.segment.id}</span>
                      <span className="text-[10px] text-slate-400">
                        {item.count} jogadora(s) &bull; Média: {item.avgScore}/10
                      </span>
                    </div>
                    <span
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black text-slate-950 ${
                        item.count === 1
                          ? 'bg-amber-400'
                          : item.count === 2
                          ? 'bg-orange-500 text-white'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {item.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-slate-900/60 p-4 text-center border border-slate-800 text-xs font-semibold text-slate-400">
              🟢 Nenhuma dor ou queixa muscular assinalada nas respostas submetidas para este dia.
            </div>
          )}
        </>
      )}

      {/* Modal Tooltip: Affected Players List for Selected Muscle Group */}
      {selectedStat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-brand-lime/40 bg-dark-card p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-brand-lime block">
                  Detalhe de Queixa Muscular
                </span>
                <h3 className="text-base font-extrabold text-slate-100">{selectedStat.segment.id}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMuscleModal(null)}
                className="rounded-full p-1 text-slate-400 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 bg-dark-bg p-2.5 rounded-xl border border-slate-800">
                <span>Total de Atletas: <strong className="text-brand-lime">{selectedStat.count}</strong></span>
                <span>Média Dor: <strong className="text-amber-400">{selectedStat.avgScore} / 10</strong></span>
              </div>

              {selectedStat.affected.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Nenhuma jogadora reportou dor nesta zona.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedStat.affected.map((ath) => {
                    const score = ath.muscleFatigue?.[selectedStat.segment.id] || 0;
                    return (
                      <div
                        key={ath.id || ath.athleteName}
                        className="flex items-center justify-between rounded-xl bg-dark-bg/80 p-2.5 border border-slate-800 text-xs"
                      >
                        <span className="font-bold text-slate-100">{ath.athleteName}</span>
                        <span
                          className={`font-black px-2.5 py-0.5 rounded-full border text-[11px] ${
                            score <= 4
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          }`}
                        >
                          Intensidade: {score} / 10
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedMuscleModal(null)}
              className="w-full rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
