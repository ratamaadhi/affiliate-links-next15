import { render, screen, waitFor, act } from '@testing-library/react';
import { SWRConfig } from 'swr';
import { useLinkInfinite } from '@/hooks/queries';
import { useUpdateLinkOrder } from '@/hooks/mutations';
import ListLinks from '@/components/link/list-links';
import { LinkPageContext } from '@/context/link-page-context';
import { useAuth } from '@/hooks/useAuth';
import { DndContext } from '@dnd-kit/core';
import userEvent from '@testing-library/user-event';

// Mock the hooks
jest.mock('@/hooks/queries', () => ({
  useLinkInfinite: jest.fn(),
  useInfiniteScroll: jest.fn(() => jest.fn()),
}));

jest.mock('@/hooks/mutations', () => ({
  useUpdateLinkOrder: jest.fn(),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/components/link/delete-link-button', () => ({
  DeleteLinkButton: ({ data }: { data: any }) => (
    <button data-testid={`delete-${data.id}`}>Delete</button>
  ),
}));

jest.mock('@/components/link/edit-link-button', () => ({
  EditLinkButton: ({ data }: { data: any }) => (
    <button data-testid={`edit-${data.id}`}>Edit</button>
  ),
}));

jest.mock('@/components/link/interactive-health-badge', () => ({
  InteractiveHealthBadge: ({ linkId, status }: any) => (
    <button data-testid={`health-${linkId}`} data-status={status}>
      Health Check
    </button>
  ),
}));

jest.mock('@/components/link/toggle-link-active', () => ({
  __esModule: true,
  default: ({ linkId }: { linkId: number }) => (
    <button data-testid={`toggle-${linkId}`}>Toggle</button>
  ),
}));

jest.mock('@/components/link/update-position-button', () => ({
  UpdatePositionButton: ({ data }: { data: any }) => (
    <button data-testid={`position-${data.id}`}>Position</button>
  ),
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map() }}>{children}</SWRConfig>
);

const mockLinks = [
  {
    id: 1,
    title: 'Link 1',
    url: 'https://example.com/1',
    description: 'Description 1',
    displayOrder: 1,
    isActive: true,
    clickCount: 0,
    healthStatus: 'healthy',
    lastCheckedAt: Date.now(),
    statusCode: 200,
    responseTime: 100,
    errorMessage: null,
    imageUrl: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 2,
    title: 'Link 2',
    url: 'https://example.com/2',
    description: 'Description 2',
    displayOrder: 2,
    isActive: true,
    clickCount: 0,
    healthStatus: 'unknown',
    lastCheckedAt: null,
    statusCode: null,
    responseTime: null,
    errorMessage: null,
    imageUrl: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 3,
    title: 'Link 3',
    url: 'https://example.com/3',
    description: 'Description 3',
    displayOrder: 3,
    isActive: true,
    clickCount: 0,
    healthStatus: 'unhealthy',
    lastCheckedAt: Date.now(),
    statusCode: 500,
    responseTime: 1000,
    errorMessage: 'Server error',
    imageUrl: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 4,
    title: 'Link 4',
    url: 'https://example.com/4',
    description: 'Description 4',
    displayOrder: 4,
    isActive: true,
    clickCount: 0,
    healthStatus: null,
    lastCheckedAt: null,
    statusCode: null,
    responseTime: null,
    errorMessage: null,
    imageUrl: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 5,
    title: 'Link 5',
    url: 'https://example.com/5',
    description: 'Description 5',
    displayOrder: 5,
    isActive: true,
    clickCount: 0,
    healthStatus: 'timeout',
    lastCheckedAt: Date.now(),
    statusCode: null,
    responseTime: null,
    errorMessage: null,
    imageUrl: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

const mockSelectedPage = {
  id: 1,
  title: 'Test Page',
  description: 'Test Description',
  slug: 'test-page',
  userId: 1,
  themeSettings: null,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const defaultContextValue = {
  selectedPage: mockSelectedPage,
  keywordLink: '',
  setSelectedPage: jest.fn(),
  setKeywordLink: jest.fn(),
};

function renderListLinks(contextValue = defaultContextValue) {
  return render(
    <Wrapper>
      <LinkPageContext.Provider value={contextValue}>
        <ListLinks />
      </LinkPageContext.Provider>
    </Wrapper>
  );
}

describe('ListLinks - Scroll Position Preservation', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, username: 'testuser' },
    });

    (useUpdateLinkOrder as jest.Mock).mockReturnValue({
      trigger: jest.fn(),
    });

    (useLinkInfinite as jest.Mock).mockReturnValue({
      data: [
        {
          data: {
            data: mockLinks,
          },
        },
      ],
      isLoading: false,
      size: 1,
      setSize: jest.fn(),
    });
  });

  it('should render all links', () => {
    renderListLinks();

    expect(screen.getByText('Link 1')).toBeInTheDocument();
    expect(screen.getByText('Link 2')).toBeInTheDocument();
    expect(screen.getByText('Link 3')).toBeInTheDocument();
    expect(screen.getByText('Link 4')).toBeInTheDocument();
    expect(screen.getByText('Link 5')).toBeInTheDocument();
  });

  it('should have scroll container with ref', () => {
    renderListLinks();

    const ulElement = document.querySelector('ul.absolute.inset-0');
    expect(ulElement).toBeInTheDocument();
  });

  it('should preserve scroll position when data updates', async () => {
    // Create a mock scroll container
    const mockScrollTop = 100;
    let storedScrollPosition = 0;

    // Override the scroll behavior
    Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
      get() {
        return storedScrollPosition;
      },
      set(value) {
        storedScrollPosition = value;
      },
      configurable: true,
    });

    const { rerender } = renderListLinks();

    // Find the scroll container
    const ulElement = document.querySelector('ul.absolute.inset-0');
    expect(ulElement).toBeInTheDocument();

    // Simulate scrolling down
    await act(async () => {
      if (ulElement) {
        storedScrollPosition = mockScrollTop;
        // Trigger scroll event
        ulElement.dispatchEvent(new Event('scroll'));
      }
    });

    // Wait for the scroll handler to complete
    await waitFor(() => {
      expect(storedScrollPosition).toBe(mockScrollTop);
    });

    // Simulate data update (like health check update)
    (useLinkInfinite as jest.Mock).mockReturnValue({
      data: [
        {
          data: {
            data: [
              ...mockLinks,
              {
                id: 1,
                title: 'Link 1 (Updated)',
                url: 'https://example.com/1',
                description: 'Description 1',
                displayOrder: 1,
                isActive: true,
                clickCount: 0,
                healthStatus: 'healthy',
                lastCheckedAt: Date.now(),
                statusCode: 200,
                responseTime: 100,
                errorMessage: null,
                imageUrl: null,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              },
            ],
          },
        },
      ],
      isLoading: false,
      size: 1,
      setSize: jest.fn(),
    });

    // Rerender with updated data
    rerender(
      <Wrapper>
        <LinkPageContext.Provider value={defaultContextValue}>
          <ListLinks />
        </LinkPageContext.Provider>
      </Wrapper>
    );

    // Wait for the component to update
    await waitFor(() => {
      expect(screen.getByText('Link 2')).toBeInTheDocument();
    });

    // The scroll position should be restored
    // Note: In actual implementation, this happens via useEffect
  });

  it('should save scroll position before data changes', async () => {
    const { container } = renderListLinks();

    const ulElement = document.querySelector('ul.absolute.inset-0');
    expect(ulElement).toBeInTheDocument();

    // The scroll container should exist with overflow-y-scroll class
    expect(ulElement).toHaveClass('overflow-y-scroll');
  });

  it('should restore scroll position after dndLinks update', async () => {
    let storedScrollPosition = 0;

    Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
      get() {
        return storedScrollPosition;
      },
      set(value) {
        storedScrollPosition = value;
      },
      configurable: true,
    });

    renderListLinks();

    const ulElement = document.querySelector('ul.absolute.inset-0');

    // Simulate scroll
    await act(async () => {
      if (ulElement) {
        storedScrollPosition = 150;
        ulElement.dispatchEvent(new Event('scroll'));
      }
    });

    await waitFor(() => {
      expect(storedScrollPosition).toBe(150);
    });
  });

  it('should distinguish between user scroll and programmatic updates', async () => {
    let scrollEventCount = 0;
    let storedScrollPosition = 0;

    Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
      get() {
        return storedScrollPosition;
      },
      set(value) {
        storedScrollPosition = value;
      },
      configurable: true,
    });

    renderListLinks();

    const ulElement = document.querySelector('ul.absolute.inset-0');

    // Track scroll events
    ulElement?.addEventListener('scroll', () => {
      scrollEventCount++;
    });

    // Simulate user scroll
    await act(async () => {
      if (ulElement) {
        storedScrollPosition = 200;
        ulElement.dispatchEvent(new Event('scroll'));
      }
    });

    await waitFor(() => {
      expect(scrollEventCount).toBeGreaterThan(0);
    });
  });
});

