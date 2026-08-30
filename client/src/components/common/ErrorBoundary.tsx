import { Component, type ErrorInfo, type ReactNode } from "react";
import { ArrowCounterClockwiseIcon, HouseIcon, WarningOctagonIcon } from "@phosphor-icons/react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
          <div className="w-full max-w-md">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 border border-rose-100 shadow-sm mb-5">
              <WarningOctagonIcon size={32} weight="duotone" />
            </div>

            <span className="inline-block rounded-md bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-rose-700">
              Application Error
            </span>

            <h1 className="mt-3 text-xl font-bold tracking-tight text-slate-900">
              Something went wrong
            </h1>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              An unexpected error occurred while rendering this page. This has been logged automatically.
              Please try again or return to the dashboard.
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-100 p-3 text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Error Details (dev only)
                </p>
                <pre className="whitespace-pre-wrap break-words font-mono text-xs text-rose-700">
                  {this.state.error.message}
                </pre>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleRetry}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
              >
                <ArrowCounterClockwiseIcon size={14} /> Try Again
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-sky-700"
              >
                <HouseIcon size={14} /> Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
