'use client';

/**
 * This file contains lazy-loaded component definitions.
 * These components will be code-split and only loaded when needed,
 * improving initial bundle size and loading performance.
 */
import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Box, Typography, Button, CircularProgress } from '@mui/material';

// Fallback loading UI component
const LoadingFallback = () => (
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    p: 2 
  }}>
    <CircularProgress size={32} />
  </Box>
);

// Error boundary component for catching errors in lazy-loaded components
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to monitoring service
    console.error('Lazy component error:', error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <Box sx={{ 
          p: 2, 
          border: '1px solid', 
          borderColor: 'error.light', 
          bgcolor: 'error.lighter', 
          borderRadius: 2
        }}>
          <Typography variant="subtitle1" color="error.main" fontWeight="medium">
            Something went wrong
          </Typography>
          <Typography variant="body2" color="error.main">
            The component could not be loaded.
          </Typography>
          <Button 
            onClick={() => this.setState({ hasError: false })}
            variant="text"
            color="error"
            size="small"
            sx={{ mt: 1 }}
          >
            Try again
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Lazy-loaded components
// These will only be loaded when the component is rendered
export const LazyChart = dynamic(
  () => import('./Charts/Chart'),
  {
    loading: () => <LoadingFallback />,
    ssr: false, // Disable server-side rendering for heavy client-side components
  }
);

export const LazyDataGrid = dynamic(
  () => import('./DataGrid/DataGrid'),
  {
    loading: () => <LoadingFallback />,
    ssr: true, // Enable server-side rendering for SEO and initial render
  }
);

export const LazyPdfViewer = dynamic(
  () => import('./PdfViewer'),
  {
    loading: () => <LoadingFallback />,
    ssr: false, // PDF viewers typically require browser APIs
  }
);

export const LazyMap = dynamic(
  () => import('./Map/Map'),
  {
    loading: () => <LoadingFallback />,
    ssr: false, // Maps often require browser APIs
  }
);

export const LazyVideoPlayer = dynamic(
  () => import('./VideoPlayer'),
  {
    loading: () => <LoadingFallback />,
    ssr: false, // Video players often need browser APIs
  }
);

// Usage example with Suspense and ErrorBoundary
export const LazyComponent = ({ componentName, props = {} }: { componentName: string; props?: Record<string, unknown> }) => {
  // This is a factory pattern to dynamically load components by name
  const componentMap: Record<string, React.ComponentType<Record<string, unknown>>> = {
    'chart': LazyChart,
    'dataGrid': LazyDataGrid,
    'pdfViewer': LazyPdfViewer,
    'map': LazyMap,
    'videoPlayer': LazyVideoPlayer,
  };

  const Component = componentMap[componentName];
  
  if (!Component) {
    return <Typography variant="body1">Component "{componentName}" not found</Typography>;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Component {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}; 