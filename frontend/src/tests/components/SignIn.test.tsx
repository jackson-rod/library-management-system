import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '../utils/test-utils';
import userEvent from '@testing-library/user-event';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
import SignIn from '../../components/SignIn';

describe('SignIn', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it('should render sign in form', () => {
    render(<SignIn />);

    expect(screen.getByTestId('signin-page')).toBeInTheDocument();
    expect(screen.getByTestId('signin-title')).toHaveTextContent('Sign in to your account');
    expect(screen.getByTestId('signin-logo')).toBeInTheDocument();
    expect(screen.getByTestId('signin-form')).toBeInTheDocument();
  });

  it('should render form fields with labels', () => {
    render(<SignIn />);

    expect(screen.getByTestId('form-input-label-email')).toHaveTextContent('Email address');
    expect(screen.getByTestId('form-input-label-password')).toHaveTextContent('Password');
    expect(screen.getByTestId('form-input-email')).toBeInTheDocument();
    expect(screen.getByTestId('form-input-password')).toBeInTheDocument();
  });

  it('should have submit button disabled initially with empty form', async () => {
    render(<SignIn />);

    const submitButton = screen.getByTestId('signin-submit-button');
    
    // Clear default values first
    const emailInput = screen.getByTestId('form-input-email');
    const passwordInput = screen.getByTestId('form-input-password');
    
    await userEvent.clear(emailInput);
    await userEvent.clear(passwordInput);
    
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  it('should show validation error for invalid email', async () => {
    const user = userEvent.setup();
    render(<SignIn />);

    const emailInput = screen.getByTestId('form-input-email');
    await user.clear(emailInput);
    await user.type(emailInput, 'invalid-email');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByTestId('form-input-error-email')).toHaveTextContent('Invalid email address');
    });
  });

  it('should show validation error for short password', async () => {
    const user = userEvent.setup();
    render(<SignIn />);

    const passwordInput = screen.getByTestId('form-input-password');
    await user.clear(passwordInput);
    await user.type(passwordInput, '123');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByTestId('form-input-error-password')).toHaveTextContent('Password must be at least 6 characters');
    });
  });

  it('should enable submit button when form is valid', async () => {
    const user = userEvent.setup();
    render(<SignIn />);

    const emailInput = screen.getByTestId('form-input-email');
    const passwordInput = screen.getByTestId('form-input-password');
    const submitButton = screen.getByTestId('signin-submit-button');

    await user.clear(emailInput);
    await user.clear(passwordInput);
    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'password123');

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should successfully log in with valid credentials', async () => {
    const user = userEvent.setup();
    render(<SignIn />);

    const emailInput = screen.getByTestId('form-input-email');
    const passwordInput = screen.getByTestId('form-input-password');
    const submitButton = screen.getByTestId('signin-submit-button');

    await user.clear(emailInput);
    await user.clear(passwordInput);
    await user.type(emailInput, 'admin@admin.com');
    await user.type(passwordInput, 'admin123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Welcome back, Default!')).toBeInTheDocument();
    });
  });

  it('should show error in toast on 401 authentication failure', async () => {
    const user = userEvent.setup();
    
    server.use(
      http.post('http://localhost:9080/api/login', () => {
        return HttpResponse.json(
          { message: 'Invalid credentials' },
          { status: 401 }
        );
      })
    );

    render(<SignIn />);

    const emailInput = screen.getByTestId('form-input-email');
    const passwordInput = screen.getByTestId('form-input-password');
    const submitButton = screen.getByTestId('signin-submit-button');

    await user.clear(emailInput);
    await user.clear(passwordInput);
    await user.type(emailInput, 'wrong@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      // Error should appear in toast, not form error
      expect(screen.getByTestId('toast-error')).toBeInTheDocument();
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    // Form error should not be shown
    expect(screen.queryByTestId('form-error')).not.toBeInTheDocument();
  });

  it('should show error in form on 422 validation failure', async () => {
    const user = userEvent.setup();
    
    server.use(
      http.post('http://localhost:9080/api/login', () => {
        return HttpResponse.json(
          { message: 'The provided credentials are incorrect' },
          { status: 422 }
        );
      })
    );

    render(<SignIn />);

    const emailInput = screen.getByTestId('form-input-email');
    const passwordInput = screen.getByTestId('form-input-password');
    const submitButton = screen.getByTestId('signin-submit-button');

    await user.clear(emailInput);
    await user.clear(passwordInput);
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'testpass');
    await user.click(submitButton);

    await waitFor(() => {
      // Error should appear in form error
      const errorElement = screen.getByTestId('form-error');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveTextContent('The provided credentials are incorrect');
    });

    // Toast should not be shown for validation errors
    expect(screen.queryByTestId('toast-error')).not.toBeInTheDocument();
  });

  it('should show loading state during login', async () => {
    const user = userEvent.setup();
    
    // Add a delay to the mock response so we can check the loading state
    server.use(
      http.post('http://localhost:9080/api/login', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({
          user: {
            id: 1,
            name: 'Default Admin',
            email: 'admin@admin.com',
            role: 'Admin',
          },
          token: 'mock-token-admin',
        });
      })
    );

    render(<SignIn />);

    const emailInput = screen.getByTestId('form-input-email');
    const passwordInput = screen.getByTestId('form-input-password');
    const submitButton = screen.getByTestId('signin-submit-button');

    await user.clear(emailInput);
    await user.clear(passwordInput);
    await user.type(emailInput, 'admin@admin.com');
    await user.type(passwordInput, 'admin123!');
    
    // Click submit without awaiting to check loading state
    const clickPromise = user.click(submitButton);

    // Check loading state during submission
    await waitFor(() => {
      expect(submitButton).toHaveTextContent('Signing in...');
      expect(submitButton).toBeDisabled();
    });

    // Wait for submission to complete
    await clickPromise;
  });

  it('should disable form fields during submission', async () => {
    const user = userEvent.setup();
    
    // Add a delay to the mock response so we can check the loading state
    server.use(
      http.post('http://localhost:9080/api/login', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({
          user: {
            id: 1,
            name: 'Default Admin',
            email: 'admin@admin.com',
            role: 'Admin',
          },
          token: 'mock-token-admin',
        });
      })
    );

    render(<SignIn />);

    const emailInput = screen.getByTestId('form-input-email');
    const passwordInput = screen.getByTestId('form-input-password');
    const submitButton = screen.getByTestId('signin-submit-button');

    await user.clear(emailInput);
    await user.clear(passwordInput);
    await user.type(emailInput, 'admin@admin.com');
    await user.type(passwordInput, 'admin123!');
    
    // Click submit and immediately check for disabled state
    const clickPromise = user.click(submitButton);

    // Check that fields are disabled during submission
    await waitFor(() => {
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
    });

    // Wait for the submission to complete
    await clickPromise;
  });

  it('should extract first name from user name for welcome message', async () => {
    const user = userEvent.setup();
    
    server.use(
      http.post('http://localhost:9080/api/login', () => {
        return HttpResponse.json({
          user: {
            id: 1,
            name: 'John Doe Smith',
            email: 'john@example.com',
            role: 'Member',
          },
          token: 'test-token',
        });
      })
    );

    render(<SignIn />);

    const emailInput = screen.getByTestId('form-input-email');
    const passwordInput = screen.getByTestId('form-input-password');
    const submitButton = screen.getByTestId('signin-submit-button');

    await user.clear(emailInput);
    await user.clear(passwordInput);
    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Welcome back, John!')).toBeInTheDocument();
    });
  });
});
