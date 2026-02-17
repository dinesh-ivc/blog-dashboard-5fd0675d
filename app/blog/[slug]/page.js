import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import { Calendar, User, Tag, Folder } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default async function BlogPostPage({ params }) {
  const { slug } = params;
  const supabase = await createClient();

  try {
    // Fetch the post with all relations
    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_author_id_fkey(id, name, email, avatar_url, bio),
        category:categories!posts_category_id_fkey(id, name, slug),
        post_tags(tag:tags(id, name, slug))
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error || !post) {
      console.error('Error fetching post:', error);
      notFound();
    }

    // Fetch related posts from same category
    const { data: relatedPosts } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        featured_image,
        published_at,
        author:users!posts_author_id_fkey(name)
      `)
      .eq('category_id', post.category_id)
      .eq('status', 'published')
      .neq('id', post.id)
      .order('published_at', { ascending: false })
      .limit(3);

    // Format the date
    const publishedDate = post.published_at 
      ? new Date(post.published_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'N/A';

    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Featured Image */}
          {post.featured_image && (
            <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
              <img
                src={post.featured_image}
                alt={post.title}
                className="w-full h-96 object-cover"
              />
            </div>
          )}

          {/* Post Header */}
          <header className="mb-8">
            {/* Category Badge */}
            {post.category && (
              <div className="mb-4">
                <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                  <Folder className="h-3 w-3" />
                  {post.category.name}
                </Badge>
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-xl text-gray-600 mb-6">
                {post.excerpt}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 border-y border-gray-200 py-4">
              <div className="flex items-center gap-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={post.author?.avatar_url} alt={post.author?.name} />
                  <AvatarFallback>
                    {post.author?.name?.charAt(0).toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1 text-gray-900 font-medium">
                    <User className="h-3 w-3" />
                    {post.author?.name || 'Unknown Author'}
                  </div>
                  {post.author?.bio && (
                    <div className="text-xs text-gray-500">{post.author.bio}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {publishedDate}
              </div>
            </div>

            {/* Tags */}
            {post.post_tags && post.post_tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <Tag className="h-4 w-4 text-gray-500" />
                {post.post_tags.map(({ tag }) => (
                  <Badge key={tag.id} variant="outline">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </header>

          {/* Post Content */}
          <div 
            className="prose prose-lg max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Author Bio */}
          {post.author && (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-12">
              <h3 className="text-lg font-semibold mb-4">About the Author</h3>
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={post.author.avatar_url} alt={post.author.name} />
                  <AvatarFallback className="text-xl">
                    {post.author.name?.charAt(0).toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">{post.author.name}</h4>
                  <p className="text-gray-600 text-sm">
                    {post.author.bio || 'No bio available'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Related Posts */}
          {relatedPosts && relatedPosts.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold mb-6">Related Posts</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedPosts.map((related) => (
                  <a
                    key={related.id}
                    href={`/blog/${related.slug}`}
                    className="group"
                  >
                    <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                      {related.featured_image && (
                        <img
                          src={related.featured_image}
                          alt={related.title}
                          className="w-full h-40 object-cover group-hover:opacity-90 transition-opacity"
                        />
                      )}
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {related.title}
                        </h4>
                        {related.excerpt && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {related.excerpt}
                          </p>
                        )}
                        <div className="text-xs text-gray-500 mt-2">
                          By {related.author?.name}
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    );
  } catch (error) {
    console.error('Error loading blog post:', error);
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-900 mb-2">Error Loading Post</h2>
            <p className="text-red-700">Something went wrong. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }
}