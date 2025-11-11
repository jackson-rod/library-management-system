import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import NavigationBar from '@/components/NavigationBar';
import Loading from '@/components/Loading';
import FormInput from '@/components/FormInput';
import FormError from '@/components/FormError';
import { bookService } from '@/services/bookService';
import type { Book } from '@/types/library';
import type { PaginationMeta } from '@/types/library';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { extractErrorMessage } from '@/utils/error';

type BookFormData = {
  title: string;
  author: string;
  isbn?: string;
  publication_year: number;
};

const generateIsbn = () => `978${Math.floor(Math.random() * 1_000_000_0000).toString().padStart(10, '0')}`;

export default function ManageBooksPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BookFormData>({
    defaultValues: {
      title: '',
      author: '',
      isbn: generateIsbn(),
      publication_year: new Date().getFullYear(),
    },
  });

  const currentIsbn = watch('isbn');

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  const fetchBooks = async (pageNumber = 1, searchTerm = '') => {
    setLoading(true);
    setError('');
    try {
      const response = await bookService.list({
        page: pageNumber,
        search: searchTerm || undefined,
      });
      setBooks(response.data);
      setMeta(response.meta);
      setPage(pageNumber);
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load books.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks(1, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const totalBooks = meta?.total ?? books.length;
  const availableBooks = useMemo(() => books.filter((book) => book.available).length, [books]);

  const onSubmit = async (data: BookFormData) => {
    try {
      if (editingBook) {
        const { isbn, ...rest } = data;
        await bookService.update(editingBook.id, rest);
        showToast('Book updated successfully', 'success');
      } else {
        const isbn = data.isbn ?? generateIsbn();
        await bookService.create({ ...data, isbn, available: true });
        showToast('Book created successfully', 'success');
      }
      reset({
        title: '',
        author: '',
        isbn: generateIsbn(),
        publication_year: new Date().getFullYear(),
      });
      setEditingBook(null);
      fetchBooks(page, search);
    } catch (err) {
      showToast(extractErrorMessage(err, 'Unable to save book.'), 'error');
    }
  };

  const handleEdit = (selected: Book) => {
    setEditingBook(selected);
    reset({
      title: selected.title,
      author: selected.author,
      isbn: selected.isbn,
      publication_year: selected.publication_year,
    });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this book?')) return;
    try {
      await bookService.remove(id);
      showToast('Book deleted', 'success');
      fetchBooks(page, search);
    } catch (err) {
      showToast(extractErrorMessage(err, 'Unable to delete book.'), 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditingBook(null);
    reset({
      title: '',
      author: '',
      isbn: generateIsbn(),
      publication_year: new Date().getFullYear(),
    });
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900">
        <NavigationBar />
        <main className="mx-auto max-w-5xl px-4 py-20 text-center text-gray-200">
          <p className="text-sm uppercase tracking-[0.3em] text-rose-300">Restricted</p>
          <h1 className="mt-4 text-3xl font-semibold text-white">Admin access required</h1>
          <p className="mt-2 text-gray-400">
            Book management is restricted to admins. Contact your lead if you need access.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <NavigationBar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm text-indigo-300 uppercase tracking-[0.3em]">Admin</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Manage Books</h1>
          <p className="mt-2 text-gray-400">
            Maintain a clean catalog—import new titles, update metadata, and enforce availability rules.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-gray-800/60 p-4">
            <p className="text-sm text-gray-400">Total books</p>
            <p className="mt-2 text-2xl font-semibold text-white">{meta?.total ?? books.length}</p>
            <p className="text-xs text-gray-500">Across all pages</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-gray-800/60 p-4">
            <p className="text-sm text-gray-400">Available</p>
            <p className="mt-2 text-2xl font-semibold text-white">{availableBooks}</p>
            <p className="text-xs text-gray-500">Ready for borrowing</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-gray-800/60 p-4">
            <p className="text-sm text-gray-400">Unavailable</p>
            <p className="mt-2 text-2xl font-semibold text-white">{books.length - availableBooks}</p>
            <p className="text-xs text-gray-500">Currently borrowed or locked</p>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-gray-800/80 p-6 lg:col-span-2">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Catalog</h2>
                <p className="text-sm text-gray-400">
                  Showing {books.length} of {totalBooks}
                </p>
              </div>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by title, author, or ISBN"
                className="w-full rounded-lg border border-white/10 bg-gray-900/60 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none md:w-72"
              />
            </div>

            <div className="mt-4 overflow-x-auto">
              {loading ? (
                <div className="py-10 text-center">
                  <Loading fullScreen={false} />
                </div>
              ) : books.length === 0 ? (
                <p className="py-10 text-center text-gray-400">No books found.</p>
              ) : (
                <table className="min-w-full divide-y divide-white/10 text-sm text-white">
                  <thead className="text-left text-gray-400">
                    <tr>
                      <th className="py-3 pr-4 font-medium">Title</th>
                      <th className="py-3 pr-4 font-medium">Author</th>
                      <th className="py-3 pr-4 font-medium">ISBN</th>
                      <th className="py-3 pr-4 font-medium text-center">Availability</th>
                      <th className="py-3 pr-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {books.map((book) => (
                      <tr key={book.id}>
                        <td className="py-3 pr-4">
                          <p className="font-semibold text-white">{book.title}</p>
                          <p className="text-xs text-gray-500">{book.publication_year}</p>
                        </td>
                        <td className="py-3 pr-4 text-gray-300">{book.author}</td>
                        <td className="py-3 pr-4 text-gray-300">{book.isbn}</td>
                        <td className="py-3 pr-4 text-center">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              book.available
                                ? 'bg-emerald-500/10 text-emerald-200'
                                : 'bg-rose-500/10 text-rose-200'
                            }`}
                          >
                            {book.available ? 'Available' : 'Unavailable'}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(book)}
                              className="text-xs font-semibold text-indigo-300 hover:text-indigo-200"
                            >
                              Edit
                            </button>
                            <span className="text-gray-700">|</span>
                            <button
                              type="button"
                              onClick={() => handleDelete(book.id)}
                              className="text-xs font-semibold text-rose-300 hover:text-rose-200"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {error && <p className="mt-4 rounded-lg bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p>}

            <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => fetchBooks(page - 1, search)}
                className="rounded-md border border-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <p>
                Page <span className="text-white">{meta?.current_page ?? 1}</span> of{' '}
                <span className="text-white">{meta?.last_page ?? 1}</span>
              </p>
              <button
                type="button"
                disabled={(meta && page >= meta.last_page) || loading}
                onClick={() => fetchBooks(page + 1, search)}
                className="rounded-md border border-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-gray-800/80 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {editingBook ? 'Update Book' : 'Add Book'}
                </h2>
                <p className="text-sm text-gray-400">
                  {editingBook ? 'Adjust metadata or toggle availability.' : 'Log a new title into the system.'}
                </p>
              </div>
              {editingBook && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <FormInput
                id="title"
                label="Title"
                type="text"
                disabled={isSubmitting}
                error={errors.title}
                {...register('title', { required: 'Title is required' })}
              />

              <FormInput
                id="author"
                label="Author"
                type="text"
                disabled={isSubmitting}
                error={errors.author}
                {...register('author', { required: 'Author is required' })}
              />

              {!editingBook && (
                <div className="space-y-2">
                  <FormInput
                    id="isbn"
                    label="ISBN"
                    type="text"
                    disabled={isSubmitting}
                    error={errors.isbn}
                    {...register('isbn', { required: 'ISBN is required' })}
                  />
                  <button
                    type="button"
                    className="text-xs font-semibold text-indigo-300 hover:text-indigo-200"
                    onClick={() => setValue('isbn', generateIsbn())}
                  >
                    Generate ISBN
                  </button>
                </div>
              )}

              <FormInput
                id="publication_year"
                label="Publication Year"
                type="number"
                disabled={isSubmitting}
                error={errors.publication_year}
                {...register('publication_year', {
                  required: 'Publication year is required',
                  valueAsNumber: true,
                })}
              />

              {error && <FormError message={error} />}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-4 w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
              >
                {isSubmitting ? 'Saving...' : editingBook ? 'Update Book' : 'Create Book'}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
