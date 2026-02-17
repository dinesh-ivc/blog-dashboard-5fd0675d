import { BookOpen } from 'lucide-react';

export default function Hero() {
  return (
    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <BookOpen className="h-10 w-10" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Welcome to Our Blog
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8">
            Discover stories, thinking, and expertise from writers on any topic
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="bg-white/10 backdrop-blur-sm rounded-full px-6 py-2">
              📚 Quality Content
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-full px-6 py-2">
              ✍️ Expert Writers
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-full px-6 py-2">
              🌟 Fresh Perspectives
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}