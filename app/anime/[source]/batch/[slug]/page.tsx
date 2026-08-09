'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, Clock, Calendar, Building2, Download, HardDrive } from 'lucide-react';
import Link from 'next/link';
import { getAnimeBatch } from '@/lib/anime-api';

export default function AnimeBatchPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const fetchBatch = async () => {
      try {
        const res = await getAnimeBatch(slug, source);
        setDetail(res?.data || res?.batch_detail || res);
      } catch (error) {
        console.error("Failed to fetch anime batch", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBatch();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#60a5fa] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen pt-16 text-white p-4 flex flex-col items-center justify-center">
        <p className="text-zinc-500 mb-4">Data Batch tidak ditemukan.</p>
        <button onClick={() => router.back()} className="text-[#60a5fa] hover:underline">Kembali</button>
      </div>
    );
  }

  const formats = detail.downloadUrl?.formats || detail.downloads || [];

  return (
    <div className="min-h-screen pt-16 text-white pb-24 font-sans">
      
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center pt-8 px-4 sm:px-6">
        {/* POSTER */}
        <div className="w-32 sm:w-48 lg:w-56 aspect-[3/4] rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(96,165,250,0.15)] mb-6">
          <img 
            src={`/api/image-proxy?url=${encodeURIComponent(detail.poster || detail.thumb)}`} 
            alt={detail.title} 
            className="w-full h-full object-cover"
          />
        </div>

        {/* TITLES */}
        <h1 className="text-xl sm:text-2xl font-bold text-center text-white mb-2 leading-tight">
          {detail.title}
        </h1>
        <p className="text-sm text-zinc-400 text-center mb-5">
          {detail.japanese || detail.title}
        </p>

        {/* INFO TAGS */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {detail.score && (
            <span className="bg-[#2A2B3D] text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Star size={14} className="text-yellow-400 fill-current" /> {detail.score}
            </span>
          )}
          {detail.duration && (
            <span className="bg-[#2A2B3D] text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Clock size={14} className="text-[#60a5fa]" /> {detail.duration}
            </span>
          )}
          {(detail.aired || detail.release_date) && (
            <span className="bg-[#2a3457] text-[#8fb3ff] text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Calendar size={14} /> {detail.aired || detail.release_date}
            </span>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {(detail.studios || detail.studio) && (
            <span className="bg-[#214a38] text-[#81e8b5] text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5">
              <Building2 size={14} /> {detail.studios || detail.studio}
            </span>
          )}
          {detail.episodes && (
            <span className="bg-[#5c3e58] text-[#ffb3e6] text-xs font-bold px-4 py-1.5 rounded-full">
              {detail.episodes} Episodes
            </span>
          )}
        </div>

        {/* GENRES */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {(detail.genreList || detail.genre_list || []).map((g: any, i: number) => (
            <Link key={i} href={`/anime/${source}/genre/${g.genreId || g.slug}`} className="bg-[#1C1D2A] border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium px-4 py-1.5 rounded-lg transition-colors">
              {g.title || g.genreName || g.name}
            </Link>
          ))}
        </div>

        {/* DOWNLOAD BATCH SECTION */}
        <div className="w-full">
          <h3 className="text-xl font-bold text-[#60a5fa] mb-6 flex items-center gap-2 justify-center sm:justify-start">
            <Download size={24} /> Link Download Batch
          </h3>

          <div className="flex flex-col gap-6">
            {formats.length > 0 ? formats.map((format: any, idx: number) => (
              <div key={idx} className="bg-[#1C1D2A] border border-zinc-800 rounded-2xl p-4 sm:p-6">
                <h4 className="text-sm sm:text-base font-bold text-white mb-4 text-center sm:text-left border-b border-zinc-800 pb-3">
                  {format.title || 'Download Format'}
                </h4>
                
                <div className="grid gap-4">
                  {(format.qualities || []).map((q: any, qIdx: number) => (
                    <div key={qIdx} className="bg-[#2A2B3D] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="bg-[#214a38] text-[#81e8b5] text-xs font-bold px-3 py-1 rounded-md">
                          {q.title || q.quality}
                        </span>
                        {q.size && (
                          <span className="flex items-center gap-1 text-zinc-400 text-xs font-bold">
                            <HardDrive size={12} /> {q.size}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {(q.urls || q.serverList || []).map((urlObj: any, urlIdx: number) => (
                          <a 
                            key={urlIdx} 
                            href={urlObj.url || urlObj.href} 
                            target="_blank"
                            rel="noreferrer"
                            className="bg-[#3b3c54] hover:bg-[#60a5fa] hover:text-[#2c131b] text-zinc-300 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                          >
                            {urlObj.title || urlObj.server}
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )) : (
              <div className="bg-[#1C1D2A] border border-zinc-800 rounded-xl p-8 text-center text-zinc-500 font-bold">
                Belum ada link download batch.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
