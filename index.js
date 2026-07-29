import { useEffect, useState } from 'react';

const COLORS = {
  meta: '#4F46E5',
  lsa: '#0EA5E9',
  green: '#10B981',
  amber: '#F59E0B',
  red: '#EF4444',
  bg: '#0F172A',
  card: '#1E293B',
  border: '#334155',
  text: '#F1F5F9',
  muted: '#94A3B8',
};

function fmt$(n) {
  return '$' + (n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function pct(a, b) {
  if (!b) return '—';
  return Math.round((a / b) * 100) + '%';
}

function Card({ title, value, sub, color }) {
  return (
    <div style={{
      background: COLORS.card, border: `1px solid ${COLORS.border}`,
      borderRadius: 12, padding: '20px 24px', flex: 1, minWidth: 160,
    }}>
      <div style={{ color: COLORS.muted, fontSize: 13, marginBottom: 6 }}>{title}</div>
      <div style={{ color: color || COLORS.text, fontSize: 28, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ color: COLORS.muted, fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function FunnelBar({ label, steps, color }) {
  const max = steps[0]?.value || 1;
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ color: COLORS.text, fontWeight: 600, marginBottom: 12, fontSize: 15 }}>{label}</div>
      {steps.map((step, i) => {
        const width = Math.max(4, (step.value / max) * 100);
        return (
          <div key={i} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: COLORS.muted, fontSize: 13 }}>{step.label}</span>
              <span style={{ color: COLORS.text, fontSize: 13, fontWeight: 600 }}>
                {step.value} {step.rate && <span style={{ color: COLORS.muted, fontWeight: 400 }}>({step.rate})</span>}
              </span>
            </div>
            <div style={{ background: COLORS.border, borderRadius: 4, height: 10 }}>
              <div style={{
                width: `${width}%`, height: '100%', borderRadius: 4,
                background: color, opacity: 1 - i * 0.15,
                transition: 'width 0.8s ease',
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LeadTable({ leads }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
            {['Name', 'Phone', 'In HCP', 'Estimate Booked', 'Estimate Approved', 'Revenue'].map(h => (
              <th key={h} style={{ color: COLORS.muted, textAlign: 'left', padding: '8px 12px', fontWeight: 500 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((l, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              <td style={{ padding: '10px 12px', color: COLORS.text }}>{l.name || '—'}</td>
              <td style={{ padding: '10px 12px', color: COLORS.muted }}>{l.phone || '—'}</td>
              <td style={{ padding: '10px 12px' }}>
                <span style={{
                  background: l.inHCP ? '#10B98122' : '#EF444422',
                  color: l.inHCP ? COLORS.green : COLORS.red,
                  padding: '2px 8px', borderRadius: 99, fontSize: 12,
                }}>{l.inHCP ? 'Yes' : 'No'}</span>
              </td>
              <td style={{ padding: '10px 12px' }}>
                <span style={{
                  background: l.bookedEstimate ? '#10B98122' : '#33415522',
                  color: l.bookedEstimate ? COLORS.green : COLORS.muted,
                  padding: '2px 8px', borderRadius: 99, fontSize: 12,
                }}>{l.bookedEstimate ? 'Yes' : 'No'}</span>
              </td>
              <td style={{ padding: '10px 12px' }}>
                <span style={{
                  background: l.approvedEstimate ? '#10B98122' : '#33415522',
                  color: l.approvedEstimate ? COLORS.green : COLORS.muted,
                  padding: '2px 8px', borderRadius: 99, fontSize: 12,
                }}>{l.approvedEstimate ? 'Yes' : 'No'}</span>
              </td>
              <td style={{ padding: '10px 12px', color: l.revenue > 0 ? COLORS.green : COLORS.muted }}>
                {l.revenue > 0 ? fmt$(l.revenue) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    fetch('/api/funnel')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const styles = {
    root: {
      background: COLORS.bg, minHeight: '100vh', color: COLORS.text,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      padding: '32px 24px', maxWidth: 1100, margin: '0 auto',
    },
  };

  if (loading) return (
    <div style={{ ...styles.root, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
        <div style={{ color: COLORS.muted }}>Loading funnel data…</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ ...styles.root, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ color: COLORS.red, textAlign: 'center' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>Error loading data</div>
        <div style={{ color: COLORS.muted, fontSize: 14 }}>{error}</div>
      </div>
    </div>
  );

  const { meta, lsa } = data;

  const totalRevenue = (meta.revenue || 0) + (lsa.revenue || 0);

  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>⚡ Panel Swap Electric</div>
          <div style={{ color: COLORS.muted, fontSize: 14 }}>Lead Conversion Funnel</div>
        </div>
        <div style={{ color: COLORS.muted, fontSize: 12, textAlign: 'right' }}>
          Last updated<br />
          <span style={{ color: COLORS.text }}>{new Date(data.lastUpdated).toLocaleString()}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
        <Card title="Meta Leads (GHL)" value={meta.totalLeads} sub="From Meta ads" color={COLORS.meta} />
        <Card title="Meta → HCP" value={meta.inHCP} sub={`${pct(meta.inHCP, meta.totalLeads)} conversion`} />
        <Card title="Estimates Booked" value={meta.estimateBooked + lsa.estimateBooked} sub="Both sources" color={COLORS.amber} />
        <Card title="Estimates Approved" value={meta.estimateApproved + lsa.estimateApproved} sub="Both sources" color={COLORS.green} />
        <Card title="Total Revenue" value={fmt$(totalRevenue)} sub="Closed jobs" color={COLORS.green} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 0 }}>
        {['overview', 'meta', 'lsa'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '8px 20px', fontSize: 14, fontWeight: 500,
            color: tab === t ? COLORS.text : COLORS.muted,
            borderBottom: tab === t ? `2px solid ${COLORS.meta}` : '2px solid transparent',
            marginBottom: -1,
          }}>
            {t === 'overview' ? 'Overview' : t === 'meta' ? 'Meta Ads' : 'Google LSA'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24 }}>
            <FunnelBar
              label="Meta Ads Funnel"
              color={COLORS.meta}
              steps={[
                { label: 'Leads in (GHL)', value: meta.totalLeads },
                { label: 'Entered HCP', value: meta.inHCP, rate: pct(meta.inHCP, meta.totalLeads) },
                { label: 'Estimate Booked', value: meta.estimateBooked, rate: pct(meta.estimateBooked, meta.inHCP) },
                { label: 'Estimate Approved', value: meta.estimateApproved, rate: pct(meta.estimateApproved, meta.estimateBooked) },
              ]}
            />
            <div style={{ marginTop: 8, color: COLORS.green, fontSize: 14 }}>Revenue: {fmt$(meta.revenue)}</div>
          </div>
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24 }}>
            <FunnelBar
              label="Google LSA Funnel"
              color={COLORS.lsa}
              steps={[
                { label: 'Customers in HCP', value: lsa.inHCP },
                { label: 'Estimate Booked', value: lsa.estimateBooked, rate: pct(lsa.estimateBooked, lsa.inHCP) },
                { label: 'Estimate Approved', value: lsa.estimateApproved, rate: pct(lsa.estimateApproved, lsa.estimateBooked) },
              ]}
            />
            <div style={{ marginTop: 8, color: COLORS.green, fontSize: 14 }}>Revenue: {fmt$(lsa.revenue)}</div>
          </div>
        </div>
      )}

      {tab === 'meta' && (
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24 }}>
          <div style={{ marginBottom: 20, color: COLORS.muted, fontSize: 14 }}>
            {meta.totalLeads} Meta leads — {meta.inHCP} matched to HCP
          </div>
          <LeadTable leads={meta.details || []} />
        </div>
      )}

      {tab === 'lsa' && (
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24 }}>
          <div style={{ color: COLORS.muted, fontSize: 14, marginBottom: 12 }}>
            LSA lead detail view requires uploading your Google LSA CSV. Connect via the API route to enable real-time LSA tracking.
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Card title="HCP Customers (non-Meta)" value={lsa.inHCP} />
            <Card title="Estimates Booked" value={lsa.estimateBooked} sub={pct(lsa.estimateBooked, lsa.inHCP)} color={COLORS.amber} />
            <Card title="Estimates Approved" value={lsa.estimateApproved} sub={pct(lsa.estimateApproved, lsa.estimateBooked)} color={COLORS.green} />
            <Card title="Revenue" value={fmt$(lsa.revenue)} color={COLORS.green} />
          </div>
        </div>
      )}
    </div>
  );
}
