import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { CreatePageButton } from '../../../src/components/page/create-page-button';
import { useCreatePage } from '../../../src/hooks/mutations';
import { useAuth } from '../../../src/hooks/useAuth';
import { authClient } from '../../../src/lib/auth-client';

jest.mock('../../../src/hooks/mutations');
jest.mock('../../../src/hooks/useAuth');

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

    const button = screen.getByRole('button', { name: /Page/i });
    button.click();

    // Dialog should be open
    await waitFor(() => {
      expect(screen.getByText('Add new page')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Create a new page to start collecting links.')
    ).toBeInTheDocument();

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    cancelButton.click();

    // Dialog should be closed
    await waitFor(() => {
      expect(screen.queryByText('Add new page')).not.toBeInTheDocument();
    });
  });

  it('shows validation errors for empty title', async () => {
    render(<CreatePageButton />);

    const button = screen.getByRole('button', { name: /Page/i });
    button.click();

    // Wait for form to be visible
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/My page title/i)).toBeInTheDocument();
    });

    const form = document.getElementById('create-page-form');
    expect(form).toBeInTheDocument();

    // Submit empty form
    fireEvent.submit(form!);

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

    const button = screen.getByRole('button', { name: /Page/i });
    button.click();

    // Wait for form to be visible
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/My page title/i)).toBeInTheDocument();
    });

    // Fill in form
    fireEvent.change(screen.getByPlaceholderText(/My page title/i), {
      target: { value: 'Test Page' },
    });
    fireEvent.change(screen.getByPlaceholderText(/What page is about/i), {
      target: { value: 'This is a test description.' },
    });

    // Wait for auto-generated slug
    await waitFor(
      () => {
        const slugInput = screen.getByPlaceholderText(/my-page-url/i);
        expect(slugInput).toHaveValue('test-page');
      },
      { timeout: 1000 }
    );

    const form = document.getElementById('create-page-form');
    expect(form).toBeInTheDocument();
    fireEvent.submit(form!);

    // Verify form submission
    await waitFor(() => {
      expect(mockTrigger).toHaveBeenCalledWith({
        title: 'Test Page',
        description: 'This is a test description.',
        slug: 'test-page',
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

    const button = screen.getByRole('button', { name: /Page/i });
    button.click(); // Open dialog

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/My page title/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/My page title/i), {
      target: { value: 'Test Page' },
    });

    // Wait for auto-generated slug
    await waitFor(
      () => {
        const slugInput = screen.getByPlaceholderText(/my-page-url/i);
        expect(slugInput).toHaveValue('test-page');
      },
      { timeout: 1000 }
    );

    const submitButton = screen.getByRole('button', { name: /Create/i });
    submitButton.click(); // Submit form

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

    const button = screen.getByRole('button', { name: /Page/i });
    button.click(); // Open dialog

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/My page title/i)).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText(/My page title/i)).toBeDisabled();
    expect(screen.getByPlaceholderText(/What page is about/i)).toBeDisabled();
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
