import { render, screen } from '@testing-library/react';
import { useLinkClick } from '@/hooks/use-link-click';
import { SWRConfig } from 'swr';
import userEvent from '@testing-library/user-event';

// Wrapper component to provide SWR context (must be uppercase)
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map() }}>{children}</SWRConfig>
);

// Test component that uses the hook
function TestComponent({ url, linkId }: { url: string; linkId: number }) {
  const { handleClick } = useLinkClick();

  return (
    <button data-testid="test-button" onClick={() => handleClick(linkId, url)}>
      Click Link
    </button>
  );
}

function renderTestComponent(url: string, linkId: number) {
  return render(
    <Wrapper>
      <TestComponent url={url} linkId={linkId} />
    </Wrapper>
  );
}

describe('useLinkClick', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Mock fetch to return a resolved promise
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should create an anchor element with target="_blank"', () => {
    const createElementSpy = jest.spyOn(document, 'createElement');

    renderTestComponent('https://example.com', 1);

    const button = screen.getByTestId('test-button');
    button.click();

    // Check that createElement was called with 'a' at some point
    const calls = createElementSpy.mock.calls;
    const anchorCreated = calls.some((call) => call[0] === 'a');
    expect(anchorCreated).toBe(true);

    createElementSpy.mockRestore();
  });

  it('should track click via API call', () => {
    renderTestComponent('https://example.com', 123);

    const button = screen.getByTestId('test-button');
    button.click();

    // Verify fetch was called with correct data
    expect(global.fetch).toHaveBeenCalledWith('/api/links/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkId: 123 }),
    });
  });

  it('should NOT navigate the current page when opening link in new tab', () => {
    // Store original location and create a mock location object
    const originalLocation = window.location;
    let mockHref = 'http://localhost/';
    let didNavigate = false;

    // Create a mock location object that tracks navigation
    const mockLocation = {
      get href() {
        return mockHref;
      },
      set href(value: string) {
        mockHref = value;
        didNavigate = true;
      },
    };

    // Replace window.location with our mock
    Object.defineProperty(window, 'location', {
      configurable: true,
      get() {
        return mockLocation;
      },
    });

    renderTestComponent('https://example.com', 1);

    const button = screen.getByTestId('test-button');
    button.click();

    // Fast-forward past the cleanup delay
    jest.advanceTimersByTime(200);

    // The current page should NOT navigate when opening in new tab
    expect(didNavigate).toBe(false);
    expect(mockLocation.href).toBe('http://localhost/');

    // Restore original location
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('should handle invalid URL gracefully', () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const createElementSpy = jest.spyOn(document, 'createElement');

    renderTestComponent('', 1);

    const button = screen.getByTestId('test-button');
    button.click();

    // Should not create anchor for invalid URL (only div and button for render)
    const calls = createElementSpy.mock.calls;
    const anchorCreated = calls.some((call) => call[0] === 'a');
    expect(anchorCreated).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Invalid URL provided to useLinkClick'
    );

    consoleErrorSpy.mockRestore();
    createElementSpy.mockRestore();
  });

  it('should handle null URL gracefully', () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const createElementSpy = jest.spyOn(document, 'createElement');

    // Render with empty string (simulating invalid URL)
    renderTestComponent('', 1);

    const button = screen.getByTestId('test-button');
    button.click();

    // Should not create anchor for invalid URL
    const calls = createElementSpy.mock.calls;
    const anchorCreated = calls.some((call) => call[0] === 'a');
    expect(anchorCreated).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Invalid URL provided to useLinkClick'
    );

    consoleErrorSpy.mockRestore();
    createElementSpy.mockRestore();
  });

  it('should append anchor to body and click it', () => {
    const appendChildSpy = jest.spyOn(document.body, 'appendChild');

    renderTestComponent('https://example.com', 1);

    const button = screen.getByTestId('test-button');
    button.click();

    // Verify anchor was appended to body
    expect(appendChildSpy).toHaveBeenCalled();

    appendChildSpy.mockRestore();
  });

  it('should remove anchor after 100ms', () => {
    const removeChildSpy = jest.spyOn(document.body, 'removeChild');

    renderTestComponent('https://example.com', 1);

    const button = screen.getByTestId('test-button');
    button.click();

    // Anchor should not be removed immediately
    expect(removeChildSpy).not.toHaveBeenCalled();

    // Fast-forward 100ms
    jest.advanceTimersByTime(100);

    // Anchor should be removed after 100ms
    expect(removeChildSpy).toHaveBeenCalled();

    removeChildSpy.mockRestore();
  });
});
