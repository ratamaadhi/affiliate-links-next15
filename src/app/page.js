"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchAPI } from "@/lib/api";
import Link from "next/link";
import { RxMagnifyingGlass } from "react-icons/rx";
import qs from "qs";
import { debounce } from "lodash";
import MetaImage from "@/components/ui/meta-image";

const PAGE_SIZE = 5;

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const loaderRef = useRef(null);

  const fetchPosts = useCallback(async (pageNumber, queryParams = {}) => {
    try {
      const query = qs.stringify(
        {
          populate: "*",
          pagination: {
            page: pageNumber,
            pageSize: PAGE_SIZE,
          },
          filters: queryParams,
        },
        { encodeValuesOnly: true }
      );

      const response = await fetchAPI(`/posts?${query}`);

      if (!response?.data || !response?.meta) {
        console.error("Invalid API response structure:", response);
        setHasMore(false);
        return;
      }

      const newPosts = response.data;
      const total = response.meta.pagination.total;
      const isFirstPage = pageNumber === 1;

      setPosts((prevPosts) => {
        const updatedPosts = isFirstPage ? newPosts : [...prevPosts, ...newPosts];
        setHasMore(updatedPosts.length < total);
        return updatedPosts;
      });
    } catch (error) {
      console.error("Failed to load posts:", error);
      setHasMore(false);
    }
  }, []);

  const loadPosts = useCallback(
    (pageNumber, keyword = "") => {
      const queryParams = keyword
        ? {
            $or: [
              { title: { $containsi: keyword } },
              { description: { $containsi: keyword } },
              { link: { $containsi: keyword } },
            ],
          }
        : undefined;

      return fetchPosts(pageNumber, queryParams);
    },
    [fetchPosts]
  );

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadPosts(1, searchTerm);
  }, [searchTerm, loadPosts]);

  useEffect(() => {
    if (page > 1) {
      loadPosts(page, searchTerm);
    }
  }, [page, searchTerm, loadPosts]);

  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1 }
    );

    const currentLoaderRef = loaderRef.current;
    observer.observe(currentLoaderRef);

    return () => {
      if (currentLoaderRef) {
        observer.unobserve(currentLoaderRef);
      }
      observer.disconnect();
    };
  }, [hasMore]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSearch = useCallback(
    debounce((e) => {
      setSearchTerm(e.target.value);
    }, 300),
    []
  );

  return (
    <div className="px-4 w-full mt-4">
      <div className="relative flex gap-2">
        <Input
          type="text"
          placeholder="Search..."
          onChange={handleSearch}
          startIcon={RxMagnifyingGlass}
        />
      </div>

      <ul className="mt-4">
        {posts.map((post) => (
          <li key={post.id} className="mb-4">
            <Link href={post.link} target="_blank">
              <Card>
                <CardContent>
                  <MetaImage link={post.link} />
                  <h2 className="text-xl font-bold">{post.title}</h2>
                  <p className="text-gray-500 line-clamp-2">{post.description}</p>
                  {/* <p className="text-gray-700 line-clamp-2">{post.link}</p> */}
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>

      <div ref={loaderRef} className="flex justify-center items-center py-4">
        {hasMore ? (
          <span className="text-sm text-gray-500">Loading more...</span>
        ) : (
          <span className="text-sm text-gray-400">No more posts</span>
        )}
      </div>
    </div>
  );
}
