import { useEffect, useState } from 'react';
import './App.css';
import { authService, type User } from './services/auth';

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
          setUser(authService.getUser());
        })
        .catch(err => {
          console.error('Authentication failed:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // Check if already authenticated
      setUser(authService.getUser());
      setIsLoading(false);
    }
  }, []);

  const handleLogin = () => {
    authService.login();
  };

  const handleLogout = () => {
    authService.logout();
  };

  if (isLoading) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>Time Management</h1>
        </header>
        <main className="app-main">
          <p>Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Time Management</h1>
        {user && (
          <div>
            <span>Welcome, {user.email}</span>
            <button onClick={handleLogout} style={{ marginLeft: '1rem' }}>
              Log Out
            </button>
          </div>
        )}
      </header>
      <main className="app-main">
        {user ? (
          <div>
            <p>You are authenticated!</p>
            <p>User ID: {user.sub}</p>
            <p>Email: {user.email}</p>
          </div>
        ) : (
          <div>
            <p>Welcome. This is the beginning of a time management and focus app.</p>
            <button onClick={handleLogin}>Log In</button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
