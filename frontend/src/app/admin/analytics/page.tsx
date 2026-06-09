'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Eye, Users, MousePointer, TrendingDown, MessageSquare, Mail, MessageCircleQuestion, Activity } from 'lucide-react';
import AdminShell from '@/components/AdminShell';
import {
  analyticsSummary,
  analyticsTimeseries,
  analyticsTopPages,
  analyticsReferrers,
  analyticsDevices,
  analyticsCountries,
  analyticsRecent,
  analyticsInternal,
  analyticsJourneys,
  analyticsEventAttribution,
  analyticsTopPaths,
  type AnalyticsSummary,
  type TimeseriesPoint,
  type TopPageRow,
  type ReferrerRow,
  type DevicesBreakdown,
  type CountryRow,
  type RecentActivity,
  type InternalMetrics,
  type SessionJourney,
  type EventAttributionRow,
  type TopPathRow,
} from '@/lib/adminApi';

const RANGE_OPTIONS = [
  { id: '24h', label: 'Last 24h', days: 1, granularity: 'hour' as const },
  { id: '7d', label: 'Last 7 days', days: 7, granularity: 'day' as const },
  { id: '30d', label: 'Last 30 days', days: 30, granularity: 'day' as const },
  { id: '90d', label: 'Last 90 days', days: 90, granularity: 'day' as const },
];

type RangeId = (typeof RANGE_OPTIONS)[number]['id'];