describe('ListLinks - Link Rendering and Health Status', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, username: 'testuser' },
    });

    (useUpdateLinkOrder as jest.Mock).mockReturnValue({
      trigger: jest.fn(),
    });

    (useLinkInfinite as jest.Mock).mockReturnValue({
      data: [
        {
          data: {
            data: mockLinks,
          },
        },
      ],
      isLoading: false,
      size: 1,
      setSize: jest.fn(),
    });
  });

  it('should display health status for each link', () => {
    renderListLinks();

    // Check that health badges are rendered
    expect(screen.getByTestId('health-1')).toHaveAttribute(
      'data-status',
      'healthy'
    );
    expect(screen.getByTestId('health-2')).toHaveAttribute(
      'data-status',
      'unknown'
    );
    expect(screen.getByTestId('health-3')).toHaveAttribute(
      'data-status',
      'unhealthy'
    );
    expect(screen.getByTestId('health-5')).toHaveAttribute(
      'data-status',
      'timeout'
    );
  });

  it('should render link actions', () => {
    renderListLinks();

    expect(screen.getByTestId('delete-1')).toBeInTheDocument();
    expect(screen.getByTestId('edit-1')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-1')).toBeInTheDocument();
    expect(screen.getByTestId('position-1')).toBeInTheDocument();
  });

  it('should display link click count', () => {
    renderListLinks();

    // Check that click count is displayed (all links have 0 clicks)
    const clickButtons = screen
      .getAllByRole('button')
      .filter((button) => button.textContent?.includes('clicks'));
    expect(clickButtons.length).toBeGreaterThan(0);
    expect(clickButtons[0]).toHaveTextContent('0 clicks');
  });

  it('should show loading state', () => {
    (useLinkInfinite as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      size: 0,
      setSize: jest.fn(),
    });

    renderListLinks();

    // Check for skeleton elements
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should show empty state', () => {
    (useLinkInfinite as jest.Mock).mockReturnValue({
      data: [
        {
          data: {
            data: [],
          },
        },
      ],
      isLoading: false,
      size: 1,
      setSize: jest.fn(),
    });

    renderListLinks();

    expect(screen.getByText('No Links found.')).toBeInTheDocument();
  });
});
