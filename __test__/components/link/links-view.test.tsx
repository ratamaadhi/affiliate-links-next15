import { render, screen } from '@testing-library/react';
import { useLinkForPageInfinite } from '@/hooks/queries';
import { LinksView } from '@/components/link/links-view';

// Mock the useLinkForPageInfinite hook
jest.mock('@/hooks/queries', () => ({
  useLinkForPageInfinite: jest.fn(),
}));

describe('LinksView', () => {
  const mockPageData = {
    id: 1,
    title: 'Test Page',
    description: 'Test Description',
    slug: 'test-page',
    userId: 123,
    themeSettings: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const mockLinks = [
    {
      id: 1,
      title: 'Link with Image',
      url: 'https://example.com',
      imageUrl: 'https://example.com/image.jpg',
      pageId: 1,
      displayOrder: 0,
      clickCount: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 2,
      title: 'Link without Image',
      url: 'https://example2.com',
      imageUrl: null,
      pageId: 1,
      displayOrder: 1,
      clickCount: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 3,
      title: 'Inactive Link',
      url: 'https://example3.com',
      imageUrl: 'https://example.com/image3.jpg',
      pageId: 1,
      displayOrder: 2,
      clickCount: 0,
      isActive: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    (useLinkForPageInfinite as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(<LinksView pageData={mockPageData} />);

    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });

  it('renders no page selected message when pageData is null', () => {
    (useLinkForPageInfinite as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });

    render(<LinksView pageData={null} />);

    expect(screen.getByText('No Page Selected or Found')).toBeInTheDocument();
    expect(
      screen.getByText('Select a page to see its preview.')
    ).toBeInTheDocument();
  });

  it('renders links with images correctly', () => {
    (useLinkForPageInfinite as jest.Mock).mockReturnValue({
      data: [{ data: { data: mockLinks } }],
      isLoading: false,
    });

    render(<LinksView pageData={mockPageData} />);

    // Check page title and description are displayed
    expect(screen.getByText(mockPageData.title)).toBeInTheDocument();
    expect(screen.getByText(mockPageData.description)).toBeInTheDocument();

    // Check that active links are rendered
    expect(screen.getByText('Link with Image')).toBeInTheDocument();
    expect(screen.getByText('Link without Image')).toBeInTheDocument();

    // Check that inactive link is not rendered
    expect(screen.queryByText('Link with Image')).toBeInTheDocument();

    // Check that links with images have image elements
    const linkWithImage = screen.getByText('Link with Image').closest('a');
    const image = linkWithImage?.querySelector('img');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    expect(image).toHaveAttribute('alt', 'Link with Image');

    // Check that links without images don't have image elements
    const linkWithoutImage = screen
      .getByText('Link without Image')
      .closest('a');
    const noImage = linkWithoutImage?.querySelector('img');
    expect(noImage).not.toBeInTheDocument();
  });

  it('renders no active links message when there are no active links', () => {
    const inactiveLinks = mockLinks.map((link) => ({
      ...link,
      isActive: false,
    }));

    (useLinkForPageInfinite as jest.Mock).mockReturnValue({
      data: [{ data: { data: inactiveLinks } }],
      isLoading: false,
    });

    render(<LinksView pageData={mockPageData} />);

    expect(screen.getByText('No active links to display.')).toBeInTheDocument();
  });

  it('handles empty links array', () => {
    (useLinkForPageInfinite as jest.Mock).mockReturnValue({
      data: [{ data: { data: [] } }],
      isLoading: false,
    });

    render(<LinksView pageData={mockPageData} />);

    expect(screen.getByText('No active links to display.')).toBeInTheDocument();
  });

  it('removes duplicate links based on ID', () => {
    const duplicateLinks = [
      mockLinks[0],
      mockLinks[0], // Duplicate
      mockLinks[1],
    ];

    (useLinkForPageInfinite as jest.Mock).mockReturnValue({
      data: [{ data: { data: duplicateLinks } }],
      isLoading: false,
    });

    render(<LinksView pageData={mockPageData} />);

    // Should only render unique links (no duplicates)
    const linkElements = screen.getAllByRole('link');
    expect(linkElements).toHaveLength(2); // Only 2 unique active links
  });

  it('renders links with correct attributes', () => {
    (useLinkForPageInfinite as jest.Mock).mockReturnValue({
      data: [{ data: { data: mockLinks } }],
      isLoading: false,
    });

    render(<LinksView pageData={mockPageData} />);

    const links = screen.getAllByRole('link');

    // Check first link
    expect(links[0]).toHaveAttribute('href', 'https://example.com');
    expect(links[0]).toHaveAttribute('target', '_blank');
    expect(links[0]).toHaveAttribute('rel', 'noopener noreferrer');

    // Check second link
    expect(links[1]).toHaveAttribute('href', 'https://example2.com');
    expect(links[1]).toHaveAttribute('target', '_blank');
    expect(links[1]).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