function fmtNumber(n: number) {
  return new Intl.NumberFormat().format(Math.round(n));
}
function fmtPercent(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}
function fmtTime(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
function fmtTimeAgo(iso: string) {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const d = Math.floor(hr / 24);
    return `${d}d ago`;
  } catch {
    return iso;
  }
}
function fmtBucket(iso: string, granularity: 'day' | 'hour') {
  try {
    const d = new Date(iso);
    if (granularity === 'hour') {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

export default function AdminAnalyticsPage() {
  const [rangeId, setRangeId] = useState<RangeId>('7d');
  const range = RANGE_OPTIONS.find((r) => r.id === rangeId)!;

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [topPages, setTopPages] = useState<TopPageRow[]>([]);
  const [referrers, setReferrers] = useState<ReferrerRow[]>([]);
  const [devices, setDevices] = useState<DevicesBreakdown | null>(null);
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [recent, setRecent] = useState<RecentActivity[]>([]);
  const [internal, setInternal] = useState<InternalMetrics | null>(null);
  const [journeys, setJourneys] = useState<SessionJourney[]>([]);
  const [topPaths, setTopPaths] = useState<TopPathRow[]>([]);
  const [attributionEvent, setAttributionEvent] = useState<string>('newsletter_signup');
  const [attribution, setAttribution] = useState<EventAttributionRow[]>([]);
  const [journeyTab, setJourneyTab] = useState<'sessions' | 'paths' | 'attribution'>(
    'sessions',
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const to = new Date().toISOString();
    const from = new Date(Date.now() - range.days * 86400_000).toISOString();
    const args = { from, to };

    const [s, t, tp, ref, dev, ctry, rec, intl, jrn, tpath, attr] = await Promise.all([
      analyticsSummary(args),
      analyticsTimeseries({ ...args, granularity: range.granularity }),
      analyticsTopPages({ ...args, limit: 10 }),
      analyticsReferrers({ ...args, limit: 10 }),
      analyticsDevices(args),
      analyticsCountries({ ...args, limit: 8 }),
      analyticsRecent({ limit: 20 }),
      analyticsInternal(args),
      analyticsJourneys({ ...args, limit: 30 }),
      analyticsTopPaths({ ...args, limit: 10 }),
      analyticsEventAttribution({ ...args, eventName: attributionEvent, limit: 10 }),
    ]);

    if (s.ok && s.data) setSummary(s.data.data);
    if (t.ok && t.data) setTimeseries(t.data.data);
    if (tp.ok && tp.data) setTopPages(tp.data.data);
    if (ref.ok && ref.data) setReferrers(ref.data.data);
    if (dev.ok && dev.data) setDevices(dev.data.data);
    if (ctry.ok && ctry.data) setCountries(ctry.data.data);
    if (rec.ok && rec.data) setRecent(rec.data.data);
    if (intl.ok && intl.data) setInternal(intl.data.data);
    if (jrn.ok && jrn.data) setJourneys(jrn.data.data);
    if (tpath.ok && tpath.data) setTopPaths(tpath.data.data);
    if (attr.ok && attr.data) setAttribution(attr.data.data);

    // Surface the first error if any of them failed
    const firstError = [s, t, tp, ref, dev, ctry, rec, intl, jrn, tpath, attr].find((r) => !r.ok);
    if (firstError && !firstError.ok) setError(firstError.error || '');

    setLoading(false);
  }, [range.days, range.granularity, attributionEvent]);

  useEffect(() => {
    load();
  }, [load]);

  const seriesForChart = timeseries.map((p) => ({
    ...p,
    label: fmtBucket(p.bucket, range.granularity),
  }));

  return (
    <AdminShell>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl gold-text-gradient font-bold tracking-wider uppercase">
            Analytics
          </h1>
          <p className="font-body text-sm text-wool-muted mt-1 max-w-2xl">
            First-party, cookieless analytics. No data sent to third parties. IPs hashed daily and
            never stored raw.
          </p>
        </div>
        <div className="inline-flex border border-gold/20 rounded-sm overflow-hidden">
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r.id}
              onClick={() => setRangeId(r.id)}
              className={`font-body text-xs tracking-wider uppercase px-3.5 py-2 transition-colors ${
                rangeId === r.id
                  ? 'bg-gradient-to-br from-gold to-gold-light text-pine'
                  : 'text-wool-muted hover:text-gold'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="font-body text-sm text-heritage bg-heritage/10 border border-heritage/30 px-4 py-3 rounded-sm mb-6">
          {error}
        </p>
      )}

      {/* ---- Top-line cards ---- */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card
          icon={<Users className="w-4 h-4" strokeWidth={1.8} />}
          label="Sessions"
          value={summary ? fmtNumber(summary.sessions) : '—'}
          loading={loading}
        />
        <Card
          icon={<Eye className="w-4 h-4" strokeWidth={1.8} />}
          label="Pageviews"
          value={summary ? fmtNumber(summary.pageviews) : '—'}
          loading={loading}
        />
        <Card
          icon={<MousePointer className="w-4 h-4" strokeWidth={1.8} />}
          label="Pages / Session"
          value={summary ? summary.avgPagesPerSession.toFixed(2) : '—'}
          loading={loading}
        />
        <Card
          icon={<TrendingDown className="w-4 h-4" strokeWidth={1.8} />}
          label="Bounce Rate"
          value={summary ? fmtPercent(summary.bounceRate) : '—'}
          loading={loading}
        />
      </div>

      {/* ---- Time-series chart ---- */}
      <div className="border border-gold/15 bg-highland/30 rounded-sm p-5 mb-8">
        <h2 className="font-display text-base text-gold tracking-wider uppercase mb-4">
          Traffic Over Time
        </h2>
        {timeseries.length === 0 ? (
          <p className="font-accent italic text-wool-muted text-center py-10">
            {loading ? 'Loading…' : 'No traffic recorded in this range yet.'}
          </p>
        ) : (
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <AreaChart data={seriesForChart} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gold-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F4D165" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#D4AF37" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(212,175,55,0.08)" />
                <XAxis
                  dataKey="label"
                  stroke="rgba(245,241,228,0.4)"
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  stroke="rgba(245,241,228,0.4)"
                  tick={{ fontSize: 11 }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#0F1A1F',
                    border: '1px solid rgba(212,175,55,0.3)',
                    borderRadius: 4,
                    color: '#F5F1E4',
                  }}
                  labelStyle={{ color: '#F4D165' }}
                />
                <Area
                  type="monotone"
                  dataKey="sessions"
                  stroke="#D4AF37"
                  strokeWidth={2}
                  fill="url(#gold-fill)"
                  name="Sessions"
                />
                <Area
                  type="monotone"
                  dataKey="pageviews"
                  stroke="rgba(244,209,101,0.5)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  fill="none"
                  name="Pageviews"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ---- Internal metrics row ---- */}
      <h2 className="font-display text-base text-gold tracking-wider uppercase mb-4">
        Engagement
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card
          icon={<MessageSquare className="w-4 h-4" strokeWidth={1.8} />}
          label="Chat Conversations"
          value={internal ? fmtNumber(internal.chat.conversations) : '—'}
          subValue={internal ? `${fmtNumber(internal.chat.messages)} messages` : ''}
          loading={loading}
        />
        <Card
          icon={<Mail className="w-4 h-4" strokeWidth={1.8} />}
          label="Newsletter Signups"
          value={internal ? fmtNumber(internal.newsletterSignups) : '—'}
          loading={loading}
        />
        <Card
          icon={<MessageCircleQuestion className="w-4 h-4" strokeWidth={1.8} />}
          label="Contact Submissions"
          value={internal ? fmtNumber(internal.contactSubmissions) : '—'}
          loading={loading}
        />
        <Card
          icon={<Activity className="w-4 h-4" strokeWidth={1.8} />}
          label="Admin Logins"
          value={internal ? fmtNumber(internal.logins.successes) : '—'}
          subValue={
            internal && internal.logins.failures > 0
              ? `${fmtNumber(internal.logins.failures)} failed`
              : ''
          }
          loading={loading}
        />
      </div>

      {/* ---- Top pages + referrers grid ---- */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <TopList
          title="Top Pages"
          rows={topPages.map((p) => ({
            label: p.path,
            primary: fmtNumber(p.pageviews),
            secondary: `${fmtNumber(p.sessions)} sessions`,
          }))}
          empty={loading ? 'Loading…' : 'No pages tracked yet.'}
        />
        <TopList
          title="Top Referrers"
          rows={referrers.map((r) => ({
            label: r.source,
            primary: fmtNumber(r.sessions),
            secondary: `${fmtNumber(r.pageviews)} pageviews`,
          }))}
          empty={loading ? 'Loading…' : 'No referrers recorded.'}
        />
      </div>

      {/* ---- Devices / browsers / countries grid ---- */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <TopList
          title="Devices"
          rows={
            devices?.devices.map((d) => ({
              label: d.name,
              primary: fmtNumber(d.sessions),
              secondary: '',
            })) || []
          }
          empty={loading ? 'Loading…' : 'No data.'}
        />
        <TopList
          title="Browsers"
          rows={
            devices?.browsers.map((b) => ({
              label: b.name,
              primary: fmtNumber(b.sessions),
              secondary: '',
            })) || []
          }
          empty={loading ? 'Loading…' : 'No data.'}
        />
        <TopList
          title="Countries"
          rows={countries.map((c) => ({
            label: c.country,
            primary: fmtNumber(c.sessions),
            secondary: '',
          }))}
          empty={loading ? 'Loading…' : 'No data.'}
        />
      </div>

      {/* ---- Journeys ---- */}
      <h2 className="font-display text-base text-gold tracking-wider uppercase mb-4">
        Customer Journeys
      </h2>
      <div className="border border-gold/15 bg-highland/30 rounded-sm mb-8 overflow-hidden">
        <div className="flex border-b border-gold/15">
          {[
            { id: 'sessions' as const, label: 'Recent Sessions' },
            { id: 'paths' as const, label: 'Top Paths' },
            { id: 'attribution' as const, label: 'Event Attribution' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setJourneyTab(t.id)}
              className={`font-body text-xs tracking-wider uppercase px-5 py-3 transition-colors ${
                journeyTab === t.id
                  ? 'text-gold border-b-2 border-gold -mb-px bg-gold/5'
                  : 'text-wool-muted hover:text-wool'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {journeyTab === 'sessions' && (
            <>
              {journeys.length === 0 ? (
                <p className="font-accent italic text-wool-muted text-center py-6">
                  {loading ? 'Loading…' : 'No sessions in this range yet.'}
                </p>
              ) : (
                <ul className="divide-y divide-gold/10">
                  {journeys.map((j) => (
                    <li key={j.sessionHash} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-baseline justify-between gap-3 mb-1.5">
                        <div className="font-body text-[11px] text-wool-muted/70">
                          <span className="text-wool-muted">{fmtTimeAgo(j.startedAt)}</span>
                          <span className="mx-2">·</span>
                          <span className="text-gold/80">{j.entryReferrer}</span>
                          <span className="mx-2">·</span>
                          <span>{j.device}</span>
                          <span className="mx-2">·</span>
                          <span>{j.country}</span>
                        </div>
                        <span className="font-mono text-[10px] text-wool-muted/60 shrink-0">
                          {j.pageviewCount} pv
                        </span>
                      </div>
                      <PathChain path={j.path} />
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {journeyTab === 'paths' && (
            <>
              {topPaths.length === 0 ? (
                <p className="font-accent italic text-wool-muted text-center py-6">
                  {loading ? 'Loading…' : 'Not enough multi-page sessions to identify common paths yet.'}
                </p>
              ) : (
                <ul className="divide-y divide-gold/10">
                  {topPaths.map((p, i) => (
                    <li key={i} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-baseline justify-between gap-3 mb-1.5">
                        <span className="font-display text-xs text-gold tracking-wider uppercase">
                          #{i + 1}
                        </span>
                        <span className="font-mono text-xs text-gold shrink-0">
                          {fmtNumber(p.sessions)} sessions
                        </span>
                      </div>
                      <PathChain path={p.path} />
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {journeyTab === 'attribution' && (
            <>
              <div className="mb-5">
                <label className="font-body text-[10px] tracking-wider text-wool-muted uppercase block mb-2">
                  Event
                </label>
                <select
                  value={attributionEvent}
                  onChange={(e) => setAttributionEvent(e.target.value)}
                  className="bg-pine/60 border border-gold/25 px-3 py-2 rounded-sm font-body text-sm text-wool focus:border-gold outline-none"
                >
                  {[
                    'newsletter_signup',
                    'contact_submitted',
                    'chat_opened',
                    'chat_message_sent',
                    'program_selected',
                    'signup_clicked',
                  ].map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <p className="font-body text-[11px] text-wool-muted/60 mt-2">
                  Most common page paths preceding this event (last 6 pages of each session).
                </p>
              </div>
              {attribution.length === 0 ? (
                <p className="font-accent italic text-wool-muted text-center py-6">
                  {loading
                    ? 'Loading…'
                    : `No attribution data for "${attributionEvent}" yet — fire the event a few times to see paths.`}
                </p>
              ) : (
                <ul className="divide-y divide-gold/10">
                  {attribution.map((row, i) => (
                    <li key={i} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-baseline justify-between gap-3 mb-1.5">
                        <span className="font-display text-xs text-gold tracking-wider uppercase">
                          #{i + 1}
                        </span>
                        <span className="font-mono text-xs text-gold shrink-0">
                          {fmtNumber(row.count)} events
                        </span>
                      </div>
                      <PathChain path={row.path} />
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>

      {/* ---- Recent activity ---- */}
      <h2 className="font-display text-base text-gold tracking-wider uppercase mb-4">
        Recent Activity
      </h2>
      <div className="border border-gold/15 rounded-sm overflow-hidden">
        {recent.length === 0 ? (
          <p className="font-accent italic text-wool-muted text-center py-8">
            {loading ? 'Loading…' : 'No recent pageviews yet.'}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-highland/40 border-b border-gold/15">
              <tr className="text-left font-body text-[10px] tracking-wider text-wool-muted uppercase">
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Path</th>
                <th className="px-4 py-3">Referrer</th>
                <th className="px-4 py-3 hidden md:table-cell">Device</th>
                <th className="px-4 py-3 hidden md:table-cell">Country</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r, i) => (
                <tr
                  key={i}
                  className="border-b border-gold/10 last:border-b-0 hover:bg-highland/20"
                >
                  <td className="px-4 py-3 font-body text-xs text-wool-muted whitespace-nowrap">
                    {fmtTime(r.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-wool break-all">{r.path}</td>
                  <td className="px-4 py-3 font-body text-xs text-wool-muted break-all">
                    {r.referrer}
                  </td>
                  <td className="px-4 py-3 font-body text-xs text-wool-muted hidden md:table-cell">
                    {r.device} · {r.browser}
                  </td>
                  <td className="px-4 py-3 font-body text-xs text-wool-muted hidden md:table-cell">
                    {r.country}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminShell>
  );
}

/* ---- Reusable card ---- */
function Card({
  icon,
  label,
  value,
  subValue,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  loading?: boolean;
}) {
  return (
    <div className="border border-gold/15 bg-highland/30 rounded-sm p-5">
      <div className="flex items-center gap-2 text-wool-muted mb-2">
        {icon}
        <span className="font-body text-[10px] tracking-wider uppercase">{label}</span>
      </div>
      <div className="font-display text-2xl text-gold tracking-wider">
        {loading ? '…' : value}
      </div>
      {subValue ? (
        <div className="font-body text-[11px] text-wool-muted/70 mt-1">{subValue}</div>
      ) : null}
    </div>
  );
}

/* ---- Reusable top-N list ---- */
function TopList({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: { label: string; primary: string; secondary: string }[];
  empty: string;
}) {
  return (
    <div className="border border-gold/15 bg-highland/30 rounded-sm p-5">
      <h3 className="font-display text-sm text-gold tracking-wider uppercase mb-4">{title}</h3>
      {rows.length === 0 ? (
        <p className="font-accent italic text-wool-muted text-xs text-center py-4">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r, i) => (
            <li key={i} className="flex items-baseline justify-between gap-3">
              <span className="font-body text-sm text-wool truncate flex-1">{r.label}</span>
              <span className="font-mono text-xs text-gold shrink-0">{r.primary}</span>
              {r.secondary && (
                <span className="font-body text-[10px] text-wool-muted/60 shrink-0 ml-1">
                  {r.secondary}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---- Path chain visualization (small chevron-separated breadcrumb) ---- */
function PathChain({ path }: { path: string[] }) {
  if (!path || path.length === 0) {
    return <span className="font-accent italic text-wool-muted/60 text-xs">empty path</span>;
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {path.map((p, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <code className="font-mono text-[11px] bg-pine/60 border border-gold/15 text-wool px-2 py-0.5 rounded-sm break-all">
            {p}
          </code>
          {i < path.length - 1 && (
            <span className="text-gold/40 text-xs select-none">→</span>
          )}
        </span>
      ))}
    </div>
  );
}
