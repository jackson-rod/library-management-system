import { http, HttpResponse } from 'msw';

// Use the same base URL as the application
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9080/api';

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
];
