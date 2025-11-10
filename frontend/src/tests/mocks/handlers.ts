import { http, HttpResponse } from 'msw';

// Use the same base URL as the application
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9080/api';

type MockBook = {
  id: number;
  title: string;
  author: string;
  isbn: string;
  publication_year: number;
  available: boolean;
};

export type MockBorrowRecord = {
  id: number;
  userId: number;
  bookId: number;
  borrowedAt: string;
  dueDate: string;
  returnedAt: string | null;
};

const day = 24 * 60 * 60 * 1000;
const now = Date.now();

const initialBooks: MockBook[] = [
  {
    id: 1,
    title: 'Atomic Habits',
    author: 'James Clear',
    isbn: '9780735211292',
    publication_year: 2018,
    available: true,
  },
  {
    id: 2,
    title: 'Deep Work',
    author: 'Cal Newport',
    isbn: '9781455586691',
    publication_year: 2016,
    available: false,
  },
  {
    id: 3,
    title: 'Clean Architecture',
    author: 'Robert C. Martin',
    isbn: '9780134494166',
    publication_year: 2017,
    available: true,
  },
];

const initialBorrowings: MockBorrowRecord[] = [
  {
    id: 100,
    userId: 2,
    bookId: 2,
    borrowedAt: new Date(now - 3 * day).toISOString(),
    dueDate: new Date(now + 11 * day).toISOString(),
    returnedAt: null,
  },
  {
    id: 101,
    userId: 2,
    bookId: 3,
    borrowedAt: new Date(now - 20 * day).toISOString(),
    dueDate: new Date(now - 6 * day).toISOString(),
    returnedAt: new Date(now - 5 * day).toISOString(),
  },
];

let mockBooks: MockBook[] = [];
let mockBorrowings: MockBorrowRecord[] = [];

const clone = <T>(data: T): T => JSON.parse(JSON.stringify(data));

const syncBookAvailability = () => {
  mockBooks = mockBooks.map((book) => ({
    ...book,
    available: true,
  }));

  mockBorrowings.forEach((borrow) => {
    if (!borrow.returnedAt) {
      const book = mockBooks.find((b) => b.id === borrow.bookId);
      if (book) {
        book.available = false;
      }
    }
  });
};

export const resetMockLibraryData = () => {
  mockBooks = clone(initialBooks);
  mockBorrowings = clone(initialBorrowings);
  syncBookAvailability();
};

export const setMockBorrowings = (data: MockBorrowRecord[]) => {
  mockBorrowings = clone(data);
  syncBookAvailability();
};

export const getMockBooks = () => mockBooks;

const buildBorrowResponse = (borrow: MockBorrowRecord) => {
  const book = mockBooks.find((b) => b.id === borrow.bookId);
  const dueDate = new Date(borrow.dueDate);
  const returned = Boolean(borrow.returnedAt);
  const overdue = !returned && dueDate.getTime() < Date.now();
  const daysOverdue = overdue ? Math.ceil((Date.now() - dueDate.getTime()) / day) : 0;

  return {
    id: borrow.id,
    borrowed_at: borrow.borrowedAt,
    due_date: borrow.dueDate,
    returned_at: borrow.returnedAt,
    status: returned ? 'returned' : overdue ? 'overdue' : 'active',
    is_overdue: overdue,
    days_overdue: daysOverdue,
    book: book
      ? {
          id: book.id,
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          publication_year: book.publication_year,
          available: book.available,
        }
      : null,
  };
};

resetMockLibraryData();

