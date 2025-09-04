interface LoadingIndicatorProps {
  hasMore: boolean;
  loaderRef: React.RefObject<HTMLDivElement>;
}

function LoadingIndicator({ hasMore, loaderRef }: LoadingIndicatorProps) {
  return (
    <div ref={loaderRef} className="flex justify-center items-center">
      {hasMore ? (
        <span className="text-sm text-gray-500">Loading more...</span>
      ) : (
        <span className="text-sm text-gray-400">No more data</span>
      )}
    </div>
  );
}

export default LoadingIndicator;
