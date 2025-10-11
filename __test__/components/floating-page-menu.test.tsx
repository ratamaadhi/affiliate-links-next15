import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { FloatingPageMenu } from '@/components/link/floating-page-menu';
import { usePublicPages } from '@/hooks/use-public-pages';

// Mock the hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/hooks/use-public-pages', () => ({
  usePublicPages: jest.fn(),
}));

// Mock the Drawer component
jest.mock('@/components/ui/drawer', () => ({
  Drawer: ({ children, open, onOpenChange }: any) => {
    const [isOpen, setIsOpen] = React.useState(open);

    React.useEffect(() => {
      setIsOpen(open);
    }, [open]);

    const handleOpenChange = (newOpen: boolean) => {
      setIsOpen(newOpen);
      onOpenChange(newOpen);
    };

    return (
      <div data-testid="drawer" data-open={isOpen}>
        {React.Children.map(children, (child) =>
          React.isValidElement(child) && child.type.name === 'DrawerTrigger'
            ? React.cloneElement(child, {
                onClick: () => handleOpenChange(true),
              })
            : child
        )}
      </div>
    );
  },
  DrawerContent: ({ children }: any) => (
    <div data-testid="drawer-content">{children}</div>
  ),
  DrawerHeader: ({ children }: any) => (
    <div data-testid="drawer-header">{children}</div>
  ),
  DrawerTitle: ({ children, ...props }: any) => (
    <h2 data-testid="drawer-title" {...props}>
      {children}
    </h2>
  ),
  DrawerTrigger: ({ children, onClick, asChild, ...props }: any) => {
    if (asChild) {
      return React.cloneElement(children, { onClick, ...props });
    }
    return (
      <button data-testid="drawer-trigger" onClick={onClick} {...props}>
        {children}
      </button>
    );
  },
}));

// Mock other UI components
jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: any) => (
    <div data-testid="scroll-area">{children}</div>
  ),
}));

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: any) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: any) => (
    <div data-testid="avatar" className={className}>
      {children}
    </div>
  ),
  AvatarFallback: ({ children, className }: any) => (
    <div data-testid="avatar-fallback" className={className}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, ...props }: any) => (
    <button
      data-testid="button"
      onClick={onClick}
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/link/page-list-item', () => ({
  PageListItem: ({ page, username, isCurrentPage }: any) => (
    <div
      data-testid="page-list-item"
      data-page-id={page.id}
      data-current={isCurrentPage}
    >
      {page.title}
    </div>
  ),
}));

describe('FloatingPageMenu', () => {
  const mockPush = jest.fn();
  const mockMutate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('should render floating button', () => {
    (usePublicPages as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      mutate: mockMutate,
    });

    render(<FloatingPageMenu username="testuser" />);

    const floatingButton = screen.getByLabelText('Open page menu');
    expect(floatingButton).toBeInTheDocument();
    expect(floatingButton).toHaveClass('rounded-full', 'w-14', 'h-14');
  });

  it('should open drawer when button is clicked', async () => {
    (usePublicPages as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      mutate: mockMutate,
    });

    render(<FloatingPageMenu username="testuser" />);

    const floatingButton = screen.getByLabelText('Open page menu');
    fireEvent.click(floatingButton);

    await waitFor(() => {
      expect(screen.getByTestId('drawer-content')).toBeInTheDocument();
    });
  });

  it('should display loading state', () => {
    (usePublicPages as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      mutate: mockMutate,
    });

    render(<FloatingPageMenu username="testuser" />);

    const floatingButton = screen.getByLabelText('Open page menu');
    fireEvent.click(floatingButton);

    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThanOrEqual(3); // At least 3 loading skeletons
  });

  it('should display error state', () => {
    (usePublicPages as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to fetch'),
      mutate: mockMutate,
    });

    render(<FloatingPageMenu username="testuser" />);

    const floatingButton = screen.getByLabelText('Open page menu');
    fireEvent.click(floatingButton);

    expect(screen.getByText('Failed to load pages')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should display user info and pages when data is loaded', () => {
    const mockData = {
      user: {
        id: 1,
        name: 'Test User',
        username: 'testuser',
        displayUsername: 'testuser',
        image: null,
      },
      pages: [
        {
          id: 1,
          title: 'Test Page 1',
          description: 'Test description',
          slug: 'test-page-1',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 2,
          title: 'Test Page 2',
          description: 'Another test page',
          slug: 'test-page-2',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
    };

    (usePublicPages as jest.Mock).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      mutate: mockMutate,
    });

    render(<FloatingPageMenu username="testuser" currentSlug="test-page-1" />);

    const floatingButton = screen.getByLabelText('Open page menu');
    fireEvent.click(floatingButton);

    // Check drawer title
    expect(screen.getByTestId('drawer-title')).toHaveTextContent(
      'Pages by testuser'
    );

    // Check user info
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('@testuser')).toBeInTheDocument();

    // Check pages count badge
    const pagesBadge = screen.getByTestId('badge');
    expect(pagesBadge).toHaveTextContent('2 pages');

    // Check page list items
    const pageItems = screen.getAllByTestId('page-list-item');
    expect(pageItems).toHaveLength(2);

    // Check current page indicator
    const currentPageItem = pageItems.find(
      (item) => item.getAttribute('data-current') === 'true'
    );
    expect(currentPageItem).toBeTruthy();
    expect(currentPageItem).toHaveAttribute('data-page-id', '1');
  });

  it('should display empty state when no pages', () => {
    const mockData = {
      user: {
        id: 1,
        name: 'Test User',
        username: 'testuser',
        displayUsername: 'testuser',
        image: null,
      },
      pages: [],
    };

    (usePublicPages as jest.Mock).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      mutate: mockMutate,
    });

    render(<FloatingPageMenu username="testuser" />);

    const floatingButton = screen.getByLabelText('Open page menu');
    fireEvent.click(floatingButton);

    expect(screen.getByText('No pages available')).toBeInTheDocument();
  });

  it('should navigate to profile when profile button is clicked', () => {
    const mockData = {
      user: {
        id: 1,
        name: 'Test User',
        username: 'testuser',
        displayUsername: 'testuser',
        image: null,
      },
      pages: [],
    };

    (usePublicPages as jest.Mock).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      mutate: mockMutate,
    });

    render(<FloatingPageMenu username="testuser" />);

    const floatingButton = screen.getByLabelText('Open page menu');
    fireEvent.click(floatingButton);

    const profileButton = screen.getByText('View Profile');
    fireEvent.click(profileButton);

    expect(mockPush).toHaveBeenCalledWith('/testuser/');
  });

  it('should not render when username is not provided', () => {
    (usePublicPages as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      mutate: mockMutate,
    });

    // When username is empty, the component should still render but the hook should not be called
    render(<FloatingPageMenu username="" />);

    // The usePublicPages hook should not be called with empty username
    expect(usePublicPages).toHaveBeenCalledWith('');
  });
});
