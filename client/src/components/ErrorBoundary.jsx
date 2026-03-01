import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("App crashed:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="w-full max-w-lg rounded-2xl border border-primary/30 bg-primary/10 p-8 text-center">
            <h1 className="text-3xl font-semibold">Something went wrong</h1>
            <p className="text-gray-400 mt-2">An unexpected error occurred in the app.</p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2 rounded-md bg-primary hover:bg-primary-dull"
              >
                Reload
              </button>
              <button
                onClick={() => {
                  window.location.href = "/";
                }}
                className="px-5 py-2 rounded-md border border-primary/40"
              >
                Go Home
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
