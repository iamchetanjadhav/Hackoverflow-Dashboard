'use client';
import Link from 'next/link';
import { CSSProperties } from 'react';

type CSSVar = CSSProperties & { [key: `--${string}`]: string | number };

export default function HomePage() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#050505',
      color: '#fff',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: inherit; }

        @keyframes gridPulse {
          0%, 100% { opacity: 0.03; }
          50% { opacity: 0.07; }
        }

        @keyframes glitchA {
          0%, 90%, 100% { clip-path: inset(0 0 100% 0); transform: translateX(0); }
          92% { clip-path: inset(10% 0 60% 0); transform: translateX(-4px); }
          94% { clip-path: inset(40% 0 30% 0); transform: translateX(4px); }
          96% { clip-path: inset(70% 0 5% 0); transform: translateX(-2px); }
        }

        @keyframes glitchB {
          0%, 90%, 100% { clip-path: inset(0 0 100% 0); transform: translateX(0); }
          92% { clip-path: inset(60% 0 5% 0); transform: translateX(3px); }
          94% { clip-path: inset(20% 0 55% 0); transform: translateX(-3px); }
          96% { clip-path: inset(80% 0 2% 0); transform: translateX(2px); }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes borderPulse {
          0%, 100% { border-color: rgba(255,255,255,0.08); }
          50% { border-color: rgba(255,255,255,0.18); }
        }

        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .hero-title {
          animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
        }

        .hero-sub {
          animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both;
        }

        .hero-cta {
          animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both;
        }

        .nav-animate {
          animation: fadeIn 0.6s ease 0s both;
        }

        .glitch-wrap {
          position: relative;
          display: inline-block;
        }

        .glitch-wrap::before,
        .glitch-wrap::after {
          content: attr(data-text);
          position: absolute;
          inset: 0;
          color: #fff;
          font-size: inherit;
          font-weight: inherit;
          line-height: inherit;
          letter-spacing: inherit;
          font-family: inherit;
        }

        .glitch-wrap::before {
          color: rgba(255,255,255,0.7);
          animation: glitchA 6s infinite;
          left: 2px;
        }

        .glitch-wrap::after {
          color: rgba(255,255,255,0.5);
          animation: glitchB 6s infinite;
          left: -2px;
        }

        .btn-primary {
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .btn-primary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          background-size: 200% 100%;
          transform: translateX(-100%);
          transition: transform 0.5s;
        }

        .btn-primary:hover::before {
          transform: translateX(100%);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.3);
        }

        .btn-ghost {
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .btn-ghost::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0);
          backdrop-filter: blur(0px);
          transition: all 0.3s;
        }

        .btn-ghost:hover {
          transform: translateY(-2px);
          border-color: rgba(255,255,255,0.4) !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
        }

        .nav-link {
          transition: color 0.3s;
        }

        .nav-link:hover {
          color: #fff !important;
        }

        .footer-link {
          transition: all 0.3s;
          position: relative;
        }

        .footer-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1px;
          background: #fff;
          transition: width 0.3s;
        }

        .footer-link:hover::after {
          width: 100%;
        }

      `}</style>

      {/* Noise Texture Overlay */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'none',
        opacity: 0.035,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: '150px 150px',
      }} />

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




      {/* ── NAVIGATION ── */}
      <nav className="nav-animate" style={{
        position: 'relative',
        zIndex: 10,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        background: 'rgba(5,5,5,0.6)',
      }}>
        <div style={{
          maxWidth: '84rem',
          margin: '0 auto',
          padding: '0.5rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {/* Logo + Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <img
              src="/Images/BW.png"
              alt="Hackoverflow Logo"
              style={{
                width: '90px',
                height: '90px',
                objectFit: 'contain',
                flexShrink: 0,
              }}
            />

          </div>

          {/* Nav Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>

            <Link
              href="/login"
              className="btn-ghost"
              style={{
                padding: '0.6rem 1.4rem',
                border: '1px solid rgba(255,255,255,0.15)',
                backgroundColor: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(10px)',
                color: '#fff',
                textDecoration: 'none',
                fontSize: '0.75rem',
                letterSpacing: '0.15em',
                display: 'inline-block',
              }}
            >
              LOGIN →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '84rem',
        margin: '0 auto',
        padding: '7rem 2rem 4rem',
      }}>
        <div className="hero-title" style={{ marginBottom: '2.5rem' }}>
          <h1 style={{
            fontSize: 'clamp(4.5rem, 14vw, 11rem)',
            fontWeight: 900,
            lineHeight: 0.88,
            letterSpacing: '-0.04em',
          }}>
            <span className="glitch-wrap" data-text="HACK">HACK</span>
            <br />
            <span style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.25) 60%, rgba(255,255,255,0.05) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              OVERFLOW
            </span>
          </h1>
        </div>

        <div className="hero-sub" style={{ textAlign: 'left', marginBottom: '4rem' }}>
          {/* Glass descriptor card */}
          <div style={{
            display: 'block',
            padding: '1rem 2rem',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(16px)',
            marginBottom: '1rem',
          }}>
            <p style={{
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.55)',
              lineHeight: 1.7,
              letterSpacing: '0.08em',
              fontFamily: 'monospace',
            }}>
              Unified admin dashboard for management.
              <br />
              Built for Hackoverflow <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>4.0</span>
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="hero-cta" style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-start',
          flexWrap: 'wrap',
          marginBottom: '6rem',
        }}>
          <Link
            href="/login"
            className="btn-primary"
            style={{
              padding: '1rem 2.5rem',
              backgroundColor: '#fff',
              color: '#000',
              fontWeight: 900,
              fontSize: '0.875rem',
              textDecoration: 'none',
              letterSpacing: '0.15em',
              display: 'inline-block',
            }}
          >
            GET STARTED →
          </Link>
          <a
            href="https://github.com/Niravcanvas/Hackoverflow-Dashboard.git"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
            style={{
              padding: '1rem 2.5rem',
              border: '1px solid rgba(255,255,255,0.15)',
              backgroundColor: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(10px)',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '0.875rem',
              textDecoration: 'none',
              display: 'inline-block',
              letterSpacing: '0.12em',
            }}
          >
            GITHUB REPO ↗
          </a>
        </div>

      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        position: 'relative',
        zIndex: 10,
        borderTop: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        background: 'rgba(5,5,5,0.5)',
        padding: '2.5rem 0',
      }}>
        <div style={{
          maxWidth: '84rem',
          margin: '0 auto',
          padding: '0 2rem',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}>
            {/* Left */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img
                src="/Images/BW.png"
                alt="Logo"
                style={{ width: '20px', height: '20px', objectFit: 'contain', opacity: 0.4 }}
              />
              <span style={{
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.3)',
                letterSpacing: '0.1em',
              }}>
                © 2026 MADE BY NI // HACKOVERFLOW 4.0
              </span>
            </div>

            {/* Right */}
            <div style={{ display: 'flex', gap: '2rem' }}>
              {[
                { label: 'INSTAGRAM', href: 'https://www.instagram.com/hackoverflow4.0' },
                { label: 'WEBSITE', href: 'https://hackoverflow4.tech' },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link"
                  style={{
                    color: 'rgba(255,255,255,0.35)',
                    textDecoration: 'none',
                    fontSize: '0.7rem',
                    letterSpacing: '0.15em',
                  }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}