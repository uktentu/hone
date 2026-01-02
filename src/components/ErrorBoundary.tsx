import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-8">
                    <div className="max-w-md w-full card rounded-2xl p-8 shadow-2xl animate-slide-in border border-red-500/30">
                        <h1 className="text-2xl font-bold text-red-400 mb-4 tracking-tight">
                            Something went wrong
                        </h1>
                        <p className="text-sm text-slate-400 mb-4">
                            An unexpected error occurred. Clear your data and reload to fix the issue.
                        </p>
                        <pre className="text-xs surface p-4 rounded-xl overflow-auto text-slate-300 mb-4 max-h-40 border border-slate-700/50">
                            {this.state.error?.message}
                        </pre>
                        <button
                            onClick={() => {
                                localStorage.clear();
                                window.location.reload();
                            }}
                            className="w-full bg-red-600 hover:bg-red-500 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95 shadow-lg hover:shadow-red-500/30 text-white"
                        >
                            Clear Data & Reload
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
