'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setIsOpen(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const menuItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      )
    },
    {
      title: 'Participants',
      href: '/dashboard/participants',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      )
    },
    {
      title: 'Sponsors',
      href: '/dashboard/sponsors',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
        </svg>
      )
    },
    {
      title: 'Mailer',
      href: '/dashboard/mailer',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
      )
    },
    {
      title: 'ID Cards',
      href: '/dashboard/id-cards',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="4" width="20" height="16" rx="2"></rect>
          <circle cx="8" cy="10" r="2"></circle>
          <path d="M14 10h4"></path>
          <path d="M14 14h4"></path>
          <path d="M6 16h4"></path>
        </svg>
      )
    },
    {
      title: 'Scanner',
      href: '/dashboard/scanner',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
          <rect x="7" y="7" width="3" height="3"/>
          <rect x="14" y="7" width="3" height="3"/>
          <rect x="7" y="14" width="3" height="3"/>
          <path d="M14 14h3v3h-3z"/>
        </svg>
      )
    },
    {
      title: 'Check-in',
      href: '/dashboard/checkin',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 11l3 3L22 4"></path>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
      )
    },
    {
      title: 'Food',
      href: '/dashboard/food',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
          <line x1="6" y1="1" x2="6" y2="4"></line>
          <line x1="10" y1="1" x2="10" y2="4"></line>
          <line x1="14" y1="1" x2="14" y2="4"></line>
        </svg>
      )
    },
    {
      title: 'Database',
      href: '/dashboard/database',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
        </svg>
      )
    },
    {
      title: 'Bot Config',
      href: '/dashboard/bot',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          <circle cx="12" cy="16" r="1"></circle>
        </svg>
      )
    },
  ];

  const sidebarContent = (
    <div style={{
      width: '280px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '2rem 0',
    }}>
      {/* Logo/Brand */}
      <div style={{ padding: '0 1.5rem', marginBottom: '3rem' }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 900,
          letterSpacing: '-0.05em',
          marginBottom: '0.25rem'
        }}>
          HACKOVERFLOW
        </h1>
        <p style={{
          fontFamily: 'monospace',
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.5)',
          letterSpacing: '0.05em'
        }}>
          ADMIN PANEL
        </p>
      </div>

      {/* Navigation */}
      <nav style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        padding: '0 1rem'
      }}>
        {menuItems.map((item, i) => {
          const isActive = pathname === item.href;
          const isDatabase = item.href === '/dashboard/database';
          return (
            <Link
              key={i}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.875rem 1rem',
                textDecoration: 'none',
                color: isActive ? '#fff' : isDatabase ? 'rgba(74, 222, 128, 0.7)' : 'rgba(255, 255, 255, 0.6)',
                backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                border: isActive ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
                transition: 'all 0.2s',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                fontWeight: isActive ? 'bold' : 'normal',
                letterSpacing: '0.02em'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.color = isDatabase ? 'rgba(74, 222, 128, 0.7)' : 'rgba(255, 255, 255, 0.6)';
                }
              }}
            >
              <span style={{
                display: 'flex',
                alignItems: 'center',
                color: isActive ? '#fff' : isDatabase && !isActive ? 'rgba(74, 222, 128, 0.7)' : 'inherit',
              }}>
                {item.icon}
              </span>
              <span style={{ flex: 1 }}>{item.title}</span>
              {isDatabase && !isActive && (
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '0.55rem',
                  padding: '0.15rem 0.4rem',
                  border: '1px solid rgba(74, 222, 128, 0.4)',
                  color: 'rgba(74, 222, 128, 0.7)',
                  letterSpacing: '0.08em',
                  lineHeight: 1.4,
                }}>
                  DB
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  // ── MOBILE ──────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: '60px',
          backgroundColor: '#000',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.25rem',
        }}>
          <h1 style={{
            fontSize: '1.1rem',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            margin: 0,
          }}>
            HACKOVERFLOW
          </h1>
          <button
            onClick={() => setIsOpen(prev => !prev)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              cursor: 'pointer',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>
        </div>

        {isOpen && (
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 110,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(4px)',
            }}
          />
        )}

        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 120,
          backgroundColor: '#000',
          borderRight: '1px solid rgba(255, 255, 255, 0.15)',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowY: 'auto',
        }}>
          {sidebarContent}
        </div>

        <div style={{ height: '60px' }} />
      </>
    );
  }

  // ── DESKTOP ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      width: '280px',
      height: '100vh',
      borderRight: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
    }}>
      {sidebarContent}
    </div>
  );
}