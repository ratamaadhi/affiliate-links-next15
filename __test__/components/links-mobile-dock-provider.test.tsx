import { LinksMobileDockProvider } from '@/components/link/links-mobile-dock-provider';
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
const mockCreateLinkButton = {
  click: jest.fn(),
};

const mockSearchInput = {
  focus: jest.fn(),
};

describe('LinksMobileDockProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock document.querySelector
    document.querySelector = jest.fn((selector) => {
      if (selector === '[data-create-link-button]') {
        return mockCreateLinkButton;
      }
      if (selector === '[data-search-input]') {
        return mockSearchInput;
      }
      return null;
    });
  });

  afterEach(() => {
    // Restore mocks
    jest.restoreAllMocks();
  });

  it('should provide correct config for links page', () => {
    render(
      <LinksMobileDockProvider>
        <TestComponent />
      </LinksMobileDockProvider>
    );

    // Check if config is provided correctly
    expect(screen.getByTestId('add-button-text')).toHaveTextContent('Add Link');
    expect(screen.getByTestId('search-button-text')).toHaveTextContent(
      'Search Link'
    );
  });

  it('should trigger create link button when add action is called', () => {
    render(
      <LinksMobileDockProvider>
        <TestComponent />
      </LinksMobileDockProvider>
    );

    // Click the add button
    const addButton = screen.getByTestId('add-button');
    fireEvent.click(addButton);

    // Check if create link button was clicked
    expect(mockCreateLinkButton.click).toHaveBeenCalledTimes(1);
    expect(document.querySelector).toHaveBeenCalledWith(
      '[data-create-link-button]'
    );
  });

  it('should focus search input when search action is called', () => {
    render(
      <LinksMobileDockProvider>
        <TestComponent />
      </LinksMobileDockProvider>
    );

    // Click the search button
    const searchButton = screen.getByTestId('search-button');
    fireEvent.click(searchButton);

    // Check if search input was focused
    expect(mockSearchInput.focus).toHaveBeenCalledTimes(1);
    expect(document.querySelector).toHaveBeenCalledWith('[data-search-input]');
  });

  it('should handle missing DOM elements gracefully', () => {
    // Mock document.querySelector to return null
    document.querySelector = jest.fn(() => null);

    render(
      <LinksMobileDockProvider>
        <TestComponent />
      </LinksMobileDockProvider>
    );

    // Click the add button
    const addButton = screen.getByTestId('add-button');
    fireEvent.click(addButton);

    // Should not throw error even if element is not found
    expect(document.querySelector).toHaveBeenCalledWith(
      '[data-create-link-button]'
    );
  });
});
