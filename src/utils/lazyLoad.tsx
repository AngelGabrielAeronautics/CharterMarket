// @ts-nocheck
'use client';

import React, { lazy, Suspense } from 'react';

interface LazyComponentOptions {
  fallback?: React.ReactNode;
  errorBoundary?: boolean;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps, 
  { hasError: boolean; error: Error | null }
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-fallback p-4 border border-red-300 bg-red-50 rounded-md">
          <h3 className="text-red-700 font-medium mb-1">Something went wrong</h3>
          <p className="text-red-600 text-sm">
            {this.state.error?.message || 'Failed to load component'}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

const DefaultLoadingFallback = () => (
  <div className="loading-fallback flex items-center justify-center p-4 h-full w-full min-h-[100px]">
    <div className="animate-pulse flex space-x-2">
      <div className="rounded-full bg-slate-200 h-3 w-3"></div>
      <div className="rounded-full bg-slate-200 h-3 w-3"></div>
      <div className="rounded-full bg-slate-200 h-3 w-3"></div>
    </div>
  </div>
);

export function createLazyComponent<T extends object>(
  importFactory: () => Promise<{ default: React.ComponentType<T> }>,
  options: LazyComponentOptions = {}
) {
  const LazyComponent = lazy(importFactory);
  
  const fallback = options.fallback || <DefaultLoadingFallback />;
  
  return function LazyLoadedComponent(props: T) {
    const component = (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
    
    return options.errorBoundary ? (
      <ErrorBoundary fallback={
        <div className="error-fallback p-4 border border-red-300 bg-red-50 rounded-md">
          <h3 className="text-red-700 font-medium mb-1">Failed to load component</h3>
          <button 
            onClick={() => window.location.reload()}
            className="text-red-600 text-sm underline"
          >
            Reload page
          </button>
        </div>
      }>
        {component}
      </ErrorBoundary>
    ) : component;
  };
}

// Example usage:
// const LazyChart = createLazyComponent(() => import('../components/Chart'), {
//   errorBoundary: true,
//   fallback: <div>Loading chart...</div>
// }); 