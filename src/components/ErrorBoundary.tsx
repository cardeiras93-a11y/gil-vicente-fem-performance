'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Shield, RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary apanhou um erro no cliente:', error, errorInfo);
  }

  public componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.setState({ hasError: false, error: null });
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-red-500/40 bg-dark-card p-6 text-center shadow-2xl space-y-4 animate-fade-in">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600/20 text-red-500 border border-red-500/40 shadow-lg">
              <Shield className="h-6 w-6 stroke-[2.5]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                {this.props.fallbackTitle || 'Painel de Administração • Recuperação'}
              </h3>
              <p className="text-xs text-slate-300">
                Ocorreu uma pequena divergência de carregamento de dados em tempo real. Os dados da nuvem estão 100% seguros.
              </p>
              {this.state.error?.message && (
                <div className="mt-2 p-2 rounded-lg bg-dark-bg/80 border border-slate-800 text-[11px] font-mono text-rose-300/90 truncate">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center space-x-2 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex items-center space-x-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-red-900/40 hover:bg-red-500 transition-all active:scale-95 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Atualizar e Recarregar Painel</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
