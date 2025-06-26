import * as React from 'react';

/**
 * Enhanced error reporting utility using React 19's captureOwnerStack
 */

// Global error handler with owner stack capture
export const setupEnhancedErrorReporting = () => {
  if (process.env.NODE_ENV !== 'production') {
    const originalConsoleError = console.error;
    
    console.error = function enhancedConsoleError(...args) {
      // Call original console.error first
      originalConsoleError.apply(console, args);
      
      // Capture owner stack if available
      const ownerStack = React.captureOwnerStack?.();
      
      if (ownerStack) {
        console.group('🔍 Component Owner Stack:');
        console.log(ownerStack);
        console.groupEnd();
      }
      
      // You could also send this to an error reporting service
      reportError({
        message: args[0],
        ownerStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    };
  }
};

// Error reporting function (could integrate with Sentry, LogRocket, etc.)
const reportError = (errorInfo) => {
  // In development, just log to console
  if (process.env.NODE_ENV !== 'production') {
    console.log('📊 Error Report:', errorInfo);
  }
  
  // In production, you would send to your error reporting service
  // Example: Sentry.captureException(errorInfo);
};

// Hook for capturing owner stack in components
export const useOwnerStackDebug = (componentName) => {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      const ownerStack = React.captureOwnerStack?.();
      if (ownerStack) {
        console.log(`🏗️ ${componentName} Owner Stack:`, ownerStack);
      }
    }
  }, [componentName]);
};

// Error boundary with enhanced reporting
export class EnhancedErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const ownerStack = React.captureOwnerStack?.();
    
    const enhancedErrorInfo = {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      ownerStack,
      props: this.props,
      timestamp: new Date().toISOString()
    };
    
    console.error('🚨 Enhanced Error Boundary Caught Error:', enhancedErrorInfo);
    
    // Report to error service
    reportError(enhancedErrorInfo);
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(enhancedErrorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error);
      }
      
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary>Error Details</summary>
            {this.state.error?.toString()}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}