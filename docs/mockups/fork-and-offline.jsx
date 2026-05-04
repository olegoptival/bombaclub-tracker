// fork-and-offline.jsx — Session fork screen + Offline live view

const { useState: useStateF, useEffect: useEffectF } = React;

// ─────────────────────────────────────────────────────────────
// Session fork — Online vs Offline
// ─────────────────────────────────────────────────────────────
function SessionFork({ width = 390, onPick, onClose }) {
  return (
    <div className="pkr" style={{
      width, height: 844, background: 'var(--bg-0)',
      display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 8px 4px' }}>
        <button onClick={onClose} style={{
          width: 40, height: 40, borderRadius: 10, background: 'transparent',
          border: 'none', cursor: 'pointer', color: 'var(--fg-1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><Icon name="x" size={20} /></button>
        <div style={{ fontSize: 14, fontWeight: 600 }}>New session</div>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ padding: '12px 16px 0' }}>
        <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.4, lineHeight: 1.15 }}>
          What kind of session?
        </div>
        <div style={{ fontSize: 14, color: 'var(--fg-2)', marginTop: 6, lineHeight: 1.45 }}>
          Online and live games are tracked differently. This choice can't be changed later.
        </div>
      </div>

      <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        {/* Online card */}
        <button onClick={() => onPick && onPick('online')} className="pkr-card" style={{
          padding: 18, textAlign: 'left', cursor: 'pointer',
          border: 'none', color: 'inherit',
          background: 'linear-gradient(180deg, rgba(30,138,79,0.10) 0%, var(--bg-1) 100%)',
          boxShadow: '0 0 0 0.5px rgba(30,138,79,0.30) inset',
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'linear-gradient(135deg, #0f2018, #1a3322)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--felt)',
              boxShadow: '0 0 0 0.5px rgba(30,138,79,0.4) inset',
            }}>
              <Icon name="monitor" size={22} strokeWidth={1.8} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 600 }}>Online</div>
              <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 1 }}>From ClubGG screenshots</div>
            </div>
            <Icon name="chevR" size={18} color="var(--fg-2)" />
          </div>
          <div style={{ fontSize: 13, color: 'var(--fg-1)', lineHeight: 1.5 }}>
            Drop end-of-table screenshots, we OCR players and stacks, you confirm. Closed in one short flow.
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 11.5, color: 'var(--fg-2)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Icon name="upload" size={11} /> upload
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Icon name="zap" size={11} /> OCR'd
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Icon name="clock" size={11} /> minutes
            </span>
          </div>
        </button>

        {/* Offline card */}
        <button onClick={() => onPick && onPick('offline')} className="pkr-card" style={{
          padding: 18, textAlign: 'left', cursor: 'pointer',
          border: 'none', color: 'inherit',
          background: 'linear-gradient(180deg, var(--accent-soft) 0%, var(--bg-1) 100%)',
          boxShadow: '0 0 0 0.5px var(--accent-ring) inset',
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'linear-gradient(135deg, #2a1f0e, #4a3618)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent)',
              boxShadow: '0 0 0 0.5px var(--accent-ring) inset',
            }}>
              <Icon name="users" size={22} strokeWidth={1.8} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 600 }}>Live at table</div>
              <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 1 }}>Real chips, real seats</div>
            </div>
            <Icon name="chevR" size={18} color="var(--fg-2)" />
          </div>
          <div style={{ fontSize: 13, color: 'var(--fg-1)', lineHeight: 1.5 }}>
            Open before play. Track buy-ins, rebuys, cash-outs as they happen. Close when the last seat empties.
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 11.5, color: 'var(--fg-2)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--felt)' }} /> live
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Icon name="clock" size={11} /> hours
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Icon name="refresh" size={11} /> events
            </span>
          </div>
        </button>

        {/* Helper */}
        <div style={{
          marginTop: 'auto', padding: '12px 14px', borderRadius: 12,
          background: 'var(--bg-1)', boxShadow: '0 0 0 0.5px var(--line) inset',
          fontSize: 12, color: 'var(--fg-2)', lineHeight: 1.5,
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <Icon name="alert" size={14} style={{ marginTop: 1 }} />
          <span>One screenshot batch = one online session per ClubGG table. Multi-table nights need one online session per table.</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Offline live view — buy-in / rebuy / cash-out tracking
// ─────────────────────────────────────────────────────────────
const LIVE_SESSION = {
  num: 42,
  game: 'NLH',
  blinds: '1/2',
  startedAt: Date.now() - (2 * 3600 + 14 * 60) * 1000,
  seated: [
    { id: 'u1',  name: 'Yakir',     nick: 'Yakirsneh',  buyIn: 800,  events: 2, joined: '22 min ago', isYou: true, isHost: true },
    { id: 'u2',  name: 'Don',       nick: 'Don ron99',  buyIn: 1000, events: 2, joined: '2h ago' },
    { id: 'u4',  name: 'Roi',       nick: 'Roi K.',     buyIn: 500,  events: 1, joined: '2h ago' },
    { id: 'u6',  name: 'Tomer',     nick: 'TomTom',     buyIn: 700,  events: 2, joined: '1h 40m ago' },
    { id: 'g1',  name: 'Sasha',     nick: 'Sasha',      buyIn: 400,  events: 1, joined: '1h ago', guest: true },
  ],
  cashed: [
    { id: 'u7',  name: 'Shahar',    nick: 'Shaks',      buyIn: 600,  stack: 1135, pnl: +535, leftAt: '12 min ago' },
    { id: 'u9',  name: 'Ofir',      nick: 'OfirBets',   buyIn: 400,  stack:   0,  pnl: -400, leftAt: '45 min ago' },
  ],
  lastEvent: { type: 'rebuy', who: 'TomTom', amount: 200, when: '4 min ago' },
};

function Elapsed({ since }) {
  const [now, setNow] = useStateF(Date.now());
  useEffectF(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);
  const ms = now - since;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return <span data-mono style={{ fontFamily: 'var(--font-mono)' }}>{h}h {m.toString().padStart(2, '0')}m</span>;
}

function PlayerLiveRow({ p, cashed }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 11,
      padding: '12px 14px',
      borderTop: '0.5px solid var(--line)',
      opacity: cashed ? 0.78 : 1,
    }}>
      <PlayerAvatar name={p.name} size={36} guest={p.guest} you={p.isYou} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500 }}>
          {p.nick}
          {p.isYou && <span style={{ color: 'var(--accent)', fontSize: 11 }}>you</span>}
          {p.guest && (
            <span style={{ fontSize: 10, color: 'var(--fg-2)', padding: '1px 5px', borderRadius: 4, background: 'var(--bg-2)' }}>
              guest
            </span>
          )}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--fg-2)', display: 'flex', gap: 6, marginTop: 1 }}>
          {!cashed ? (
            <>
              <span data-mono style={{ fontFamily: 'var(--font-mono)' }}>{p.events} buy-ins</span>
              <span style={{ color: 'var(--fg-3)' }}>·</span>
              <span>joined {p.joined}</span>
            </>
          ) : (
            <>
              <span data-mono style={{ fontFamily: 'var(--font-mono)' }}>in {p.buyIn} → out {p.stack}</span>
              <span style={{ color: 'var(--fg-3)' }}>·</span>
              <span>{p.leftAt}</span>
            </>
          )}
        </div>
      </div>
      {!cashed ? (
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10.5, color: 'var(--fg-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>In</div>
          <span data-mono style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 500 }}>
            {p.buyIn.toLocaleString()}
          </span>
        </div>
      ) : (
        <MoneyDisplay value={p.pnl} variant="medium" />
      )}
    </div>
  );
}

