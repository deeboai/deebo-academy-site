"use client";

import { MutableRefObject, useEffect, useRef } from "react";

type ScrollRevealOptions = {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
  initialClassName?: string | null;
  activeClassName?: string;
};

type ScrollRevealRef<T extends HTMLElement> = MutableRefObject<T | null>;

export const useScrollReveal = <T extends HTMLElement>(
  {
    threshold = 0.15,
    rootMargin = "0px",
    once = true,
    initialClassName = "reveal-element",
    activeClassName = "is-visible",
  }: ScrollRevealOptions = {},
): ScrollRevealRef<T> => {
  const elementRef = useRef<T | null>(null);

  useEffect(() => {
    const node = elementRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      return;
    }

    if (initialClassName) {
      node.classList.add(initialClassName);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(activeClassName);
            if (once) {
              observer.unobserve(entry.target);
            }
          } else if (!once) {
            entry.target.classList.remove(activeClassName);
          }
        });
      },
      { threshold, rootMargin },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, once, initialClassName, activeClassName]);

  return elementRef;
};
