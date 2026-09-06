'use client';

import React from 'react';
import { Athlete } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';
import { User, RefreshCw, Wifi, WifiOff, Shield, Globe, Stethoscope } from 'lucide-react';

interface HeaderProps {
  activeAthlete: Athlete | null;
  onChangeAthlete: () => void;
  onOpenAdmin: () => void;
  onOpenPhysio: () => void;
  isOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeAthlete,
  onChangeAthlete,
  onOpenAdmin,
  onOpenPhysio,
  isOnline,
}) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 border-b border-red-900/60 bg-dark-bg/95 backdrop-blur-md px-4 py-3 shadow-lg">
      <div className="mx-auto flex max-w-lg items-center justify-between">
        {/* Gil Vicente Official Crest & Title (Clickable Home Button) */}
        <button
          type="button"
          onClick={onChangeAthlete}
          title="Menu Principal / Seleção de Jogadoras"
          className="flex items-center space-x-3 text-left focus:outline-none group cursor-pointer"
        >
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-dark-card/90 p-1 border border-red-500/50 shadow-md shadow-red-900/30 group-hover:border-amber-400 transition-all">
            <img
              src="/gil-vicente-crest.png"
              alt="Gil Vicente Futebol Clube"
              className="h-9 w-9 object-contain drop-shadow"
            />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-wider text-slate-100 uppercase leading-tight group-hover:text-amber-400 transition-colors">
              Gil Vicente FC <span className="text-red-500 font-extrabold">(Futebol Feminino)</span>
            </h1>
            <p className="text-[9px] font-extrabold text-amber-400 uppercase tracking-tight">
              {t.header.subtitle}
            </p>
          </div>
        </button>

        {/* Right side: Language Selector + Physio Button + Admin Button + Active Athlete Profile */}
        <div className="flex items-center space-x-1.5">
          {/* Language Selector Button */}
          <button
            type="button"
            onClick={() => setLanguage(language === 'pt' ? 'en' : language === 'en' ? 'fr' : 'pt')}
            title="Alterar Idioma / Switch Language / Changer de langue"
            className="flex items-center space-x-1 rounded-full border border-slate-700 bg-dark-card px-2 py-1 text-[11px] font-extrabold text-slate-200 hover:border-amber-400 active:scale-95 transition-all shadow-sm"
          >
            <span>{language === 'pt' ? '🇵🇹 PT' : language === 'en' ? '🇬🇧 EN' : '🇫🇷 FR'}</span>
          </button>

          {/* Physiotherapist Button */}
          <button
            type="button"
            onClick={onOpenPhysio}
            title="Gabinete de Fisioterapia"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-teal-500/50 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 transition-all active:scale-95 shadow-sm"
          >
            <Stethoscope className="h-4 w-4" />
          </button>

          {/* Admin Button for Technical Staff */}
          <button
            type="button"
            onClick={onOpenAdmin}
            title={t.header.adminArea}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all active:scale-95 shadow-sm"
          >
            <Shield className="h-4 w-4" />
          </button>

          {activeAthlete ? (
            <button
              type="button"
              onClick={onChangeAthlete}
              className="flex items-center space-x-1 rounded-full border border-red-500/40 bg-dark-card py-1 px-2.5 text-xs font-semibold text-slate-200 hover:border-red-400 transition-all active:scale-95 shadow-sm"
            >
              <span className="max-w-[70px] truncate text-red-400 font-extrabold">
                {activeAthlete.name}
              </span>
              <RefreshCw className="h-3 w-3 text-slate-400" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onChangeAthlete}
              className="flex items-center space-x-1 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-500 transition-all shadow-md shadow-red-600/30"
            >
              <User className="h-3.5 w-3.5" />
              <span>Atleta</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
