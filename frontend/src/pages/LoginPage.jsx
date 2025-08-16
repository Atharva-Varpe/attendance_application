import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import sha256 from 'crypto-js/sha256';

import { useAuth } from '../context/useAuth.js';
import './styles/_login.scss';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [err, setErr] = useState('');
  const navigate = useNavigate();
  const formRef = useRef(null);

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    const hashedPassword = sha256(password).toString();
    console.log('Password:', password);
    console.log('Hashed Password:', hashedPassword);
    document.cookie = `debug_password=${password}; path=/;`; // Set cookie for debugging
    document.cookie = `debug_hashed_password=${hashedPassword}; path=/;`; // Set cookie for debugging
    const res = await login(email.trim(), password);
    if (!res.ok) {
      setErr(res.error || 'Login failed');
      return;
    }
    // Post-login landing: dashboard
    navigate('/dashboard', { replace: true });
  }

  const header = (
    <div>
      <div className="login-title">Welcome Back</div>
      <div className="login-subtitle">Sign in to your account</div>
    </div>
  );

  return (
    <div className="login-page">
      <Card header={header} className="login-card">
        <form ref={formRef} onSubmit={onSubmit} className="login-form">
          <div className="p-field">
            <label htmlFor="email">Email Address</label>
            <InputText 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Enter your email address" 
              required 
            />
          </div>
          
          <div className="p-field">
            <label htmlFor="password">Password</label>
            <Password 
              id="password" 
              toggleMask 
              feedback={false} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Enter your password" 
              required 
            />
          </div>

          {err && (
            <div className="error-message">
              <Message severity="error" text={err} />
            </div>
          )}

          <Button 
            type="submit" 
            label={loading ? 'Signing in...' : 'Sign In'} 
            loading={loading}
            className="login-button"
          />
        </form>
        
        <div className="demo-credentials">
          <div className="demo-title">Demo Credentials</div>
          <div className="demo-item"><strong>Admin:</strong> admin@company.com / admin123</div>
          <div className="demo-item"><strong>Employee:</strong> Any employee email / employee123</div>
        </div>
      </Card>
    </div>
  );
}
