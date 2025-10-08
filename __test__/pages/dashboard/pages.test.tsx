import PagesPage from '@/app/(admin)/dashboard/pages/page';
import { render, screen } from '@testing-library/react';
import { headers } from 'next/headers';

// Mock the child components
jest.mock('@/components/page/create-page-button', () => ({
  CreatePageButton: () => <div data-testid="create-page-button" />,
}));
jest.mock('@/components/page/list-pages', () => ({
  ListPages: () => <div data-testid="list-pages" />,
}));
jest.mock('@/components/page/page-wrapper', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-wrapper">{children}</div>
  ),
}));
jest.mock('@/components/page/search-page-input', () => ({
  __esModule: true,
  default: () => <div data-testid="search-page-input" />,
}));
jest.mock('@/components/page/pages-mobile-dock-provider', () => ({
  PagesMobileDockProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pages-mobile-dock-provider">{children}</div>
  ),
}));
jest.mock('@/components/link/mobile-dock', () => ({
  MobileDock: ({
    username,
    pageLink,
  }: {
    username: string;
    pageLink: string;
  }) => (
    <div data-testid="mobile-dock">
      <span data-testid="mobile-dock-username">{username}</span>
      <span data-testid="mobile-dock-page-link">{pageLink}</span>
    </div>
  ),
}));
jest.mock('@/components/link/dynamic-page-link', () => ({
  DynamicPageLink: () => (
    <div data-testid="dynamic-page-link">
      <span>My Linkid: </span>
      <span>Select a page to generate link</span>
    </div>
  ),
}));
jest.mock('@/components/link/enhanced-dashboard-preview', () => ({
  EnhancedDashboardPreview: ({
    pageLink,
    username,
  }: {
    pageLink: string;
    username: string;
  }) => (
    <div data-testid="enhanced-dashboard-preview">
      <span data-testid="preview-page-link">{pageLink}</span>
      <span data-testid="preview-username">{username}</span>
    </div>
  ),
}));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// Mock next/headers
jest.mock('next/headers', () => ({
  headers: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

// Mock hooks
jest.mock('@/hooks/use-mobile', () => ({
  useIsMobile: jest.fn(() => false),
}));

// Mock context
jest.mock('@/context/link-page-context', () => ({
  LinkPageContext: {
    Provider: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="link-page-context-provider">{children}</div>
    ),
  },
  useContext: jest.fn(() => ({
    selectedPage: { slug: 'test' },
  })),
}));

// Mock LinkPageProvider
jest.mock('@/components/link/link-page-provider', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="link-page-provider">{children}</div>
  ),
}));

jest.mock('@/context/mobile-dock-context', () => ({
  useMobileDock: jest.fn(() => ({
    actions: {
      triggerAdd: jest.fn(),
      triggerSearch: jest.fn(),
    },
    config: {
      showAddButton: true,
      showSearchButton: true,
      addButtonText: 'Add Page',
      searchButtonText: 'Search Page',
      addButtonIcon: <div data-testid="add-icon" />,
      searchButtonIcon: <div data-testid="search-icon" />,
    },
  })),
}));

describe('PagesPage', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Mock environment variable
    process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
    // Default mock for headers
    (headers as jest.Mock).mockReturnValue({
      get: jest.fn((key: string) => {
        if (key === 'x-user-info') {
          return JSON.stringify({ username: 'testuser' });
        }
        return null;
      }),
    });
  });

  it('renders the page with correct elements and user info', async () => {
    render(await PagesPage());

    // Check if PageWrapper is rendered
    expect(screen.getByTestId('page-wrapper')).toBeInTheDocument();

    // Check for main headings
    expect(
      screen.getByRole('heading', { name: /Your Pages/i })
    ).toBeInTheDocument();

    // Check for Linkid display with mocked user info
    expect(screen.getByText(/My Linkid:/i)).toBeInTheDocument();
    expect(screen.getByTestId('dynamic-page-link')).toBeInTheDocument();
    expect(
      screen.getByText('Select a page to generate link')
    ).toBeInTheDocument();

    // Check if child components are rendered
    expect(screen.getByTestId('create-page-button')).toBeInTheDocument();
    expect(screen.getByTestId('list-pages')).toBeInTheDocument();
  });

  it('renders without user info if x-user-info header is missing', async () => {
    (headers as jest.Mock).mockReturnValue({
      get: jest.fn((key: string) => {
        if (key === 'x-user-info') {
          return null; // Simulate missing user info
        }
        return null;
      }),
    });

    render(await PagesPage());

    // Check for main headings (should still be present)
    expect(
      screen.getByRole('heading', { name: /Your Pages/i })
    ).toBeInTheDocument();

    // Linkid should still be present but with undefined username
    expect(screen.getByText(/My Linkid:/i)).toBeInTheDocument();
    expect(screen.getByTestId('dynamic-page-link')).toBeInTheDocument();
    expect(
      screen.getByText('Select a page to generate link')
    ).toBeInTheDocument();
  });
});
