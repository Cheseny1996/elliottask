"use client";

import { useEffect, useRef, useState } from "react";

const target = 150_000;
const duration = 1_600;

export function AnimatedStat() {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || started) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setStarted(true);
        observer.disconnect();

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          setCount(target);
          return;
        }

        const start = performance.now();
        const animate = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - (1 - progress) ** 4;
          setCount(Math.floor(target * eased));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      },
      { threshold: 0.4 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [started]);

  return (
    <div className="impact-stat" ref={elementRef}>
      <p className="eyebrow eyebrow-on-dark">Our connection goal</p>
      <p className="impact-stat-number" aria-hidden="true">
        {count.toLocaleString("en-US")}+
      </p>
      <p className="impact-stat-label">meaningful work connections to build</p>
      <span className="sr-only">Our goal is to build 150,000 meaningful work connections.</span>
    </div>
  );
}
