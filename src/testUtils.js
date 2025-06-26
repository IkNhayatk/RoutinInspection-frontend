import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Enhanced error reporting for tests
const captureTestError = (error, componentName) => {
  if (process.env.NODE_ENV !== 'production') {
    const ownerStack = React.captureOwnerStack?.();
    console.error(`Test Error in ${componentName}:`, {
      error: error.message,
      ownerStack,
      timestamp: new Date().toISOString()
    });
  }
};

// Error Boundary for capturing render errors with owner stack
class TestErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      const ownerStack = React.captureOwnerStack?.();
      console.error('Test Render Error:', {
        error: error.message,
        componentStack: errorInfo.componentStack,
        ownerStack,
        testComponent: this.props.testName || 'Unknown'
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return <div data-testid="test-error">Test component failed to render</div>;
    }
    return this.props.children;
  }
}

export const renderWithRouter = (component, authValue = {
  isAdmin: true,
  isLoggedIn: true,
  user: { id: 1, userName: 'Test User', priorityLevel: 3 }
}, options = {}) => {
  const { enableErrorBoundary = true, testName = 'Unknown' } = options;
  
  const wrappedComponent = enableErrorBoundary ? (
    <TestErrorBoundary testName={testName}>
      {component}
    </TestErrorBoundary>
  ) : component;

  return render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <AuthContext.Provider value={authValue}>
          {wrappedComponent}
        </AuthContext.Provider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

// Utility for debugging component hierarchy in tests
export const debugOwnerStack = (context = 'Test Debug') => {
  if (process.env.NODE_ENV !== 'production') {
    const ownerStack = React.captureOwnerStack?.();
    if (ownerStack) {
      console.log(`🔍 ${context} - Owner Stack:`, ownerStack);
    } else {
      console.log(`🔍 ${context} - No Owner Stack available (outside React render cycle)`);
    }
    return ownerStack;
  }
  return null;
};

// Enhanced renderWithRouter that can capture debug info
export const renderWithDebug = (component, authValue, options = {}) => {
  const { debug = false, ...restOptions } = options;
  
  if (debug) {
    console.log('🧪 Rendering component with debug info...');
    debugOwnerStack('Pre-render');
  }
  
  return renderWithRouter(component, authValue, restOptions);
};

// Utility function to expand actions section in UserManagement tests
export const expandActionsSection = async () => {
  const { screen, fireEvent, waitFor } = await import('@testing-library/react');
  
  try {
    const toggleButton = screen.getByTitle('展開操作選項');
    fireEvent.click(toggleButton);
    
    // Wait for the section to expand
    await waitFor(() => {
      expect(screen.getByText('下載範例')).toBeInTheDocument();
    });
  } catch (error) {
    console.warn('Could not expand actions section:', error.message);
  }
};

// Export the error capture function for manual use in tests
export { captureTestError };

export * from '@testing-library/react';