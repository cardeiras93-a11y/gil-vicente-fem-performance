'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  AthleteNutritionRecord,
  TEAM_MONTHLY_AVERAGES,
  getStoredNutritionRecords,
  saveStoredNutritionRecords,
  getStatusStyle,
  getStatusFromSkf,
  NutritionStatusLevel,
  SKF_THRESHOLDS,
} from '@/lib/nutritionData';
import {
  Scale,
  Search,
  Filter,
  Download,
  Award,
  TrendingDown,
  TrendingUp,
  Target,
  Sparkles,
  Flame,
  Apple,
  Info,
  Calendar,
  ChevronRight,
  X,
  Edit3,
  Check,
  CheckCircle2,
  AlertTriangle,
  User,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export const AdminNutritionManager: React.FC = () => {
  const [records, setRecords] = useState<AthleteNutritionRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteNutritionRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<{
    targetWeightKg: number;
    novWeight: number;
    novSkf: number;
    novFatPct: number;
    novMuscleKg: number;
    notes: string;
  }>({
    targetWeightKg: 0,
    novWeight: 0,
    novSkf: 0,
    novFatPct: 0,
    novMuscleKg: 0,
    notes: '',
  });

  const loadData = () => {
    setRecords(getStoredNutritionRecords());
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
  }, []);

  // Filtered list
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Search
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const matchName =
          r.canonicalName.toLowerCase().includes(q) ||
          r.fullName.toLowerCase().includes(q) ||
          r.position.toLowerCase().includes(q);
        if (!matchName) return false;
      }

      // Position filter
      if (positionFilter !== 'all' && r.position !== positionFilter) {
        return false;
      }

      // Status filter (based on November / latest status)
      const currentStatus = r.history.november?.status || 'Adequada';
      if (statusFilter !== 'all' && currentStatus !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [records, searchQuery, positionFilter, statusFilter]);

  // Squad Summary Stats
  const squadStats = useMemo(() => {
    let countAdequada = 0;
    let countAtencao = 0;
    let countAlerta = 0;
    let countRisco = 0;
    let totalDelta = 0;
    let deltaCount = 0;

    records.forEach((r) => {
      const status = r.history.november?.status || 'Adequada';
      if (status === 'Adequada') countAdequada++;
      else if (status === 'Atenção') countAtencao++;
      else if (status === 'Alerta') countAlerta++;
      else if (status === 'Risco') countRisco++;

      const ago = r.history.august?.skf;
      const nov = r.history.november?.skf;
      if (ago !== undefined && ago !== null && nov !== undefined && nov !== null) {
        totalDelta += nov - ago;
        deltaCount++;
      }
    });

    const avgDelta = deltaCount > 0 ? totalDelta / deltaCount : 0;

    return {
      total: records.length,
      countAdequada,
      countAtencao,
      countAlerta,
      countRisco,
      avgDelta,
    };
  }, [records]);

  // Open Edit Modal for an athlete
  const handleOpenDetail = (record: AthleteNutritionRecord) => {
    setSelectedAthlete(record);
    const nov = record.history.november;
    setEditFormData({
      targetWeightKg: record.targetWeightKg,
      novWeight: nov?.weight ?? record.augustWeightKg,
      novSkf: nov?.skf ?? 0,
      novFatPct: nov?.fatMassPct !== undefined ? nov.fatMassPct * 100 : record.augustFatMassPct * 100,
      novMuscleKg: nov?.muscleMassKg ?? record.augustMuscleMassKg,
      notes: record.notes || '',
    });
    setIsEditing(false);
  };

  // Save changes
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAthlete) return;

    const newSkf = Number(editFormData.novSkf);
    const newStatus = getStatusFromSkf(newSkf);

    const updatedRecords = records.map((r) => {
      if (r.athleteId === selectedAthlete.athleteId) {
        const updatedNov = {
          ...r.history.november,
          weight: Number(editFormData.novWeight),
          skf: newSkf,
          fatMassPct: Number(editFormData.novFatPct) / 100,
          muscleMassKg: Number(editFormData.novMuscleKg),
          status: newStatus,
        };

        return {
          ...r,
          targetWeightKg: Number(editFormData.targetWeightKg),
          notes: editFormData.notes,
          history: {
            ...r.history,
            november: updatedNov,
          },
        };
      }
      return r;
    });

    saveStoredNutritionRecords(updatedRecords);
    setRecords(updatedRecords);
    const updatedSelected = updatedRecords.find((r) => r.athleteId === selectedAthlete.athleteId);
    if (updatedSelected) {
      setSelectedAthlete(updatedSelected);
    }
    setIsEditing(false);
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'ID',
      'Nome Oficial',
      'Nome Completo',
      'Posição',
      'Estatura (cm)',
      'Peso Alvo (kg)',
      'Peso Ago (kg)',
      '% MG Ago',
      'MM Ago (kg)',
      'SKF Ago (mm)',
      'SKF Set (mm)',
      'SKF Out (mm)',
      'SKF Nov (mm)',
      'Status Nov',
      'Peso Nov (kg)',
      '% MG Nov',
      'MM Nov (kg)',
      'Delta SKF (Ago->Nov)',
      'Notas',
    ];

    const rows = records.map((r) => {
      const ago = r.history.august;
      const set = r.history.september;
      const out = r.history.october;
      const nov = r.history.november;
      const delta =
        typeof ago?.skf === 'number' && typeof nov?.skf === 'number'
          ? (nov.skf - ago.skf).toFixed(1)
          : '';

      return [
        r.athleteId,
        `"${r.canonicalName}"`,
        `"${r.fullName}"`,
        r.position,
        r.heightCm,
        r.targetWeightKg.toFixed(1),
        r.augustWeightKg.toFixed(1),
        (r.augustFatMassPct * 100).toFixed(1),
        r.augustMuscleMassKg.toFixed(1),
        ago?.skf != null ? ago.skf.toFixed(1) : '',
        set?.skf != null ? set.skf.toFixed(1) : '',
        out?.skf != null ? out.skf.toFixed(1) : '',
        nov?.skf != null ? nov.skf.toFixed(1) : '',
        nov?.status || '',
        nov?.weight !== undefined ? nov.weight.toFixed(1) : '',
        nov?.fatMassPct !== undefined ? (nov.fatMassPct * 100).toFixed(1) : '',
        nov?.muscleMassKg !== undefined ? nov.muscleMassKg.toFixed(1) : '',
        delta,
        `"${r.notes || ''}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GVFC_Nutricao_Antropometria_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header Panel */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20 shrink-0">
              <Apple className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  GIL VICENTE FC &bull; DEPARTAMENTO DE PERFORMANCE
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold text-slate-400">
                  Época 2026/2027
                </span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight mt-0.5">
                Nutrição &bull; Antropometria &bull; Pregas Cutâneas (∑8SKF)
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitorização longitudinal da composição corporal, % massa gorda e evolução individual da equipa.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-extrabold text-xs transition-all shadow-sm active:scale-95"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              <span>Exportar CSV</span>
            </button>
            <button
              type="button"
              onClick={loadData}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-extrabold text-xs transition-all shadow-sm active:scale-95"
              title="Recarregar dados"
            >
              <RefreshCw className="h-4 w-4 text-cyan-400" />
            </button>
          </div>
        </div>

        {/* Collective Timeline & Club Target */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center space-x-2 text-xs font-black text-emerald-300 uppercase tracking-wider">
              <Calendar className="h-3.5 w-3.5 text-emerald-400" />
              <span>Evolução da Média Coletiva da Equipa (∑8SKF):</span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="text-slate-400">Redução Total da Época:</span>
              <span className="text-emerald-400 font-extrabold flex items-center">
                <TrendingDown className="h-3.5 w-3.5 mr-0.5" /> -12.6 mm (-12.8%)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {TEAM_MONTHLY_AVERAGES.map((m) => {
              const style = getStatusStyle(m.status);
              return (
                <div
                  key={m.monthKey}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                    <span>{m.monthLabelPt}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      n={m.totalEvaluated}
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline space-x-1">
                    <span className="text-xl font-black font-mono text-white">
                      {m.averageSkf.toFixed(1)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">mm</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${style.bg} ${style.border} ${style.text}`}
                    >
                      {m.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Status Distribution KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'Adequada' ? 'all' : 'Adequada')}
          className={`rounded-2xl border p-3.5 text-left transition-all ${
            statusFilter === 'Adequada'
              ? 'border-emerald-500 bg-emerald-950/40 shadow-lg shadow-emerald-950/40'
              : 'border-slate-800 bg-dark-card hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Adequada</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">&le; 80.0mm</span>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400 font-mono">
            {squadStats.countAdequada}{' '}
            <span className="text-xs text-slate-500 font-sans">
              ({Math.round((squadStats.countAdequada / (squadStats.total || 1)) * 100)}%)
            </span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Alvo atingido</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'Atenção' ? 'all' : 'Atenção')}
          className={`rounded-2xl border p-3.5 text-left transition-all ${
            statusFilter === 'Atenção'
              ? 'border-amber-500 bg-amber-950/40 shadow-lg shadow-amber-950/40'
              : 'border-slate-800 bg-dark-card hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span>Atenção</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">80.1-90mm</span>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-400 font-mono">
            {squadStats.countAtencao}{' '}
            <span className="text-xs text-slate-500 font-sans">
              ({Math.round((squadStats.countAtencao / (squadStats.total || 1)) * 100)}%)
            </span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Ajuste ligeiro</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'Alerta' ? 'all' : 'Alerta')}
          className={`rounded-2xl border p-3.5 text-left transition-all ${
            statusFilter === 'Alerta'
              ? 'border-orange-500 bg-orange-950/40 shadow-lg shadow-orange-950/40'
              : 'border-slate-800 bg-dark-card hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-orange-400" />
              <span>Alerta</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">90.1-100mm</span>
          </div>
          <div className="mt-2 text-2xl font-black text-orange-400 font-mono">
            {squadStats.countAlerta}{' '}
            <span className="text-xs text-slate-500 font-sans">
              ({Math.round((squadStats.countAlerta / (squadStats.total || 1)) * 100)}%)
            </span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Intervenção nutricional</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'Risco' ? 'all' : 'Risco')}
          className={`rounded-2xl border p-3.5 text-left transition-all ${
            statusFilter === 'Risco'
              ? 'border-rose-500 bg-rose-950/40 shadow-lg shadow-rose-950/40'
              : 'border-slate-800 bg-dark-card hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              <span>Risco</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">&gt; 100.0mm</span>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-400 font-mono">
            {squadStats.countRisco}{' '}
            <span className="text-xs text-slate-500 font-sans">
              ({Math.round((squadStats.countRisco / (squadStats.total || 1)) * 100)}%)
            </span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Acompanhamento próximo</div>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-dark-card p-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar jogadora pelo nome ou posição..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Position Filter Chips */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          <span className="text-[11px] font-bold text-slate-400 mr-1 shrink-0">Posição:</span>
          {['all', 'GR', 'DC', 'LAT', 'MC', 'EX', 'PL'].map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => setPositionFilter(pos)}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all shrink-0 ${
                positionFilter === pos
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {pos === 'all' ? 'Todas' : pos}
            </button>
          ))}
        </div>
      </div>

      {/* Full Squad Matrix Table */}
      <div className="rounded-2xl border border-slate-800 bg-dark-card overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-3 px-3">Jogadora</th>
                <th className="py-3 px-2 text-center">Pos</th>
                <th className="py-3 px-2 text-center">Alt (cm)</th>
                <th className="py-3 px-2 text-center">Peso Atual</th>
                <th className="py-3 px-2 text-center">Alvo (kg)</th>
                <th className="py-3 px-2 text-center">Dif.</th>
                <th className="py-3 px-2 text-center">% MG</th>
                <th className="py-3 px-2 text-center">MM (kg)</th>
                <th className="py-3 px-2 text-center text-slate-500">Ago</th>
                <th className="py-3 px-2 text-center text-slate-500">Set</th>
                <th className="py-3 px-2 text-center text-slate-500">Out</th>
                <th className="py-3 px-2 text-center text-emerald-400">Nov (Atual)</th>
                <th className="py-3 px-2 text-center">Status</th>
                <th className="py-3 px-2 text-center">Evolução</th>
                <th className="py-3 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
              {filteredRecords.map((r) => {
                const nov = r.history.november;
                const out = r.history.october;
                const set = r.history.september;
                const ago = r.history.august;

                const currentWeight = nov?.weight ?? r.augustWeightKg;
                const weightDiff = currentWeight - r.targetWeightKg;
                const currentFatPct =
                  nov?.fatMassPct !== undefined ? nov.fatMassPct * 100 : r.augustFatMassPct * 100;
                const currentMuscle = nov?.muscleMassKg ?? r.augustMuscleMassKg;
                const currentSkf = nov?.skf ?? null;
                const currentStatus: NutritionStatusLevel = nov?.status || 'Adequada';
                const statusStyle = getStatusStyle(currentStatus);

                const agoSkf = ago?.skf ?? null;
                const deltaSkf =
                  agoSkf !== null && currentSkf !== null ? currentSkf - agoSkf : null;

                return (
                  <tr
                    key={r.athleteId}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => handleOpenDetail(r)}
                  >
                    {/* Jogadora */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center space-x-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-black text-emerald-300">
                          {r.canonicalName.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-extrabold text-white text-xs">{r.canonicalName}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                            {r.fullName}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Posição */}
                    <td className="py-2.5 px-2 text-center">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-slate-800 text-slate-300 border border-slate-700">
                        {r.position}
                      </span>
                    </td>

                    {/* Altura */}
                    <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-300">
                      {r.heightCm}
                    </td>

                    {/* Peso Atual */}
                    <td className="py-2.5 px-2 text-center font-mono font-extrabold text-white">
                      {currentWeight.toFixed(1)}
                    </td>

                    {/* Peso Alvo */}
                    <td className="py-2.5 px-2 text-center font-mono font-semibold text-cyan-300">
                      {r.targetWeightKg.toFixed(1)}
                    </td>

                    {/* Dif. Alvo */}
                    <td className="py-2.5 px-2 text-center">
                      {Math.abs(weightDiff) < 0.1 ? (
                        <span className="text-[10px] font-black text-emerald-400">0.0</span>
                      ) : weightDiff > 0 ? (
                        <span className="text-[10px] font-black text-amber-400 font-mono">
                          +{weightDiff.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-[10px] font-black text-sky-400 font-mono">
                          {weightDiff.toFixed(1)}
                        </span>
                      )}
                    </td>

                    {/* % Gordura */}
                    <td className="py-2.5 px-2 text-center font-mono text-rose-300 font-semibold">
                      {currentFatPct.toFixed(1)}%
                    </td>

                    {/* Massa Muscular */}
                    <td className="py-2.5 px-2 text-center font-mono text-indigo-300 font-semibold">
                      {currentMuscle.toFixed(1)}
                    </td>

                    {/* Histórico SKF Ago */}
                    <td className="py-2.5 px-2 text-center font-mono text-slate-400">
                      {ago?.skf != null ? ago.skf.toFixed(1) : '—'}
                    </td>

                    {/* Histórico SKF Set */}
                    <td className="py-2.5 px-2 text-center font-mono text-slate-400">
                      {set?.skf != null ? set.skf.toFixed(1) : '—'}
                    </td>

                    {/* Histórico SKF Out */}
                    <td className="py-2.5 px-2 text-center font-mono text-slate-400">
                      {out?.skf != null ? out.skf.toFixed(1) : '—'}
                    </td>

                    {/* Histórico SKF Nov (Atual) */}
                    <td className="py-2.5 px-2 text-center font-mono font-black text-emerald-300 bg-emerald-500/5">
                      {currentSkf !== null ? currentSkf.toFixed(1) : '—'}
                    </td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-2 text-center">
                      <span
                        className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded border ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}
                      >
                        {currentStatus}
                      </span>
                    </td>

                    {/* Evolução Delta */}
                    <td className="py-2.5 px-2 text-center">
                      {deltaSkf !== null ? (
                        <span
                          className={`font-mono text-[10px] font-black ${
                            deltaSkf <= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {deltaSkf > 0 ? `+${deltaSkf.toFixed(1)}` : deltaSkf.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    {/* Ação */}
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(r);
                        }}
                        className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition-colors"
                        title="Ver ficha detalhada"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Athlete Detail & Edit Modal */}
      {selectedAthlete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-black">
                  <Apple className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {selectedAthlete.fullName}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <span className="font-extrabold text-emerald-400">
                      {selectedAthlete.position}
                    </span>
                    <span>&bull;</span>
                    <span>Estatura: {selectedAthlete.heightCm} cm</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Editar Registo</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedAthlete(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content: View Mode vs Edit Mode */}
            {!isEditing ? (
              <div className="space-y-4">
                {/* 4-Month Progression Strip */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                    Histórico Mensal de Pregas (∑8SKF):
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { label: 'Agosto', data: selectedAthlete.history.august },
                      { label: 'Setembro', data: selectedAthlete.history.september },
                      { label: 'Outubro', data: selectedAthlete.history.october },
                      {
                        label: 'Novembro',
                        data: selectedAthlete.history.november,
                        isCurrent: true,
                      },
                    ].map((m) => {
                      const status = m.data?.status || 'Adequada';
                      const style = getStatusStyle(status);
                      return (
                        <div
                          key={m.label}
                          className={`rounded-xl border p-3 ${
                            m.isCurrent
                              ? 'border-emerald-500/40 bg-emerald-950/20 ring-1 ring-emerald-500/30'
                              : 'border-slate-800 bg-slate-900/60'
                          }`}
                        >
                          <div className="text-[10px] font-bold text-slate-400">{m.label}</div>
                          <div className="mt-1 flex items-baseline space-x-1">
                            <span className="text-lg font-black font-mono text-white">
                              {m.data?.skf != null ? m.data.skf.toFixed(1) : '—'}
                            </span>
                            <span className="text-[10px] text-slate-500">mm</span>
                          </div>
                          {m.data?.skf != null && (
                            <span
                              className={`inline-block mt-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${style.bg} ${style.border} ${style.text}`}
                            >
                              {status}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                    <span className="text-[10px] font-bold text-slate-400 block">Peso Atual</span>
                    <span className="text-lg font-black font-mono text-white">
                      {(selectedAthlete.history.november?.weight ?? selectedAthlete.augustWeightKg).toFixed(1)} kg
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                    <span className="text-[10px] font-bold text-slate-400 block">Peso Alvo</span>
                    <span className="text-lg font-black font-mono text-cyan-300">
                      {selectedAthlete.targetWeightKg.toFixed(1)} kg
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                    <span className="text-[10px] font-bold text-slate-400 block">% Massa Gorda</span>
                    <span className="text-lg font-black font-mono text-rose-300">
                      {(
                        (selectedAthlete.history.november?.fatMassPct !== undefined
                          ? selectedAthlete.history.november.fatMassPct
                          : selectedAthlete.augustFatMassPct) * 100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                </div>

                {/* Notes */}
                {selectedAthlete.notes && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-200">
                    <span className="font-extrabold text-amber-300 block mb-0.5">Observações:</span>
                    {selectedAthlete.notes}
                  </div>
                )}
              </div>
            ) : (
              /* Edit Form */
              <form onSubmit={handleSaveEdit} className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Peso Alvo (kg):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={editFormData.targetWeightKg}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, targetWeightKg: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Peso Atual Nov (kg):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={editFormData.novWeight}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, novWeight: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      ∑8SKF Novembro (mm):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={editFormData.novSkf}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, novSkf: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      % Massa Gorda (%):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={editFormData.novFatPct}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, novFatPct: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-rose-300 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Massa Muscular (kg):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={editFormData.novMuscleKg}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, novMuscleKg: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-indigo-300 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Notas da Equipa Técnica:
                  </label>
                  <textarea
                    rows={2}
                    value={editFormData.notes}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, notes: e.target.value })
                    }
                    placeholder="Indicações alimentares, suplementação ou feedback específico..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition-all shadow-md active:scale-95"
                  >
                    <Check className="h-4 w-4" />
                    <span>Guardar Alterações</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
