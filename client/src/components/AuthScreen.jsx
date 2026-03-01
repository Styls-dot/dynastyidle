import React, { useState } from 'react';
import { api, setToken } from '../api';

export default function AuthScreen({ onAuth }) {
  const [mode,     setMode]    = useState('login');   // 'login' | 'register'
  const [login,    setLogin]   = useState('');
  const [username, setUsername] = useState('');
  const [email,    setEmail]   = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]   = useState('');
  const [loading,  setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      if (password !== confirm) { setError('Passwords do not match'); return; }
    }

    setLoading(true);
    try {
      let data;
      if (mode === 'login') {
        data = await api.login(login, password);
      } else {
        data = await api.register(username, email, password);
      }
      setToken(data.token);
      onAuth(data);
    } catch (err) {
      const msg = err.message || '';
      const jsonMatch = msg.match(/\{.*"error"\s*:\s*"([^"]+)"/);
      setError(jsonMatch ? jsonMatch[1] : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-panel">
        <div className="auth-title">Dynasty Idle</div>
        <div className="auth-subtitle">{mode === 'login' ? 'Sign In' : 'Create Account'}</div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <input
                className="auth-input"
                type="text"
                placeholder="Username (min. 3 characters)"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
              <input
                className="auth-input"
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </>
          )}

          {mode === 'login' && (
            <input
              className="auth-input"
              type="text"
              placeholder="Username or email"
              value={login}
              onChange={e => setLogin(e.target.value)}
              autoComplete="username"
              required
            />
          )}

          <input
            className="auth-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
          />

          {mode === 'register' && (
            <input
              className="auth-input"
              type="password"
              placeholder="Confirm password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
          )}

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? '…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-toggle">
          {mode === 'login' ? (
            <>No account?{' '}<button onClick={() => { setMode('register'); setError(''); }}>Create one</button></>
          ) : (
            <>Already have an account?{' '}<button onClick={() => { setMode('login'); setError(''); }}>Sign in</button></>
          )}
        </div>
      </div>
    </div>
  );
}
