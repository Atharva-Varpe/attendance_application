import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Login02 } from '../components/ui/login-02.jsx';
import { useAuth } from '../context/useAuth.js';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    const res = await login(email.trim(), password);
    if (!res.ok) {
      setErr(res.error || 'Login failed');
      return;
    }
    // Post-login landing: dashboard
    navigate('/dashboard', { replace: true });
  }

  return (
    <Login02
      onSubmit={onSubmit}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      loading={loading}
      error={err}
    />
  );
}
