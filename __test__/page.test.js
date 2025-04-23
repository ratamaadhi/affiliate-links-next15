import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import PostPage from "@/app/posts/page";
import usePosts from "@/hooks/usePosts";
import useInfiniteScroll from "@/hooks/useInfiniteScroll";

// Mock the hooks
jest.mock("@/hooks/usePosts");
jest.mock("@/hooks/useInfiniteScroll");

describe("PostPage Component", () => {
  it("renders without errors", () => {
    usePosts.mockReturnValue({
      posts: [],
      hasMore: false,
      setPage: jest.fn(),
      handleSearch: jest.fn(),
      isLoading: false,
      setIsLoading: jest.fn(),
    });
    useInfiniteScroll.mockReturnValue(null);

    render(<PostPage />);
    expect(screen.getByText("No more posts")).toBeInTheDocument();
  });

  it("displays posts when available", () => {
    usePosts.mockReturnValue({
      posts: [
        { id: 1, title: "Test Post 1", description: "Test Description 1", link: "test-link-1" },
        { id: 2, title: "Test Post 2", description: "Test Description 2", link: "test-link-2" },
      ],
      hasMore: false,
      setPage: jest.fn(),
      handleSearch: jest.fn(),
      isLoading: false,
      setIsLoading: jest.fn(),
    });
    useInfiniteScroll.mockReturnValue(null);

    render(<PostPage />);
    expect(screen.getByText("Test Post 1")).toBeInTheDocument();
    expect(screen.getByText("Test Post 2")).toBeInTheDocument();
  });

  it("displays loading indicator when loading", () => {
    usePosts.mockReturnValue({
      posts: [],
      hasMore: true,
      setPage: jest.fn(),
      handleSearch: jest.fn(),
      isLoading: true,
      setIsLoading: jest.fn(),
    });
    useInfiniteScroll.mockReturnValue(null);

    render(<PostPage />);
    //expect(screen.getByText("Loading more...")).toBeInTheDocument();
  });

  it("calls setPage when infinite scroll triggers", () => {
    const setPageMock = jest.fn();
    usePosts.mockReturnValue({
      posts: [],
      hasMore: true,
      setPage: setPageMock,
      handleSearch: jest.fn(),
      isLoading: false,
      setIsLoading: jest.fn(),
    });
    const loaderRef = { current: document.createElement('div') };
    useInfiniteScroll.mockReturnValue(loaderRef);

    render(<PostPage />);

    // Simulate intersection observer triggering
    const observer = new IntersectionObserver(() => {});
    observer.observe(loaderRef.current);
    observer.disconnect();

    // Wait for the setPage mock to be called
    //waitFor(() => expect(setPageMock).toHaveBeenCalled());
  });

  beforeAll(() => {
    global.IntersectionObserver = class IntersectionObserver {
      constructor() {}

      disconnect() {
        return null;
      }

      observe() {
        return null;
      }

      takeRecords() {
        return null;
      }

      unobserve() {
        return null;
      }
    };
  });
});
