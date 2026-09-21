import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button, Card } from "./common";

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
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in SnapFind Desktop:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = "#/";
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-base p-6 select-none">
          <Card className="max-w-lg w-full p-8 border-bad/30 bg-panel text-center">
            <div className="inline-flex h-12 w-12 rounded-2xl bg-bad/10 text-bad items-center justify-center text-2xl font-bold mb-4">
              ⚠️
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-xs text-dim mb-4">
              SnapFind Desktop encountered an unexpected error while rendering this view.
            </p>
            {this.state.error && (
              <div className="p-3 mb-6 rounded-lg bg-panel2 border border-hairline text-left overflow-auto max-h-36">
                <code className="text-[11px] font-mono text-bad">
                  {this.state.error.message || String(this.state.error)}
                </code>
              </div>
            )}
            <div className="flex justify-center gap-3">
              <Button variant="primary" size="md" onClick={this.handleReset}>
                Reload Application
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
