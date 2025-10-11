import { LinksView } from '@/components/link/links-view';
import { act, fireEvent, render, screen } from '@testing-library/react';

// Mock the hooks
jest.mock('@/hooks/queries', () => ({
  useLinkForPageInfinite: jest.fn(),
}));

jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value, // Return value immediately for testing
}));

import { useLinkForPageInfinite } from '@/hooks/queries';

const mockPageData: any = {
  id: 1,
  title: 'Test Page',
  description: 'Test Description',
  slug: 'test-page',
  userId: 1,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  themeSettings: {},
};

const mockLinks: any[] = [
  {
    id: 1,
    title: 'Test Link 1',
    description: 'Test Description 1',
    url: 'https://example1.com',
    isActive: true,
    clickCount: 10,
    displayOrder: 1,
    pageId: 1,
    imageUrl: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 2,
    title: 'Another Link 2',
    description: 'Test Description 2',
    url: 'https://example2.com',
    isActive: true,
    clickCount: 5,
    displayOrder: 2,
    pageId: 1,
    imageUrl: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

describe('LinksView Search Performance', () => {
  const mockUseLinkForPageInfinite =
    useLinkForPageInfinite as jest.MockedFunction<
      typeof useLinkForPageInfinite
    >;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation
    mockUseLinkForPageInfinite.mockReturnValue({
      data: [
        {
          data: {
            data: mockLinks,
            pagination: {
              totalItems: mockLinks.length,
              itemCount: mockLinks.length,
              itemsPerPage: 100,
              totalPages: 1,
              currentPage: 1,
            },
          },
        },
      ],
      isLoading: false,
      error: null,
      mutate: jest.fn(),
    } as any);
  });

  it('should not re-fetch all data when search term changes', () => {
    jest.useFakeTimers();

    // Mock initial loading state first, then loaded state
    mockUseLinkForPageInfinite
      .mockReturnValueOnce({
        data: [],
        isLoading: true,
        error: null,
        mutate: jest.fn(),
      } as any)
      .mockReturnValue({
        data: [
          {
            data: {
              data: mockLinks,
              pagination: {
                totalItems: mockLinks.length,
                itemCount: mockLinks.length,
                itemsPerPage: 100,
                totalPages: 1,
                currentPage: 1,
              },
            },
          },
        ],
        isLoading: false,
        error: null,
        mutate: jest.fn(),
      } as any);

    const { rerender } = render(<LinksView pageData={mockPageData} />);

    // Initial render should call the hook
    expect(mockUseLinkForPageInfinite).toHaveBeenCalledTimes(1);
    expect(mockUseLinkForPageInfinite).toHaveBeenCalledWith({
      pageId: 1,
      search: '',
      limit: 8,
    });

    // Re-render with loaded state to simulate initial load completion
    rerender(<LinksView pageData={mockPageData} />);

    // Type in search input
    const searchInput = screen.getByPlaceholderText('Search links...');
    act(() => {
      fireEvent.change(searchInput, { target: { value: 'test' } });
    });

    // Fast forward timers for debounce
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should call hook again with new search term (may be called multiple times due to React renders)
    // Verify that at least 2 calls were made (initial + search)
    expect(mockUseLinkForPageInfinite.mock.calls.length).toBeGreaterThanOrEqual(
      2
    );
    expect(mockUseLinkForPageInfinite).toHaveBeenLastCalledWith({
      pageId: 1,
      search: 'test',
      limit: 8,
    });

    jest.useRealTimers();
  });

  it('should update UI without full page reload when searching', async () => {
    const { rerender } = render(<LinksView pageData={mockPageData} />);

    // Verify initial state
    expect(screen.getByText('Featured Links')).toBeInTheDocument();
    expect(screen.getAllByTestId('link-card')).toHaveLength(2);

    // Type in search input
    const searchInput = screen.getByPlaceholderText('Search links...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Mock filtered results
    mockUseLinkForPageInfinite.mockReturnValue({
      data: [{ data: { data: [mockLinks[0]] } }], // Only one link matches
      isLoading: false,
      error: null,
      mutate: jest.fn(),
    } as any);

    // Re-render component with new data
    rerender(<LinksView pageData={mockPageData} />);

    // Verify UI updated without full reload
    expect(screen.getByText('Search Results')).toBeInTheDocument();
    expect(screen.getAllByTestId('link-card')).toHaveLength(1);

    // Header should remain the same (not reloaded)
    expect(screen.getByText('Test Page')).toBeInTheDocument();
  });

  it('should show loading state without page reload during search', () => {
    jest.useFakeTimers();

    // Mock initial loaded state
    mockUseLinkForPageInfinite.mockReturnValue({
      data: [{ data: { data: mockLinks } }],
      isLoading: false,
      error: null,
      mutate: jest.fn(),
    } as any);

    const { rerender } = render(<LinksView pageData={mockPageData} />);

    // Type in search input
    const searchInput = screen.getByPlaceholderText('Search links...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Mock loading state during search
    mockUseLinkForPageInfinite.mockReturnValue({
      data: [{ data: { data: mockLinks } }],
      isLoading: true,
      error: null,
      mutate: jest.fn(),
    } as any);

    // Re-render to show loading state
    rerender(<LinksView pageData={mockPageData} />);

    // Should show loading spinner without page reload
    expect(screen.getByTestId('search-spinner')).toBeInTheDocument();

    // Header should remain visible (not reloaded)
    expect(screen.getByText('Test Page')).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('should handle empty search results without page reload', () => {
    jest.useFakeTimers();

    // Mock initial loading state first, then loaded state with empty results
    mockUseLinkForPageInfinite
      .mockReturnValueOnce({
        data: [],
        isLoading: true,
        error: null,
        mutate: jest.fn(),
      } as any)
      .mockReturnValue({
        data: [{ data: { data: [] } }],
        isLoading: false,
        error: null,
        mutate: jest.fn(),
      } as any);

    const { rerender } = render(<LinksView pageData={mockPageData} />);

    // Re-render with loaded state to simulate initial load completion
    rerender(<LinksView pageData={mockPageData} />);

    // Type in search input
    const searchInput = screen.getByPlaceholderText('Search links...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    // Fast forward timers for debounce
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should show empty state without page reload
    expect(screen.getByText('No Results Found')).toBeInTheDocument();

    // Header should remain the same (not reloaded)
    expect(screen.getByText('Test Page')).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('should clear search without page reload', () => {
    render(<LinksView pageData={mockPageData} />);

    // Type in search input
    const searchInput = screen.getByPlaceholderText('Search links...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Clear search
    const clearButton = screen.getByTestId('clear-search-button');
    fireEvent.click(clearButton);

    // Should reset to original state without page reload
    expect(screen.getByText('Featured Links')).toBeInTheDocument();
    expect(screen.getAllByTestId('link-card')).toHaveLength(2);

    // Header should remain the same (not reloaded)
    expect(screen.getByText('Test Page')).toBeInTheDocument();
  });
});
