'use client';

import React, { useState, useEffect } from 'react';
import { WellnessEntry, RPEEntry, HydrationEntry, Athlete } from '@/lib/types';
import { INITIAL_ATHLETES, calculateHydrationStatus } from '@/lib/data';
import {
  getWellnessLocally,
  getRPELocally,
  getHydrationLocally,
  deleteHydrationLocally,
  updateHydrationLocally,
  getPhysioPin
} from '@/lib/storage';
import {
  Stethoscope, Shield, CheckCircle2, Clock, AlertTriangle, Search,
  Calendar, User, Droplets, HeartPulse, Dumbbell, Pencil, Trash2, X, Lock,
  ChevronLeft, ChevronRight, Check, Activity
} from 'lucide-react';
import { SquadMuscleHeatmap } from './SquadMuscleHeatmap';

interface PhysioDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const PHYSIO_ATTENDANCE_KEY = 'femperf_physio_attendance_status';

export const PhysioDashboard: React.FC<PhysioDashboardProps> = ({ isOpen, onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [physioPin, setPhysioPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'triage' | 'wellness' | 'hydration'>('triage');

  const [wellnessList, setWellnessList] = useState<WellnessEntry[]>([]);
  const [rpeList, setRpeList] = useState<RPEEntry[]>([]);
  const [hydrationList, setHydrationList] = useState<HydrationEntry[]>([]);
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Attendance status for physio triage (date-athleteId -> boolean)
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({});

  // Editing Hydration
  const [editingHydrationEntry, setEditingHydrationEntry] = useState<HydrationEntry | null>(null);
  const [editPreWeight, setEditPreWeight] = useState<string>('');
  const [editPostWeight, setEditPostWeight] = useState<string>('');
  const [editFluids, setEditFluids] = useState<string>('');

  const loadData = () => {
    const w = getWellnessLocally();
    const r = getRPELocally();
    const h = getHydrationLocally();

    setWellnessList(w);
    setRpeList(r);
    setHydrationList(h);

    try {
      const storedMap = JSON.parse(localStorage.getItem(PHYSIO_ATTENDANCE_KEY) || '{}');
      setAttendanceMap(storedMap);
    } catch {
      setAttendanceMap({});
    }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadData();
    }
  }, [isOpen, isAuthenticated, selectedDate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPin = getPhysioPin();
    if (physioPin.trim() === storedPin.trim()) {
      setIsAuthenticated(true);
      setPinError('');
      loadData();
    } else {
      setPinError('PIN incorreto. Tente novamente.');
    }
  };

  const toggleAttendance = (key: string) => {
    const updated = { ...attendanceMap, [key]: !attendanceMap[key] };
    setAttendanceMap(updated);
    try {
      localStorage.setItem(PHYSIO_ATTENDANCE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Erro ao guardar estado da fisioterapia:', e);
    }
  };

  const handleDeleteHydration = (id: string) => {
    if (confirm('Tem a certeza que deseja apagar este registo de hidratação?')) {
      deleteHydrationLocally(id);
      loadData();
    }
  };

  const handleStartEditHydration = (entry: HydrationEntry) => {
    setEditingHydrationEntry(entry);
    setEditPreWeight(entry.preWeight.toString());
    setEditPostWeight(entry.postWeight.toString());
    setEditFluids(entry.fluidsIntake.toString());
  };

  const handleSaveEditedHydration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHydrationEntry) return;

    const pre = parseFloat(editPreWeight);
    const post = parseFloat(editPostWeight);
    const fluids = parseFloat(editFluids || '0.5');

    if (isNaN(pre) || isNaN(post) || pre <= 0 || post <= 0) return;

    const calc = calculateHydrationStatus(pre, post, fluids, 'pt');
    const updated: HydrationEntry = {
      ...editingHydrationEntry,
      preWeight: pre,
      postWeight: post,
      fluidsIntake: fluids,
      weightLoss: calc.weightLoss,
      dehydrationRate: calc.dehydrationRate,
      status: calc.status,
      refillNeededLiters: calc.refillNeededLiters,
      recommendation: calc.recommendation,
      biologicalImpact: calc.biologicalImpact,
    };

    updateHydrationLocally(updated);
    setEditingHydrationEntry(null);
    loadData();
  };

  if (!isOpen) return null;

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
        <div className="w-full max-w-sm rounded-2xl border border-teal-500/30 bg-dark-card p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                <Stethoscope className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase text-slate-100">Gabinete de Fisioterapia</h2>
                <p className="text-[11px] text-teal-400 font-bold">Departamento Médico Gil Vicente</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-slate-300 block mb-1.5">
                PIN de Acesso da Fisioterapeuta
              </label>
              <input
                type="password"
                value={physioPin}
                onChange={(e) => setPhysioPin(e.target.value)}
                placeholder="Insira o PIN"
                autoFocus
                className="w-full rounded-xl border border-slate-700 bg-dark-bg p-3 text-center text-lg font-black tracking-widest text-slate-100 focus:border-teal-500 focus:outline-none"
              />
              {pinError && <p className="text-xs font-bold text-rose-400 mt-1 text-center">{pinError}</p>}
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-teal-600 py-3 text-xs font-extrabold text-white shadow-lg shadow-teal-600/30 hover:bg-teal-500 transition-all"
            >
              Entrar no Gabinete Médico
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Triage list: Athletes needing physio for selected date
  const todaysWellness = wellnessList.filter((w) => w.date === selectedDate);
  const physioAthletesToday = todaysWellness.filter((w) => w.needsPhysio);

  // Filtered hydration list
  const filteredHydration = hydrationList.filter(
    (h) =>
      h.date === selectedDate &&
      h.athleteName.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-bg text-slate-100 p-4 sm:p-6 animate-fade-in">
      <div className="mx-auto max-w-5xl space-y-6 pb-12">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-teal-900/60 pb-4 gap-3">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white font-black shadow-lg shadow-teal-600/30">
              <Stethoscope className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-tight text-slate-100">
                Gil Vicente FC &bull; Gabinete de Fisioterapia
              </h1>
              <p className="text-[11px] font-bold text-teal-400">Triagem Pré-Treino & Gestão Fisiológica</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Date Selector */}
            <div className="flex items-center space-x-1 rounded-xl border border-slate-700 bg-dark-card p-1">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-lg border-0 bg-transparent px-2 py-1 text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Top Tabs */}
        <div className="flex space-x-2 border-b border-slate-800 pb-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('triage')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'triage'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <span>🚨 Atendimento Pré-Treino ({physioAthletesToday.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wellness')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'wellness'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <HeartPulse className="h-4 w-4 text-brand-lime" />
            <span>🧘 Questionários & Sintomas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hydration')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'hydration'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Droplets className="h-4 w-4 text-cyan-400" />
            <span>💧 Gestão de Pesagem & Hidratação</span>
          </button>
        </div>

        {/* TAB 1: TRIAGEM DE FISIOTERAPIA PRÉ-TREINO */}
        {activeTab === 'triage' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <div>
                <h3 className="text-sm font-black text-amber-300 uppercase flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Jogadoras que Necessitam de Fisioterapia Pré-Treino</span>
                </h3>
                <p className="text-xs text-amber-200/80 mt-0.5">
                  Lista de atletas que assinalaram necessidade de atendimento fisioterapêutico no Wellness de {selectedDate}.
                </p>
              </div>
              <span className="text-xl font-black text-amber-400 bg-amber-500/20 px-3 py-1 rounded-xl border border-amber-500/40">
                {physioAthletesToday.length} Atletas
              </span>
            </div>

            {physioAthletesToday.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-dark-card p-12 text-center space-y-2">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
                <h4 className="text-sm font-extrabold text-slate-200">Nenhuma jogadora assinalou fisioterapia pré-treino para esta data.</h4>
                <p className="text-xs text-slate-400">Todas as atletas aptas sem queixas registadas no dia {selectedDate}.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {physioAthletesToday.map((item) => {
                  const key = `${item.date}-${item.athleteId}`;
                  const isAttended = Boolean(attendanceMap[key]);

                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border p-5 space-y-3 shadow-lg transition-all ${
                        isAttended
                          ? 'border-emerald-500/40 bg-emerald-950/20'
                          : 'border-rose-500/50 bg-rose-950/20'
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-100 font-black text-sm border border-slate-700">
                            {item.athleteName.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-100">{item.athleteName}</h4>
                            <span className="text-[10px] font-bold text-slate-400">
                              Wellness Total: {item.wellnessTotal || '28'}/35
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleAttendance(key)}
                          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                            isAttended
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'bg-rose-600 text-white shadow-md hover:bg-rose-500'
                          }`}
                        >
                          {isAttended ? (
                            <>
                              <Check className="h-4 w-4" />
                              <span>Atendida / Trata</span>
                            </>
                          ) : (
                            <>
                              <Clock className="h-4 w-4" />
                              <span>Pendente</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Motivo & Queixa */}
                      <div className="space-y-1 bg-dark-bg p-3 rounded-xl border border-slate-800">
                        <span className="text-[10px] font-bold text-amber-400 uppercase block">
                          Motivo / Queixa Relatada:
                        </span>
                        <p className="text-xs font-semibold text-slate-200">
                          {item.physioReason || 'Dores e rigidez muscular generalizada.'}
                        </p>
                      </div>

                      {/* Muscle Fatigue Tags */}
                      {item.muscleFatigue && Object.keys(item.muscleFatigue).length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Zonas Afetadas:</span>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(item.muscleFatigue).map(([muscle, score]) => (
                              <span
                                key={muscle}
                                className="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-[11px] font-bold"
                              >
                                {muscle}: {score}/10
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CONSULTA DE QUESTIONÁRIOS */}
        {activeTab === 'wellness' && (
          <div className="rounded-2xl border border-slate-800 bg-dark-card p-4 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-100 uppercase">Questionários de Wellness em {selectedDate}</h3>
            <div className="divide-y divide-slate-800">
              {todaysWellness.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center italic">Nenhum questionário Wellness submetido nesta data.</p>
              ) : (
                todaysWellness.map((w) => (
                  <div key={w.id} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-slate-100 text-xs">{w.athleteName}</span>
                      <div className="text-[11px] text-slate-400 space-x-2">
                        <span>Sono: {w.sleepQuality}/5</span>
                        <span>Fadiga: {w.fatigue}/5</span>
                        <span>Stress: {w.stress}/5</span>
                        <span>Dores: {w.soreness}/5</span>
                      </div>
                    </div>
                    {w.needsPhysio && (
                      <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                        🚨 Fisioterapia
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Squad Muscle Heatmap Body Chart */}
            <SquadMuscleHeatmap
              entries={todaysWellness}
              date={selectedDate}
              title="Mapa Coletivo de Queixas Musculares do Plantel (Gabinete Médico)"
            />
          </div>
        )}

        {/* TAB 3: GESTÃO DE PESAGEM E HIDRATAÇÃO */}
        {activeTab === 'hydration' && (
          <div className="rounded-2xl border border-slate-800 bg-dark-card p-4 space-y-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-100 uppercase flex items-center space-x-2">
                  <Droplets className="h-4 w-4 text-cyan-400" />
                  <span>Gestão de Pesagem & Hidratação ({selectedDate})</span>
                </h3>
                <p className="text-xs text-slate-400">A fisioterapeuta pode visualizar, editar ou apagar qualquer registo.</p>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar jogadora..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-dark-bg py-1.5 pl-8 pr-3 text-xs font-semibold text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-dark-bg text-slate-400 font-extrabold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Jogadora</th>
                    <th className="py-2.5 px-3">Peso Pré</th>
                    <th className="py-2.5 px-3">Peso Pós</th>
                    <th className="py-2.5 px-3">Perda (kg)</th>
                    <th className="py-2.5 px-3">Desidratação (%)</th>
                    <th className="py-2.5 px-3">Reposição (L)</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-semibold">
                  {filteredHydration.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                        Sem registos de pesagem para {selectedDate}.
                      </td>
                    </tr>
                  ) : (
                    filteredHydration.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-bold text-slate-100">{h.athleteName}</td>
                        <td className="py-3 px-3 text-slate-300">{h.preWeight} kg</td>
                        <td className="py-3 px-3 text-slate-300">{h.postWeight} kg</td>
                        <td className="py-3 px-3 font-bold text-amber-400">{h.weightLoss} kg</td>
                        <td className="py-3 px-3 font-bold text-cyan-300">{h.dehydrationRate}%</td>
                        <td className="py-3 px-3 font-bold text-emerald-400">{h.refillNeededLiters} L</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              h.status === 'Alerta'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                : h.status === 'Atenção'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {h.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => handleStartEditHydration(h)}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-cyan-400 hover:bg-slate-700"
                            title="Editar Registo"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteHydration(h.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                            title="Apagar Registo"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* EDIT HYDRATION MODAL */}
        {editingHydrationEntry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-dark-card p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black uppercase text-slate-100">
                  Editar Pesagem: {editingHydrationEntry.athleteName}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingHydrationEntry(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEditedHydration} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-300 mb-1">Peso Pré-Treino (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editPreWeight}
                    onChange={(e) => setEditPreWeight(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-dark-bg p-3 text-slate-100 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Peso Pós-Treino (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editPostWeight}
                    onChange={(e) => setEditPostWeight(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-dark-bg p-3 text-slate-100 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Fluidos Ingeridos (L)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editFluids}
                    onChange={(e) => setEditFluids(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-dark-bg p-3 text-slate-100 font-bold"
                  />
                </div>

                <div className="flex justify-end space-x-2 border-t border-slate-800 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditingHydrationEntry(null)}
                    className="rounded-xl border border-slate-700 bg-dark-bg px-4 py-2 text-slate-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-teal-600 px-4 py-2 font-black text-white hover:bg-teal-500"
                  >
                    Guardar Alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
