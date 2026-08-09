"use client";

import React, { useRef, useState } from 'react';

export default function OnboardingBackground() {
  const [bgOffset, setBgOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const onPointerDownBg = (e: React.PointerEvent) => {
    dragging.current = true;
    dragStart.current = { x: e.clientX - bgOffset.x, y: e.clientY - bgOffset.y };
    try { (e.target as Element).setPointerCapture(e.pointerId); } catch (err) {}
    e.stopPropagation();
  };

  const onPointerMoveBg = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    setBgOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
    e.stopPropagation();
  };

  const onPointerUpBg = (e: React.PointerEvent) => {
    dragging.current = false;
    try { (e.target as Element).releasePointerCapture(e.pointerId); } catch (err) {}
    e.stopPropagation();
  };

  return (
    <div
      className="absolute bottom-0 inset-x-0 h-[40vh] z-[-1] opacity-80"
      style={{ transform: `translate(${bgOffset.x}px, ${bgOffset.y}px)`, touchAction: 'none' }}
      onPointerDown={onPointerDownBg}
      onPointerMove={onPointerMoveBg}
      onPointerUp={onPointerUpBg}
    >
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#ff6b00] rounded-full blur-[2px] opacity-90 translate-y-1/3"></div>
      <div
        className="absolute bottom-0 inset-x-0 h-32 bg-repeat-x"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath fill='%23050505' d='M0,100 L0,80 L10,80 L10,60 L20,60 L20,70 L30,70 L30,40 L45,40 L45,55 L55,55 L55,30 L70,30 L70,50 L85,50 L85,75 L100,75 L100,100 Z'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 100%'
        }}
      ></div>
      <div
        className="absolute bottom-0 inset-x-0 h-24 bg-repeat-x"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath fill='%23000000' d='M0,100 L0,90 L15,90 L15,65 L25,65 L25,80 L40,80 L40,45 L50,45 L50,60 L65,60 L65,35 L80,35 L80,70 L95,70 L95,85 L100,85 L100,100 Z'/%3E%3C/svg%3E")`,
          backgroundSize: '150px 100%'
        }}
      ></div>
      <div className="absolute top-[-50vh] inset-x-0 h-[80vh] bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.8)_0%,_transparent_2px)] bg-[size:30px_30px] opacity-30"></div>
    </div>
  );
}
