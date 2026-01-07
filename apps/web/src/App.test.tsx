import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the app header', () => {
    render(<App />);
    const headingElement = screen.getByRole('heading', { name: /Time Management/i });
    expect(headingElement).toBeInTheDocument();
  });

  it('renders the login button when not authenticated', () => {
    render(<App />);
    const loginButton = screen.getByRole('button', { name: /Log In/i });
    expect(loginButton).toBeInTheDocument();
  });
});
