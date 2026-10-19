'use client';

import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, X, CheckCircle2, ShieldCheck, ArrowLeft, Sparkles } from 'lucide-react';
import { getAthletePin, setAthletePin, syncCredentialsFromCloud } from '@/lib/storage';
import { useLanguage } from '@/context/LanguageContext';

interface PinModalProps {
  athleteId: string;
  athleteName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type SetupStep = 'verify' | 'initial' | 'new_pin' | 'confirm_pin' | 'success';

export const PinModal: React.FC<PinModalProps> = ({
  athleteId,
  athleteName,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { language, t } = useLanguage();
  const isEn = language === 'en';

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<SetupStep>('verify');
  const [tempNewPin, setTempNewPin] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize or reset step whenever modal opens
  useEffect(() => {
    if (isOpen) {
      syncCredentialsFromCloud();
      const existing = getAthletePin(athleteId);
      if (existing) {
        setStep('verify');
      } else {
        setStep('initial');
      }
      setPin('');
      setError('');
      setTempNewPin('');
      setIsSaving(false);
    }
  }, [isOpen, athleteId]);

  if (!isOpen) return null;

  const existingPin = getAthletePin(athleteId);

  const handleDigit = (digit: string) => {
    if (isSaving || pin.length >= 4) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setError('');

    if (nextPin.length === 4) {
      // 1. Existing PIN Verification Flow
      if (step === 'verify') {
        if (nextPin === existingPin) {
          onSuccess();
        } else {
          setError(isEn ? 'Wrong PIN. Try again.' : t.athleteSelector.wrongPin || 'PIN incorreto. Tenta novamente.');
          setPin('');
        }
        return;
      }

      // 2. First Access: Step 1 - Enter Initial Temporary PIN (1234)
      if (step === 'initial') {
        if (nextPin === '1234') {
          // Success! Advance to define their personal new PIN
          setStep('new_pin');
          setPin('');
          setError('');
        } else {
          setError(
            isEn
              ? 'Incorrect initial PIN. Use temporary code: 1234'
              : 'PIN inicial incorreto. Usa o código provisório: 1234'
          );
          setPin('');
        }
        return;
      }

      // 3. First Access: Step 2 - Enter New Personal PIN
      if (step === 'new_pin') {
        if (nextPin === '1234') {
          setError(
            isEn
              ? 'Please choose a PIN different from 1234 for your safety.'
              : 'Escolhe um PIN diferente de 1234 para segurança da tua conta.'
          );
          setPin('');
          return;
        }
        setTempNewPin(nextPin);
        setStep('confirm_pin');
        setPin('');
        setError('');
        return;
      }

      // 4. First Access: Step 3 - Confirm New Personal PIN
      if (step === 'confirm_pin') {
        if (nextPin === tempNewPin) {
          setIsSaving(true);
          setStep('success');
          setAthletePin(athleteId, nextPin);

          // Brief delay to show success celebration before proceeding
          setTimeout(() => {
            onSuccess();
          }, 900);
        } else {
          setError(
            isEn
              ? 'PINs do not match. Please choose again.'
              : 'Os PINs não coincidem. Tenta definir novamente.'
          );
          setStep('new_pin');
          setTempNewPin('');
          setPin('');
        }
        return;
      }
    }
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleBack = () => {
    if (step === 'confirm_pin') {
      setStep('new_pin');
      setPin('');
      setError('');
    } else if (step === 'new_pin') {
      setStep('initial');
      setPin('');
      setError('');
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-xs rounded-3xl border border-slate-800 bg-dark-card p-6 shadow-2xl space-y-4 text-center relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-lime/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top bar with back or close */}
        <div className="flex justify-between items-center relative z-10">
          {step === 'new_pin' || step === 'confirm_pin' ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center space-x-1 text-[11px] font-bold text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{isEn ? 'Back' : 'Voltar'}</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1.5 text-brand-lime">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-[10px] uppercase font-black tracking-wider">
                {step === 'verify'
                  ? (isEn ? 'PIN ACCESS' : 'ACESSO POR PIN')
                  : (isEn ? 'FIRST ACCESS' : 'PRIMEIRO ACESSO')}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content based on Step */}
        <div className="space-y-2 relative z-10">
          <h2 className="text-base font-black text-slate-100 tracking-tight uppercase">
            {athleteName}
          </h2>

          {step === 'verify' && (
            <p className="text-xs text-slate-400">
              {isEn ? 'Enter your 4-digit PIN to continue' : 'Introduz o teu PIN de 4 dígitos para continuar'}
            </p>
          )}

          {step === 'initial' && (
            <div className="space-y-2 pt-1">
              <p className="text-xs text-slate-300 font-bold leading-snug">
                {isEn
                  ? 'To activate your profile, enter the initial club PIN:'
                  : 'Para ativares o teu perfil, introduz o PIN provisório do clube:'}
              </p>
              {/* Clue Badge */}
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-black shadow-sm">
                <KeyRound className="h-4 w-4 text-amber-400 shrink-0" />
                <span>{isEn ? 'Temporary PIN:' : 'PIN Provisório:'}</span>
                <span className="font-mono text-white tracking-widest text-sm bg-amber-500/30 px-2 py-0.5 rounded-lg border border-amber-400/50">
                  1234
                </span>
              </div>
            </div>
          )}

          {step === 'new_pin' && (
            <div className="space-y-1 pt-1">
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase border border-blue-500/30">
                {isEn ? 'Step 1 of 2 • New PIN' : 'Passo 1 de 2 • Novo PIN'}
              </div>
              <p className="text-xs text-slate-300 font-bold">
                {isEn ? 'Choose your new 4-digit personal PIN:' : 'Escolhe o teu novo PIN pessoal de 4 dígitos:'}
              </p>
              <p className="text-[11px] text-slate-400">
                {isEn ? 'This code will protect your personal account.' : 'Este código será o teu acesso exclusivo a partir de agora.'}
              </p>
            </div>
          )}

          {step === 'confirm_pin' && (
            <div className="space-y-1 pt-1">
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase border border-purple-500/30">
                {isEn ? 'Step 2 of 2 • Confirm' : 'Passo 2 de 2 • Confirmar'}
              </div>
              <p className="text-xs text-slate-300 font-bold">
                {isEn ? 'Re-enter your 4-digit PIN to confirm:' : 'Confirma o teu novo PIN de 4 dígitos:'}
              </p>
              <p className="text-[11px] text-slate-400">
                {isEn ? 'Re-enter the same code to make sure.' : 'Digita o mesmo código para garantir que não houve enganos.'}
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="py-4 space-y-2 animate-fade-in">
              <div className="h-12 w-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-xs font-black text-emerald-300 uppercase tracking-wide">
                {isEn ? 'PIN Activated Successfully!' : 'PIN Ativado com Sucesso!'}
              </p>
              <p className="text-[11px] text-slate-400">
                {isEn ? 'Logging in...' : 'A entrar no teu perfil...'}
              </p>
            </div>
          )}
        </div>

        {/* PIN Indicators */}
        {step !== 'success' && (
          <div className="flex justify-center space-x-3 py-2 relative z-10">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`h-4 w-4 rounded-full transition-all duration-200 ${
                  i < pin.length
                    ? 'bg-brand-lime scale-110 shadow-lg shadow-brand-lime/50 border border-brand-lime'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              />
            ))}
          </div>
        )}

        {error && (
          <p className="text-xs font-bold text-rose-400 animate-pulse px-2 relative z-10 leading-tight">
            {error}
          </p>
        )}

        {/* Numpad */}
        {step !== 'success' && (
          <div className="grid grid-cols-3 gap-2.5 pt-1 relative z-10">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleDigit(num)}
                className="h-12 rounded-xl border border-slate-800 bg-dark-surface hover:bg-slate-800 text-lg font-black text-slate-100 transition-all hover:border-brand-lime/40 active:scale-95 shadow-sm"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-12 rounded-xl border border-slate-800 bg-slate-900/90 text-[11px] font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all active:scale-95"
            >
              {isEn ? 'Clear' : 'Apagar'}
            </button>
            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="h-12 rounded-xl border border-slate-800 bg-dark-surface hover:bg-slate-800 text-lg font-black text-slate-100 hover:border-brand-lime/40 transition-all active:scale-95 shadow-sm"
            >
              0
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-12 rounded-xl border border-slate-800 bg-slate-900/90 text-[11px] font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all active:scale-95"
            >
              {isEn ? 'Cancel' : 'Cancelar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
