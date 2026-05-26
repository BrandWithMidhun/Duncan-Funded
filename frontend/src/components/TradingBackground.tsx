'use client';

import { useEffect, useRef } from 'react';

/** Animated candlestick chart canvas — atmospheric background. */
export default function TradingBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let offset = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const generateCandles = (count: number) => {
      const candles: { o: number; c: number; h: number; l: number }[] = [];
      let price = 50;
      for (let i = 0; i < count; i++) {
        const change = (Math.random() - 0.48) * 6;
        const o = price;
        const c = price + change;
        const h = Math.max(o, c) + Math.random() * 3;
        const l = Math.min(o, c) - Math.random() * 3;
        candles.push({ o, c, h, l });
        price = c;
      }
      return candles;
    };

    const candles = generateCandles(120);
    const indices = [
      { name: 'EUR/USD', data: generateCandles(80) },
      { name: 'GBP/JPY', data: generateCandles(80) },
    ];

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = 'hsla(150, 32%, 18%, 0.15)';
      ctx.lineWidth = 0.5;
      for (let y = 0; y < h; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      for (let x = 0; x < w; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      const candleW = 10;
      const gap = 4;
      const chartH = h * 0.5;
      const chartY = h * 0.35;
      const minPrice = Math.min(...candles.map((c) => c.l));
      const maxPrice = Math.max(...candles.map((c) => c.h));
      const range = maxPrice - minPrice || 1;
      const toY = (price: number) => chartY + chartH - ((price - minPrice) / range) * chartH;
      const startX = -offset % (candleW + gap);

      for (let i = 0; i < candles.length; i++) {
        const x = startX + i * (candleW + gap);
        if (x < -candleW || x > w + candleW) continue;
        const candle = candles[i];
        const isGreen = candle.c >= candle.o;
        const alpha = 0.12;
        ctx.strokeStyle = isGreen
          ? `hsla(150, 60%, 40%, ${alpha})`
          : `hsla(3, 52%, 46%, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + candleW / 2, toY(candle.h));
        ctx.lineTo(x + candleW / 2, toY(candle.l));
        ctx.stroke();
        ctx.fillStyle = isGreen
          ? `hsla(150, 60%, 40%, ${alpha})`
          : `hsla(3, 52%, 46%, ${alpha})`;
        const bodyTop = toY(Math.max(candle.o, candle.c));
        const bodyBot = toY(Math.min(candle.o, candle.c));
        ctx.fillRect(x, bodyTop, candleW, Math.max(bodyBot - bodyTop, 1));
      }

      indices.forEach((idx, ii) => {
        const lineY = h * 0.1 + ii * h * 0.15;
        const lineH = h * 0.12;
        const data = idx.data;
        const min = Math.min(...data.map((c) => c.l));
        const max = Math.max(...data.map((c) => c.h));
        const r = max - min || 1;
        ctx.strokeStyle = ii === 0 ? 'hsla(43, 72%, 55%, 0.08)' : 'hsla(150, 60%, 40%, 0.08)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        data.forEach((c, j) => {
          const px = (j / data.length) * w;
          const py = lineY + lineH - ((c.c - min) / r) * lineH;
          if (j === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
        ctx.fillStyle = 'hsla(43, 72%, 55%, 0.06)';
        ctx.font = '10px Raleway, sans-serif';
        ctx.fillText(idx.name, 20, lineY + 10);
      });

      offset += 0.15;
      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}

/** Small decorative candlestick used in lists. */
export function TradingCandle({ variant = 'green' }: { variant?: 'green' | 'red' }) {
  return (
    <span className={variant === 'green' ? 'candle-green' : 'candle-red'} aria-hidden="true" />
  );
}
