import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  /** Optional custom fallback; defaults to the built-in error card. */
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * React error boundary that catches render-phase exceptions in its subtree and
 * displays a recovery UI instead of a blank page.
 *
 * Must be a class component — React does not yet support error boundaries as
 * function components (getDerivedStateFromError / componentDidCatch are
 * class-only lifecycle methods).
 *
 * Placement strategy:
 * - Wrap the entire <Board> to catch runtime failures in any column or card.
 * - You can also add finer-grained boundaries per Column if you want the rest
 *   of the board to remain usable when a single column crashes.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center min-h-[300px] p-8 bg-red-50 border border-red-200 rounded-xl m-4 text-center"
        >
          <AlertTriangle size={40} className="text-red-400 mb-4" />
          <h2 className="text-lg font-semibold text-red-700 mb-2">Something went wrong</h2>
          <p className="text-sm text-red-600 mb-1 max-w-md">
            {this.state.error?.message ?? 'An unexpected error occurred while rendering.'}
          </p>
          <p className="text-xs text-red-400 mb-6">
            Your task data is safe — this is a display error only.
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium text-sm transition-colors"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
