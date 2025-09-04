import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { CreatePageButton } from '../../../src/components/page/create-page-button';
import { useCreatePage } from '../../../src/hooks/mutations';
import { useAuth } from '../../../src/hooks/useAuth';
import { authClient } from '../../../src/lib/auth-client';

// Mock external modules
jest.mock('@/hooks/mutations', () => ({
  useCreatePage: jest.fn(),
}));
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    getSession: jest.fn(),
  },
}));
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}));
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

describe('CreatePageButton', () => {
  const mockTrigger = jest.fn();
  const mockUseSearchParams = useSearchParams as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (useCreatePage as jest.Mock).mockReturnValue({
      trigger: mockTrigger,
      isMutating: false,
    });
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 123, username: 'testuser' },
      isAuthenticated: true,
    });
    (authClient.getSession as jest.Mock).mockResolvedValue({
      data: { user: { id: 123 } },
    });
    mockUseSearchParams.mockReturnValue(new URLSearchParams('_page=1'));
  });

  it('opens and closes the dialog', async () => {
    render(<CreatePageButton />);

    // Dialog is initially closed
    expect(screen.queryByText('Add new page')).not.toBeInTheDocument();

    // Click the button to open the dialog
    fireEvent.click(screen.getByRole('button', { name: /Page/i }));

    // Dialog should be open
    expect(screen.getByText('Add new page')).toBeInTheDocument();
    expect(
      screen.getByText('Create a new page to start collecting links.')
    ).toBeInTheDocument();

    // Click cancel button to close the dialog
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

    // Dialog should be closed
    await waitFor(() => {
      expect(screen.queryByText('Add new page')).not.toBeInTheDocument();
    });
  });

  it('shows validation errors for empty title', async () => {
    render(<CreatePageButton />);

    // Open dialog
    fireEvent.click(screen.getByRole('button', { name: /Page/i }));

    const form = screen.getByRole('form');

    // Submit empty form
    fireEvent.submit(form);

    await waitFor(() => {
      expect(
        screen.getByText('Title must be at least 2 characters long')
      ).toBeInTheDocument();
    });
    expect(mockTrigger).not.toHaveBeenCalled();
  });
  it('creates a page successfully', async () => {
    mockTrigger.mockResolvedValue({ success: true });

    render(<CreatePageButton />);

    // Open dialog
    fireEvent.click(screen.getByRole('button', { name: /Page/i }));

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: 'Test Page' },
    });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: 'This is a test description.' },
    });

    // Submit form
    const form = screen.getByRole('form');
    fireEvent.submit(form);

    // Verify form submission
    await waitFor(() => {
      expect(mockTrigger).toHaveBeenCalledWith({
        title: 'Test Page',
        description: 'This is a test description.',
        userId: 123,
      });
    });

    // Wait for and verify dialog closure
    await waitFor(() => {
      expect(screen.queryByText('Add new page')).not.toBeInTheDocument();
    });
  });

  it('shows error toast if user is not logged in', async () => {
    (authClient.getSession as jest.Mock).mockResolvedValue({ data: null });

    render(<CreatePageButton />);

    fireEvent.click(screen.getByRole('button', { name: /Page/i })); // Open dialog

    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: 'Test Page' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Create/i })); // Submit form

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'You must be logged in to create a page'
      );
    });
    expect(mockTrigger).not.toHaveBeenCalled();
  });

  it('disables form fields and buttons when mutating', async () => {
    (useCreatePage as jest.Mock).mockReturnValue({
      trigger: mockTrigger,
      isMutating: true,
    });

    render(<CreatePageButton />);

    fireEvent.click(screen.getByRole('button', { name: /Page/i })); // Open dialog

    expect(screen.getByLabelText(/Title/i)).toBeDisabled();
    expect(screen.getByLabelText(/Description/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeDisabled();

    // Find the submit button within the dialog footer and verify it's disabled
    const submitButtons = screen.getAllByRole('button');
    const submitButton = submitButtons.find(
      (button) => button.getAttribute('type') === 'submit'
    );
    expect(submitButton).toBeDefined();
    expect(submitButton).toBeDisabled();
  });
});
