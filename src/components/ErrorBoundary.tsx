import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6" data-testid="error-boundary-fallback">
          <div className="max-w-md w-full rounded-2xl border border-destructive/20 bg-card p-6 text-center shadow-lg space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-foreground">Ocurrió un error inesperado</h2>
              <p className="text-xs text-muted-foreground">
                La aplicación encontró un problema al renderizar esta sección.
              </p>
            </div>
            {this.state.error?.message && (
              <div className="rounded-md bg-secondary/60 p-2.5 text-left font-mono text-[11px] text-muted-foreground break-all max-h-24 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={this.handleReset} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Reintentar
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  window.location.href = "/";
                }}
                className="gap-1.5"
              >
                <Home className="h-3.5 w-3.5" />
                Ir al Inicio
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
