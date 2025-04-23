"use client";

import React from "react";
import { Skeleton } from "./skeleton";
import axios from "axios";
import _ from "lodash";

const scrapingApiUrl = process.env.NEXT_PUBLIC_SCRAPING_API;

function useLinkPreview(link) {
  const [state, setState] = React.useState({
    image: null,
    title: null,
    description: null,
    url: null,
    loading: false,
    error: null,
  });

  const isInitialMount = React.useRef(true);

  React.useEffect(() => {
    async function fetchPreview() {
      setState((prev) => ({ ...prev, loading: true }));

      try {
        const url = encodeURIComponent(link)
        // const response = await axios.get(`/api/link-meta2?url=${url}`);
        const response = await axios.get(`${scrapingApiUrl}/metadata?url=${url}`);
        const data = await response.data;
        console.log("Fetched data:", data);

        setState({
          image: data.image,
          title: data.title,
          description: data.description,
          url: link,
          loading: false,
          error: null,
        });
      } catch (error) {
        setState((prev) => ({ ...prev, error, loading: false }));
      }
    }

    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      fetchPreview();
    }
  }, [link]);

  return state;
}

function LoadingSkeleton() {
  return <Skeleton className="w-full h-full rounded-lg" />;
}

function ImagePreview({ image, title }) {
  return (
    <img
      src={image}
      alt={title || "Preview"}
      width={400}
      height={300}
      className="object-cover w-full h-full rounded-lg"
    />
  );
}

function NoImageBackground() {
  return <div className="bg-accent w-full h-full rounded-lg" />;
}

function NoPreviewMessage() {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <p>No preview available</p>
    </div>
  );
}

function MetaImage({ link }) {
  const { image, title, loading, error } = useLinkPreview(link);

  return (
    <div className="aspect-[4/3] w-full mb-4">
      {loading && <LoadingSkeleton />}
      {!loading && !_.isEmpty(image) && <ImagePreview image={image} title={title} />}
    </div>
  );
}

export default MetaImage;
