'use client';

import { useState, useEffect } from 'react';
import { DBParticipant, MEAL_LABELS, MealStatus, countMealsTaken } from '@/types';
import { getParticipants } from '@/actions/participants';

// ─── Meal schedule config ────────────────────────────────────────────────────
const MEAL_KEYS = (Object.keys(MEAL_LABELS) as (keyof MealStatus)[]);

const DAY_GROUPS = [
  {
    label: 'DAY 1',
    meals: ['day1_dinner'] as (keyof MealStatus)[],
  },
  {
    label: 'DAY 2',
    meals: ['day2_breakfast', 'day2_lunch', 'day2_dinner'] as (keyof MealStatus)[],
  },
  {
    label: 'DAY 3',
    meals: ['day3_breakfast', 'day3_lunch'] as (keyof MealStatus)[],
  },
];

const SHORT_LABEL: Record<keyof MealStatus, string> = {
  day1_dinner:    'Dinner',
  day2_breakfast: 'Bfast',
  day2_lunch:     'Lunch',
  day2_dinner:    'Dinner',
  day3_breakfast: 'Bfast',
  day3_lunch:     'Lunch',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMeal(p: DBParticipant, key: keyof MealStatus): boolean {
  return p.meals?.[key] ?? false;
}

function getMealCount(participants: DBParticipant[], key: keyof MealStatus) {
  return participants.filter(p => getMeal(p, key)).length;
}

// ─── Dot indicator ────────────────────────────────────────────────────────────
function Dot({ taken }: { taken: boolean }) {
  return (
    <div style={{
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      backgroundColor: taken ? '#4ade80' : 'transparent',
      border: taken ? '1px solid #4ade80' : '1px solid rgba(255,255,255,0.2)',
      flexShrink: 0,
      transition: 'all 0.2s',
    }} />
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function Bar({ value, total }: { value: number; total: number }) {
  const pct = total === 0 ? 0 : (value / total) * 100;
  return (
    <div style={{
      height: '3px',
      backgroundColor: 'rgba(255,255,255,0.08)',
      marginTop: '0.5rem',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: `${pct}%`,
        backgroundColor: '#4ade80',
        transition: 'width 0.4s ease',
      }} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FoodMonitorPage() {
  const [participants, setParticipants] = useState<DBParticipant[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [activeDay, setActiveDay] = useState<'ALL' | 'DAY 1' | 'DAY 2' | 'DAY 3'>('ALL');

  const load = async () => {
    try {
      const data = await getParticipants();
      setParticipants(data);
      setLastRefresh(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Auto-refresh every 30 seconds
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  const filtered = participants.filter(p => {
    const q = search.toLowerCase();
    return (
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.participantId.toLowerCase().includes(q) ||
      (p.teamName && p.teamName.toLowerCase().includes(q))
    );
  });

  const activeMeals: (keyof MealStatus)[] =
    activeDay === 'ALL'
      ? MEAL_KEYS
      : DAY_GROUPS.find(d => d.label === activeDay)!.meals;

  const totalParticipants = participants.length;

  // ── Summary stats ──────────────────────────────────────────────────────────
  const totalMealsServed = MEAL_KEYS.reduce(
    (sum, key) => sum + getMealCount(participants, key),
    0
  );
  const maxMealsPossible = totalParticipants * MEAL_KEYS.length;

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '1rem', color: 'rgba(255,255,255,0.5)' }}>
          Loading meal data...
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .fm-page { padding: 3rem; }
        .fm-stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; }
        .fm-meal-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; }
        .fm-row-meals { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        @media (max-width: 640px) {
          .fm-page { padding: 1.25rem; padding-top: calc(60px + 1.25rem); }
          .fm-stat-grid { grid-template-columns: repeat(2, 1fr); }
          .fm-meal-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div className="fm-page">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{
                fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                fontWeight: 900,
                letterSpacing: '-0.05em',
                marginBottom: '0.5rem',
              }}>
                FOOD MONITOR
              </h1>
              <p style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
                Live meal tracking · Read-only · Auto-refreshes every 30s
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{
                fontFamily: 'monospace',
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.35)',
                letterSpacing: '0.05em',
              }}>
                LAST SYNC {lastRefresh.toLocaleTimeString()}
              </span>
              <button
                onClick={load}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'rgba(255,255,255,0.7)',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
                REFRESH
              </button>
            </div>
          </div>
        </div>

        {/* ── Top stats ──────────────────────────────────────────────────── */}
        <div className="fm-stat-grid" style={{ marginBottom: '2rem' }}>
          {/* Total participants */}
          <div style={{
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '1.25rem',
          }}>
            <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
              PARTICIPANTS
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.04em' }}>
              {totalParticipants}
            </div>
          </div>

          {/* Total meals served */}
          <div style={{
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '1.25rem',
          }}>
            <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
              MEALS SERVED
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.04em' }}>
              {totalMealsServed}
              <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>
                /{maxMealsPossible}
              </span>
            </div>
            <Bar value={totalMealsServed} total={maxMealsPossible} />
          </div>

          {/* Per-meal quick stats */}
          {MEAL_KEYS.map(key => {
            const count = getMealCount(participants, key);
            const pct = totalParticipants === 0 ? 0 : Math.round((count / totalParticipants) * 100);
            return (
              <div key={key} style={{
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '1.25rem',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '0.65rem',
                  color: 'rgba(255,255,255,0.35)',
                  letterSpacing: '0.08em',
                  marginBottom: '0.4rem'
                }}>
                  {MEAL_LABELS[key].toUpperCase()}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em', color: count > 0 ? '#4ade80' : 'rgba(255,255,255,0.5)' }}>
                    {count}
                  </span>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>
                    {pct}%
                  </span>
                </div>
                <Bar value={count} total={totalParticipants} />
              </div>
            );
          })}
        </div>

        {/* ── Filters row ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, team, ID..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                padding: '0.625rem 1rem 0.625rem 2.5rem',
                color: '#fff',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
            />
          </div>

          {/* Day tabs */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(['ALL', 'DAY 1', 'DAY 2', 'DAY 3'] as const).map(day => {
              const isActive = activeDay === day;
              return (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  style={{
                    padding: '0.5rem 0.875rem',
                    backgroundColor: isActive ? '#fff' : 'transparent',
                    border: isActive ? 'none' : '1px solid rgba(255,255,255,0.2)',
                    color: isActive ? '#000' : 'rgba(255,255,255,0.6)',
                    fontFamily: 'monospace',
                    fontSize: '0.7rem',
                    fontWeight: isActive ? 'bold' : 'normal',
                    cursor: 'pointer',
                    letterSpacing: '0.06em',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                    }
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Result count */}
          <div style={{
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.35)',
            whiteSpace: 'nowrap',
          }}>
            {filtered.length} / {totalParticipants}
          </div>
        </div>

        {/* ── Column headers ─────────────────────────────────────────────── */}
        <div style={{
          border: '1px solid rgba(255,255,255,0.08)',
          borderBottom: 'none',
          padding: '0.625rem 1.25rem',
          display: 'grid',
          gridTemplateColumns: '2fr 1fr ' + activeMeals.map(() => '1fr').join(' ') + ' 80px',
          gap: '0.5rem',
          alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.03)',
        }}>
          <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>
            PARTICIPANT
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>
            TEAM
          </div>
          {activeMeals.map(key => (
            <div key={key} style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', textAlign: 'center' }}>
              {SHORT_LABEL[key].toUpperCase()}
            </div>
          ))}
          <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textAlign: 'center' }}>
            TOTAL
          </div>
        </div>

        {/* ── Participant rows ────────────────────────────────────────────── */}
        <div style={{
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {filtered.length === 0 ? (
            <div style={{
              padding: '4rem',
              textAlign: 'center',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              color: 'rgba(255,255,255,0.25)',
            }}>
              {participants.length === 0 ? 'No participants in database' : 'No results match your search'}
            </div>
          ) : (
            filtered.map((p, i) => {
              const taken = countMealsTaken(p.meals ?? {} as MealStatus);
              const total = MEAL_KEYS.length;
              return (
                <div
                  key={p._id || p.participantId}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr ' + activeMeals.map(() => '1fr').join(' ') + ' 80px',
                    gap: '0.5rem',
                    alignItems: 'center',
                    padding: '0.875rem 1.25rem',
                    borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {/* Name + ID */}
                  <div>
                    <div style={{
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      marginBottom: '0.15rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {p.name}
                    </div>
                    <div style={{
                      fontFamily: 'monospace',
                      fontSize: '0.65rem',
                      color: 'rgba(255,255,255,0.3)',
                    }}>
                      {p.participantId}
                    </div>
                  </div>

                  {/* Team */}
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.5)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {p.teamName || '—'}
                  </div>

                  {/* Meal dots */}
                  {activeMeals.map(key => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Dot taken={getMeal(p, key)} />
                    </div>
                  ))}

                  {/* Total meals taken */}
                  <div style={{ textAlign: 'center' }}>
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      color: taken === total ? '#4ade80' : taken === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
                      fontWeight: taken > 0 ? 'bold' : 'normal',
                    }}>
                      {taken}/{total}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Footer summary ─────────────────────────────────────────────── */}
        {filtered.length > 0 && (
          <div style={{
            marginTop: '1rem',
            padding: '0.875rem 1.25rem',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            backgroundColor: 'rgba(255,255,255,0.02)',
          }}>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '0.7rem',
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.05em',
            }}>
              TOTALS FOR VISIBLE ROWS
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {activeMeals.map(key => {
                const count = filtered.filter(p => getMeal(p, key)).length;
                return (
                  <div key={key} style={{ textAlign: 'center' }}>
                    <div style={{
                      fontFamily: 'monospace',
                      fontSize: '0.6rem',
                      color: 'rgba(255,255,255,0.3)',
                      letterSpacing: '0.06em',
                      marginBottom: '0.2rem',
                    }}>
                      {MEAL_LABELS[key].toUpperCase()}
                    </div>
                    <div style={{
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      color: count > 0 ? '#4ade80' : 'rgba(255,255,255,0.2)',
                    }}>
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </>
  );
}