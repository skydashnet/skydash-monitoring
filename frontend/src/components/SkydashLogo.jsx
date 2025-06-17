import React, { useState, useEffect, useRef } from 'react';

const SkydashLogo = ({ size = 'medium', variant = 'cosmic', className = '' }) => {
  const [time, setTime] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Perbaikan performa: Menggunakan setInterval dengan frekuensi lebih rendah
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Naikkan nilai sedikit lebih banyak untuk mengimbangi frekuensi yang lebih rendah
      setTime(prevTime => prevTime + 0.02); 
    }, 50); // Berjalan sekitar 20 kali per detik (1000ms / 50ms)

    return () => {
      clearInterval(intervalId); // Membersihkan interval saat komponen dilepas
    };
  }, []); // Dependensi kosong agar hanya berjalan sekali

  const handleMouseMove = (e) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: (e.clientX - rect.left - rect.width / 2) / rect.width,
        y: (e.clientY - rect.top - rect.height / 2) / rect.height
      });
    }
  };

  const sizes = {
    small: { container: 'w-48 h-24', text: 'text-2xl', sub: 'text-xs', particles: 12 },
    medium: { container: 'w-72 h-36', text: 'text-4xl', sub: 'text-sm', particles: 18 },
    large: { container: 'w-96 h-48', text: 'text-6xl', sub: 'text-base', particles: 24 }
  };

  const variants = {
    neon: { bg: 'bg-black', primary: '#00ffff', secondary: '#ff00ff', accent: '#ffff00' },
    cosmic: { bg: 'bg-purple-950', primary: '#8b5cf6', secondary: '#06b6d4', accent: '#f59e0b' },
    matrix: { bg: 'bg-gray-950', primary: '#00ff41', secondary: '#ffffff', accent: '#ff6b6b' }
  };

  const config = sizes[size];
  const theme = variants[variant];

  const WaveEffect = ({ delay = 0, amplitude = 1 }) => {
    const points = [];
    for (let i = 0; i <= 100; i += 2) {
      const y = Math.sin((i * 0.1) + time * 2 + delay) * amplitude * 10 + 50;
      points.push(`${i},${y}`);
    }
    return (
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="url(#waveGradient)"
        strokeWidth="0.5"
        opacity="0.6"
        className="animate-pulse"
      />
    );
  };

  const ParticleField = () => {
    return Array.from({ length: config.particles }, (_, i) => {
      const angle = (i / config.particles) * Math.PI * 2;
      const radius = 40 + Math.sin(time * 2 + i) * 20;
      const x = 50 + Math.cos(angle + time) * radius;
      const y = 50 + Math.sin(angle + time) * radius;
      const opacity = (Math.sin(time * 3 + i) + 1) * 0.3 + 0.2;
      
      return (
        <circle
          key={i}
          cx={`${x}%`}
          cy={`${y}%`}
          r={Math.sin(time * 4 + i) + 2}
          fill={theme.primary}
          opacity={opacity}
          className="animate-pulse"
        />
      );
    });
  };

  const GridPattern = () => {
    const lines = [];
    for (let i = 0; i <= 10; i++) {
      const opacity = Math.abs(Math.sin(time + i * 0.5)) * 0.3;
      lines.push(
        <line
          key={`h${i}`} x1="0" y1={`${i * 10}%`}
          x2="100%" y2={`${i * 10}%`}
          stroke={theme.secondary} strokeWidth="0.2" opacity={opacity}
        />
      );
      lines.push(
        <line
          key={`v${i}`} x1={`${i * 10}%`} y1="0"
          x2={`${i * 10}%`} y2="100%"
          stroke={theme.secondary} strokeWidth="0.2" opacity={opacity}
        />
      );
    }
    return lines;
  };

  const letterAnimations = "Skydash".split('').map((letter, i) => ({
    letter,
    delay: i * 0.1,
    transform: `translateY(${Math.sin(time * 2 + i * 0.5) * 3}px) rotate(${Math.sin(time + i) * 2}deg)`
  }));

  return (
    <div
      ref={containerRef}
      className={`relative ${config.container} ${theme.bg} rounded-3xl overflow-hidden cursor-pointer ${className}`}
      onMouseMove={handleMouseMove}
      style={{
        boxShadow: `0 0 60px ${theme.primary}40, inset 0 0 60px ${theme.secondary}20`,
        transform: `perspective(1000px) rotateX(${mousePos.y * 10}deg) rotateY(${mousePos.x * 10}deg)`,
        transition: 'transform 0.1s ease-out'
      }}
    >
      <svg className="absolute inset-0 w-full h-full" style={{ filter: 'blur(0.5px)' }}>
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={theme.primary} stopOpacity="0" />
            <stop offset="50%" stopColor={theme.primary} stopOpacity="1" />
            <stop offset="100%" stopColor={theme.secondary} stopOpacity="0" />
          </linearGradient>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={theme.primary} stopOpacity="0.3" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        <rect width="100%" height="100%" fill="url(#centerGlow)" />
        <GridPattern />
        <WaveEffect delay={0} amplitude={1} />
        <WaveEffect delay={1} amplitude={0.8} />
        <WaveEffect delay={2} amplitude={0.6} />
        <ParticleField />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <div className="relative">
          <div className="flex items-center justify-center mb-2">
            {letterAnimations.map((item, i) => (
              <span
                key={i}
                className={`${config.text} font-black tracking-wider`}
                style={{
                  color: theme.primary,
                  textShadow: `0 0 10px ${theme.primary}, 0 0 20px ${theme.secondary}80`,
                  transform: item.transform,
                  filter: `hue-rotate(${Math.sin(time + i) * 30}deg)`,
                  transition: 'all 0.1s ease-out',
                  animationDelay: `${item.delay}s`
                }}
              >
                {item.letter}
              </span>
            ))}
          </div>

          <div
            className={`absolute -top-2 -right-8 px-3 py-1 rounded-full text-xs font-bold text-black`}
            style={{
              backgroundColor: theme.accent,
              boxShadow: `0 0 20px ${theme.accent}`,
              transform: `scale(${1 + Math.sin(time * 3) * 0.1}) rotate(${Math.sin(time * 2) * 5}deg)`,
            }}
          >
            .NET
          </div>
        </div>
      </div>
      
      <div
        className="absolute inset-0 rounded-3xl"
        style={{
          background: `radial-gradient(circle at ${50 + mousePos.x * 20}% ${50 + mousePos.y * 20}%, ${theme.primary}10, transparent 40%)`,
          opacity: 0.5
        }}
      />

      <div
        className="absolute inset-1 rounded-3xl border"
        style={{
          borderColor: theme.primary,
          opacity: 0.5 + Math.sin(time * 2) * 0.2,
          boxShadow: `inset 0 0 20px ${theme.primary}40`
        }}
      />
    </div>
  );
};

export default SkydashLogo;