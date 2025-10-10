import { SearchLinksView } from '@/components/link/search-links-view';
import { fireEvent, render, screen } from '@testing-library/react';

// Mock debounce untuk testing
jest.mock('lodash', () => ({
  debounce: (fn: Function) => fn,
}));

describe('SearchLinksView', () => {
  const mockOnSearch = jest.fn();
  const mockOnInputChange = jest.fn();

  beforeEach(() => {
    mockOnSearch.mockClear();
    mockOnInputChange.mockClear();
  });

  it('renders search input with placeholder', () => {
    render(
      <SearchLinksView
        onSearch={mockOnSearch}
        onInputChange={mockOnInputChange}
        value=""
      />
    );

    const searchInput = screen.getByPlaceholderText('Search links...');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('data-testid', 'search-input');
  });

  it('calls onSearch when user types in input', () => {
    jest.useFakeTimers();
    render(
      <SearchLinksView
        onSearch={mockOnSearch}
        onInputChange={mockOnInputChange}
        value=""
      />
    );

    const searchInput = screen.getByPlaceholderText('Search links...');
    fireEvent.change(searchInput, { target: { value: 'test query' } });

    // Fast forward until all timers have been executed
    jest.advanceTimersByTime(500);

    expect(mockOnSearch).toHaveBeenCalledWith('test query');
    jest.useRealTimers();
  });

  it('shows clear button when text is entered', () => {
    const { rerender } = render(
      <SearchLinksView
        onSearch={mockOnSearch}
        onInputChange={mockOnInputChange}
        value=""
      />
    );

    const searchInput = screen.getByPlaceholderText('Search links...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Rerender with updated value to simulate controlled component behavior
    rerender(
      <SearchLinksView
        onSearch={mockOnSearch}
        onInputChange={mockOnInputChange}
        value="test"
      />
    );

    const clearButton = screen.getByTestId('clear-search-button');
    expect(clearButton).toBeInTheDocument();
  });

  it('calls onSearch with empty string when clear button is clicked', async () => {
    const { rerender } = render(
      <SearchLinksView
        onSearch={mockOnSearch}
        onInputChange={mockOnInputChange}
        value=""
      />
    );

    const searchInput = screen.getByPlaceholderText('Search links...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Rerender with updated value to simulate controlled component behavior
    rerender(
      <SearchLinksView
        onSearch={mockOnSearch}
        onInputChange={mockOnInputChange}
        value="test"
      />
    );

    const clearButton = screen.getByTestId('clear-search-button');
    fireEvent.click(clearButton);

    expect(mockOnSearch).toHaveBeenCalledWith('');
  });

  it('shows loading spinner when isLoading is true', () => {
    render(
      <SearchLinksView
        onSearch={mockOnSearch}
        onInputChange={mockOnInputChange}
        value=""
        isLoading={true}
      />
    );

    const spinner = screen.getByTestId('search-spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('shows result count badge when resultCount is provided', () => {
    render(
      <SearchLinksView
        onSearch={mockOnSearch}
        onInputChange={mockOnInputChange}
        value="test"
        resultCount={5}
      />
    );

    // Simulate having a search term to show the badge
    const searchInput = screen.getByPlaceholderText('Search links...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    const badge = screen.getByText('5 results');
    expect(badge).toBeInTheDocument();
  });

  it('shows no results message when resultCount is 0', () => {
    render(
      <SearchLinksView
        onSearch={mockOnSearch}
        onInputChange={mockOnInputChange}
        value="test"
        resultCount={0}
      />
    );

    // Simulate user typing to trigger search
    const searchInput = screen.getByPlaceholderText('Search links...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    const noResultsMessage = screen.getByText(/no links found matching/i);
    expect(noResultsMessage).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <SearchLinksView
        onSearch={mockOnSearch}
        onInputChange={mockOnInputChange}
        value=""
      />
    );

    const searchInput = screen.getByRole('textbox');
    expect(searchInput).toHaveAttribute('aria-label', 'Search links');
  });

  it('clears debounce timeout on unmount', () => {
    const { unmount } = render(
      <SearchLinksView
        onSearch={mockOnSearch}
        onInputChange={mockOnInputChange}
        value=""
      />
    );

    // Component should unmount without errors
    expect(() => unmount()).not.toThrow();
  });
});
