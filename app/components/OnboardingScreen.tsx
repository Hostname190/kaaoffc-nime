"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { User, Lock, Eye, EyeOff, Compass } from 'lucide-react';

export default function OnboardingScreen() {
  const [show, setShow] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { user, loading, signIn, signUp } = useAuth();
  const router = useRouter();

  // Form states
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const hasOnboarded = localStorage.getItem('kaaoffc_onboarded');
    
    if (!loading) {
      if (!hasOnboarded && !user) {
        // Wait for SplashScreen to finish (3s display + 0.5s fade)
        const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
        const delay = hasSeenSplash ? 0 : 3600;
        const timer = setTimeout(() => {
          setShow(true);
          document.body.style.overflow = 'hidden';
        }, delay);
        return () => {
          clearTimeout(timer);
          document.body.style.overflow = '';
        };
      } else {
        setShow(false);
        document.body.style.overflow = '';
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [loading, user]);


  const handleSkip = () => {
    localStorage.setItem('kaaoffc_onboarded', 'true');
    document.body.style.overflow = ''; // Kembalikan scroll
    setShow(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email dan password wajib diisi');
      return;
    }

    setIsSubmitting(true);

    if (isRegister) {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error);
      } else {
        alert('Akun berhasil dibuat! Silakan login.');
        setIsRegister(false);
        setPassword('');
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
      } else {
        localStorage.setItem('kaaoffc_onboarded', 'true');
        setShow(false);
      }
    }

    setIsSubmitting(false);
  };

  if (!isClient || !show) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex flex-col items-center justify-center min-h-screen bg-[#0a0a0c] overflow-y-auto p-4 py-10" style={{ animation: 'fadeIn 0.5s ease-out' }}>

      <div className="w-full max-w-[400px] px-6 py-8 relative z-10 flex flex-col items-center animate-in slide-in-from-bottom-10 duration-700">
        {/* Logo and Title */}
          <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-40 h-40 mb-4 flex items-center justify-center">
            {/* User will place the uploaded logo as 'welcome-logo.png' in the public folder */}
            <img src="/welcome-logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-lg" onError={(e) => { e.currentTarget.src = '/logo.png'; }} />
          </div>
          <h1 className="text-2xl font-black text-white mb-2 drop-shadow-md">
            Welcome to <span className="text-red-600">K</span>aaoffc
          </h1>
          <p className="text-zinc-400 text-sm font-medium max-w-xs leading-relaxed">
            Kaaoffc is a free no ads anime site to watch free anime.
          </p>
        </div>

        {/* Action Button */}
        <div className="w-full mt-4 flex justify-center">
          <button 
 onClick={handleSkip}
 className="px-10 py-2.5 bg-[#ff6b00] hover:bg-[#ff8533] text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
 >
            Watch Now
          </button>
        </div>
      </div>
    </div>
  );
}
