'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BlogPostCard from './BlogPostCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';

export default function BlogPostGrid({ posts, categories, initialCategory, initialSearch }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');

  const handleSearch = (e) => {
    e.preventDefault();
    updateFilters(searchQuery, selectedCategory);
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    updateFilters(searchQuery, value);
  };

  const updateFilters = (search, category) => {
    const params = new URLSearchParams();
    
    if (search) {
      params.set('search', search);
    }
    
    if (category && category !== 'all') {
      params.set('category', category);
    }

    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : '/');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    router.push('/');
  };

  const hasActiveFilters = searchQuery || (selectedCategory && selectedCategory !== 'all');

  return (
    <div>
      {/* Filters */}
      <div className="mb-8 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.slug}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit">Search</Button>
        </form>

        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {searchQuery && (
              <Button variant="secondary" size="sm" className="gap-1">
                Search: "{searchQuery}"
              </Button>
            )}
            {selectedCategory && selectedCategory !== 'all' && (
              <Button variant="secondary" size="sm" className="gap-1">
                Category: {categories?.find(c => c.slug === selectedCategory)?.name}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-1 text-red-600 hover:text-red-700"
            >
              <X className="h-3 w-3" />
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Posts Grid */}
      {posts && posts.length > 0 ? (
        <>
          <div className="mb-4 text-sm text-gray-600">
            Showing {posts.length} {posts.length === 1 ? 'post' : 'posts'}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts found</h3>
          <p className="text-gray-600 mb-4">
            {hasActiveFilters
              ? 'Try adjusting your filters or search query'
              : 'No posts have been published yet'}
          </p>
          {hasActiveFilters && (
            <Button onClick={clearFilters} variant="outline">
              Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}