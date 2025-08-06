"use client";

import React from 'react';
import usePosts from "@/hooks/usePosts";
import useInfiniteScroll from "@/hooks/useInfiniteScroll";
import SearchBar from "@/components/search-bar";
import PostItem from "@/components/post-item";
import LoadingIndicator from "@/components/loading-indicator";

// Main component
export default function Home() {
  const { posts, hasMore, setPage, handleSearch, isLoading, setIsLoading } = usePosts();
  const loaderRef = useInfiniteScroll(hasMore, () => {
    if (!isLoading) {
      setIsLoading(true);
      setPage((prev) => prev + 1);
    }
  }, isLoading, setIsLoading);

  return (
    <div className="px-4 w-full mt-4">
      <SearchBar onSearch={handleSearch} />

      <ul className="mt-4">
        {posts.map((post) => (
          <PostItem key={post.id} post={post} />
        ))}
      </ul>

      <LoadingIndicator hasMore={hasMore} loaderRef={loaderRef} />
    </div>
  );
}
