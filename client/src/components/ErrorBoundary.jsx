import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-2xl">!</div>
        <h1 className="text-xl font-semibold text-slate-900">Something went wrong</h1>
        <p className="max-w-sm text-sm text-slate-500">
          The page could not be displayed. Reloading usually fixes this.
        </p>
        <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
          Reload the page
        </button>
      </div>
    );
  }
}
