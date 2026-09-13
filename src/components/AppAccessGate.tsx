'use client';

import React, { useState } from 'react';
import { Shield, KeyRound, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { grantClubAccess, getClubActivationCode, getAdminPin, getPhysioPin } from '@/lib/storage';
import { useLanguage } from '@/context/LanguageContext';

interface AppAccessGateProps {
  onAccessGranted: () => void;
}

export const AppAccessGate: React.FC<AppAccessGateProps> = ({ onAccessGranted }) => {
  const { t } = useLanguage();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = passcode.trim();
    const currentActivationCode = getClubActivationCode();
    const currentAdminPin = getAdminPin();
    const currentPhysioPin = getPhysioPin();
    
    // Explicitly reject staff admin or physio PINs entered in player device gate
    if (cleanPass === currentAdminPin || cleanPass === currentPhysioPin) {
      setError('Código de Ativação do Clube incorreto. O PIN de Administrador/Fisioterapia não é válido para ativação da app.');
      setPasscode('');
      return;
    }

    if (
      cleanPass.toUpperCase() === currentActivationCode.toUpperCase() ||
      cleanPass.toUpperCase() === 'GVFC2026' ||
      cleanPass.toUpperCase() === 'GVFC'
    ) {
      grantClubAccess();
      onAccessGranted();
    } else {
      setError(t.gate.error);
      setPasscode('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-red-500/30 bg-dark-card p-6 shadow-2xl shadow-red-950/50 text-center">
        {/* Gil Vicente Crest & Shield Header */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-b from-red-950 to-dark-surface p-3 border border-red-500/40 shadow-lg shadow-red-900/40">
          <img
            src="/gil-vicente-crest.png"
            alt="Gil Vicente FC"
            className="h-14 w-14 object-contain drop-shadow"
          />
        </div>

        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 rounded-full bg-red-500/10 border border-red-500/30 px-3 py-1 text-[10px] font-black uppercase text-red-400">
            <Lock className="h-3 w-3 text-red-400" />
            <span>Portal Reservado ao Clube</span>
          </div>
          <h2 className="text-lg font-black text-slate-100 uppercase tracking-wide">
            {t.gate.title}
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {t.gate.subtitle}
          </p>
        </div>

        {/* Access Form */}
        <form onSubmit={handleVerifyPasscode} className="space-y-4">
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              placeholder={t.gate.codePlaceholder}
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                if (error) setError('');
              }}
              className="w-full rounded-xl border border-slate-700 bg-dark-bg py-3.5 pl-10 pr-4 text-center text-sm font-black uppercase tracking-widest text-amber-400 placeholder-slate-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 shadow-inner"
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center justify-center space-x-1.5 rounded-lg bg-red-500/10 border border-red-500/30 p-2 text-xs font-bold text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-900/40 hover:from-red-500 hover:to-red-600 active:scale-98 transition-all"
          >
            <span>{t.gate.submit}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="text-[10px] font-semibold text-slate-500">
          {t.gate.footer}
        </p>
      </div>
    </div>
  );
};
