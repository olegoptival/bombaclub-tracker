// wizard.jsx — Create Online Session wizard (4 steps)

const { useState: useStateW, useEffect: useEffectW } = React;

// ─────────────────────────────────────────────────────────────
// Stepper — top progress bar
// ─────────────────────────────────────────────────────────────
function Stepper({ step, total, labels = [] }) {
  return (
    <div style={{ padding: '14px 14px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--fg-2)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>STEP {step + 1} / {total}</span>
        <span style={{ color: 'var(--fg-1)', fontWeight: 500 }}>{labels[step]}</span>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 999,
            background: i <= step ? 'var(--accent)' : 'var(--bg-3)',
            transition: 'background 200ms',
          }} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Wizard Header — close, title, save-draft
// ─────────────────────────────────────────────────────────────
function WizardHeader({ onClose }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 8px 4px',
    }}>
      <button onClick={onClose} style={{
        width: 40, height: 40, borderRadius: 10,
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: 'var(--fg-1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="x" size={20} />
      </button>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-0)' }}>New online session</div>
      <button style={{
        height: 32, padding: '0 12px', borderRadius: 8,
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: 'var(--fg-2)', fontSize: 12.5, fontWeight: 500,
      }}>
        Save draft
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Step 1 — Title (optional)
// ─────────────────────────────────────────────────────────────
function Step1({ value, onChange }) {
  const presets = ['Bomba NLH', 'Tuesday grind', 'Late session', 'Weekend bomba'];
  return (
    <div style={{ padding: '4px 14px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--fg-0)', letterSpacing: -0.4, lineHeight: 1.2 }}>
          Give it a name <span style={{ color: 'var(--fg-3)', fontWeight: 400 }}>(optional)</span>
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--fg-2)', marginTop: 4, lineHeight: 1.4 }}>
          So you and the others can find it later. Skip and we'll just call it "Online · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}".
        </div>
      </div>
      <input
        className="pkr-input"
        placeholder="Bomba NLH"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ height: 52, fontSize: 17 }}
        autoFocus
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {presets.map(p => (
          <button key={p} onClick={() => onChange(p)} style={{
            padding: '8px 12px', borderRadius: 999,
            background: value === p ? 'var(--accent-soft)' : 'var(--bg-2)',
            color: value === p ? 'var(--accent-hi)' : 'var(--fg-1)',
            border: 'none', cursor: 'pointer',
            fontSize: 12.5, fontWeight: 500,
            boxShadow: value === p ? '0 0 0 0.5px var(--accent-ring) inset' : '0 0 0 0.5px var(--line) inset',
          }}>{p}</button>
        ))}
      </div>

      <div style={{
        marginTop: 10, padding: '12px 14px',
        background: 'var(--bg-1)', borderRadius: 12,
        boxShadow: '0 0 0 0.5px var(--line) inset',
      }}>
        <div style={{ fontSize: 12, color: 'var(--fg-2)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="zap" size={11} /> Quick tip
        </div>
        <div style={{ fontSize: 13, color: 'var(--fg-1)', lineHeight: 1.45 }}>
          Drop your ClubGG end-of-table screenshots in the next step — we'll OCR players and stacks automatically.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Step 2 — Upload + OCR
// ─────────────────────────────────────────────────────────────
function OCRTile({ shot }) {
  if (!shot.parsed && shot.error == null) {
    // Processing
    return (
      <div className="pkr-card" style={{
        padding: 14, display: 'flex', flexDirection: 'column', gap: 10,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 8,
            background: 'var(--bg-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--fg-3)',
            position: 'relative', overflow: 'hidden',
          }}>
            <Icon name="image" size={20} />
            {/* scan line */}
            <div style={{
              position: 'absolute', left: 0, right: 0, height: 2,
              background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
              animation: 'scan 1.4s ease-in-out infinite',
              top: '50%',
              boxShadow: '0 0 8px var(--accent)',
            }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg-1)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{shot.file}</div>
            <div style={{ fontSize: 11.5, color: 'var(--fg-2)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
              {shot.statusText}
            </div>
          </div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
            {Math.round(shot.progress * 100)}%
          </div>
        </div>
        <div style={{ height: 3, background: 'var(--bg-3)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${shot.progress * 100}%`,
            background: 'var(--accent)',
            transition: 'width 600ms cubic-bezier(.4,0,.2,1)',
          }} />
        </div>
      </div>
    );
  }

  // Confidence color
  const conf = shot.confidence ?? 'high';
  const confMap = {
    high: { c: 'var(--pos)', label: 'High' },
    med:  { c: 'var(--accent)', label: 'Med' },
    low:  { c: '#e89888', label: 'Low' },
  }[conf];

  // Parsed — show parsed data preview
  return (
    <div className="pkr-card" style={{ overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: 12,
        borderBottom: '0.5px solid var(--line)',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 8,
          background: 'linear-gradient(135deg, #1a3322, #0f2018)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--felt)',
          boxShadow: '0 0 0 0.5px rgba(30,138,79,0.3) inset',
        }}>
          <Icon name="image" size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-0)' }}>{shot.table}</div>
            {shot.dupTable && (
              <span title="Same table as another screenshot — P&L will be summed" style={{
                fontSize: 9.5, fontWeight: 600, padding: '2px 5px', borderRadius: 4,
                background: 'var(--accent-soft)', color: 'var(--accent-hi)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>R{shot.round}</span>
            )}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '1px 6px 1px 5px', borderRadius: 999,
              background: 'rgba(255,255,255,0.04)',
              fontSize: 10, color: confMap.c,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: 999, background: confMap.c }} />
              OCR {confMap.label}
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--fg-2)', marginTop: 2, display: 'flex', gap: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <Icon name="check" size={10} color="var(--pos)" />
              <span data-mono style={{ fontFamily: 'var(--font-mono)' }}>matched {shot.matched}/{shot.total}</span>
            </span>
            <span style={{ color: 'var(--fg-3)' }}>·</span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              color: shot.sumOk ? 'var(--pos)' : '#e89888',
            }}>
              {shot.sumOk ? <Icon name="check" size={10} /> : <Icon name="alert" size={10} />}
              {shot.sumOk ? 'sums to 0.00' : 'sums off'}
            </span>
          </div>
        </div>
        <button style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--fg-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="more" size={16} />
        </button>
      </div>
      {/* Players row preview */}
      <div style={{ padding: '6px 12px 10px' }}>
        {shot.rows.map((r, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 0',
            borderTop: i === 0 ? 'none' : '0.5px solid var(--line)',
          }}>
            <PlayerAvatar name={r.name} size={22} guest={!r.matched} />
            <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: r.matched ? 'var(--fg-1)' : 'var(--fg-2)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {r.name}
              {!r.matched && (
                <span style={{ marginLeft: 6, fontSize: 10.5, color: '#e89888',
                  padding: '1px 5px', borderRadius: 4,
                  background: 'rgba(217,117,101,0.10)',
                }}>unmatched</span>
              )}
            </div>
            <span data-mono style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>{r.id}</span>
            <MoneyDisplay value={r.pnl} variant="small" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Step2({ shots }) {
  return (
    <div style={{ padding: '4px 14px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--fg-0)', letterSpacing: -0.4, lineHeight: 1.2 }}>
          Drop ClubGG screenshots
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--fg-2)', marginTop: 4, lineHeight: 1.4 }}>
          All screenshots must be from the <span style={{ color: 'var(--fg-1)' }}>same table</span>. Different tables = different sessions. Same table across multiple shots = different rounds — P&amp;L is summed.
        </div>
      </div>

      {/* Upload zone */}
      <button style={{
        width: '100%', minHeight: 110,
        background: 'var(--bg-2)',
        border: '1px dashed var(--line-strong)',
        borderRadius: 14, color: 'var(--fg-1)', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 6, padding: 18,
      }}>
        <span style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--bg-3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--accent)',
        }}>
          <Icon name="upload" size={18} />
        </span>
        <span style={{ fontSize: 14, fontWeight: 500 }}>Tap to add &middot; or paste from clipboard</span>
        <span style={{ fontSize: 11.5, color: 'var(--fg-2)', fontFamily: 'var(--font-mono)' }}>⌘V · JPG, PNG · 10 MB each</span>
      </button>

      {/* Tiles */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {shots.map(s => <OCRTile key={s.id} shot={s} />)}
      </div>

      {/* Multi-shot table hint */}
      <div style={{
        padding: '10px 12px', borderRadius: 10,
        background: 'var(--accent-soft)',
        boxShadow: '0 0 0 0.5px var(--accent-ring) inset',
        display: 'flex', gap: 10, alignItems: 'flex-start',
        fontSize: 12, color: 'var(--fg-1)', lineHeight: 1.45,
      }}>
        <Icon name="alert" size={13} color="var(--accent-hi)" style={{ marginTop: 2 }} />
        <span>
          Two shots from <span style={{ color: 'var(--accent-hi)', fontWeight: 600 }}>Bomba #4187</span> detected. P&amp;L will be summed across rounds.
        </span>
      </div>

      {/* Summary band */}
      <div className="pkr-card" style={{ padding: 14, marginTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="pkr-section-label">Detected so far</div>
          <span data-mono style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-2)' }}>2 of 3 ready</span>
        </div>
        <div style={{ display: 'flex', gap: 18, marginTop: 10 }}>
          <Stat label="Tables" value="1" sub="+ 1 round" />
          <Stat label="Players" value="11" sub="1 unmatched" />
          <Stat label="Total pot" value="4,420" mono />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, mono = true }) {
  const subColor = sub && sub.startsWith('+') ? 'var(--accent-hi)' : '#e89888';
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, color: 'var(--fg-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{
        fontSize: 22, fontWeight: 500, color: 'var(--fg-0)', marginTop: 4,
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-ui)',
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: -0.01,
      }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: subColor, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// 5-minute undo banner — shown after wizard confirm
function UndoBanner({ remaining = 272 }) {
  const m = Math.floor(remaining / 60);
  const s = (remaining % 60).toString().padStart(2, '0');
  return (
    <div style={{
      margin: '14px 14px 0', padding: '12px 14px', borderRadius: 12,
      background: 'linear-gradient(180deg, rgba(212,164,55,0.16), rgba(212,164,55,0.06))',
      boxShadow: '0 0 0 0.5px var(--accent-ring) inset',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <span style={{
        width: 32, height: 32, borderRadius: 8,
        background: 'var(--accent)', color: '#1a1408',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><Icon name="clock" size={16} strokeWidth={2.2} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--accent-hi)' }}>Notifications going out in {m}:{s}</div>
        <div style={{ fontSize: 11.5, color: 'var(--fg-2)' }}>Saved · 11 players, 2 rounds &middot; balances updated</div>
      </div>
      <button className="pkr-btn pkr-btn--ghost pkr-btn--sm">Undo</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Step 3 — Match unmatched players
// ─────────────────────────────────────────────────────────────
function Step3() {
  const [pick, setPick] = useStateW(null);
  const unmatched = OCR_SHOTS[1].rows.find(r => !r.matched);
  return (
    <div style={{ padding: '4px 14px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--fg-0)', letterSpacing: -0.4, lineHeight: 1.2 }}>
          1 player needs a match
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--fg-2)', marginTop: 4, lineHeight: 1.4 }}>
          ClubGG aliases sometimes change. Pick the right member, mark as guest, or skip this row.
        </div>
      </div>

      {/* Unmatched card */}
      <div className="pkr-card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
        <PlayerAvatar name={unmatched.name} size={44} guest />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>{unmatched.name}</div>
          <div style={{ fontSize: 11.5, color: 'var(--fg-2)', display: 'flex', gap: 6, alignItems: 'center', marginTop: 1 }}>
            <span style={{ fontFamily: 'var(--font-mono)' }}>id {unmatched.id}</span>
            <span style={{ color: 'var(--fg-3)' }}>·</span>
            <span>from Bomba #4188</span>
          </div>
        </div>
        <MoneyDisplay value={unmatched.pnl} variant="medium" />
      </div>

      <div style={{ fontSize: 12, color: 'var(--fg-2)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 2px 0' }}>
        Match to member
      </div>
      <div className="pkr-card" style={{ overflow: 'hidden' }}>
        {MEMBERS.slice(0, 5).map((m, i) => {
          const on = pick === m.id;
          return (
            <button key={m.id} onClick={() => setPick(m.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', width: '100%',
              background: on ? 'var(--accent-soft)' : 'transparent',
              border: 'none', cursor: 'pointer',
              borderTop: i === 0 ? 'none' : '0.5px solid var(--line)',
              textAlign: 'left',
            }}>
              <PlayerAvatar name={m.name} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg-0)' }}>{m.nick}</div>
                <div style={{ fontSize: 11.5, color: 'var(--fg-2)', fontFamily: 'var(--font-mono)' }}>
                  ClubGG: {m.clubGG}
                </div>
              </div>
              <span style={{
                width: 18, height: 18, borderRadius: 999,
                background: on ? 'var(--accent)' : 'var(--bg-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: on ? 'none' : '0 0 0 0.5px var(--line-strong) inset',
              }}>
                {on && <Icon name="check" size={11} color="#1a1408" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="pkr-btn pkr-btn--ghost" style={{ flex: 1 }}>Mark as guest</button>
        <button className="pkr-btn pkr-btn--ghost" style={{ flex: 1 }}>Skip row</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Step 4 — Final review
// ─────────────────────────────────────────────────────────────
function Step4() {
  // Merge rows, sum P&L per player
  const allRows = OCR_SHOTS.filter(s => s.parsed).flatMap(s => s.rows);
  const merged = {};
  for (const r of allRows) {
    const key = r.matched || `guest-${r.name}`;
    merged[key] = merged[key] || { name: r.name, matched: r.matched, pnl: 0, tables: 0 };
    merged[key].pnl += r.pnl;
    merged[key].tables += 1;
  }
  const rows = Object.values(merged).sort((a, b) => b.pnl - a.pnl);
  const total = rows.reduce((s, r) => s + r.pnl, 0);
  const pot = rows.reduce((s, r) => s + Math.max(r.pnl, 0), 0);

  return (
    <div style={{ padding: '4px 14px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--fg-0)', letterSpacing: -0.4, lineHeight: 1.2 }}>
          Review &amp; confirm
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--fg-2)', marginTop: 4, lineHeight: 1.4 }}>
          {rows.length} players · 2 tables · merged. Once confirmed you have 5 minutes to undo before notifications go out.
        </div>
      </div>

      {/* Sum check */}
      <div className="pkr-card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{
          width: 36, height: 36, borderRadius: 10,
          background: Math.abs(total) < 0.01 ? 'var(--felt-soft)' : 'rgba(217,117,101,0.10)',
          color: Math.abs(total) < 0.01 ? 'var(--felt)' : '#e89888',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={Math.abs(total) < 0.01 ? "check" : "alert"} size={16} strokeWidth={2.4} />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: Math.abs(total) < 0.01 ? '#7ed09a' : '#e89888' }}>
            {Math.abs(total) < 0.01 ? 'Sums to zero' : `Off by ${fmtMoney(total)}`}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--fg-2)' }}>across all tables</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--fg-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pot</div>
          <span data-mono style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 500 }}>
            {pot.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Merged players */}
      <div className="pkr-card" style={{ overflow: 'hidden' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto 70px',
          gap: 12, padding: '10px 14px',
          fontSize: 11, color: 'var(--fg-2)',
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          <div>Player</div>
          <div style={{ textAlign: 'right' }}>Tables</div>
          <div style={{ textAlign: 'right' }}>P&amp;L</div>
        </div>
        {rows.map((r, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '1fr auto 70px', alignItems: 'center',
            gap: 12, padding: '10px 14px',
            borderTop: '0.5px solid var(--line)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <PlayerAvatar name={r.name} size={28} guest={!r.matched} you={r.matched === 'u1'} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{r.name}{r.matched === 'u1' && <span style={{ color: 'var(--accent)', marginLeft: 5, fontSize: 11 }}>you</span>}</div>
                {!r.matched && <div style={{ fontSize: 10.5, color: '#e89888' }}>guest</div>}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--fg-2)', fontFamily: 'var(--font-mono)' }}>
              {r.tables}
            </div>
            <div style={{ textAlign: 'right' }}>
              <MoneyDisplay value={r.pnl} variant="small" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Wizard root
// ─────────────────────────────────────────────────────────────
function Wizard({ width = 390, initialStep = 1, onClose }) {
  const [step, setStep] = useStateW(initialStep);
  const [title, setTitle] = useStateW('Bomba NLH');
  const labels = ['Title', 'Upload', 'Match players', 'Review'];

  // Inject scan keyframes once
  useEffectW(() => {
    if (document.getElementById('pkr-scan-kf')) return;
    const s = document.createElement('style');
    s.id = 'pkr-scan-kf';
    s.textContent = `@keyframes scan {
      0% { top: 5%; opacity: 0.3; }
      50% { opacity: 1; }
      100% { top: 95%; opacity: 0.3; }
    }`;
    document.head.appendChild(s);
  }, []);

  const cta = step === 0 ? 'Continue'
    : step === 1 ? 'Continue · 2 tables'
    : step === 2 ? 'Confirm match'
    : 'Confirm session';

  return (
    <div className="pkr" style={{
      width, minHeight: 844, height: 844,
      background: 'var(--bg-0)',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>
      <WizardHeader onClose={onClose} />
      <Stepper step={step} total={4} labels={labels} />

      <div style={{ flex: 1, overflow: 'auto', paddingBottom: 90 }}>
        {step === 0 && <Step1 value={title} onChange={setTitle} />}
        {step === 1 && <Step2 shots={OCR_SHOTS} />}
        {step === 2 && <Step3 />}
        {step === 3 && <Step4 />}
      </div>

      {/* Sticky bottom CTA */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        padding: '12px 14px 18px',
        background: 'linear-gradient(180deg, transparent, var(--bg-0) 30%)',
        display: 'flex', gap: 8,
      }}>
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="pkr-btn pkr-btn--ghost" style={{ width: 60 }}>
            <Icon name="chevL" size={16} />
          </button>
        )}
        <button
          onClick={() => step < 3 ? setStep(step + 1) : null}
          className="pkr-btn pkr-btn--primary"
          style={{ flex: 1, height: 50, fontSize: 15 }}
        >
          {cta}
          {step < 3 && <Icon name="chevR" size={16} strokeWidth={2.4} />}
          {step === 3 && <Icon name="check" size={16} strokeWidth={2.6} />}
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { Wizard, Stepper, UndoBanner });
