import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
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
    console.error("Uncaught application error:", error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#0B1220] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xl font-bold">
              !
            </div>
            <h1 className="text-xl font-bold font-serif text-white">
              {this.props.fallbackTitle || "Something went wrong"}
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              An unexpected error occurred while rendering the portfolio. Please refresh or try again.
            </p>
            {this.state.error?.message && (
              <pre className="text-[10px] text-zinc-500 bg-black/40 p-3 rounded-lg overflow-x-auto text-left max-h-32 border border-white/5">
                {this.state.error.message}
              </pre>
            )}
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => (window.location.href = "/")}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                Home
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 transition-all"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

