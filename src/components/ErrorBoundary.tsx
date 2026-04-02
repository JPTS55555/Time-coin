import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
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
      let errorDetails = null;
      try {
        if (this.state.error?.message.startsWith('{')) {
          errorDetails = JSON.parse(this.state.error.message);
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Oops, something went wrong.</h2>
            <p className="text-gray-600 mb-4">We encountered an unexpected error. Please try refreshing the page.</p>
            
            {errorDetails ? (
              <div className="bg-red-50 p-4 rounded-md overflow-auto text-sm font-mono text-red-800">
                <p><strong>Operation:</strong> {errorDetails.operationType}</p>
                <p><strong>Path:</strong> {errorDetails.path}</p>
                <p><strong>Error:</strong> {errorDetails.error}</p>
              </div>
            ) : (
              <div className="bg-red-50 p-4 rounded-md overflow-auto text-sm font-mono text-red-800">
                {this.state.error?.message || "Unknown error occurred"}
              </div>
            )}
            
            <button
              className="mt-6 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
