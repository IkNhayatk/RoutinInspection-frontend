import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

export const renderWithRouter = (component, authValue = {
  isAdmin: true,
  isLoggedIn: true,
  user: { id: 1, userName: 'Test User' }
}) => {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        <AuthContext.Provider value={authValue}>
          {component}
        </AuthContext.Provider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export * from '@testing-library/react';