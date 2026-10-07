'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Athlete } from '@/lib/types';
import { getAthletePin, setAthletePin, getAthleteAvatar, setAthleteAvatar } from '@/lib/storage';
import { secureFetch } from '@/lib/authGuard';
import { useLanguage } from '@/context/LanguageContext';
import { X, Camera, Lock, KeyRound, CheckCircle, Trash2, UserCheck, ShieldAlert } from 'lucide-react';

interface AthleteProfileModalProps {
  athlete: Athlete | null;
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: () => void;
}

export const AthleteProfileModal: React.FC<AthleteProfileModalProps> = ({
  athlete,
  isOpen,
  onClose,
  onProfileUpdated,
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (athlete) {
      const savedAvatar = getAthleteAvatar(athlete.id) || athlete.avatarUrl || null;
      setCurrentAvatar(savedAvatar);
      setNewPin('');
      setConfirmPin('');
      setPinError('');
      setSuccessMessage(null);
    }
  }, [athlete, isOpen]);

  if (!isOpen || !athlete) return null;

  // Handle Photo Upload & Canvas Compression (max 300x300)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor seleciona um ficheiro de imagem válido.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setAthleteAvatar(athlete.id, compressedDataUrl);
          setCurrentAvatar(compressedDataUrl);
          setSuccessMessage('Fotografia de perfil atualizada com sucesso!');
          if (onProfileUpdated) onProfileUpdated();
          setTimeout(() => setSuccessMessage(null), 3500);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAthleteAvatar(athlete.id, null);
    setCurrentAvatar(null);
    setSuccessMessage('Fotografia de perfil removida.');
    if (onProfileUpdated) onProfileUpdated();
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinError('O PIN deve conter exatamente 4 dígitos numéricos (ex: 1234).');
      return;
    }

    if (newPin !== confirmPin) {
      setPinError('A confirmação do PIN não coincide com o novo PIN.');
      return;
    }

    setAthletePin(athlete.id, newPin);
    setNewPin('');
    setConfirmPin('');
    setSuccessMessage('Palavra-passe / PIN redefinido com sucesso!');
    if (onProfileUpdated) onProfileUpdated();
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const currentPin = getAthletePin(athlete.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-red-500/40 bg-dark-card p-6 shadow-2xl shadow-red-950/50">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase text-slate-100">
                Perfil & Definições Pessoais
              </h3>
              <p className="text-[11px] font-semibold text-slate-400">
                {athlete.name} • Gil Vicente FC
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback Success Toast */}
        {successMessage && (
          <div className="flex items-center space-x-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 p-3 text-xs font-bold text-emerald-300 animate-fade-in">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 1. Profile Photo Section */}
        <div className="rounded-2xl border border-slate-800 bg-dark-surface p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs font-black uppercase text-slate-200 flex items-center space-x-1.5">
              <Camera className="h-4 w-4 text-red-500" />
              <span>Fotografia de Perfil</span>
            </span>
          </div>

          <div className="flex items-center space-x-4 pt-1">
            {/* Avatar Preview */}
            <div className="relative group">
              <div className="h-16 w-16 rounded-full border-2 border-red-500/50 bg-slate-900 overflow-hidden flex items-center justify-center shadow-lg">
                {currentAvatar ? (
                  <img
                    src={currentAvatar}
                    alt={athlete.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-black text-amber-400">
                    {athlete.name.substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Photo Action Buttons */}
            <div className="space-y-2 flex-1">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center space-x-1.5 rounded-xl border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs font-extrabold text-red-300 hover:bg-red-500/20 transition-all active:scale-95 shadow-sm"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>{currentAvatar ? 'Alterar Fotografia' : 'Carregar Fotografia'}</span>
              </button>

              {currentAvatar && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="w-full flex items-center justify-center space-x-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-[11px] font-bold text-rose-400 hover:bg-rose-500/20 transition-all"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Remover Foto</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2. Redefine PIN Section */}
        <div className="rounded-2xl border border-slate-800 bg-dark-surface p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs font-black uppercase text-slate-200 flex items-center space-x-1.5">
              <KeyRound className="h-4 w-4 text-amber-400" />
              <span>Redefinir Palavra-passe / PIN</span>
            </span>
            <span className="text-[10px] font-mono font-bold text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
              PIN Atual: {currentPin ? '••••' : 'Sem PIN'}
            </span>
          </div>

          <form onSubmit={handleSavePin} className="space-y-3 pt-1">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">Novo PIN (4 dígitos):</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Ex: 1234"
                  className="w-full rounded-xl border border-slate-700 bg-dark-bg py-2 pl-9 pr-3 text-center text-sm font-black tracking-widest text-slate-100 placeholder-slate-600 focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">Confirmar Novo PIN:</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Repetir PIN..."
                  className="w-full rounded-xl border border-slate-700 bg-dark-bg py-2 pl-9 pr-3 text-center text-sm font-black tracking-widest text-slate-100 placeholder-slate-600 focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            {pinError && (
              <div className="flex items-center space-x-1.5 rounded-lg bg-red-500/10 border border-red-500/30 p-2 text-xs font-semibold text-rose-400 animate-pulse">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-1.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 py-2.5 text-xs font-black uppercase text-white hover:from-red-500 hover:to-red-600 active:scale-98 transition-all shadow-md shadow-red-950/40"
            >
              <KeyRound className="h-4 w-4" />
              <span>Guardar Novo PIN</span>
            </button>
          </form>
        </div>

        {/* Modal Close Footer */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
