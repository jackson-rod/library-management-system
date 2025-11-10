import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import NavigationBar from './NavigationBar';
import Loading from './Loading';
import { bookService } from '@/services/bookService';
import { borrowService, MAX_ACTIVE_BORROWS } from '@/services/borrowService';
import type { Book, PaginationMeta } from '@/types/library';
import { useToast } from '@/hooks/useToast';
import { extractErrorMessage } from '@/utils/error';

const SEARCH_DEBOUNCE_MS = 350;

export default function BooksPage() {
  const { showToast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [borrowCount, setBorrowCount] = useState(0);
  const [borrowInFlight, setBorrowInFlight] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    loadBooks(1, debouncedSearch);
  }, [debouncedSearch]);

  useEffect(() => {
    refreshBorrowCount();
  }, []);

  const borrowLimitReached = useMemo(
    () => borrowCount >= MAX_ACTIVE_BORROWS,
    [borrowCount]
  );

  const loadBooks = async (pageNumber = 1, term = '') => {
    setLoading(true);
    try {
      const response = await bookService.list({
        page: pageNumber,
        search: term || undefined,
      });

      setBooks(response.data);
      setMeta(response.meta);
      setPage(pageNumber);
    } catch (error) {
      showToast(extractErrorMessage(error, 'Unable to load books right now.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const refreshBorrowCount = async () => {
    try {
      const response = await borrowService.getMyBorrowings('active');
      setBorrowCount(response.length);
    } catch (error) {
      showToast(extractErrorMessage(error, 'Unable to load your borrowing summary.'), 'error');
    }
  };

  const handleBorrow = async (bookId: number) => {
    setBorrowInFlight(bookId);

    try {
      await borrowService.borrowBook(bookId);
      showToast('Book successfully borrowed. Check your dashboard for details.', 'success');
      setBorrowCount((prev) => prev + 1);
      await loadBooks(page, debouncedSearch);
    } catch (error) {
      showToast(extractErrorMessage(error, 'Unable to borrow this book.'), 'error');
    } finally {
      setBorrowInFlight(null);
    }
  };

  const handlePageChange = (direction: 'next' | 'prev') => {
    if (!meta) return;

    if (direction === 'next' && page < meta.last_page) {
      loadBooks(page + 1, debouncedSearch);
    }

    if (direction === 'prev' && page > 1) {
      loadBooks(page - 1, debouncedSearch);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <NavigationBar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-2">
          <p className="text-sm text-indigo-300">Catalog</p>
          <h1 className="text-3xl font-semibold text-white">Browse available books</h1>
          <p className="text-gray-400">
            Discover titles, borrow instantly, and keep your pipeline filled with learning opportunities.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-white/10 bg-gray-800/60 p-4">
            <p className="text-sm text-gray-400">Active borrowings</p>
            <p className="mt-2 text-2xl font-semibold text-white">{borrowCount}</p>
            <p className="text-xs text-gray-500">Out of {MAX_ACTIVE_BORROWS} allowed</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-gray-800/60 p-4">
            <p className="text-sm text-gray-400">Availability</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {books.filter((book) => book.available).length}
            </p>
            <p className="text-xs text-gray-500">Books ready to borrow</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-gray-800/60 p-4">
            <p className="text-sm text-gray-400">Search</p>
            <p className="mt-2 text-2xl font-semibold text-white">{debouncedSearch ? `"${debouncedSearch}"` : '—'}</p>
            <p className="text-xs text-gray-500">Filtered results</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-gray-800/60 p-4">
            <p className="text-sm text-gray-400">Status</p>
            <p className={`mt-2 text-2xl font-semibold ${borrowLimitReached ? 'text-rose-300' : 'text-emerald-300'}`}>
              {borrowLimitReached ? 'Limit reached' : 'Available'}
            </p>
            <p className="text-xs text-gray-500">
              {borrowLimitReached ? 'Return a book to continue borrowing' : 'You can borrow more books'}
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-white/10 bg-gray-800/80 p-6 shadow-lg shadow-black/30">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-3 rounded-lg border border-white/10 bg-gray-900/60 px-3 py-2">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by title, author, or ISBN"
                className="w-full bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-300">
              Page {meta?.current_page ?? 1} of {meta?.last_page ?? 1}
              <div className="flex rounded-md border border-white/10">
                <button
                  type="button"
                  className="px-3 py-2 text-xs font-medium text-white/70 hover:bg-white/5 disabled:cursor-not-allowed disabled:text-white/30"
                  onClick={() => handlePageChange('prev')}
                  disabled={page === 1 || loading}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="border-l border-white/5 px-3 py-2 text-xs font-medium text-white/70 hover:bg-white/5 disabled:cursor-not-allowed disabled:text-white/30"
                  onClick={() => handlePageChange('next')}
                  disabled={meta ? page >= meta.last_page || loading : true}
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loading fullScreen={false} />
              </div>
            ) : books.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-400">No books found. Try a different keyword.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-white/5 text-sm">
                <thead>
                  <tr className="text-left text-gray-400">
                    <th className="py-3 pr-4 font-medium">Title</th>
                    <th className="py-3 pr-4 font-medium">Author</th>
                    <th className="py-3 pr-4 font-medium">ISBN</th>
                    <th className="py-3 pr-4 font-medium text-center">Availability</th>
                    <th className="py-3 pr-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white">
                  {books.map((book) => {
                    const isAvailable = book.available;
                    const disableBorrow = !isAvailable || borrowLimitReached || borrowInFlight === book.id;

                    return (
                      <tr key={book.id}>
                        <td className="py-4 pr-4">
                          <Link
                            to={`/books/${book.id}`}
                            className="font-semibold text-white hover:text-indigo-300"
                          >
                            {book.title}
                          </Link>
                          <p className="text-xs text-gray-400">Published {book.publication_year}</p>
                        </td>
                        <td className="py-4 pr-4 text-gray-200">{book.author}</td>
                        <td className="py-4 pr-4 text-gray-200">{book.isbn}</td>
                        <td className="py-4 pr-4 text-center">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                              isAvailable
                                ? 'bg-emerald-500/10 text-emerald-300'
                                : 'bg-rose-500/10 text-rose-300'
                            }`}
                          >
                            {isAvailable ? 'Available' : 'Unavailable'}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleBorrow(book.id)}
                            disabled={disableBorrow}
                            className="rounded-md bg-indigo-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
                          >
                            {borrowInFlight === book.id ? 'Processing…' : 'Borrow'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
