import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import NavigationBar from './NavigationBar';
import Loading from './Loading';
import { borrowService, MAX_ACTIVE_BORROWS } from '@/services/borrowService';
import type { Borrow } from '@/types/library';
import { useToast } from '@/hooks/useToast';
import { extractErrorMessage } from '@/utils/error';
import { useAuth } from '@/hooks/useAuth';

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
};

function formatDate(value: string) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, DATE_FORMAT_OPTIONS);
}

function isSameMonth(date: Date, reference: Date) {
  return date.getMonth() === reference.getMonth() && date.getFullYear() === reference.getFullYear();
}

export default function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [borrows, setBorrows] = useState<Borrow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBorrowings = async () => {
      try {
        const data = await borrowService.getMyBorrowings('all');
        setBorrows(data);
      } catch (error) {
        showToast(extractErrorMessage(error, 'Unable to load your dashboard data.'), 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchBorrowings();
  }, [showToast]);

  const today = useMemo(() => new Date(), []);

  const activeBorrows = useMemo(
    () => borrows.filter((borrow) => borrow.status === 'active'),
    [borrows]
  );

  const overdueBorrows = useMemo(
    () => activeBorrows.filter((borrow) => borrow.is_overdue),
    [activeBorrows]
  );

  const returnedThisMonth = useMemo(
    () =>
      borrows.filter(
        (borrow) =>
          borrow.status === 'returned' &&
          borrow.returned_at &&
          isSameMonth(new Date(borrow.returned_at), today)
      ).length,
    [borrows, today]
  );

  const dueSoon = useMemo(
    () =>
      [...activeBorrows]
        .sort(
          (a, b) =>
            new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        )
        .slice(0, 3),
    [activeBorrows]
  );

  const limitRemaining = Math.max(MAX_ACTIVE_BORROWS - activeBorrows.length, 0);

  return (
    <div className="min-h-screen bg-gray-900">
      <NavigationBar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-2">
          <p className="text-sm text-indigo-300">Dashboard</p>
          <h1 className="text-3xl font-semibold text-white">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
          </h1>
          <p className="text-gray-400">
            Stay on top of your borrowing commitments with real-time visibility and clear next steps.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loading fullScreen={false} />
          </div>
        ) : (
          <>
            <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 p-5 shadow-lg shadow-indigo-500/10">
                <p className="text-sm text-indigo-200">Active borrowings</p>
                <p className="mt-2 text-3xl font-semibold text-white">{activeBorrows.length}</p>
                <p className="mt-1 text-xs text-indigo-200">{limitRemaining} slots remaining</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 p-5 shadow-lg shadow-emerald-500/10">
                <p className="text-sm text-emerald-200">Returned this month</p>
                <p className="mt-2 text-3xl font-semibold text-white">{returnedThisMonth}</p>
                <p className="mt-1 text-xs text-emerald-200">Great job staying accountable</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-gradient-to-br from-rose-500/20 to-rose-500/5 p-5 shadow-lg shadow-rose-500/10">
                <p className="text-sm text-rose-200">Overdue items</p>
                <p className="mt-2 text-3xl font-semibold text-white">{overdueBorrows.length}</p>
                <p className="mt-1 text-xs text-rose-200">
                  {overdueBorrows.length > 0 ? 'Resolve as soon as possible' : 'All caught up'}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-gradient-to-br from-sky-500/20 to-sky-500/5 p-5 shadow-lg shadow-sky-500/10">
                <p className="text-sm text-sky-200">Total history</p>
                <p className="mt-2 text-3xl font-semibold text-white">{borrows.length}</p>
                <p className="mt-1 text-xs text-sky-200">Lifetime transactions</p>
              </div>
            </section>

            <section className="mt-8 grid gap-6 lg:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-gray-800/80 p-6 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Active borrowings</h2>
                    <p className="text-sm text-gray-400">Monitor due dates and return status in a single view.</p>
                  </div>
                  <Link
                    to="/borrowings"
                    className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
                  >
                    View details →
                  </Link>
                </div>

                <div className="mt-4 overflow-x-auto">
                  {activeBorrows.length === 0 ? (
                    <p className="py-8 text-center text-gray-400">
                      No active borrowings. Browse the <Link to="/books" className="text-indigo-400 underline">catalog</Link> to get started.
                    </p>
                  ) : (
                    <table className="min-w-full divide-y divide-white/5 text-sm">
                      <thead>
                        <tr className="text-left text-gray-400">
                          <th className="py-3 pr-4 font-medium">Book</th>
                          <th className="py-3 pr-4 font-medium">Due date</th>
                          <th className="py-3 pr-4 font-medium text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {activeBorrows.map((borrow) => (
                          <tr key={borrow.id}>
                            <td className="py-4 pr-4">
                              <p className="font-medium text-white">{borrow.book.title}</p>
                              <p className="text-xs text-gray-400">{borrow.book.author}</p>
                            </td>
                            <td className="py-4 pr-4 text-gray-200">{formatDate(borrow.due_date)}</td>
                            <td className="py-4 pr-4 text-right">
                              <span
                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                                  borrow.is_overdue
                                    ? 'bg-rose-500/10 text-rose-300'
                                    : 'bg-emerald-500/10 text-emerald-300'
                                }`}
                              >
                                {borrow.is_overdue ? 'Overdue' : 'On track'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-gray-800/80 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Due soon</h2>
                    <p className="text-sm text-gray-400">Next actionable items</p>
                  </div>
                  <span className="text-sm text-gray-400">{dueSoon.length} items</span>
                </div>

                <div className="mt-5 space-y-4">
                  {dueSoon.length === 0 ? (
                    <p className="text-sm text-gray-400">No upcoming deadlines 🎉</p>
                  ) : (
                    dueSoon.map((borrow) => (
                      <div
                        key={borrow.id}
                        className="rounded-lg border border-white/10 bg-gray-900/50 p-4"
                      >
                        <p className="font-medium text-white">{borrow.book.title}</p>
                        <p className="text-xs text-gray-400">{borrow.book.author}</p>
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <span className="text-gray-400">Due</span>
                          <span className="text-indigo-300">{formatDate(borrow.due_date)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-6 rounded-lg border border-white/10 bg-gray-900/40 p-4">
                  <p className="text-sm text-gray-300">Need another resource?</p>
                  <p className="text-xs text-gray-500">Borrow up to {MAX_ACTIVE_BORROWS} books at a time.</p>
                  <div className="mt-4 flex gap-2">
                    <Link
                      to="/books"
                      className="flex-1 rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-indigo-500"
                    >
                      Browse catalog
                    </Link>
                    <Link
                      to="/borrowings"
                      className="flex-1 rounded-md border border-white/20 px-3 py-2 text-center text-sm font-medium text-white/80 hover:border-white/40"
                    >
                      View history
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
