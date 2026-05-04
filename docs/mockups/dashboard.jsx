// dashboard.jsx — Dashboard screen (mobile + desktop)

const { useState: useStateD } = React;

function PeriodPicker({ value, onChange }) {
  const opts = [
    { id: 'week', label: 'This week' },
    { id: 'month', label: 'This month' },
    { id: 'all', label: 'All time' },
  ];
  return (
    <div style={{
      display: 'inline-flex', padding: 2, borderRadius: 999,
      background: 'var(--bg-2)',
      boxShadow: '0 0 0 0.5px var(--line) inset',
      gap: 0,
    }}>
      {opts.map(o => {
        const on = value === o.id;
        return (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            padding: '6px 12px',
            background: on ? 'var(--bg-3)' : 'transparent',
            color: on ? 'var(--fg-0)' : 'var(--fg-2)',
            border: 'none', cursor: 'pointer',
            borderRadius: 999,
            fontSize: 12, fontWeight: 500,
            letterSpacing: 0.01,
            boxShadow: on ? '0 0 0 0.5px var(--line-strong) inset' : 'none',
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

function SessionRow({ session, dense = false }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: dense ? '10px 14px' : '12px 14px',
      borderTop: '0.5px solid var(--line)',
    }}>
      <SessionTypeIcon type={session.type} size={14} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg-0)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{session.title || (session.type === 'online' ? 'Online session' : 'Live session')}</div>
        <div style={{ fontSize: 11.5, color: 'var(--fg-2)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
          <span data-mono style={{ fontFamily: 'var(--font-mono)' }}>{session.date}</span>
          <span style={{ color: 'var(--fg-3)' }}>·</span>
          <span>{session.players}p</span>
          {session.status === 'disputed' && (
            <>
              <span style={{ color: 'var(--fg-3)' }}>·</span>
              <span style={{ color: '#e89888', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <Icon name="alert" size={10} /> disputed
              </span>
            </>
          )}
        </div>
      </div>
      <MoneyDisplay value={session.myPnL} variant="medium" />
    </div>
  );
}

function ActivityRow({ a }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
      <PlayerAvatar name={a.actor} size={26} />
      <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: 'var(--fg-1)', lineHeight: 1.35 }}>
        <span style={{ color: 'var(--fg-0)', fontWeight: 500 }}>{a.actor}</span>{' '}
        {a.verb === 'won' && <>won </>}
        {a.verb === 'lost' && <>lost </>}
        {a.verb === 'joined' && <>joined </>}
        {a.amount !== null && (
          <MoneyDisplay value={Math.abs(a.amount) * (a.verb === 'lost' ? -1 : 1)} variant="inline" />
        )}
        {a.amount !== null && ' '}in <span style={{ color: 'var(--fg-1)' }}>{a.where}</span>
        <span style={{ color: 'var(--fg-3)' }}> · {a.when}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Dashboard — mobile
// ─────────────────────────────────────────────────────────────
function Dashboard({ width = 390 }) {
  const [period, setPeriod] = useStateD('week');
  const [tab, setTab] = useStateD('home');
  const balance = ME.balance;
  const lastSession = SESSIONS[0];
  const recent3 = SESSIONS.slice(0, 3);

  return (
    <div className="pkr" style={{
      width, minHeight: 844, height: 844,
      background: 'var(--bg-0)',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Header */}
      <MobileHeader club={CLUB.name} role={ME.isHost ? 'Host' : 'Player'} notifications={2} />

      {/* Scrollable content */}
      <div style={{ flex: 1, overflow: 'auto', paddingBottom: 110 }}>

        {/* Hero balance card */}
        <div style={{ padding: '6px 14px 0' }}>
          <div className="pkr-card" style={{
            padding: 18,
            background: 'linear-gradient(180deg, #14130f 0%, var(--bg-1) 100%)',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* decorative top accent line */}
            <div style={{
              position: 'absolute', top: 0, left: 18, right: 18, height: 2,
              background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
              opacity: 0.3,
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div className="pkr-section-label">Your balance</div>
              <PeriodPicker value={period} onChange={setPeriod} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
              <MoneyDisplay value={balance} variant="hero" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12.5, color: 'var(--fg-2)' }}>
              <Icon name="trend" size={12} color={balance >= 0 ? 'var(--pos)' : 'var(--neg)'} />
              <span data-mono style={{ fontFamily: 'var(--font-mono)' }}>{period === 'week' ? 'last 7 days' : period === 'month' ? 'last 30 days' : 'all time'}</span>
              <span style={{ color: 'var(--fg-3)' }}>·</span>
              <span>{recent3.length === 0 ? 'no sessions' : `${SESSIONS.length} sessions`}</span>
            </div>

            {/* Chart */}
            <div style={{ marginTop: 14 }}>
              <AreaChart data={SPARK} width={width - 72} height={108} accent="var(--accent)" />
            </div>

            {/* Last session callout */}
            <div style={{
              marginTop: 12, padding: '10px 12px',
              background: 'var(--bg-2)', borderRadius: 10,
              display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: '0 0 0 0.5px var(--line) inset',
            }}>
              <SessionTypeIcon type={lastSession.type} size={12} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: 'var(--fg-2)' }}>Yesterday at <span style={{ color: 'var(--fg-1)' }}>{lastSession.title}</span></div>
              </div>
              <MoneyDisplay value={lastSession.myPnL} variant="medium" />
            </div>
          </div>
        </div>

        {/* Recent sessions */}
        <div style={{ padding: '20px 14px 6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 2px' }}>
            <div className="pkr-section-label">Recent sessions</div>
            <button style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--fg-2)', fontSize: 12, fontWeight: 500,
              display: 'inline-flex', alignItems: 'center', gap: 2,
            }}>
              See all <Icon name="chevR" size={12} />
            </button>
          </div>
          <div className="pkr-card" style={{ overflow: 'hidden' }}>
            {recent3.map((s, i) => (
              <SessionRow key={s.id} session={s} dense={i === 0 ? false : false} />
            ))}
          </div>
        </div>

        {/* Activity */}
        <div style={{ padding: '18px 14px 6px' }}>
          <div className="pkr-section-label" style={{ padding: '0 2px 8px' }}>Club activity</div>
          <div className="pkr-card" style={{ padding: '4px 14px' }}>
            {ACTIVITY.map(a => <ActivityRow key={a.id} a={a} />)}
          </div>
        </div>
      </div>

      {/* Sticky FAB — host only */}
      {ME.isHost && (
        <div style={{
          position: 'absolute', left: 14, right: 14, bottom: 70,
          pointerEvents: 'none',
        }}>
          <button className="pkr-btn pkr-btn--primary" style={{
            width: '100%', height: 50, fontSize: 15, pointerEvents: 'auto',
            boxShadow: '0 8px 24px rgba(212,164,55,0.30), 0 1px 0 rgba(255,255,255,0.18) inset',
          }}>
            <Icon name="plus" size={18} strokeWidth={2.4} />
            New session
          </button>
        </div>
      )}

      {/* Bottom nav */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <BottomNav active={tab} onTab={setTab} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Dashboard — desktop variant (1080 wide)
// ─────────────────────────────────────────────────────────────
function DashboardDesktop({ width = 1180, height = 760 }) {
  const [period, setPeriod] = useStateD('month');
  const lastSession = SESSIONS[0];

  return (
    <div className="pkr" style={{
      width, height, background: 'var(--bg-0)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 28px',
        borderBottom: '0.5px solid var(--line)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 30, height: 30, borderRadius: 7,
              background: 'linear-gradient(135deg, #2a1f0e, #4a3618)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent)',
              boxShadow: '0 0 0 0.5px var(--accent-ring) inset',
            }}>
              <Icon name="spade" size={15} strokeWidth={1.8} />
            </span>
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{CLUB.name}</div>
              <div style={{ fontSize: 11, color: 'var(--fg-2)' }}>Host · 11 members</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['Home', 'Sessions', 'Settle-up', 'Members'].map((t, i) => (
              <button key={t} style={{
                background: i === 0 ? 'var(--bg-2)' : 'transparent',
                color: i === 0 ? 'var(--fg-0)' : 'var(--fg-2)',
                border: 'none', cursor: 'pointer',
                padding: '6px 12px', borderRadius: 8,
                fontSize: 13, fontWeight: 500,
              }}>{t}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 10px', borderRadius: 8,
            background: 'var(--bg-2)',
            color: 'var(--fg-2)', fontSize: 12,
            boxShadow: '0 0 0 0.5px var(--line) inset',
            minWidth: 220,
          }}>
            <Icon name="search" size={14} />
            <span>Search players, sessions…</span>
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>/</span>
          </div>
          <button className="pkr-btn pkr-btn--primary pkr-btn--sm" style={{ height: 36 }}>
            <Icon name="plus" size={14} strokeWidth={2.4} /> New session
          </button>
          <button style={{
            position: 'relative', width: 36, height: 36, borderRadius: 8,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--fg-1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="bell" size={17} />
            <span style={{
              position: 'absolute', top: 7, right: 7,
              width: 6, height: 6, borderRadius: 999,
              background: 'var(--accent)',
            }} />
          </button>
          <PlayerAvatar name="Yakir Sneh" size={32} you />
        </div>
      </div>

      {/* Body — 2 column */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, padding: 24, overflow: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>

          {/* Hero balance */}
          <div className="pkr-card" style={{
            padding: 24,
            background: 'linear-gradient(180deg, #14130f 0%, var(--bg-1) 60%)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 24, right: 24, height: 2,
              background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
              opacity: 0.3,
            }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div className="pkr-section-label">Your balance</div>
                <div style={{ marginTop: 8 }}>
                  <MoneyDisplay value={ME.balance} variant="hero" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 13, color: 'var(--fg-2)' }}>
                  <Icon name="trend" size={12} color={ME.balance >= 0 ? 'var(--pos)' : 'var(--neg)'} />
                  <span>across {SESSIONS.length} sessions in {period === 'month' ? 'May' : 'this period'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 14 }}>
                <PeriodPicker value={period} onChange={setPeriod} />
                <div style={{ display: 'flex', gap: 18, fontSize: 12 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--fg-2)', marginBottom: 2 }}>Best</div>
                    <MoneyDisplay value={204.30} variant="medium" />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--fg-2)', marginBottom: 2 }}>Worst</div>
                    <MoneyDisplay value={-267.40} variant="medium" />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--fg-2)', marginBottom: 2 }}>Win rate</div>
                    <span data-mono style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 500, color: 'var(--fg-0)' }}>40%</span>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 18 }}>
              <AreaChart data={SPARK} width={760} height={140} accent="var(--accent)" />
            </div>
            <div style={{
              marginTop: 14, padding: '10px 14px',
              background: 'var(--bg-2)', borderRadius: 10,
              display: 'flex', alignItems: 'center', gap: 12,
              boxShadow: '0 0 0 0.5px var(--line) inset',
            }}>
              <SessionTypeIcon type={lastSession.type} size={12} />
              <div style={{ flex: 1, fontSize: 13, color: 'var(--fg-2)' }}>
                Yesterday at <span style={{ color: 'var(--fg-1)' }}>{lastSession.title}</span> · 6 players · pot <span data-mono style={{ fontFamily: 'var(--font-mono)' }}>2,480</span>
              </div>
              <MoneyDisplay value={lastSession.myPnL} variant="medium" />
              <button style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--fg-2)', display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 12, fontWeight: 500,
              }}>
                Open <Icon name="arrowR" size={12} />
              </button>
            </div>
          </div>

          {/* Recent sessions table */}
          <div className="pkr-card" style={{ overflow: 'hidden' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 18px',
            }}>
              <div className="pkr-section-label">Recent sessions</div>
              <button style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--fg-2)', fontSize: 12, fontWeight: 500,
                display: 'inline-flex', alignItems: 'center', gap: 2,
              }}>
                See all <Icon name="chevR" size={12} />
              </button>
            </div>
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '24px 1.4fr 1fr 80px 90px 90px',
                gap: 12, padding: '8px 18px',
                fontSize: 11, color: 'var(--fg-2)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                borderTop: '0.5px solid var(--line)',
                background: 'var(--bg-1)',
              }}>
                <div></div>
                <div>Session</div>
                <div>Game</div>
                <div>Players</div>
                <div>Status</div>
                <div style={{ textAlign: 'right' }}>P&L</div>
              </div>
              {SESSIONS.slice(0, 6).map(s => (
                <div key={s.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '24px 1.4fr 1fr 80px 90px 90px',
                  gap: 12, padding: '12px 18px',
                  borderTop: '0.5px solid var(--line)',
                  alignItems: 'center',
                }}>
                  <SessionTypeIcon type={s.type} size={12} />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--fg-0)' }}>{s.title || 'Session'}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--fg-2)', fontFamily: 'var(--font-mono)' }}>{s.date}</div>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--fg-1)' }}>
                    {s.game || (s.type === 'online' ? 'NLH 6-max' : 'NLH 8-max')}
                    <span style={{ color: 'var(--fg-3)' }}> · </span>
                    <span data-mono style={{ fontFamily: 'var(--font-mono)' }}>{s.blinds || '1/2'}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--fg-1)', fontFamily: 'var(--font-mono)' }}>{s.players}</div>
                  <div><StatusBadge status={s.status === 'disputed' ? 'disputed' : 'ended'} size="sm" /></div>
                  <div style={{ textAlign: 'right' }}>
                    <MoneyDisplay value={s.myPnL} variant="medium" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="pkr-card" style={{ padding: 18 }}>
            <div className="pkr-section-label">Top movers · this month</div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...MEMBERS].sort((a,b) => Math.abs(b.balance) - Math.abs(a.balance)).slice(0, 5).map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <PlayerAvatar name={m.name} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{m.nick}</div>
                    <div style={{ fontSize: 11, color: 'var(--fg-2)', fontFamily: 'var(--font-mono)' }}>{m.sessions} sessions</div>
                  </div>
                  <MoneyDisplay value={m.balance} variant="medium" />
                </div>
              ))}
            </div>
          </div>

          <div className="pkr-card" style={{ padding: 18 }}>
            <div className="pkr-section-label">Club activity</div>
            <div style={{ marginTop: 8 }}>
              {ACTIVITY.map(a => <ActivityRow key={a.id} a={a} />)}
            </div>
          </div>

          <div className="pkr-card" style={{ padding: 16, background: 'var(--accent-soft)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#1a1408',
              }}>
                <Icon name="scale" size={16} strokeWidth={2} />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--accent-hi)' }}>Settle-up due Sunday</div>
                <div style={{ fontSize: 12, color: 'var(--fg-1)' }}>4 transfers across 7 members</div>
              </div>
              <Icon name="chevR" size={14} color="var(--accent-hi)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Dashboard, DashboardDesktop, PeriodPicker });
