import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import { SignUpForm } from '../src/components/form/signup-form';
import { signUpUser } from '../src/server/users';
import { toast } from 'sonner';

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('nanostores', () => ({
  atom: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    subscribe: jest.fn(),
  })),
}));

jest.mock('better-auth/client', () => ({
  createAuthClient: jest.fn(() => ({
    api: {
      signInEmail: jest.fn(),
      signUpEmail: jest.fn(),
    },
  })),
}));

// Mock src/server/users
jest.mock('../src/server/users', () => ({
  signUpUser: jest.fn(),
}));

describe('SignUpForm', () => {
  beforeEach(() => {
    signUpUser.mockClear();
    toast.success.mockClear();
    toast.error.mockClear();
  });

  it('should successfully sign up a user with valid credentials', async () => {
    signUpUser.mockResolvedValue({ success: true });

    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByTestId('confirm-password-input'), {
      target: { value: 'password123' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Sign Up', type: 'submit' })
    );

    await waitFor(() => {
      expect(signUpUser).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        'John Doe'
      );
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Please check your email for verification.'
      );
    });
  });

  it('should display an error message if passwords do not match', async () => {
    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByTestId('confirm-password-input'), {
      target: { value: 'differentpassword' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Sign Up', type: 'submit' })
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Passwords do not match');
    });

    expect(signUpUser).not.toHaveBeenCalled();
  });

  it('should display an error message if sign up fails via API', async () => {
    signUpUser.mockResolvedValue({
      success: false,
      message: 'Email already in use',
    });

    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByTestId('confirm-password-input'), {
      target: { value: 'password123' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Sign Up', type: 'submit' })
    );

    await waitFor(() => {
      expect(signUpUser).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        'John Doe'
      );
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Email already in use');
    });
  });

  it('should display validation errors for empty fields', async () => {
    render(<SignUpForm />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Sign Up', type: 'submit' })
    );

    await waitFor(() => {
      expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/Invalid email address/i)).toBeInTheDocument();
    });
    const passwordInput = screen.getByTestId('password-input');
    const passwordInputParent = passwordInput.closest('.grid.gap-3');
    expect(
      await within(passwordInputParent).findByText(
        /Too small: expected string to have >=6 characters/i
      )
    ).toBeInTheDocument();

    const confirmPasswordInput = screen.getByTestId('confirm-password-input');
    const confirmPasswordInputParent =
      confirmPasswordInput.closest('.grid.gap-3');
    expect(
      await within(confirmPasswordInputParent).findByText(
        /Too small: expected string to have >=6 characters/i
      )
    ).toBeInTheDocument();
  });

  it('should display validation error for invalid email format', async () => {
    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'invalid@email' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByTestId('confirm-password-input'), {
      target: { value: 'password123' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Sign Up', type: 'submit' })
    );

    await waitFor(() => {
      expect(screen.getByText(/Invalid email address/i)).toBeInTheDocument();
    });
  });

  it('should display validation error for password too short', async () => {
    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'short' },
    });
    fireEvent.change(screen.getByTestId('confirm-password-input'), {
      target: { value: 'short' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Sign Up', type: 'submit' })
    );

    const passwordInput = screen.getByTestId('password-input');
    const passwordInputParent = passwordInput.closest('.grid.gap-3');
    expect(
      await within(passwordInputParent).findByText(
        /Too small: expected string to have >=6 characters/i
      )
    ).toBeInTheDocument();
  });
});
