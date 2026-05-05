import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-8" role="alert">
          <div className="text-center">
            <h1 className="font-heading text-accent-red mb-2 text-2xl">
              Something went wrong
            </h1>
            <p className="text-text-secondary mb-4 text-sm">
              Tab Out encountered an unexpected error.
            </p>
            <button
              type="button"
              className="rounded-chip bg-accent-blue focus-visible:ring-accent-blue/40 min-h-11 cursor-pointer px-4 py-2 text-sm text-white transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:outline-none"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
