'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginAction } from '@/actions/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await loginAction(email, password);
      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#050505',
      color: '#fff',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes gridPulse {
          0%, 100% { opacity: 0.03; }
          50% { opacity: 0.07; }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .login-card {
          animation: fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
        }

        .input-field {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.12);
          padding: 0.875rem 1rem;
          color: #fff;
          font-size: 0.875rem;
          transition: border-color 0.3s, background 0.3s;
          outline: none;
          backdrop-filter: blur(8px);
        }

        .input-field::placeholder {
          color: rgba(255,255,255,0.2);
        }

        .input-field:focus {
          border-color: rgba(255,255,255,0.35);
          background: rgba(255,255,255,0.05);
        }

        .submit-btn {
          width: 100%;
          padding: 1rem;
          background: #fff;
          color: #000;
          border: none;
          font-weight: 900;
          font-size: 0.875rem;
          letter-spacing: 0.12em;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }

        .submit-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent);
          transform: translateX(-100%);
          transition: transform 0.5s;
        }

        .submit-btn:hover::before {
          transform: translateX(100%);
        }

        .submit-btn:hover:not(:disabled) {
          background: rgba(255,255,255,0.88);
          transform: translateY(-1px);
          box-shadow: 0 12px 40px rgba(255,255,255,0.12);
        }

        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .back-link {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.3);
          text-decoration: none;
          letter-spacing: 0.1em;
          transition: color 0.3s;
        }

        .back-link:hover {
          color: rgba(255,255,255,0.7);
        }
      `}</style>

      {/* Grid Background */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        animation: 'gridPulse 4s ease-in-out infinite',
      }} />

      {/* Noise */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'none',
        opacity: 0.03,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: '150px 150px',
      }} />

      {/* Card */}
      <div className="login-card" style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: '26rem',
        margin: '0 1.5rem',
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
          <Link href="/">
            <img
              src="/Images/BW.png"
              alt="Hackoverflow"
              style={{
                width: '72px',
                height: '72px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 16px rgba(255,255,255,0.15))',
                transition: 'filter 0.3s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = 'drop-shadow(0 0 24px rgba(255,255,255,0.3))')}
              onMouseLeave={(e) => (e.currentTarget.style.filter = 'drop-shadow(0 0 16px rgba(255,255,255,0.15))')}
            />
          </Link>
        </div>

        {/* Form Card */}
        <div style={{
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '2.5rem',
          background: 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(24px)',
        }}>
          {/* Corner accents */}
          {[
            { top: -1, left: -1, borderTop: '2px solid rgba(255,255,255,0.3)', borderLeft: '2px solid rgba(255,255,255,0.3)' },
            { top: -1, right: -1, borderTop: '2px solid rgba(255,255,255,0.3)', borderRight: '2px solid rgba(255,255,255,0.3)' },
            { bottom: -1, left: -1, borderBottom: '2px solid rgba(255,255,255,0.3)', borderLeft: '2px solid rgba(255,255,255,0.3)' },
            { bottom: -1, right: -1, borderBottom: '2px solid rgba(255,255,255,0.3)', borderRight: '2px solid rgba(255,255,255,0.3)' },
          ].map((s, i) => (
            <div key={i} style={{ position: 'absolute', width: 12, height: 12, ...s }} />
          ))}

          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            marginBottom: '0.375rem',
          }}>
            WELCOME BACK
          </h1>
          <p style={{
            fontSize: '0.8rem',
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.05em',
            marginBottom: '2rem',
          }}>
            Login to access your dashboard
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.65rem',
                color: 'rgba(255,255,255,0.4)',
                letterSpacing: '0.2em',
                marginBottom: '0.5rem',
              }}>
                EMAIL ADDRESS
              </label>
              <input
                className="input-field"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.65rem',
                color: 'rgba(255,255,255,0.4)',
                letterSpacing: '0.2em',
                marginBottom: '0.5rem',
              }}>
                PASSWORD
              </label>
              <input
                className="input-field"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div style={{
                padding: '0.75rem 1rem',
                border: '1px solid rgba(255,80,80,0.3)',
                background: 'rgba(255,80,80,0.06)',
                fontSize: '0.75rem',
                color: '#ff6b6b',
                letterSpacing: '0.03em',
              }}>
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="submit-btn"
              style={{ marginTop: '0.5rem' }}
            >
              {loading ? 'LOGGING IN...' : 'LOGIN →'}
            </button>
          </form>
        </div>

        {/* Back link */}
        <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
          <Link href="/" className="back-link">
            ← BACK TO HOME
          </Link>
        </div>
      </div>
    </div>
  );
}