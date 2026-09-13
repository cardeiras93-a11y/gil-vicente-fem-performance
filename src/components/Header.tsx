'use client';

import React from 'react';
import Link from 'next/link';
import { Athlete } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';
import { isGoalkeeper } from '@/lib/data';
import { User, RefreshCw, Shield, Stethoscope, Trophy } from 'lucide-react';

interface HeaderProps {
  activeAthlete: Athlete | null;
  onChangeAthlete: () => void;
  onOpenAdmin: () => void;
  onOpenPhysio: () => void;
  onOpenProfile?: () => void;
  isOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeAthlete,
  onChangeAthlete,
  onOpenAdmin,
  onOpenPhysio,
  onOpenProfile,
  isOnline,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const isGr = activeAthlete?.position === 'GR' || (activeAthlete?.name ? isGoalkeeper(activeAthlete.name) : false);

  return (
    <header className="sticky top-0 z-40 border-b border-red-900/60 bg-dark-bg/95 backdrop-blur-md px-3 sm:px-4 pt-safe pb-2 shadow-lg">
      <div className="mx-auto max-w-lg space-y-2">
        {/* Top Header Row */}
        <div className="flex items-center justify-between">
          {/* Gil Vicente Official Crest & Title (Clickable Home Button) */}
          <button
            type="button"
            onClick={onChangeAthlete}
            title="Menu Principal / Seleção de Jogadoras"
            className="flex items-center space-x-2 text-left focus:outline-none group cursor-pointer shrink-0"
          >
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-dark-card/90 p-1 border border-red-500/50 shadow-md shadow-red-900/30 group-hover:border-amber-400 transition-all">
              <img
                src="/gil-vicente-crest.png"
                alt="Gil Vicente Futebol Clube"
                className="h-8 w-8 object-contain drop-shadow"
              />
            </div>
            <div>
              <h1 className="text-[11px] sm:text-xs font-black tracking-wider text-slate-100 uppercase leading-tight group-hover:text-amber-400 transition-colors">
                Gil Vicente FC <span className="text-red-500 font-extrabold">(Fem)</span>
              </h1>
              <p className="text-[8px] sm:text-[9px] font-extrabold text-amber-400 uppercase tracking-tight">
                {t.header.subtitle}
              </p>
            </div>
          </button>

          {/* Right side: Language Selector + Physio Button + Admin Button */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
            {/* Language Selector Button */}
            <button
              type="button"
              onClick={() => setLanguage(language === 'pt' ? 'en' : language === 'en' ? 'fr' : language === 'fr' ? 'es' : 'pt')}
              title="Alterar Idioma / Switch Language / Changer de Langue / Cambiar Idioma"
              className="flex items-center space-x-1 rounded-full border border-slate-700 bg-dark-card px-2 py-1 text-[10px] font-extrabold text-slate-200 hover:border-amber-400 active:scale-95 transition-all shadow-sm"
            >
              <span>{language === 'pt' ? '🇵🇹 PT' : language === 'en' ? '🇬🇧 EN' : language === 'fr' ? '🇫🇷 FR' : '🇪🇸 ES'}</span>
            </button>

            {/* Match Day GPS Hub Button (Hidden for Goalkeepers) */}
            {!isGr && (
              <Link
                href="/dashboard/jogos"
                title="Dashboard Jogos"
                className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-sky-500/50 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-all active:scale-95 shadow-sm"
              >
                <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-300" />
              </Link>
            )}

            {/* Physiotherapist Button */}
            <button
              type="button"
              onClick={onOpenPhysio}
              title="Gabinete de Fisioterapia"
              className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-teal-500/50 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 transition-all active:scale-95 shadow-sm"
            >
              <Stethoscope className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>

            {/* Admin Button */}
            <button
              type="button"
              onClick={onOpenAdmin}
              title={t.header.adminArea}
              className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all active:scale-95 shadow-sm"
            >
              <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>

        {/* Active Athlete Banner / Selector Strip */}
        <div className="flex items-center justify-between rounded-xl border border-red-500/30 bg-gradient-to-r from-red-950/40 via-dark-card to-dark-card px-3 py-1.5 shadow-inner">
          <div className="flex items-center space-x-2 min-w-0">
            {activeAthlete && activeAthlete.avatarUrl ? (
              <img
                src={activeAthlete.avatarUrl}
                alt={activeAthlete.name}
                className="h-6 w-6 rounded-full object-cover border border-red-500/50 shrink-0"
              />
            ) : (
              <span className="text-[10px] font-extrabold uppercase text-slate-400 shrink-0">
                Jogadora:
              </span>
            )}
            {activeAthlete ? (
              <span className="text-xs font-black uppercase text-red-400 truncate">
                {activeAthlete.name}
              </span>
            ) : (
              <span className="text-xs font-bold text-amber-400 italic">
                Nenhuma selecionada
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            {activeAthlete && onOpenProfile && (
              <button
                type="button"
                onClick={onOpenProfile}
                title="Editar Perfil & PIN"
                className="flex items-center space-x-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-extrabold text-amber-300 transition-all active:scale-95"
              >
                <User className="h-3 w-3" />
                <span>Perfil</span>
              </button>
            )}

            <button
              type="button"
              onClick={onChangeAthlete}
              className="flex items-center space-x-1 rounded-lg bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 px-2 py-0.5 text-[10px] font-extrabold text-red-200 transition-all active:scale-95 shrink-0"
            >
              <User className="h-3 w-3" />
              <span>{activeAthlete ? 'Mudar' : 'Selecionar'}</span>
              <RefreshCw className="h-2.5 w-2.5 text-red-300 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
