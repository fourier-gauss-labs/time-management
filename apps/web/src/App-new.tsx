import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authService, type User } from './services/auth';
import { Layout } from './components/layout/Layout';
import { SettingsPage } from './pages/SettingsPage';
import { ReviewPage } from './pages/ReviewPage';
import { DriversPage } from './pages/DriversPage';
import { HomePage } from './pages/HomePage';
import './index.css';

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
    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      authService
        .handleCallback(code)
        .then(() => {
          // Clear URL parameters
          window.history.replaceState({}, document.title, '/');
          const authUser = authService.getUser();
          setUser(authUser);
          // Store token for API calls
          if (authUser) {
            localStorage.setItem('authToken', authUser.idToken);
          }
        })
        .catch(err => {
          console.error('Authentication failed:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // Check if already authenticated
      const authUser = authService.getUser();
      setUser(authUser);
      if (authUser) {
        localStorage.setItem('authToken', authUser.idToken);
      }
      setIsLoading(false);
    }
  }, []);

  const handleLogin = () => {
    authService.login();
  };

  const handleLogout = () => {
    authService.logout();
    localStorage.removeItem('authToken');
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-4xl font-bold">Time Management</h1>
        <p className="text-muted-foreground">Strategic planning for intentional living</p>
        <button
          onClick={handleLogin}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
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
