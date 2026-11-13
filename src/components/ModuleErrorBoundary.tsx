import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  moduleName?: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ModuleErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[${this.props.moduleName || "Module"}] Error caught by boundary:`, error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[300px] w-full p-6 flex flex-col items-center justify-center text-center bg-card/60 backdrop-blur rounded-2xl border border-destructive/20 my-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold tracking-tight mb-1">
            {this.props.moduleName ? `${this.props.moduleName} Interrupted` : "Something went wrong"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-5">
            An unexpected error occurred in this section. Other parts of Sha-Verse are working normally.
          </p>
          <Button onClick={this.handleRetry} variant="outline" className="gap-2 touch-target">
            <RefreshCw className="w-4 h-4" /> Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ModuleErrorBoundary;
