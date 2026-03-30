'use client';

import { useEffect, useState } from 'react';
import {
  AnalyticsSummary,
  DailyRow,
  getAnalyticsSummary,
  getDailyBreakdown,
} from '../../data/analyticsClient';

export default function AnalyticsPage() {
  const [summaries, setSummaries] = useState<(AnalyticsSummary | null)[]>([
    null,
    null,
    null,
  ]);
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [d, w, m, rows] = await Promise.all([
        getAnalyticsSummary('daily'),
        getAnalyticsSummary('weekly'),
        getAnalyticsSummary('monthly'),
        getDailyBreakdown(30),
      ]);
      setSummaries([d, w, m]);
      setDaily(rows);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <p className="text-lg text-gray-400">Loading analytics...</p>
      </div>
    );
  }

  const noData = summaries.every((s) => s === null);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Math Wings Analytics</h1>

      {noData ? (
        <div className="bg-gray-900 rounded-lg p-8 text-center">
          <p className="text-gray-400 mb-2">No analytics data yet.</p>
          <p className="text-gray-500 text-sm">
            Make sure the <code className="bg-gray-800 px-1 rounded">analytics_events</code> table
            exists in Supabase. Run the SQL in{' '}
            <code className="bg-gray-800 px-1 rounded">supabase/analytics_events.sql</code>.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {summaries.map(
              (s, i) =>
                s && (
                  <div key={i} className="bg-gray-900 rounded-lg p-5">
                    <h2 className="text-sm font-medium text-gray-400 mb-3">
                      {s.period}
                    </h2>
                    <div className="space-y-2">
                      <StatRow label="Visitors" value={s.visitors} />
                      <StatRow label="Players" value={s.players} />
                      <StatRow label="Games Played" value={s.games_played} />
                      <StatRow label="Avg Score" value={s.avg_score} />
                      <StatRow label="Max Score" value={s.max_score} />
                      <StatRow
                        label="Avg Duration"
                        value={formatDuration(s.avg_duration_seconds)}
                      />
                      <StatRow
                        label="Total Play Time"
                        value={`${s.total_play_minutes}m`}
                      />
                    </div>
                  </div>
                ),
            )}
          </div>

          {/* Daily Breakdown Table */}
          {daily.length > 0 && (
            <div className="bg-gray-900 rounded-lg p-5">
              <h2 className="text-sm font-medium text-gray-400 mb-3">
                Daily Breakdown (Last 30 Days)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-800">
                      <th className="text-left py-2 pr-4">Date</th>
                      <th className="text-right py-2 px-4">Visitors</th>
                      <th className="text-right py-2 px-4">Games</th>
                      <th className="text-right py-2 pl-4">Avg Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {daily.map((row) => (
                      <tr
                        key={row.date}
                        className="border-b border-gray-800/50 hover:bg-gray-800/30"
                      >
                        <td className="py-2 pr-4 text-gray-300">{row.date}</td>
                        <td className="py-2 px-4 text-right">{row.visitors}</td>
                        <td className="py-2 px-4 text-right">{row.games}</td>
                        <td className="py-2 pl-4 text-right">{row.avg_score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}
