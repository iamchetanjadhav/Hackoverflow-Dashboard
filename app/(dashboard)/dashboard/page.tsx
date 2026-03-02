'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { checkSessionAction, logoutAction } from '@/actions/auth';
import { getParticipants } from '@/actions/participants';
import { DBParticipant } from '@/types';

type DashboardStats = {
  totalParticipants: number;
  collegeCheckedIn: number;
  labCheckedIn: number;
  totalTeams: number;
};

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState('');
  const [greeting,    setGreeting]    = useState('');
  const [userName,    setUserName]    = useState('Admin');
  const [stats,       setStats]       = useState<DashboardStats>({
    totalParticipants: 0, collegeCheckedIn: 0, labCheckedIn: 0, totalTeams: 0,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleLogout = async () => {
    await logoutAction();
    router.push('/login');
  };

  useEffect(() => {
    checkSessionAction()
      .then(data => { if (data.user?.name) setUserName(data.user.name); })
      .catch(() => {});

    loadStats();
    updateTimeAndGreeting();
    const interval = setInterval(updateTimeAndGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const participants: DBParticipant[] = await getParticipants();

      const collegeCheckedIn = participants.filter(p => p.collegeCheckIn?.status).length;
      const labCheckedIn     = participants.filter(p => p.labCheckIn?.status).length;
      const uniqueTeams      = new Set(
        participants.map(p => p.teamName).filter(Boolean)
      );

      setStats({
        totalParticipants: participants.length,
        collegeCheckedIn,
        labCheckedIn,
        totalTeams: uniqueTeams.size,
      });
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateTimeAndGreeting = () => {
    const now   = new Date();
    const hours = now.getHours();
    setCurrentTime(
      `${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} • ` +
      now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    );
    setGreeting(hours < 12 ? 'Good Morning' : hours < 18 ? 'Good Afternoon' : 'Good Evening');
  };

  // ── Stat card ──────────────────────────────────────────────────────────────
  const StatCard = ({ label, value, color, pct }: { label: string; value: number; color: string; pct?: number }) => (
    <div
      style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '1.5rem', transition: 'border-color 0.3s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
    >
      <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: '2.5rem', fontWeight: 900, color }}>
        {loading ? '…' : value}
      </div>
      {!loading && pct !== undefined && stats.totalParticipants > 0 && (
        <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem' }}>
          {pct.toFixed(1)}% checked in
        </div>
      )}
    </div>
  );

  return (
    <>
      <style>{`
        .db-page    { padding: 3rem; }
        .db-stats   { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; max-width: 1200px; }
        .db-actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; max-width: 1200px; }
        @media (max-width: 767px) {
          .db-page    { padding: 1.25rem; padding-top: calc(60px + 1.25rem); }
          .db-stats   { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
          .db-actions { grid-template-columns: 1fr 1fr; gap: 0.75rem; }
          .db-action-card { padding: 1.25rem !important; min-height: 140px !important; gap: 0.75rem !important; }
          .db-action-card svg { width: 32px !important; height: 32px !important; }
          .db-action-title { font-size: 0.95rem !important; }
          .db-action-desc  { font-size: 0.75rem !important; }
        }
        @media (max-width: 400px) { .db-actions { grid-template-columns: 1fr; } }
      `}</style>

      <div className="db-page">
        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, letterSpacing: '-0.05em', marginBottom: '0.5rem' }}>
                {greeting}, {userName}
              </h1>
              <p style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.6)', fontSize: '1rem', letterSpacing: '0.02em' }}>
                {currentTime}
              </p>
            </div>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.6rem 1.25rem',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.55)',
                fontFamily: 'monospace', fontSize: '0.75rem',
                letterSpacing: '0.05em', cursor: 'pointer',
                transition: 'all 0.25s',
                flexShrink: 0,
                marginTop: '0.5rem',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(248,113,113,0.5)';
                e.currentTarget.style.color = '#f87171';
                e.currentTarget.style.backgroundColor = 'rgba(248,113,113,0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              SIGN OUT
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>OVERVIEW</h2>
          <div className="db-stats">
            <StatCard label="TOTAL PARTICIPANTS" value={stats.totalParticipants} color="#fff" />
            <StatCard label="COLLEGE CHECK-IN"  value={stats.collegeCheckedIn}  color="#4ade80" pct={stats.totalParticipants ? (stats.collegeCheckedIn / stats.totalParticipants) * 100 : 0} />
            <StatCard label="LAB CHECK-IN"      value={stats.labCheckedIn}      color="#60a5fa" pct={stats.totalParticipants ? (stats.labCheckedIn     / stats.totalParticipants) * 100 : 0} />
            <StatCard label="TOTAL TEAMS"        value={stats.totalTeams}        color="#f59e0b" />
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>QUICK ACTIONS</h2>
          <div className="db-actions">
            {[
              {
                title: 'Manage Participants', desc: 'View, add, or import attendees', href: '/dashboard/participants',
                icon: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
              },
              {
                title: 'Manage Sponsors', desc: 'View and manage event sponsors', href: '/dashboard/sponsors',
                icon: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>,
              },
              {
                title: 'Send Bulk Email', desc: 'Compose and send emails', href: '/dashboard/mailer',
                icon: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>,
              },
              {
                title: 'Generate ID Cards', desc: 'Create badges for attendees', href: '/dashboard/id-cards',
                icon: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><circle cx="8" cy="10" r="2"></circle><path d="M14 10h4"></path><path d="M14 14h4"></path><path d="M6 16h4"></path></svg>,
              },
              {
                title: 'View Analytics', desc: 'Check email and event stats', href: '/dashboard/analytics',
                icon: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>,
              },
            ].map((action, i) => (
              <Link key={i} href={action.href} className="db-action-card"
                style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '2rem', transition: 'all 0.3s', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '180px' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div>{action.icon}</div>
                <div>
                  <h3 className="db-action-title" style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>{action.title}</h3>
                  <p  className="db-action-desc"  style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}