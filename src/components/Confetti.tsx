/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

export default function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Confetti particle definition
    interface Particle {
      x: number;
      y: number;
      size: number;
      color: string;
      speedX: number;
      speedY: number;
      rotation: number;
      rotationSpeed: number;
      opacity: number;
    }

    const colors = [
      '#FF2A6D', '#05D9E8', '#FFD700', '#FF9800', '#4CAF50', '#00E5FF',
      '#E040FB', '#FF5A5F', '#3B82F6', '#10B981', '#F59E0B', '#EC4899'
    ];

    const particles: Particle[] = [];

    // Create initial burst from both corners
    const createExplosion = () => {
      // Left corner
      for (let i = 0; i < 80; i++) {
        particles.push({
          x: 0,
          y: canvas.height * 0.8,
          size: Math.random() * 8 + 6,
          color: colors[Math.floor(Math.random() * colors.length)],
          speedX: Math.random() * 14 + 6,
          speedY: -(Math.random() * 18 + 12),
          rotation: Math.random() * 360,
          rotationSpeed: Math.random() * 6 - 3,
          opacity: 1,
        });
      }

      // Right corner
      for (let i = 0; i < 80; i++) {
        particles.push({
          x: canvas.width,
          y: canvas.height * 0.8,
          size: Math.random() * 8 + 6,
          color: colors[Math.floor(Math.random() * colors.length)],
          speedX: -(Math.random() * 14 + 6),
          speedY: -(Math.random() * 18 + 12),
          rotation: Math.random() * 360,
          rotationSpeed: Math.random() * 6 - 3,
          opacity: 1,
        });
      }
    };

    createExplosion();

    // Occasional top drops for a trailing celebration feel
    const addTrickle = () => {
      if (particles.length < 250) {
        particles.push({
          x: Math.random() * canvas.width,
          y: -20,
          size: Math.random() * 6 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          speedX: Math.random() * 4 - 2,
          speedY: Math.random() * 3 + 2,
          rotation: Math.random() * 360,
          rotationSpeed: Math.random() * 4 - 2,
          opacity: 1,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      addTrickle();

      // Draw and physics update
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.x += p.speedX;
        p.y += p.speedY;
        p.speedY += 0.22; // subtle gravity
        p.speedX *= 0.98; // atmospheric drag
        p.rotation += p.rotationSpeed;

        if (p.y > canvas.height * 0.6) {
          p.opacity -= 0.012;
        }

        if (p.opacity <= 0 || p.y > canvas.height || p.x < -50 || p.x > canvas.width + 50) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;

        // Draw elegant standard rectangular paper flake
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4);
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-50"
    />
  );
}
