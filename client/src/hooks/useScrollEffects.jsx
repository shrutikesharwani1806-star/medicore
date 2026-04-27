import { useEffect, useRef, useState } from 'react';

/**
 * Hook: Scroll-triggered reveal animation.
 * Returns a ref to attach to the element and whether it's visible.
 */
export function useScrollReveal(options = {}) {
  const { threshold = 0.15, rootMargin = '0px', once = true } = options;
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(element);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return [ref, isVisible];
}

/**
 * Hook: Parallax scroll effect.
 * Returns the scroll-based translateY offset for an element.
 */
export function useParallax(speed = 0.3) {
  const ref = useRef(null);
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const element = ref.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      // Only calculate when element is near viewport
      if (rect.top < windowHeight && rect.bottom > 0) {
        const scrollProgress = (windowHeight - rect.top) / (windowHeight + rect.height);
        setOffsetY((scrollProgress - 0.5) * 100 * speed);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return [ref, offsetY];
}

/**
 * Hook: Smooth scroll progress for the whole page (0..1).
 */
export function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? scrollTop / docHeight : 0);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return progress;
}

/**
 * Component: ScrollReveal wrapper.
 * Wraps children and applies scroll-triggered animations.
 */
export function ScrollReveal({
  children,
  animation = 'slide-up',
  delay = 0,
  duration = 700,
  className = '',
  threshold = 0.15,
  once = true,
}) {
  const [ref, isVisible] = useScrollReveal({ threshold, once });

  const animations = {
    'slide-up': {
      hidden: 'translate-y-12 opacity-0',
      visible: 'translate-y-0 opacity-100',
    },
    'slide-up-3d': {
      hidden: 'translate-y-16 opacity-0 [transform:perspective(1000px)_rotateX(10deg)_translateY(60px)]',
      visible: 'translate-y-0 opacity-100 [transform:perspective(1000px)_rotateX(0deg)_translateY(0)]',
    },
    'slide-left': {
      hidden: '-translate-x-12 opacity-0',
      visible: 'translate-x-0 opacity-100',
    },
    'slide-right': {
      hidden: 'translate-x-12 opacity-0',
      visible: 'translate-x-0 opacity-100',
    },
    'scale': {
      hidden: 'scale-90 opacity-0',
      visible: 'scale-100 opacity-100',
    },
    'rotate': {
      hidden: 'opacity-0 [transform:perspective(1000px)_rotateY(-15deg)]',
      visible: 'opacity-100 [transform:perspective(1000px)_rotateY(0deg)]',
    },
    'fade': {
      hidden: 'opacity-0',
      visible: 'opacity-100',
    },
  };

  const anim = animations[animation] || animations['slide-up'];

  return (
    <div
      ref={ref}
      className={`transition-all ease-out ${isVisible ? anim.visible : anim.hidden} ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
