import { PagesMobileDockProvider } from '@/components/page/pages-mobile-dock-provider';
import { useMobileDock } from '@/context/mobile-dock-context';
import { fireEvent, render, screen } from '@testing-library/react';

// Test component to use the hook
function TestComponent() {
  const { actions, config } = useMobileDock();
  return (
    <div>
      <div data-testid="add-button-text">{config.addButtonText}</div>
      <div data-testid="search-button-text">{config.searchButtonText}</div>
      <button data-testid="add-button" onClick={actions.triggerAdd}>
        Add
      </button>
      <button data-testid="search-button" onClick={actions.triggerSearch}>
        Search
      </button>
    </div>
  );
}

// Mock DOM elements
const mockCreatePageButton = {
  click: jest.fn(),
};

const mockSearchPageInput = {
  focus: jest.fn(),
};

describe('PagesMobileDockProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock document.querySelector
    document.querySelector = jest.fn((selector) => {
      if (selector === '[data-create-page-button]') {
        return mockCreatePageButton;
      }
      if (selector === '[data-search-page-input]') {
        return mockSearchPageInput;
      }
      return null;
    });
  });

  afterEach(() => {
    // Restore mocks
    jest.restoreAllMocks();
  });

  it('should provide correct config for pages page', () => {
    render(
      <PagesMobileDockProvider>
        <TestComponent />
      </PagesMobileDockProvider>
    );

    // Check if config is provided correctly
    expect(screen.getByTestId('add-button-text')).toHaveTextContent('Add Page');
    expect(screen.getByTestId('search-button-text')).toHaveTextContent(
      'Search Page'
    );
  });

  it('should trigger create page button when add action is called', () => {
    render(
      <PagesMobileDockProvider>
        <TestComponent />
      </PagesMobileDockProvider>
    );

    // Click the add button
    const addButton = screen.getByTestId('add-button');
    fireEvent.click(addButton);

    // Check if create page button was clicked
    expect(mockCreatePageButton.click).toHaveBeenCalledTimes(1);
    expect(document.querySelector).toHaveBeenCalledWith(
      '[data-create-page-button]'
    );
  });

  it('should focus search page input when search action is called', () => {
    render(
      <PagesMobileDockProvider>
        <TestComponent />
      </PagesMobileDockProvider>
    );

    // Click the search button
    const searchButton = screen.getByTestId('search-button');
    fireEvent.click(searchButton);

    // Check if search page input was focused
    expect(mockSearchPageInput.focus).toHaveBeenCalledTimes(1);
    expect(document.querySelector).toHaveBeenCalledWith(
      '[data-search-page-input]'
    );
  });

  it('should handle missing DOM elements gracefully', () => {
    // Mock document.querySelector to return null
    document.querySelector = jest.fn(() => null);

    render(
      <PagesMobileDockProvider>
        <TestComponent />
      </PagesMobileDockProvider>
    );

    // Click the add button
    const addButton = screen.getByTestId('add-button');
    fireEvent.click(addButton);

    // Should not throw error even if element is not found
    expect(document.querySelector).toHaveBeenCalledWith(
      '[data-create-page-button]'
    );
  });
});