function OfflineLive({ width = 390, onClose }) {
  const totalChips = LIVE_SESSION.seated.reduce((s, p) => s + p.buyIn, 0);
  const totalBuyInsAll = totalChips + LIVE_SESSION.cashed.reduce((s, p) => s + p.buyIn, 0);
  const totalCashOuts = LIVE_SESSION.cashed.reduce((s, p) => s + p.stack, 0);

  return (
    <div className="pkr" style={{
      width, height: 844, background: 'var(--bg-0)',
      display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
    }}>
      {/* Sticky header */}
      <div style={{
        padding: '10px 14px 12px',
        background: 'linear-gradient(180deg, #14130f 0%, var(--bg-0) 100%)',
        borderBottom: '0.5px solid var(--line)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={onClose} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--fg-1)', padding: '6px 6px 6px 0',
            fontSize: 13, fontWeight: 500,
          }}>
            <Icon name="chevL" size={16} /> Sessions
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <StatusBadge status="live" size="sm" />
            <button style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--fg-1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><Icon name="more" size={18} /></button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
          <span data-mono style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg-2)', letterSpacing: 0.02 }}>#{LIVE_SESSION.num}</span>
          <span style={{ fontSize: 17, fontWeight: 600 }}>{LIVE_SESSION.game}</span>
          <span data-mono style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--fg-1)' }}>{LIVE_SESSION.blinds}</span>
          <span style={{ flex: 1 }} />
          <Elapsed since={LIVE_SESSION.startedAt} />
        </div>

        {/* Live stats strip */}
        <div style={{
          marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: 1, background: 'var(--line)',
          borderRadius: 10, overflow: 'hidden',
          boxShadow: '0 0 0 0.5px var(--line) inset',
        }}>
          <LiveStat label="On the table" value={totalChips} mono />
          <LiveStat label="Seated" value={LIVE_SESSION.seated.length} suffix=" / 8" />
          <LiveStat label="Cashed out" value={LIVE_SESSION.cashed.length} />
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 14px 220px' }}>
        {/* At the table */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px 8px' }}>
          <div className="pkr-section-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--felt)' }} />
            At the table · {LIVE_SESSION.seated.length}
          </div>
          <span data-mono style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-2)' }}>
            in {totalChips.toLocaleString()}
          </span>
        </div>
        <div className="pkr-card" style={{ overflow: 'hidden' }}>
          {LIVE_SESSION.seated.map((p, i) => (
            <div key={p.id} style={i === 0 ? { borderTop: 0 } : {}}>
              <PlayerLiveRow p={p} />
            </div>
          ))}
        </div>

        {/* Cashed out */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 2px 8px' }}>
          <div className="pkr-section-label">Cashed out · {LIVE_SESSION.cashed.length}</div>
          <span data-mono style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-2)' }}>
            out {totalCashOuts.toLocaleString()}
          </span>
        </div>
        <div className="pkr-card" style={{ overflow: 'hidden' }}>
          {LIVE_SESSION.cashed.map(p => (
            <PlayerLiveRow key={p.id} p={p} cashed />
          ))}
        </div>

        {/* Balance reminder */}
        <div style={{
          marginTop: 14, padding: '10px 12px', borderRadius: 10,
          background: 'var(--bg-1)', boxShadow: '0 0 0 0.5px var(--line) inset',
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 12, color: 'var(--fg-2)',
        }}>
          <Icon name="scale" size={14} />
          <span style={{ flex: 1 }}>
            <span data-mono style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-1)' }}>
              {totalBuyInsAll.toLocaleString()}
            </span>{' '}buy-ins ·{' '}
            <span data-mono style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-1)' }}>
              {totalCashOuts.toLocaleString()}
            </span>{' '}cashed
          </span>
          <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>checks at end</span>
        </div>
      </div>

      {/* Sticky bottom action bar */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        padding: '10px 12px 16px',
        background: 'linear-gradient(180deg, transparent, var(--bg-0) 22%)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderTop: '0.5px solid var(--line)',
      }}>
        {/* Last event + undo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 10px', borderRadius: 10,
          background: 'var(--bg-2)', marginBottom: 10,
          fontSize: 12, color: 'var(--fg-2)',
        }}>
          <Icon name="refresh" size={12} />
          <span style={{ flex: 1, minWidth: 0 }}>
            Last: <span style={{ color: 'var(--fg-1)' }}>rebuy</span>{' '}
            <span data-mono style={{ fontFamily: 'var(--font-mono)' }}>
              {LIVE_SESSION.lastEvent.amount}
            </span>{' '}
            <span style={{ color: 'var(--fg-1)' }}>{LIVE_SESSION.lastEvent.who}</span>
            <span style={{ color: 'var(--fg-3)' }}> · {LIVE_SESSION.lastEvent.when}</span>
          </span>
          <button className="pkr-btn pkr-btn--ghost pkr-btn--sm" style={{ height: 28, padding: '0 10px' }}>
            Undo
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <ActionBtn icon="plus"  label="Player" />
          <ActionBtn icon="refresh" label="Rebuy" />
          <ActionBtn icon="arrowR" label="Cash out" />
        </div>
        <button style={{
          marginTop: 8, width: '100%', height: 40,
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--fg-2)',
          fontSize: 12.5, fontWeight: 500,
          borderRadius: 10,
        }}>
          End session
        </button>
      </div>
    </div>
  );
}

function LiveStat({ label, value, suffix = '', mono = false }) {
  return (
    <div style={{ background: 'var(--bg-1)', padding: '10px 12px' }}>
      <div style={{ fontSize: 10, color: 'var(--fg-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{
        fontSize: 18, fontWeight: 500, color: 'var(--fg-0)', marginTop: 2,
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-ui)',
        fontVariantNumeric: 'tabular-nums', letterSpacing: -0.01,
      }}>
        {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </div>
    </div>
  );
}

function ActionBtn({ icon, label }) {
  return (
    <button className="pkr-btn pkr-btn--primary" style={{
      flex: 1, height: 56, fontSize: 14, flexDirection: 'column',
      gap: 2, padding: '8px 4px',
    }}>
      <Icon name={icon} size={18} strokeWidth={2.4} />
      <span style={{ fontWeight: 600 }}>{label}</span>
    </button>
  );
}

Object.assign(window, { SessionFork, OfflineLive });
