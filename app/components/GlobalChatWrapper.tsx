'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import GlobalChat from './GlobalChat';

export default function GlobalChatWrapper() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Dragging state
  const [positionY, setPositionY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const initialPositionY = useRef(0);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Initialize position
  useEffect(() => {
    // Default to bottom right corner, 80px from the bottom
    setPositionY(window.innerHeight - 80);

    const handleResize = () => {
      setPositionY(prev => Math.min(prev, window.innerHeight - 80));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(false);
    dragStartY.current = e.clientY;
    initialPositionY.current = positionY;
    if (buttonRef.current) {
      buttonRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // only drag if mouse is down or touching
    if (e.buttons !== 1 && e.pointerType === 'mouse') return;
    
    // Calculate delta
    const deltaY = e.clientY - dragStartY.current;
    
    if (Math.abs(deltaY) > 3) {
      setIsDragging(true);
      let newY = initialPositionY.current + deltaY;
      
      // Boundaries
      newY = Math.max(80, newY); // Don't go above top nav
      newY = Math.min(window.innerHeight - 80, newY); // Don't go below screen
      
      setPositionY(newY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (buttonRef.current) {
      buttonRef.current.releasePointerCapture(e.pointerId);
    }
    // Do NOT open here, let onClick handle it to prevent ghost clicks on mobile
    setTimeout(() => setIsDragging(false), 50);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging) {
      setIsOpen(true);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div 
        ref={buttonRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
        className="fixed right-4 z-[90] w-12 h-12 bg-[#5C6BC0] rounded-full flex items-center justify-center cursor-pointer hover:bg-indigo-500 transition-colors shadow-xl shadow-indigo-500/20 touch-none"
        style={{ top: positionY ? `${positionY}px` : 'auto', bottom: positionY ? 'auto' : '16px' }}
        title="Buka Global Chat (Geser ke atas/bawah)"
      >
        <MessageCircle fill="white" className="text-white pointer-events-none" size={20} />
      </div>

      {/* Global Chat Modal */}
      <GlobalChat isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
