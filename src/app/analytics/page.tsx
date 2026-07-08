import AnalyticsDashboard from './AnalyticsDashboard';
import { getAnalyticsSummary, getDailyBreakdown } from '../../data/supabaseServer';

// Run the password check on every request (the env var never ships to the client).
export const dynamic = 'force-dynamic';

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;
  const password =
    process.env.ANALYTICS_PASSWORD ?? process.env.NEXT_PUBLIC_ANALYTICS_PASSWORD;

  if (password && key !== password) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <p className="text-gray-500">404 | Not Found</p>
      </div>
    );
  }

  const [dailySummary, weeklySummary, monthlySummary, daily] = await Promise.all([
    getAnalyticsSummary('daily'),
    getAnalyticsSummary('weekly'),
    getAnalyticsSummary('monthly'),
    getDailyBreakdown(30),
  ]);

  return (
    <AnalyticsDashboard
      summaries={[dailySummary, weeklySummary, monthlySummary]}
      daily={daily}
    />
  );
}