export const handlers = [
  // Login endpoint
  http.post(`${API_URL}/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };

    if (body.email === 'admin@admin.com' && body.password === 'admin123!') {
      return HttpResponse.json({
        user: {
          id: 1,
          name: 'Default Admin',
          email: 'admin@admin.com',
          role: 'Admin',
        },
        token: 'mock-token-admin',
      });
    }

    if (body.email === 'user@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        user: {
          id: 2,
          name: 'John Doe',
          email: 'user@example.com',
          role: 'Member',
        },
        token: 'mock-token-user',
      });
    }

    return HttpResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  // Register endpoint
  http.post(`${API_URL}/register`, async ({ request }) => {
    const body = await request.json() as {
      name: string;
      email: string;
      password: string;
      role?: string;
    };

    return HttpResponse.json({
      user: {
        id: 3,
        name: body.name,
        email: body.email,
        role: body.role || 'Member',
      },
      token: 'mock-token-new-user',
    });
  }),

  // Me endpoint
  http.get(`${API_URL}/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Unauthenticated' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    if (token === 'mock-token-admin') {
      return HttpResponse.json({
        user: {
          id: 1,
          name: 'Default Admin',
          email: 'admin@admin.com',
          role: 'Admin',
        },
      });
    }

    if (token === 'mock-token-user') {
      return HttpResponse.json({
        user: {
          id: 2,
          name: 'John Doe',
          email: 'user@example.com',
          role: 'Member',
        },
      });
    }

    return HttpResponse.json(
      { message: 'Unauthenticated' },
      { status: 401 }
    );
  }),

  // Logout endpoint
  http.post(`${API_URL}/logout`, () => {
    return HttpResponse.json({ message: 'Logged out successfully' });
  }),

  // Books list
  http.get(`${API_URL}/books`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase() ?? '';

    const filtered = mockBooks.filter((book) => {
      if (!search) return true;
      return (
        book.title.toLowerCase().includes(search) ||
        book.author.toLowerCase().includes(search) ||
        book.isbn.toLowerCase().includes(search)
      );
    });

    return HttpResponse.json({
      data: filtered,
      meta: {
        current_page: 1,
        from: filtered.length ? 1 : null,
        last_page: 1,
        path: url.origin + url.pathname,
        per_page: filtered.length,
        to: filtered.length || null,
        total: filtered.length,
      },
      links: {
        first: null,
        last: null,
        prev: null,
        next: null,
      },
    });
  }),

  // Single book
  http.get(`${API_URL}/books/:id`, ({ params }) => {
    const id = Number(params.id);
    const book = mockBooks.find((b) => b.id === id);

    if (!book) {
      return HttpResponse.json({ message: 'Book not found' }, { status: 404 });
    }

    return HttpResponse.json(book);
  }),

  // Borrow book
  http.post(`${API_URL}/borrowings`, async ({ request }) => {
    const body = await request.json() as { book_id: number };
    const book = mockBooks.find((b) => b.id === body.book_id);

    if (!book) {
      return HttpResponse.json({ message: 'Book not found' }, { status: 404 });
    }

    if (!book.available) {
      return HttpResponse.json({ message: 'This book is currently unavailable.' }, { status: 422 });
    }

    const activeCount = mockBorrowings.filter((borrow) => !borrow.returnedAt).length;
    if (activeCount >= 3) {
      return HttpResponse.json({
        message: 'Borrowing limit reached. Return a book before borrowing a new one (limit: 3).',
      }, { status: 422 });
    }

    const newBorrow: MockBorrowRecord = {
      id: Date.now(),
      userId: 2,
      bookId: book.id,
      borrowedAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 14 * day).toISOString(),
      returnedAt: null,
    };

    mockBorrowings.push(newBorrow);
    book.available = false;

    return HttpResponse.json({ data: buildBorrowResponse(newBorrow) }, { status: 201 });
  }),

  // Return book
  http.post(`${API_URL}/borrowings/:id/return`, ({ params }) => {
    const id = Number(params.id);
    const borrow = mockBorrowings.find((b) => b.id === id);

    if (!borrow || borrow.returnedAt) {
      return HttpResponse.json({ message: 'Borrow not found' }, { status: 404 });
    }

    borrow.returnedAt = new Date().toISOString();
    const book = mockBooks.find((b) => b.id === borrow.bookId);
    if (book) {
      book.available = true;
    }

    return HttpResponse.json({ data: buildBorrowResponse(borrow) });
  }),

  // Borrowings (user)
  http.get(`${API_URL}/me/borrowings`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') ?? 'active';

    const filtered = mockBorrowings.filter((borrow) =>
      status === 'active' ? !borrow.returnedAt : true
    );

    return HttpResponse.json({
      data: filtered.map(buildBorrowResponse),
    });
  }),

  // Borrowings (admin)
  http.get(`${API_URL}/borrowings`, () => {
    return HttpResponse.json({
      data: mockBorrowings.map(buildBorrowResponse),
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: mockBorrowings.length,
        total: mockBorrowings.length,
        from: mockBorrowings.length ? 1 : null,
        to: mockBorrowings.length || null,
        path: `${API_URL}/borrowings`,
      },
    });
  }),
];
