import React from 'react';
import { MatchDashboard } from '@/components/MatchDashboard';
import { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: '#0B1329',
};

export const metadata: Metadata = {
  title: 'Gil Vicente FC U15 — Relatório de Performance (Dados de Jogo)',
  description: 'Relatório de performance tático-física GPS do Gil Vicente FC Sub-15 no Jogo Treino.',
};

export default function MatchDayPage() {
  return (
    <main className="min-h-screen bg-[#0B1329] px-3 sm:px-4 py-6 text-slate-100 selection:bg-sky-400 selection:text-slate-950">
      <MatchDashboard isStandalonePage={true} userRole="admin" />
    </main>
  );
}
