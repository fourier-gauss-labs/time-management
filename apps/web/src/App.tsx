import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { SettingsPage } from './pages/SettingsPage';
import { ReviewPage } from './pages/ReviewPage';
import { DriversPage } from './pages/DriversPage';
import { authService, type User } from './services/auth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for OAuth callback
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      authService
        .handleCallback(code)
        .then(() => {
          const tokens = authService.getTokens();
          const authUser = authService.getUser();
          if (tokens && authUser) {
            localStorage.setItem('authToken', tokens.idToken);
            setUser(authUser);
          }
          window.history.replaceState({}, '', window.location.pathname);
        })
        .catch(error => {
          console.error('Auth callback failed:', error);
        })
        .finally(() => setIsLoading(false));
    } else {
      // Check for existing authentication
      const authUser = authService.getUser();
      const tokens = authService.getTokens();
      if (authUser && tokens) {
        localStorage.setItem('authToken', tokens.idToken);
        setUser(authUser);
      }
      setIsLoading(false);
    }
  }, []);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h1 className="text-4xl font-bold">Time Management</h1>
        <p className="text-muted-foreground">Sign in to manage your drivers and weekly reviews</p>
        <button
          onClick={() => authService.login()}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout user={user} onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/drivers" element={<DriversPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
