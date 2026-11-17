import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] px-6 text-center">
          <div className="max-w-md border border-[#EAE4DC] bg-white p-8 space-y-4">
            <h1 className="font-display text-3xl font-medium text-[#1C1917]">
              Something went wrong
            </h1>
            <p className="text-sm text-[#6B6560]">
              Please reload the page to restore your shopping session.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-[#1C1917] text-white text-sm font-medium hover:bg-[#332E2A]"
            >
              Reload Storefront
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
