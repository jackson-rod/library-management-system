import { useEffect, useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

import NavigationBar from './NavigationBar';
import Loading from './Loading';
import type { Borrow } from '@/types/library';
import { borrowService } from '@/services/borrowService';
import { useToast } from '@/hooks/useToast';
import { extractErrorMessage } from '@/utils/error';
import { classNames } from '@/utils/classNames';

type Filter = 'active' | 'all';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'active', label: 'Active borrowings' },
  { id: 'all', label: 'History' },
];

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-amber-500/10 text-amber-200',
  overdue: 'bg-rose-500/10 text-rose-200',
  returned: 'bg-emerald-500/10 text-emerald-200',
};

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, DATE_FORMAT_OPTIONS);
}

export default function BorrowingsPage() {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<Filter>('active');
  const [borrows, setBorrows] = useState<Borrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  useEffect(() => {
    loadBorrowings(filter);
  }, [filter]);

  const loadBorrowings = async (status: Filter) => {
    setLoading(true);
    try {
      const response = await borrowService.getMyBorrowings(status);
      setBorrows(response);
    } catch (error) {
      showToast(extractErrorMessage(error, 'Unable to load your borrowings.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (borrowId: number) => {
    setActionId(borrowId);
    try {
      await borrowService.returnBorrowing(borrowId);
      showToast('Book returned successfully. Thank you!', 'success');
      await loadBorrowings(filter);
    } catch (error) {
      showToast(extractErrorMessage(error, 'Unable to return this book.'), 'error');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <NavigationBar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-2">
          <p className="text-sm text-indigo-300">Borrowings</p>
          <h1 className="text-3xl font-semibold text-white">Track and manage your loans</h1>
          <p className="text-gray-400">
            Stay aligned with due dates, accountability commitments, and your learning roadmap.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={classNames(
                'rounded-full px-5 py-2 text-sm font-medium transition',
                filter === item.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 cursor-pointer'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-gray-800/80 p-6 shadow-lg shadow-black/30">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loading fullScreen={false} />
            </div>
          ) : borrows.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-400">
                {filter === 'active'
                  ? 'You have no active borrowings right now.'
                  : 'No borrowing history yet. Start exploring the catalog!'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {borrows.map((borrow) => (
                <div
                  key={borrow.id}
                  className="flex flex-col gap-4 rounded-xl border border-white/10 bg-gray-900/60 p-4 text-sm text-white md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-base font-semibold">{borrow.book.title}</p>
                    <p className="text-xs text-gray-400">{borrow.book.author}</p>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-400">
                      <span>Borrowed {formatDate(borrow.borrowed_at)}</span>
                      <span className="text-gray-500">•</span>
                      <span>Due {formatDate(borrow.due_date)}</span>
                      {borrow.returned_at && (
                        <>
                          <span className="text-gray-500">•</span>
                          <span>Returned {formatDate(borrow.returned_at)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 text-sm md:text-right">
                    <div className="flex items-center justify-between md:justify-end md:gap-3">
                      <span
                        className={classNames(
                          'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
                          STATUS_STYLES[borrow.status] ?? 'bg-white/10 text-white/70'
                        )}
                      >
                        {borrow.status === 'active' && borrow.is_overdue
                          ? 'Overdue'
                          : borrow.status.charAt(0).toUpperCase() + borrow.status.slice(1)}
                      </span>
                      {borrow.status === 'active' && (
                        <span className="text-xs text-gray-400">
                          {borrow.is_overdue
                            ? `${borrow.days_overdue} day(s) overdue`
                            : 'On schedule'}
                        </span>
                      )}
                    </div>

                    {borrow.status === 'active' && (
                      <button
                        type="button"
                        onClick={() => handleReturn(borrow.id)}
                        disabled={actionId === borrow.id}
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/50"
                      >
                        {actionId === borrow.id ? (
                          <>
                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                            Returning…
                          </>
                        ) : (
                          'Return book'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
