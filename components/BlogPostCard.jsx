'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, User } from 'lucide-react';

export default function BlogPostCard({ post }) {
  const publishedDate = post.published_at 
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'N/A';

  return (
    <Link href={`/blog/${post.slug}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
        {post.featured_image && (
          <div className="overflow-hidden rounded-t-lg">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-3">
            {post.category && (
              <Badge variant="secondary" className="text-xs">
                {post.category.name}
              </Badge>
            )}
            {post.post_tags && post.post_tags.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {post.post_tags[0].tag.name}
              </Badge>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="text-gray-600 text-sm line-clamp-3 mb-4">
              {post.excerpt}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between text-sm text-gray-500 border-t pt-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={post.author?.avatar_url} alt={post.author?.name} />
              <AvatarFallback className="text-xs">
                {post.author?.name?.charAt(0).toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs">{post.author?.name || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span className="text-xs">{publishedDate}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}