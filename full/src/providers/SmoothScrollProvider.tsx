"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.065,
      smoothWheel: true,
      syncTouch: true,
      syncTouchLerp: 0.085,
      touchInertiaExponent: 1.7,
      orientation: "vertical",
      gestureOrientation: "vertical",
      wheelMultiplier: 0.82,
      touchMultiplier: 1.15,
    });

    let disposed = false;
    let removeTicker: (() => void) | undefined;

    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([gsapModule, scrollTriggerModule]) => {
        if (disposed) return;

        const gsap = gsapModule.gsap;
        const ScrollTrigger = scrollTriggerModule.ScrollTrigger;
        gsap.registerPlugin(ScrollTrigger);

        const update = (time: number) => lenis.raf(time * 1000);
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add(update);
        gsap.ticker.lagSmoothing(0);

        removeTicker = () => {
          lenis.off("scroll", ScrollTrigger.update);
          gsap.ticker.remove(update);
        };
      },
    );

    lenis.start();

    return () => {
      disposed = true;
      removeTicker?.();
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
