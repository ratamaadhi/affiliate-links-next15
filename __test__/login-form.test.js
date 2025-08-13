import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { LoginForm } from '../src/components/form/login-form';
import { useRouter } from 'next/navigation';
import { signInUser } from '../src/server/users';
import { toast } from 'sonner';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock src/server/users
jest.mock('../src/server/users', () => ({
  signInUser: jest.fn(),
}));

describe('LoginForm', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    useRouter.mockReturnValue({
      push: mockPush,
    });
    signInUser.mockClear();
    toast.success.mockClear();
    toast.error.mockClear();
    mockPush.mockClear();
  });

  it('should successfully log in a user with valid credentials', async () => {
    signInUser.mockResolvedValue({ success: true });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('******'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Login', type: 'submit' }));

    await waitFor(() => {
      expect(signInUser).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Login successful!');
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should display an error message for invalid credentials', async () => {
    signInUser.mockResolvedValue({ success: false, message: 'Invalid credentials' });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('******'), {
      target: { value: 'wrongpassword' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Login', type: 'submit' }));

    await waitFor(() => {
      expect(signInUser).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should display validation errors for empty fields', async () => {
    render(<LoginForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Login', type: 'submit' }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid email/i)).toBeInTheDocument();
    });
    const passwordInput = screen.getByPlaceholderText('******');
    const passwordInputParent = passwordInput.closest('.grid.gap-3');
    expect(await within(passwordInputParent).findByText(/Too small: expected string to have >=6 characters/i)).toBeInTheDocument();

    expect(signInUser).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should toggle password visibility', async () => {
    render(<LoginForm />);

    const passwordInput = screen.getByPlaceholderText('******');
    const showPasswordCheckbox = screen.getByRole('checkbox', { name: /Show Password/i });

    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(showPasswordCheckbox);

    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(showPasswordCheckbox);

    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
