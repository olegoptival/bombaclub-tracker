// design-system.jsx — Showcase of shared components
const { useState: useStateDS } = React;

function DSSection({ title, desc, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {title}
      </div>
      {desc && <div style={{ fontSize: 13, color: 'var(--fg-2)', marginTop: 4, maxWidth: 540, lineHeight: 1.45 }}>{desc}</div>}
      <div style={{ marginTop: 14 }}>{children}</div>
    </div>
  );
}

function Swatch({ token, hex, label }) {
  return (
    <div style={{ width: 120 }}>
      <div style={{
        height: 60, borderRadius: 10, background: hex,
        boxShadow: '0 0 0 0.5px var(--line-strong) inset',
      }} />
      <div style={{ marginTop: 8, fontSize: 12, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 11, color: 'var(--fg-2)', fontFamily: 'var(--font-mono)' }}>{token}</div>
      <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>{hex}</div>
    </div>
  );
}

function DesignSystemPage({ width = 1180 }) {
  return (
    <div className="pkr" style={{
      width, padding: 28,
      background: 'var(--bg-0)', color: 'var(--fg-0)',
      minHeight: 800,
    }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.5 }}>Design system</div>
        <div style={{ fontSize: 14, color: 'var(--fg-2)', marginTop: 4, maxWidth: 580, lineHeight: 1.5 }}>
          Foundation for the Poker Club Tracker. Late-night, focused, slightly luxurious. Mobile-first, dark by default.
        </div>
      </div>

      {/* Colors */}
      <DSSection title="Surfaces & text" desc="Five-step dark surface ramp with warm neutrals. Pure black is reserved for nothing.">
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <Swatch label="Page" token="--bg-0" hex="#0a0a0b" />
          <Swatch label="Card" token="--bg-1" hex="#111114" />
          <Swatch label="Input" token="--bg-2" hex="#17171c" />
          <Swatch label="Hover" token="--bg-3" hex="#1f1f25" />
          <Swatch label="Raised" token="--bg-4" hex="#2a2a31" />
          <Swatch label="FG primary" token="--fg-0" hex="#f0efe9" />
          <Swatch label="FG secondary" token="--fg-1" hex="#c9c8c0" />
          <Swatch label="FG tertiary" token="--fg-2" hex="#8c8b83" />
        </div>
      </DSSection>

      <DSSection title="Accent & money" desc="Single warm accent (amber whiskey). Money colors are muted on purpose — never neon.">
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <Swatch label="Accent" token="--accent" hex="#d4a437" />
          <Swatch label="Felt" token="--felt" hex="#1e8a4f" />
          <Swatch label="Positive" token="--pos" hex="#6fbf73" />
          <Swatch label="Negative" token="--neg" hex="#d97565" />
          <Swatch label="Disputed" token="--status-disputed" hex="#d97565" />
        </div>
      </DSSection>

      {/* Typography */}
      <DSSection title="Typography" desc="Geist for UI, Geist Mono for every numeric value. Tabular numerals on by default.">
        <div className="pkr-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>Geist 600 / -0.04em / 56</div>
            <div style={{ fontSize: 56, fontWeight: 600, letterSpacing: -0.04 + 'em', lineHeight: 1.0 }}>Late Night Felt</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>Geist 500 / 22</div>
            <div style={{ fontSize: 22, fontWeight: 500 }}>Drop ClubGG screenshots</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>Geist 500 / 14.5</div>
            <div style={{ fontSize: 14.5, fontWeight: 500 }}>New session</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>Geist Mono 500 / tabular</div>
            <div data-mono style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 500 }}>
              −1,170.25 &nbsp; +138.59 &nbsp; +0.00
            </div>
          </div>
        </div>
      </DSSection>

      {/* MoneyDisplay */}
      <DSSection title="MoneyDisplay" desc="Sign-aware coloring, monospaced, thousand separators. Variants line up across columns.">
        <div className="pkr-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
          <div><div style={{ fontSize: 11, color: 'var(--fg-2)' }}>hero</div><MoneyDisplay value={-138.59} variant="hero" /></div>
          <div><div style={{ fontSize: 11, color: 'var(--fg-2)' }}>big</div><MoneyDisplay value={482.50} variant="big" /></div>
          <div><div style={{ fontSize: 11, color: 'var(--fg-2)' }}>medium</div><div><MoneyDisplay value={-1170.25} variant="medium" /></div></div>
          <div><div style={{ fontSize: 11, color: 'var(--fg-2)' }}>small</div><div><MoneyDisplay value={42.10} variant="small" /></div></div>
          <div><div style={{ fontSize: 11, color: 'var(--fg-2)' }}>zero</div><div><MoneyDisplay value={0} variant="medium" /></div></div>
        </div>
      </DSSection>

      {/* Avatars */}
      <DSSection title="PlayerAvatar" desc="Initials with deterministic warm palette. Dotted ring = guest. Amber ring = you.">
        <div className="pkr-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          {MEMBERS.slice(0, 6).map(m => (
            <div key={m.id} style={{ textAlign: 'center' }}>
              <PlayerAvatar name={m.name} size={44} you={m.id === 'u1'} />
              <div style={{ fontSize: 11, color: 'var(--fg-2)', marginTop: 6 }}>{m.nick}</div>
            </div>
          ))}
          <div style={{ textAlign: 'center' }}>
            <PlayerAvatar name="ApexHero22" size={44} guest />
            <div style={{ fontSize: 11, color: 'var(--fg-2)', marginTop: 6 }}>guest</div>
          </div>
        </div>
      </DSSection>

      {/* Status */}
      <DSSection title="StatusBadge" desc="Same shape, dot color carries meaning. Always paired with a label — color is never the only signal.">
        <div className="pkr-card" style={{ padding: 20, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <StatusBadge status="ended" />
          <StatusBadge status="live" />
          <StatusBadge status="in_progress" />
          <StatusBadge status="disputed" />
          <StatusBadge status="cancelled" />
          <StatusBadge status="auto" />
          <StatusBadge status="active" />
          <StatusBadge status="pending" />
          <StatusBadge status="rejected" />
          <StatusBadge status="inactive" />
        </div>
      </DSSection>

      {/* Buttons */}
      <DSSection title="Buttons" desc="Primary is the only place the warm accent lands as a fill. Ghost handles the rest. Danger is reserved for balance changes.">
        <div className="pkr-card" style={{ padding: 20, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <button className="pkr-btn pkr-btn--primary"><Icon name="plus" size={16} strokeWidth={2.4} /> New session</button>
          <button className="pkr-btn pkr-btn--ghost">Save draft</button>
          <button className="pkr-btn pkr-btn--danger">Adjust balance</button>
          <button className="pkr-btn pkr-btn--primary pkr-btn--sm">Approve</button>
          <button className="pkr-btn pkr-btn--ghost pkr-btn--sm">Cancel</button>
        </div>
      </DSSection>

      {/* Session type icon */}
      <DSSection title="SessionTypeIcon" desc="Single source of truth for online vs live. Online uses felt-green, live uses amber.">
        <div className="pkr-card" style={{ padding: 20, display: 'flex', gap: 24, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SessionTypeIcon type="online" /> <span style={{ fontSize: 13 }}>Online</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SessionTypeIcon type="offline" /> <span style={{ fontSize: 13 }}>Live at table</span>
          </div>
        </div>
      </DSSection>

      {/* Empty state */}
      <DSSection title="EmptyState" desc="Quiet, no mascots. Headline / one-line body / a single CTA when relevant.">
        <div className="pkr-card" style={{ padding: 0, maxWidth: 420, overflow: 'hidden' }}>
          <EmptyState
            icon="list"
            title="No clubs yet"
            body="Ask your host for an invite — they can generate one from Members management."
            cta={<button className="pkr-btn pkr-btn--ghost pkr-btn--sm">Learn more</button>}
          />
        </div>
      </DSSection>

      {/* NavBar mobile */}
      <DSSection title="NavBar" desc="Bottom on mobile (5 tabs, 44px hit targets), inline on desktop top bar.">
        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ width: 360, borderRadius: 14, overflow: 'hidden', boxShadow: '0 0 0 0.5px var(--line-strong) inset' }}>
            <BottomNav active="home" onTab={() => {}} />
          </div>
        </div>
      </DSSection>

      {/* Sparkline */}
      <DSSection title="Sparkline & Chart" desc="recharts under the hood — area fill on hero, plain line for inline rows.">
        <div className="pkr-card" style={{ padding: 20, display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--fg-2)', marginBottom: 6 }}>Sparkline · positive</div>
            <Sparkline data={SPARK} width={140} height={36} stroke="var(--pos)" fill="rgba(111,191,115,0.12)" />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--fg-2)', marginBottom: 6 }}>Sparkline · accent</div>
            <Sparkline data={SPARK} width={140} height={36} />
          </div>
        </div>
      </DSSection>
    </div>
  );
}

Object.assign(window, { DesignSystemPage });
