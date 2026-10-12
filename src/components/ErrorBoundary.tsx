import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home, ExternalLink } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] w-full p-6 flex items-center justify-center bg-slate-950 text-slate-100 rounded-2xl border border-rose-900/50 shadow-2xl my-4">
          <div className="max-w-xl w-full text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/50">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-white">
                {this.props.fallbackTitle || 'เกิดข้อผิดพลาดในการแสดงผล (ป้องกันจอขาวเรียบร้อย)'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                ระบบได้ป้องกันไม่ให้หน้าจอค้างขาว ข้อมูลโปรเจกต์ ฉาก ตัวละคร และ Prompt ของท่านยังถูกบันทึกไว้อย่างปลอดภัยในหน่วยความจำ
              </p>
            </div>

            {this.state.error && (
              <div className="bg-black/60 border border-slate-800 rounded-xl p-3 text-left overflow-x-auto max-h-36">
                <p className="text-[11px] font-mono text-rose-300 break-words">
                  {this.state.error.name}: {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ลองใหม่อีกครั้ง (Retry)</span>
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>รีโหลดหน้าเว็บ (Refresh)</span>
              </button>

              <a
                href="https://flow.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600/30 hover:bg-teal-600 text-teal-200 hover:text-white border border-teal-500/40 text-xs font-semibold transition cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>เปิด flow.google.com ในแท็บใหม่</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
