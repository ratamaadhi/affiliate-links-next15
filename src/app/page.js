"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchAPI } from "@/lib/api";
import Link from "next/link";
import { RxMagnifyingGlass } from "react-icons/rx";
import qs from "qs";
import { debounce } from "lodash";
import MetaImage from "@/components/ui/meta-image";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const loaderRef = useRef(null);

  const loadPosts = async (pageNumber, keyword = "") => {
    const query = qs.stringify(
      {
        populate: "*",
        pagination: {
          page: pageNumber,
          pageSize: 5,
        },
        filters: keyword
          ? {
              title: {
                $containsi: keyword,
              },
            }
          : undefined,
      },
      { encodeValuesOnly: true }
    );

    const response = await fetchAPI(`/posts?query=${query}`);
    const newPosts = response.data;
    const total = response.meta.pagination.total;

    if (pageNumber === 1) {
      setPosts(newPosts);
    } else {
      setPosts((prev) => [...prev, ...newPosts]);
    }

    if (posts.length + newPosts.length >= total) {
      setHasMore(false);
    } else {
      setHasMore(true);
    }
  };

  useEffect(() => {
    loadPosts(1, searchTerm);
    setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (page === 1) return;
    loadPosts(page, searchTerm);
  }, [page]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1 }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loaderRef, hasMore]);

  const handleSearch = debounce((e) => {
    setSearchTerm(e.target.value);
  }, 300); // debounce 300ms

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
                  <p className="text-gray-500">{post.description}</p>
                  <p className="text-gray-700">{post.link}</p>
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
