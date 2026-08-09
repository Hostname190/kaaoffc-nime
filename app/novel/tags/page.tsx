'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Star, Tag } from 'lucide-react';
import Link from 'next/link';

export default function NovelTagsPage() {
  const router = useRouter();
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch('/api/novel/sakuranovel/tags');
        const json = await res.json();

        let items: any[] = [];
        if (json?.data?.results) items = json.data.results;
        else if (json?.result?.items) items = json.result.items;
        else if (Array.isArray(json?.result)) items = json.result;
        else if (json?.data?.items) items = json.data.items;
        else if (Array.isArray(json?.data)) items = json.data;
        else if (Array.isArray(json)) items = json;

        setTags(items);
      } catch (error) {
        console.error("Failed to fetch tags:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTags();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#0a0a0c] text-white">
      <header className="sticky top-0 z-30 bg-[#0a0a0c]/90 backdrop-blur-md px-4 py-3 flex items-center gap-3 border-b border-white/5">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg font-bold">Semua Tag</h1>
          <p className="text-xs text-zinc-500">Kaaoffc</p>
        </div>
      </header>

      <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1.5 h-6 bg-pink-500 rounded-full"></div>
          <h2 className="text-xl font-bold">Daftar Tag</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : tags.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">Tidak ada tag ditemukan.</div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {tags.map((tag: any, i: number) => (
              <Link
                href={`/novel/tag/sakura-${tag.slug || tag.id}`}
                key={i}
                className="flex items-center gap-2 px-4 py-2 bg-[#1C1D2A] hover:bg-pink-600/20 border border-zinc-800 hover:border-pink-500/50 text-zinc-300 hover:text-pink-300 rounded-full text-sm font-medium transition-all"
              >
                <Tag size={14} />
                {tag.name || tag.title}
                {tag.count && <span className="text-[10px] text-zinc-500 ml-1">({tag.count})</span>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
