'use client';

import React, { useState } from 'react';
import { Lock, KeyRound, X, CheckCircle } from 'lucide-react';
import { getAthletePin, setAthletePin } from '@/lib/storage';

interface PinModalProps {
  athleteId: string;
  athleteName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({
  athleteId,
  athleteName,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'verify' | 'setup'>('verify');

  if (!isOpen) return null;

  const existingPin = getAthletePin(athleteId);
  const isSettingUp = !existingPin;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError('');

      if (nextPin.length === 4) {
        if (isSettingUp) {
          setAthletePin(athleteId, nextPin);
          onSuccess();
        } else {
          if (nextPin === existingPin) {
            onSuccess();
          } else {
            setError('PIN Incorreto. Tenta novamente.');
            setPin('');
          }
        }
      }
    }
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xs rounded-2xl border border-dark-border bg-dark-card p-6 shadow-2xl space-y-5 text-center">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2 text-brand-lime">
            <Lock className="h-5 w-5" />
            <span className="text-xs uppercase font-bold tracking-wider">Acesso Seguro</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-100">{athleteName}</h2>
          <p className="text-xs text-slate-400 mt-1">
            {isSettingUp
              ? 'Cria um PIN de 4 dígitos para proteger o teu perfil'
              : 'Introduz o teu PIN de 4 dígitos'}
          </p>
        </div>

        {/* PIN Indicators */}
        <div className="flex justify-center space-x-3 py-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`h-4 w-4 rounded-full transition-all ${
                i < pin.length
                  ? 'bg-brand-lime scale-110 shadow-lg shadow-brand-lime/50'
                  : 'bg-slate-800 border border-slate-700'
              }`}
            />
          ))}
        </div>

        {error && <p className="text-xs font-semibold text-rose-400 animate-pulse">{error}</p>}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              className="h-14 rounded-xl border border-slate-800 bg-dark-surface text-xl font-bold text-slate-100 transition-all hover:border-brand-lime/50 hover:bg-slate-800 active:scale-95"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-xl border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-400 hover:text-slate-200"
          >
            Limpar
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-xl border border-slate-800 bg-dark-surface text-xl font-bold text-slate-100 hover:border-brand-lime/50 hover:bg-slate-800 active:scale-95"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => {
              // Direct pass option if PIN is optional
              onSuccess();
            }}
            className="h-14 rounded-xl border border-slate-800 bg-slate-900 text-[11px] font-semibold text-slate-400 hover:text-brand-lime"
          >
            Ignorar
          </button>
        </div>
      </div>
    </div>
  );
};
