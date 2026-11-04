"use client";

import { useEffect, useRef, useState } from "react";

const stats = [
  {
    target: 150_000,
    suffix: "+",
    label: "work connections we aim to build",
    detail: "A long-term platform goal",
  },
  {
    target: 3,
    suffix: "",
    label: "ways to work",
    detail: "Full-time · Project · AI task",
  },
  {
    target: 2,
    suffix: "",
    label: "ways to get started",
    detail: "Find work · Hire talent",
  },
];
const duration = 1_350;

export function AnimatedStat() {
  const [counts, setCounts] = useState(() => stats.map(() => 0));
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          setCounts(stats.map((stat) => stat.target));
          return;
        }

        const start = performance.now();
        const animate = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - (1 - progress) ** 4;
          setCounts(stats.map((stat) => Math.floor(stat.target * eased)));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      },
      { threshold: 0.4 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="impact-stats" ref={elementRef} aria-labelledby="impact-title">
      <p className="eyebrow eyebrow-on-dark">A clear path to good work</p>
      <h2 className="sr-only" id="impact-title">elliottask by the numbers</h2>
      <div className="impact-stats-grid">
        {stats.map((stat, index) => (
          <article className="impact-stat" key={stat.label}>
            <p className="impact-stat-number">
              <span aria-hidden="true">{counts[index].toLocaleString("en-US")}{stat.suffix}</span>
              <span className="sr-only">{stat.target.toLocaleString("en-US")}{stat.suffix}</span>
            </p>
            <p className="impact-stat-label">{stat.label}</p>
            <p className="impact-stat-detail">{stat.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
