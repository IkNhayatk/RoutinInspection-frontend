import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, useTheme } from '../ThemeContext';

// Setup global mocks at module level
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

const mockMatchMedia = jest.fn();
const mockDocumentElement = {
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
  },
};

// Mock window globals before any tests run
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

Object.defineProperty(window, 'matchMedia', {
  value: mockMatchMedia,
  writable: true,
});

Object.defineProperty(window.document, 'documentElement', {
  value: mockDocumentElement,
  writable: true,
});

// Test component that uses the theme context
const TestComponent = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <button data-testid="toggle-button" onClick={toggleTheme}>
        Toggle Theme
      </button>
    </div>
  );
};

describe('ThemeContext', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockMatchMedia.mockReturnValue({ matches: false });
  });

  describe('ThemeProvider', () => {
    test('renders children correctly', () => {
      mockLocalStorage.getItem.mockReturnValue('light');

      render(
        <ThemeProvider>
          <div data-testid="child">Test Child</div>
        </ThemeProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    test('initializes with saved theme from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('dark');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('theme');
    });

    test('initializes with light theme when no saved theme and no system preference', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockMatchMedia.mockReturnValue({ matches: false });

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    });

    test('initializes with dark theme based on system preference', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockMatchMedia.mockReturnValue({ matches: true });

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });

    test('applies theme classes to document element on mount', () => {
      mockLocalStorage.getItem.mockReturnValue('dark');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('light');
      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('dark');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    test('saves theme to localStorage on theme change', () => {
      mockLocalStorage.getItem.mockReturnValue('light');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Initial save
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'light');

      // Toggle theme
      act(() => {
        screen.getByTestId('toggle-button').click();
      });

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    test('toggles theme from light to dark', () => {
      mockLocalStorage.getItem.mockReturnValue('light');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');

      act(() => {
        screen.getByTestId('toggle-button').click();
      });

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('light');
      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('dark');
    });

    test('toggles theme from dark to light', () => {
      mockLocalStorage.getItem.mockReturnValue('dark');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');

      act(() => {
        screen.getByTestId('toggle-button').click();
      });

      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
      expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('dark');
      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('light');
    });

    test('handles multiple rapid theme toggles', () => {
      mockLocalStorage.getItem.mockReturnValue('light');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Multiple rapid toggles
      act(() => {
        screen.getByTestId('toggle-button').click(); // light -> dark
        screen.getByTestId('toggle-button').click(); // dark -> light
        screen.getByTestId('toggle-button').click(); // light -> dark
      });

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    test('handles empty string as saved theme', () => {
      mockLocalStorage.getItem.mockReturnValue('');
      mockMatchMedia.mockReturnValue({ matches: true });

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Empty string should be treated as no saved theme, use system preference
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });

    test('handles invalid saved theme value', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-theme');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Should use the saved value even if it's invalid
      expect(screen.getByTestId('current-theme')).toHaveTextContent('invalid-theme');
    });
  });

  describe('useTheme hook', () => {
    test('returns theme context when used within ThemeProvider', () => {
      mockLocalStorage.getItem.mockReturnValue('light');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
      expect(screen.getByTestId('toggle-button')).toBeInTheDocument();
    });

    test('returns undefined when used outside ThemeProvider', () => {
      // Test using actual useTheme hook outside provider
      const TestErrorComponent = () => {
        const context = useTheme();
        return (
          <div>
            <div data-testid="context-value">{context ? 'found' : 'undefined'}</div>
          </div>
        );
      };

      render(<TestErrorComponent />);
      expect(screen.getByTestId('context-value')).toHaveTextContent('undefined');
    });

    test('provides correct context value structure', () => {
      mockLocalStorage.getItem.mockReturnValue('dark');

      const ContextConsumer = () => {
        const context = useTheme();
        
        return (
          <div>
            <div data-testid="context-theme">{context.theme}</div>
            <div data-testid="has-toggle-function">
              {typeof context.toggleTheme === 'function' ? 'true' : 'false'}
            </div>
            <div data-testid="context-keys">
              {Object.keys(context).join(',')}
            </div>
          </div>
        );
      };

      render(
        <ThemeProvider>
          <ContextConsumer />
        </ThemeProvider>
      );

      expect(screen.getByTestId('context-theme')).toHaveTextContent('dark');
      expect(screen.getByTestId('has-toggle-function')).toHaveTextContent('true');
      
      const contextKeys = screen.getByTestId('context-keys').textContent;
      expect(contextKeys).toContain('theme');
      expect(contextKeys).toContain('toggleTheme');
    });
  });

  describe('DOM manipulation', () => {
    test('removes opposite theme class and adds current theme class', () => {
      mockLocalStorage.getItem.mockReturnValue('light');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      // Initial render should set light theme
      expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('dark');
      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('light');

      // Clear previous calls
      mockDocumentElement.classList.remove.mockClear();
      mockDocumentElement.classList.add.mockClear();

      // Toggle to dark
      act(() => {
        screen.getByTestId('toggle-button').click();
      });

      expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('light');
      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('dark');
    });
  });

  describe('localStorage integration', () => {
    test('retrieves theme from localStorage on initialization', () => {
      mockLocalStorage.getItem.mockReturnValue('dark');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('theme');
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });

    test('saves theme to localStorage when theme changes', () => {
      mockLocalStorage.getItem.mockReturnValue('light');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Check initial save
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'light');

      // Toggle and check save
      act(() => {
        screen.getByTestId('toggle-button').click();
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    });
  });

  describe('System preference detection', () => {
    test('detects dark mode system preference', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockMatchMedia.mockReturnValue({ matches: true });

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });

    test('detects light mode system preference', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockMatchMedia.mockReturnValue({ matches: false });

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    });

    test('prioritizes saved theme over system preference', () => {
      mockLocalStorage.getItem.mockReturnValue('light');
      mockMatchMedia.mockReturnValue({ matches: true }); // System prefers dark

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Should use saved theme (light) instead of system preference (dark)
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    });
  });

  describe('Edge cases', () => {
    test('handles multiple theme providers', () => {
      mockLocalStorage.getItem.mockReturnValue('light');

      // This should work but inner provider would be independent
      render(
        <ThemeProvider>
          <ThemeProvider>
            <TestComponent />
          </ThemeProvider>
        </ThemeProvider>
      );

      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    });

    test('maintains theme state across re-renders', () => {
      mockLocalStorage.getItem.mockReturnValue('light');

      const { rerender } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');

      // Toggle theme
      act(() => {
        screen.getByTestId('toggle-button').click();
      });

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');

      // Re-render should maintain state
      rerender(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });
  });
});