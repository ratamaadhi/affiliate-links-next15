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
    expect(
      screen.getByRole('link', { name: /http:\/\/localhost:3000\/testuser/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      'http://localhost:3000/testuser'
    );

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
    expect(
      screen.getByRole('link', { name: /http:\/\/localhost:3000\//i })
    ).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      'http://localhost:3000/'
    );
  });
});
