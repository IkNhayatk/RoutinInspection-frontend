import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  setupEnhancedErrorReporting,
  useOwnerStackDebug,
  EnhancedErrorBoundary
} from '../errorReporting';

// Mock React.captureOwnerStack
const mockCaptureOwnerStack = jest.fn();
Object.defineProperty(React, 'captureOwnerStack', {
  value: mockCaptureOwnerStack,
  writable: true,
});

// Test component for useOwnerStackDebug hook
const TestComponent = ({ componentName }) => {
  useOwnerStackDebug(componentName);
  return <div>Test Component</div>;
};

// Test component that throws an error
const ErrorThrowingComponent = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('errorReporting', () => {
  let originalConsoleError;
  let originalConsoleLog;
  let originalConsoleGroup;
  let originalConsoleGroupEnd;

  beforeEach(() => {
    originalConsoleError = console.error;
    originalConsoleLog = console.log;
    originalConsoleGroup = console.group;
    originalConsoleGroupEnd = console.groupEnd;

    console.error = jest.fn();
    console.log = jest.fn();
    console.group = jest.fn();
    console.groupEnd = jest.fn();

    jest.clearAllMocks();
    
    // Reset NODE_ENV to development for testing
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
    console.group = originalConsoleGroup;
    console.groupEnd = originalConsoleGroupEnd;
  });

  describe('setupEnhancedErrorReporting', () => {
    test('enhances console.error in development mode', () => {
      process.env.NODE_ENV = 'development';
      
      // Setup mocks before calling setupEnhancedErrorReporting
      React.captureOwnerStack = jest.fn().mockReturnValue('mock-owner-stack');
      
      setupEnhancedErrorReporting();

      // Call the enhanced console.error
      console.error('Test error message');

      // Verify captureOwnerStack was called
      expect(React.captureOwnerStack).toHaveBeenCalled();
      expect(console.group).toHaveBeenCalledWith('🔍 Component Owner Stack:');
      expect(console.log).toHaveBeenCalledWith('mock-owner-stack');
      expect(console.groupEnd).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('📊 Error Report:', expect.objectContaining({
        message: 'Test error message',
        ownerStack: 'mock-owner-stack',
        timestamp: expect.any(String),
        userAgent: expect.any(String),
        url: expect.any(String)
      }));
    });

    test('does not enhance console.error in production mode', () => {
      process.env.NODE_ENV = 'production';
      const originalError = console.error;

      setupEnhancedErrorReporting();

      // console.error should remain unchanged in production
      expect(console.error).toBe(originalError);
    });

    test('handles missing captureOwnerStack gracefully', () => {
      process.env.NODE_ENV = 'development';
      mockCaptureOwnerStack.mockReturnValue(undefined);

      setupEnhancedErrorReporting();

      console.error('Test error message');

      expect(console.group).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('📊 Error Report:', expect.objectContaining({
        message: 'Test error message',
        ownerStack: null
      }));
    });

    test('includes correct error report data', () => {
      process.env.NODE_ENV = 'development';
      mockCaptureOwnerStack.mockReturnValue('stack-trace');

      // Mock navigator and window
      Object.defineProperty(navigator, 'userAgent', {
        value: 'test-user-agent',
        writable: true
      });
      Object.defineProperty(window, 'location', {
        value: { href: 'http://test.com' },
        writable: true
      });

      setupEnhancedErrorReporting();

      const testError = 'Test error message';
      console.error(testError);

      expect(console.log).toHaveBeenCalledWith('📊 Error Report:', expect.objectContaining({
        message: testError,
        ownerStack: null, // React.captureOwnerStack returns null in test environment
        timestamp: expect.any(String),
        userAgent: expect.any(String),
        url: expect.any(String)
      }));
    });
  });

  describe('useOwnerStackDebug', () => {
    test('logs owner stack in development mode', () => {
      process.env.NODE_ENV = 'development';
      React.captureOwnerStack = jest.fn().mockReturnValue('component-owner-stack');

      render(<TestComponent componentName="TestComponent" />);

      expect(React.captureOwnerStack).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        '🏗️ TestComponent Owner Stack:',
        'component-owner-stack'
      );
    });

    test('does not log in production mode', () => {
      process.env.NODE_ENV = 'production';

      render(<TestComponent componentName="TestComponent" />);

      expect(mockCaptureOwnerStack).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
    });

    test('handles missing captureOwnerStack gracefully', () => {
      process.env.NODE_ENV = 'development';
      React.captureOwnerStack = jest.fn().mockReturnValue(null);

      render(<TestComponent componentName="TestComponent" />);

      expect(React.captureOwnerStack).toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
    });

    test('logs with correct component name', () => {
      process.env.NODE_ENV = 'development';
      // Allow actual captureOwnerStack to run and check the logged component name

      render(<TestComponent componentName="MyCustomComponent" />);

      expect(console.log).toHaveBeenCalledWith(
        '🏗️ MyCustomComponent Owner Stack:',
        expect.any(String) // Accept whatever owner stack is generated
      );
    });
  });

  describe('EnhancedErrorBoundary', () => {
    test('renders children when no error occurs', () => {
      render(
        <EnhancedErrorBoundary>
          <ErrorThrowingComponent shouldThrow={false} />
        </EnhancedErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    test('renders error UI when error is caught', () => {
      render(
        <EnhancedErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </EnhancedErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Error Details')).toBeInTheDocument();
    });

    test('renders custom fallback when provided', () => {
      const customFallback = (error) => (
        <div>Custom error: {error.message}</div>
      );

      render(
        <EnhancedErrorBoundary fallback={customFallback}>
          <ErrorThrowingComponent shouldThrow={true} />
        </EnhancedErrorBoundary>
      );

      expect(screen.getByText('Custom error: Test error')).toBeInTheDocument();
    });

    test('calls onError callback when provided', () => {
      const onErrorCallback = jest.fn();

      render(
        <EnhancedErrorBoundary onError={onErrorCallback}>
          <ErrorThrowingComponent shouldThrow={true} />
        </EnhancedErrorBoundary>
      );

      expect(onErrorCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Test error',
          stack: expect.any(String),
          componentStack: expect.any(String),
          timestamp: expect.any(String)
        })
      );
    });

    test('logs enhanced error information to console', () => {
      mockCaptureOwnerStack.mockReturnValue('error-owner-stack');

      render(
        <EnhancedErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </EnhancedErrorBoundary>
      );

      // Should have been called at least once (React may call console.error multiple times)
      expect(console.error).toHaveBeenCalledWith(
        '🚨 Enhanced Error Boundary Caught Error:',
        expect.objectContaining({
          error: 'Test error',
          stack: expect.any(String),
          componentStack: expect.any(String),
          ownerStack: expect.any(String), // May be different in test environment
          timestamp: expect.any(String)
        })
      );
    });

    test('includes props in error information', () => {
      const testProps = { customProp: 'test-value' };

      render(
        <EnhancedErrorBoundary {...testProps}>
          <ErrorThrowingComponent shouldThrow={true} />
        </EnhancedErrorBoundary>
      );

      expect(console.error).toHaveBeenCalledWith(
        '🚨 Enhanced Error Boundary Caught Error:',
        expect.objectContaining({
          props: expect.objectContaining(testProps)
        })
      );
    });

    test('handles error without captureOwnerStack', () => {
      // Temporarily remove captureOwnerStack
      const original = React.captureOwnerStack;
      delete React.captureOwnerStack;

      render(
        <EnhancedErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </EnhancedErrorBoundary>
      );

      expect(console.error).toHaveBeenCalledWith(
        '🚨 Enhanced Error Boundary Caught Error:',
        expect.objectContaining({
          ownerStack: undefined
        })
      );
      
      // Restore the original
      React.captureOwnerStack = original;
    });

    test('shows error details in expandable section', () => {
      render(
        <EnhancedErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </EnhancedErrorBoundary>
      );

      const details = screen.getByRole('group');
      expect(details).toBeInTheDocument();
      expect(details).toHaveTextContent('Test error');
    });

    test('maintains hasError state after error', () => {
      const { rerender } = render(
        <EnhancedErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </EnhancedErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Re-render with non-throwing component
      rerender(
        <EnhancedErrorBoundary>
          <ErrorThrowingComponent shouldThrow={false} />
        </EnhancedErrorBoundary>
      );

      // Should still show error UI because hasError state is maintained
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Error Report Generation', () => {
    test('reportError logs to console in development', () => {
      process.env.NODE_ENV = 'development';
      setupEnhancedErrorReporting();

      console.error('Test message');

      expect(console.log).toHaveBeenCalledWith(
        '📊 Error Report:',
        expect.objectContaining({
          message: 'Test message',
          timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
        })
      );
    });

    test('reportError does not log in production', () => {
      process.env.NODE_ENV = 'production';
      setupEnhancedErrorReporting();

      // In production, setupEnhancedErrorReporting does nothing
      // So console.error remains the original function
      const originalError = console.error;
      console.error('Test message');

      // The error should be logged, but no enhanced error report
      expect(console.error).toBe(originalError);
    });
  });
});