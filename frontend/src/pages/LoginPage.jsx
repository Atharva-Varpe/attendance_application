import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';

import { useAuth } from '../context/useAuth.js';
import './styles/_login.scss';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('admin@company.com');
  const [password, setPassword] = useState('admin123');
  const [err, setErr] = useState('');
  const navigate = useNavigate();
  const formRef = useRef(null);

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

  const header = <div className="login-title">Welcome back</div>;
  const subTitle = <span className="login-subtitle">Sign in to continue</span>;

  return (
    <div className="login-page">
      <Card title={header} subTitle={subTitle} className="login-card shadow-2">
        <form ref={formRef} onSubmit={onSubmit} className="p-fluid p-formgrid p-grid">
          <div className="p-field p-col-12">
            <label htmlFor="email" className="p-mb-2">Email</label>
            <InputText id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="p-field p-col-12">
            <label htmlFor="password" className="p-mb-2">Password</label>
            <Password id="password" toggleMask feedback={false} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            <small className="p-text-secondary">Admin: admin@company.com / admin123 — Employees: email / employee123</small>
          </div>

          {err ? (
            <div className="p-col-12 p-mt-2">
              <Message severity="error" text={err} />
            </div>
          ) : null}

          <div className="p-col-12 p-mt-3">
            <Button type="submit" label={loading ? 'Signing in...' : 'Login'} loading={loading} />
          </div>
        </form>
      </Card>
    </div>
  );
}
