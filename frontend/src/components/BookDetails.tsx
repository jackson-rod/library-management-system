import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import NavigationBar from './NavigationBar';
import Loading from './Loading';
import type { Book } from '@/types/library';
import { bookService } from '@/services/bookService';
import { borrowService, MAX_ACTIVE_BORROWS } from '@/services/borrowService';
import { useToast } from '@/hooks/useToast';
import { extractErrorMessage } from '@/utils/error';

const DETAIL_FIELDS: { label: string; accessor: keyof Book }[] = [
  { label: 'Title', accessor: 'title' },
  { label: 'Author', accessor: 'author' },
  { label: 'ISBN', accessor: 'isbn' },
  { label: 'Publication year', accessor: 'publication_year' },
];

export default function BookDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [borrowCount, setBorrowCount] = useState(0);
  const [isBorrowing, setIsBorrowing] = useState(false);

  useEffect(() => {
    if (!id || Number.isNaN(Number(id))) {
      navigate('/books', { replace: true });
      return;
    }

    const loadDetails = async () => {
      try {
        const [bookResponse, borrowings] = await Promise.all([
          bookService.getById(Number(id)),
          borrowService.getMyBorrowings('active'),
        ]);

        setBook(bookResponse);
        setBorrowCount(borrowings.length);
      } catch (error) {
        showToast(extractErrorMessage(error, 'Unable to load this book.'), 'error');
        navigate('/books', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [id, navigate, showToast]);

  const handleBorrow = async () => {
    if (!book) return;
    setIsBorrowing(true);

    try {
      await borrowService.borrowBook(book.id);
      showToast('Book borrowed successfully!', 'success');
      setBorrowCount((previous) => previous + 1);
      setBook({ ...book, available: false });
    } catch (error) {
      showToast(extractErrorMessage(error, 'Unable to borrow this book right now.'), 'error');
    } finally {
      setIsBorrowing(false);
    }
  };

  if (loading || !book) {
    return (
      <div className="min-h-screen bg-gray-900">
        <NavigationBar />
        <div className="flex justify-center py-16">
          <Loading fullScreen={false} />
        </div>
      </div>
    );
  }

  const limitReached = borrowCount >= MAX_ACTIVE_BORROWS;
  const disableBorrow = !book.available || limitReached || isBorrowing;

  return (
    <div className="min-h-screen bg-gray-900">
      <NavigationBar />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-4">
          <Link to="/books" className="text-sm font-medium text-indigo-400 hover:text-indigo-300">
            ← Back to catalog
          </Link>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950 p-8 shadow-2xl shadow-black/40">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="flex-1 space-y-4">
              <p className="text-sm uppercase tracking-[0.2em] text-indigo-300">Book detail</p>
              <h1 className="text-4xl font-semibold text-white">{book.title}</h1>
              <p className="text-lg text-gray-300">{book.author}</p>

              <div className="grid gap-4 rounded-2xl border border-white/10 bg-gray-900/70 p-4 text-sm text-gray-300 sm:grid-cols-2">
                {DETAIL_FIELDS.map(({ label, accessor }) => (
                  <div key={label}>
                    <p className="text-xs uppercase tracking-widest text-gray-500">{label}</p>
                    <p className="mt-1 text-base text-white">{String(book[accessor])}</p>
                  </div>
                ))}
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500">Availability</p>
                  <p className={`mt-1 inline-flex rounded-full px-3 py-1 text-sm font-medium ${book.available ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
                    {book.available ? 'Available' : 'Unavailable'}
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full rounded-2xl border border-white/10 bg-gray-900/80 p-6 lg:w-80">
              <p className="text-sm text-gray-400">Borrow overview</p>
              <div className="mt-4 space-y-2 text-sm text-gray-300">
                <div className="flex items-center justify-between">
                  <span>Active loans</span>
                  <span className="font-semibold text-white">
                    {borrowCount}/{MAX_ACTIVE_BORROWS}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Availability</span>
                  <span className="font-semibold text-white">{book.available ? 'Ready' : 'In use'}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleBorrow}
                disabled={disableBorrow}
                className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/50"
              >
                {book.available
                  ? isBorrowing
                    ? 'Processing…'
                    : 'Borrow book'
                  : 'Currently unavailable'}
              </button>

              {limitReached && (
                <p className="mt-3 text-xs text-rose-300">
                  You have reached the maximum number of active borrowings. Return a book to continue.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
