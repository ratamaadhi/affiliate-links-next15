import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import MetaImage from "@/components/ui/meta-image";
import Link from "next/link";

// PostItem component
function PostItem({ post }) {
  return (
    <li className="mb-4">
      <Link href={post.link} target="_blank">
        <Card>
          <CardContent>
            <MetaImage link={post.link} />
            <h2 className="text-xl font-bold">{post.title}</h2>
            <p className="text-gray-500 line-clamp-2">{post.description}</p>
          </CardContent>
        </Card>
      </Link>
    </li>
  );
}

export default PostItem;
