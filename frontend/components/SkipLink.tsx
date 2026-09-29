'use client';

import { useEffect, useRef } from 'react';

export function SkipLink() {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        el.click();
      }
    };

    el.addEventListener('keydown', handleKeyDown);
    return () => el.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <a
      ref={ref}
      href="#main-content"
      className="skip-link"
      onClick={(e) => {
        e.preventDefault();
        const target = document.getElementById('main-content');
        if (target) {
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: false });
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }}
    >
      Skip to main content
    </a>
  );
}
