'use client';

import { useState, useEffect } from 'react';
import { Menu, Search, ArrowRight, Star, Clapperboard, Globe, Heart, MessageCircle, Crown, ChevronRight, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CommentSection from '../components/CommentSection';
import GlobalChat from '../components/GlobalChat';

export default function KaaoffcHome() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [kaaoffcComments, setKaaoffcComments] = useState<any[]>([]);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [communityUrl, setCommunityUrl] = useState('https://whatsapp.com/channel/0029Vb7w9Dt4yltJRP5azv0k');
  const [supportUrl, setSupportUrl] = useState('https://saweria.co/kaaoffc');

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setInfoMessage('Aplikasi PWA sudah terinstall atau browser Anda tidak mendukung fitur ini.');
    }
  };

  useEffect(() => {
    // Cek apakah popup sudah pernah muncul hari ini
    const lastSeen = localStorage.getItem('kaaoffc_popup_last_seen');
    const now = new Date().getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    // Jika belum ada data ATAU sudah lewat 24 jam, tampilkan popup
    if (!lastSeen || now - parseInt(lastSeen) > twentyFourHours) {
      setShowPopup(true);
    }

    // Fetch comments
    fetch('/api/comments?itemUrl=all')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const topLevel = data.filter(c => !c.parent_id);
          setKaaoffcComments(topLevel.slice(0, 10)); // Ambil 10 terbaru
        }
      })
      .catch(console.error);

    // Fetch total user count
    fetch('/api/user-count')
      .then(res => res.json())
      .then(data => {
        if (data.count) setTotalUsers(data.count);
      })
      .catch(console.error);

    // Fetch site settings for links
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data.community_url) setCommunityUrl(data.community_url);
        if (data.support_url) setSupportUrl(data.support_url);
      })
      .catch(console.error);
  }, []);

  const formatItemUrl = (url: string) => {
    if (!url) return 'Global';
    if (url === 'kaaoffc-home') return 'Kaaoffc Home';
    const parts = url.split('/');
    let lastPart = parts[parts.length - 1];
    lastPart = lastPart.split('?')[0];
    return lastPart.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const closePopup = () => {
    setShowPopup(false);
    // Simpan waktu saat ini ke localStorage
    localStorage.setItem('kaaoffc_popup_last_seen', new Date().getTime().toString());
  };

  const handleEnterHub = (path: string) => {
    // Set cookie that expires in 30 days
    document.cookie = "kaaoffc_hub_passed=true; max-age=2592000; path=/";
    router.push(path);
  };

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const topSearches = [
    "Battle Through The Heavens", "Martial Peak", " Slave", "Lord of the Mysteries", 
    "Soul Land", "Apotheosis", "Swallowed Star", "Reverend Insanity"
  ];

  const getTimeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    const now = new Date();
    const past = new Date(dateStr);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays > 0) return `${diffDays}h lalu`;
    if (diffHours > 0) return `${diffHours}j lalu`;
    if (diffMins > 0) return `${diffMins}m lalu`;
    return 'Baru saja';
  };

  return (
    <div className="min-h-screen bg-[#1F1F2E] text-white font-sans flex flex-col relative overflow-x-hidden">
      
      <header className="flex items-center justify-between p-3 md:p-5 sticky top-0 z-40 bg-[#1F1F2E]/90 backdrop-blur-md">
        <button onClick={() => setMenuOpen(true)} className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors font-bold text-sm md:text-base">
          <Menu size={20} /> Menu
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-4 pt-4 pb-16 w-full max-w-4xl mx-auto">
        
        {/* Logo Section */}
        <h1 className="text-3xl md:text-4xl font-black mb-3 tracking-tight ">
          <span className="text-red-600">K</span>aaoffc
        </h1>
        
        <p className="text-center text-xs md:text-sm text-zinc-300 max-w-lg leading-relaxed mb-6">
          Kaaoffc adalah platform gratis tanpa iklan untuk membaca komik, novel, menonton donghua, dan melacak progressmu.
        </p>

        {/* Search Box */}
        <form onSubmit={handleGlobalSearch} className="w-full flex items-center gap-2 mb-6">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari komik, novel, donghua..." 
            className="flex-1 bg-white text-zinc-900 rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button type="submit" className="bg-red-600 text-white p-3 rounded-lg hover:bg-red-500 transition-colors ">
            <Search size={20} strokeWidth={3} />
          </button>
        </form>

        {/* Top Search */}
        <div className="w-full text-[11px] md:text-xs text-zinc-300 leading-relaxed mb-8">
          <span className="font-bold text-white">Top search:</span>{' '}
          {topSearches.join(', ')}
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3 mb-8">
          <Link href="/" onClick={() => document.cookie = "kaaoffc_hub_passed=true; max-age=2592000; path=/"} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm md:text-base rounded-lg py-3 flex items-center justify-center gap-2 transition-all  ">
            Jelajahi Kaaoffc <ArrowRight size={16} className="bg-white text-red-600 rounded-full p-0.5" />
          </Link>
          <button onClick={() => window.open(supportUrl, '_blank')} className="w-full bg-[#1DA1F2] hover:bg-blue-400 text-white font-bold text-sm md:text-base rounded-lg py-3 transition-all  ">
            Support Kaaoffc!me
          </button>
          
          {/* Anime & Update Buttons */}
          <div className="flex gap-3 w-full">
            <Link href="/anime" onClick={() => document.cookie = "kaaoffc_hub_passed=true; max-age=2592000; path=/"} className="flex-1 bg-[#2A2B3D] hover:bg-[#3f4058] border border-zinc-700 text-white font-bold text-sm rounded-lg py-3 flex items-center justify-center transition-all">
              Anime
            </Link>
            <Link href="/kaaoffc" onClick={() => setInfoMessage('Fitur Update belum tersedia.')} className="flex-1 bg-[#2A2B3D] hover:bg-[#3f4058] border border-zinc-700 text-white font-bold text-sm rounded-lg py-3 flex items-center justify-center transition-all">
              Update
            </Link>
          </div>
        </div>

        {/* 3 Buttons Grid */}
        <div className="w-full grid grid-cols-3 gap-2 mb-4">
          <button onClick={handleInstallClick} className="bg-[#8A2BE2] hover:bg-purple-500 text-white font-bold text-[10px] md:text-xs py-2 rounded-lg flex items-center justify-center gap-1 ">
            <Star size={14} /> KaaoffcV2
          </button>
          <button onClick={() => setInfoMessage('Fitur Downloader belum tersedia untuk saat ini.')} className="bg-[#E53935] hover:bg-red-500 text-white font-bold text-[10px] md:text-xs py-2 rounded-lg flex items-center justify-center gap-1 ">
            <Clapperboard size={14} /> Downloader
          </button>
          <button onClick={() => window.open('https://whatsapp.com/channel/0029Vb7w9Dt4yltJRP5azv0k', '_blank')} className="bg-[#10B981] hover:bg-emerald-400 text-white font-bold text-[10px] md:text-xs py-2 rounded-lg flex items-center justify-center gap-1 ">
            <Globe size={14} /> Komunitas
          </button>
        </div>

        {/* 4 Category Gateways */}
        <div className="w-full grid grid-cols-4 gap-2 mb-10">
          <Link href="/comic" onClick={() => document.cookie = "kaaoffc_hub_passed=true; max-age=2592000; path=/"} className="flex items-center justify-center bg-[#2A2B3D] border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-bold text-[10px] md:text-xs py-2.5 rounded-lg transition-all">
            Comic
          </Link>
          <Link href="/novel" onClick={() => document.cookie = "kaaoffc_hub_passed=true; max-age=2592000; path=/"} className="flex items-center justify-center bg-[#2A2B3D] border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-bold text-[10px] md:text-xs py-2.5 rounded-lg transition-all">
            Novel
          </Link>
          <Link href="/anime" onClick={() => document.cookie = "kaaoffc_hub_passed=true; max-age=2592000; path=/"} className="flex items-center justify-center bg-[#2A2B3D] border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-bold text-[10px] md:text-xs py-2.5 rounded-lg transition-all">
            Anime ID
          </Link>
          <Link href="/donghua" onClick={() => document.cookie = "kaaoffc_hub_passed=true; max-age=2592000; path=/"} className="flex items-center justify-center bg-[#2A2B3D] border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-bold text-[10px] md:text-xs py-2.5 rounded-lg transition-all">
            Donghua
          </Link>
        </div>

        {/* Support Section */}
        <div className="w-full bg-gradient-to-b from-[#252538] to-[#1F1F2E] rounded-xl p-5 border border-zinc-800  mb-10 relative overflow-hidden">
          <div className="flex flex-col items-center relative z-10 text-center">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-2">
              <Heart className="text-red-500" fill="currentColor" size={18} /> Dukung Kaaoffc!
            </h2>
            <p className="text-xs text-zinc-300 leading-relaxed mb-6 max-w-sm">
              Ayo bantu kami untuk terus aktif dengan cara <strong className="text-white">Berdonasi</strong>. 
              Setiap kontribusi dan dukungan sekecil apapun akan sangat kami hargai 🙏.
            </p>
            
            <div className="w-full bg-[#1A1A27] rounded-lg p-3 font-bold text-center mb-3 text-zinc-300 text-xs">
              Total User: <span className="text-white text-sm ml-2">{totalUsers > 0 ? totalUsers.toLocaleString('id-ID') : '...'}</span>
            </div>
            <button className="w-full bg-[#1DA1F2] hover:bg-blue-400 text-white font-bold py-3 text-sm rounded-lg transition-all  ">
              Hall of Fame Donatur
            </button>
          </div>
        </div>

        {/* Comments Section from DB (Horizontal Scrollable) */}
        <div className="w-full mb-10">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <MessageCircle size={16} /> Komentar Kaaoffc
            </h2>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x custom-scrollbar">
            {kaaoffcComments.length > 0 ? kaaoffcComments.map((comment, i) => (
              <div key={i} className="min-w-[280px] max-w-[280px] snap-center bg-[#1A1A27] rounded-lg p-4 border border-zinc-800 shrink-0">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-[13px] line-clamp-1 w-2/3">{formatItemUrl(comment.item_url)}</h3>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-zinc-500">{getTimeAgo(comment.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <img src={comment.user_avatar || '/avatar.jpeg'} alt="Avatar" className="w-8 h-8 rounded-full object-cover bg-zinc-700" onError={(e) => { e.currentTarget.src = ''; e.currentTarget.className = 'w-8 h-8 rounded-full bg-zinc-700'; }} />
                  <div>
                    <p className="font-bold text-[13px] text-zinc-200 line-clamp-1">{comment.user_email || 'User'}</p>
                    <p className="text-[10px] text-zinc-500">Level {comment.user_level || 1}</p>
                  </div>
                </div>
                <p className="text-zinc-300 text-xs mb-3 line-clamp-3">{comment.content}</p>
                <div className="flex justify-between items-center text-[11px] text-zinc-500 pt-2 border-t border-zinc-800">
                  <div className="flex gap-3">
                    <span className="flex items-center gap-1"><Heart size={12} className={comment.likes_count > 0 ? "text-red-500 fill-red-500" : "text-zinc-500"}/> {comment.likes_count || 0}</span>
                    <span className="flex items-center gap-1"><MessageCircle size={12}/> {comment.replies_count || 0}</span>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-xs text-zinc-500 px-2">Belum ada komentar.</p>
            )}
          </div>
        </div>

        {/* Static Donator Section */}
        <div className="w-full">
          <div className="flex items-center justify-center mb-6 relative">
            <h2 className="text-lg font-bold flex items-center gap-2 text-center text-yellow-500">
              🏆 Top Donatur Kaaoffc
            </h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {/* #1 Top Donatur */}
            <div className="bg-gradient-to-b from-[#2A2B3D] to-[#1A1A27] border border-yellow-500/50 rounded-xl p-4 flex flex-col items-center relative">
              <Crown className="absolute -top-2.5 right-2 text-yellow-400 rotate-12" size={20} fill="currentColor" />
              <img src="/avatar.jpeg" alt="Avatar" className="w-12 h-12 rounded-full border-2 border-yellow-500 mb-2 object-cover" onError={(e) => { e.currentTarget.src = ''; e.currentTarget.className = 'w-12 h-12 rounded-full bg-zinc-700 mb-2'; }} />
              <h3 className="font-bold text-xs mb-0.5 text-center line-clamp-1">rismacell14</h3>
              <p className="text-blue-400 text-[9px] mb-1">09 Sep 2025</p>
              <p className="text-pink-400 font-black text-xs mb-1.5">Rp 202.000</p>
              <span className="text-[8px] text-yellow-500 font-bold bg-yellow-500/10 px-2 py-0.5 rounded-full flex items-center gap-1"><Star size={7} fill="currentColor"/> Top Donation</span>
            </div>

            {/* #2 */}
            <div className="bg-[#2A2B3D] rounded-xl p-4 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-zinc-700 mb-2"></div>
              <h3 className="font-bold text-xs mb-0.5 text-center line-clamp-1">TeGaRpm</h3>
              <p className="text-blue-400 text-[9px] mb-1">29 Ags</p>
              <p className="text-pink-400 font-bold text-xs">Rp 200rb</p>
            </div>

            {/* #3 */}
            <div className="bg-[#2A2B3D] rounded-xl p-4 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-zinc-700 mb-2"></div>
              <h3 className="font-bold text-xs mb-0.5 text-center line-clamp-1">Someone</h3>
              <p className="text-blue-400 text-[9px] mb-1">06 Feb</p>
              <p className="text-pink-400 font-bold text-xs">Rp 150rb</p>
            </div>

            {/* #4 */}
            <div className="bg-[#2A2B3D] rounded-xl p-4 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-zinc-700 mb-2"></div>
              <h3 className="font-bold text-xs mb-0.5 text-center line-clamp-1">Hamba Allah</h3>
              <p className="text-blue-400 text-[9px] mb-1">11 Jan</p>
              <p className="text-pink-400 font-bold text-xs">Rp 100rb</p>
            </div>
          </div>
        </div>

      </main>

      {/* Centered Modal Dropdown Menu Override (Matching Screenshot) */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center pt-24 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#1A1A24] rounded-xl  flex flex-col relative animate-in fade-in zoom-in duration-200">
            {/* Close Button */}
            <button 
              onClick={() => setMenuOpen(false)} 
              className="absolute -top-12 right-0 bg-white text-black p-2 rounded-lg hover:bg-zinc-200 transition-colors "
            >
              <X size={20} />
            </button>
            
            <div className="flex flex-col py-6 items-center gap-4">
              <button onClick={() => { handleEnterHub('/'); setMenuOpen(false); }} className="text-white font-semibold text-sm hover:text-red-500 transition-colors">Home</button>
              <button onClick={() => { handleEnterHub('/'); setMenuOpen(false); }} className="text-white font-semibold text-sm hover:text-red-500 transition-colors">Home ID</button>
              <button onClick={() => { handleEnterHub('/comic'); setMenuOpen(false); }} className="text-white font-semibold text-sm hover:text-red-500 transition-colors">Comic</button>
              <button onClick={() => { handleEnterHub('/novel'); setMenuOpen(false); }} className="text-white font-semibold text-sm hover:text-red-500 transition-colors">Novel</button>
              <button onClick={() => { handleEnterHub('/donghua'); setMenuOpen(false); }} className="text-white font-semibold text-sm hover:text-red-500 transition-colors">Donghua</button>
              <button onClick={() => setMenuOpen(false)} className="text-white font-semibold text-sm hover:text-red-500 transition-colors">Kaaoffclist</button>
              <button onClick={() => setMenuOpen(false)} className="text-white font-semibold text-sm hover:text-red-500 transition-colors">Artikel</button>
              
              <div className="w-10 h-px bg-zinc-700 my-2"></div>
              
              <button onClick={() => setMenuOpen(false)} className="text-white font-semibold text-sm hover:text-red-500 transition-colors">Soundtrack</button>
              <button onClick={() => setMenuOpen(false)} className="text-white font-semibold text-sm hover:text-red-500 transition-colors">Contact CS</button>
              <button onClick={() => setMenuOpen(false)} className="text-white font-semibold text-sm hover:text-red-500 transition-colors">About</button>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Popup (Once a day) */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#1A1A24] rounded-2xl w-full max-w-[340px] p-5 md:p-7 relative border border-zinc-800 shadow-2xl flex flex-col items-center">
            <button onClick={closePopup} className="absolute top-3 right-3 text-zinc-500 hover:text-white bg-zinc-800/50 hover:bg-zinc-700 rounded-full p-1.5 transition-all">
              <X size={18} />
            </button>
            
            <h2 className="text-xl font-extrabold text-center mb-5 text-white tracking-wide">Pemberitahuan !!</h2>
            
            <div className="flex items-center justify-center gap-3 mb-6 bg-zinc-900/50 px-6 py-3 rounded-2xl border border-zinc-800/50">
              <img src="/welcome-logo.png" alt="Kaaoffc" className="w-12 h-12 object-contain drop-shadow-md" onError={(e) => { e.currentTarget.src = '/logo.png'; }} />
              <span className="font-bold text-xl tracking-tight"><span className="text-red-500">K</span>aaoffc</span>
            </div>

            <div className="text-center text-[13px] md:text-sm text-zinc-400 mb-7 leading-relaxed space-y-3 px-1">
              <p>
                <strong className="text-white">Website ini dikelola sepenuh hati.</strong>
              </p>
              <p>
                Kami berkomitmen menghadirkan platform hiburan yang bersih, aman, dan <strong className="text-red-400">Tanpa Iklan Sama Sekali.</strong>
              </p>
              <p>
                Jika Anda ingin <strong className="text-white">Berkontribusi</strong> untuk biaya server kami, silakan klik tombol <strong className="text-blue-400">Support Kaaoffc</strong>.
              </p>
              <p className="font-medium">
                Jangan Lupa Untuk Join <strong className="text-emerald-400">Komunitas Kaaoffc!</strong> 😊
              </p>
            </div>

            <div className="w-full flex flex-col gap-3 mb-4">
              <div className="flex gap-3">
                <button onClick={() => { window.open(communityUrl, '_blank'); }} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-[13px] py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                  <Globe size={16} /> Komunitas
                </button>
                <button onClick={() => { window.open(supportUrl, '_blank'); }} className="flex-1 bg-blue-500 hover:bg-blue-400 text-white font-bold text-[13px] py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                  <Heart size={16} /> Support
                </button>
              </div>
            </div>
            
            <button onClick={closePopup} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-[13px] py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/20 active:scale-95">
              Lanjut <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Info Message Popup */}
      {infoMessage && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#2A2B3D] rounded-xl w-full max-w-sm p-6 relative border border-zinc-700 flex flex-col items-center gap-4">
            <button onClick={() => setInfoMessage('')} className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
            <div className="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center">
              <Clapperboard size={28} className="text-zinc-400" />
            </div>
            <h2 className="text-lg font-bold text-center">Segera Hadir!</h2>
            <p className="text-sm text-zinc-300 text-center leading-relaxed">{infoMessage}</p>
            <button onClick={() => setInfoMessage('')} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm py-3 rounded-lg transition-all">
              Mengerti
            </button>
          </div>
        </div>
      )}

      {/* Global Style for scrollbar hiding */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

    </div>
  );
}
