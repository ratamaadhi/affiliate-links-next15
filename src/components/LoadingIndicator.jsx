import React from 'react';

// LoadingIndicator component
function LoadingIndicator({ hasMore, loaderRef }) {
  return (
    <div ref={loaderRef} className="flex justify-center items-center py-4">
      {hasMore ? (
        <span className="text-sm text-gray-500">Loading more...</span>
      ) : (
        <span className="text-sm text-gray-400">No more posts</span>
      )}
    </div>
  );
}

export default LoadingIndicator;
