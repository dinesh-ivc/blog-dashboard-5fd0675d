import { createClient } from '@/lib/supabase/server';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import BlogPostGrid from '@/components/BlogPostGrid';

export default async function HomePage({ searchParams }) {
  const supabase = await createClient();
  
  try {
    // Build query for published posts
    let query = supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_author_id_fkey(id, name, avatar_url),
        category:categories!posts_category_id_fkey(id, name, slug),
        post_tags(tag:tags(id, name, slug))
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    // Apply category filter if provided
    const categorySlug = searchParams?.category;
    if (categorySlug) {
      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .single();
      
      if (category) {
        query = query.eq('category_id', category.id);
      }
    }

    // Apply search filter if provided
    const search = searchParams?.search;
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`);
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
      return (
        <div className="min-h-screen bg-gray-50">
          <Header />
          <Hero />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">Failed to load posts. Please try again later.</p>
            </div>
          </main>
        </div>
      );
    }

    // Fetch all categories for filter
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Hero />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <BlogPostGrid 
            posts={posts || []} 
            categories={categories || []}
            initialCategory={categorySlug}
            initialSearch={search}
          />
        </main>
        <footer className="bg-white border-t border-gray-200 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <p className="text-center text-gray-500 text-sm">
              © {new Date().getFullYear()} Blog. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    );
  } catch (error) {
    console.error('Error in homepage:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-600">Please try refreshing the page</p>
        </div>
      </div>
    );
  }
}