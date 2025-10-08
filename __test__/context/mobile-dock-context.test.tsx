import {
  MobileDockProvider,
  useMobileDock,
} from '@/context/mobile-dock-context';
import { render, screen } from '@testing-library/react';

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

describe('MobileDockContext', () => {
  const mockActions = {
    triggerAdd: jest.fn(),
    triggerSearch: jest.fn(),
  };

  const mockConfig = {
    addButtonText: 'Test Add',
    searchButtonText: 'Test Search',
    addButtonIcon: <div data-testid="add-icon" />,
    searchButtonIcon: <div data-testid="search-icon" />,
    showAddButton: true,
    showSearchButton: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide actions and config to child components', () => {
    render(
      <MobileDockProvider actions={mockActions} config={mockConfig}>
        <TestComponent />
      </MobileDockProvider>
    );

    // Check if config is provided correctly
    expect(screen.getByTestId('add-button-text')).toHaveTextContent('Test Add');
    expect(screen.getByTestId('search-button-text')).toHaveTextContent(
      'Test Search'
    );

    // Check if actions are provided
    const addButton = screen.getByTestId('add-button');
    const searchButton = screen.getByTestId('search-button');

    addButton.click();
    expect(mockActions.triggerAdd).toHaveBeenCalledTimes(1);

    searchButton.click();
    expect(mockActions.triggerSearch).toHaveBeenCalledTimes(1);
  });

  it('should use default config when partial config is provided', () => {
    const partialConfig = {
      addButtonText: 'Custom Add',
      // Other config values should use defaults
    };

    render(
      <MobileDockProvider actions={mockActions} config={partialConfig}>
        <TestComponent />
      </MobileDockProvider>
    );

    // Check if custom config is used
    expect(screen.getByTestId('add-button-text')).toHaveTextContent(
      'Custom Add'
    );

    // Check if default config is used for missing values
    expect(screen.getByTestId('search-button-text')).toHaveTextContent(
      'Search'
    );
  });

  it('should throw error when useMobileDock is used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useMobileDock must be used within a MobileDockProvider');

    // Restore console.error
    console.error = originalError;
  });
});
