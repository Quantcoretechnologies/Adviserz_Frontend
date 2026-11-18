"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils/cn";
import { SHOWCASE_INTERVAL_MS, SHOWCASE_SLIDES } from "@/config/showcase";

/** Radial blue-to-black gradient behind the curtain image, exported from Figma. */
const PANEL_GRADIENT = `url("data:image/svg+xml;utf8,<svg viewBox='0 0 709 888' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(52.55 138.68 -110.72 39.431 61.5 23.751)'><stop stop-color='rgba(0,184,255,1)' offset='0'/><stop stop-color='rgba(9,139,247,1)' offset='0.29317'/><stop stop-color='rgba(17,93,238,1)' offset='0.58635'/><stop stop-color='rgba(17,74,184,1)' offset='0.68976'/><stop stop-color='rgba(16,56,130,1)' offset='0.79317'/><stop stop-color='rgba(16,37,76,1)' offset='0.89659'/><stop stop-color='rgba(15,27,49,1)' offset='0.94829'/><stop stop-color='rgba(15,18,22,1)' offset='1'/></radialGradient></defs></svg>")`;

const SLIDE_COUNT = SHOWCASE_SLIDES.length;

/**
 * The marketing panel shown beside the auth and onboarding forms: a slider that advances
 * on its own, pauses while hovered or focused, and can be driven with the
 * dots or the arrow keys.
 */
export function ShowcasePanel({ className }: { className?: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const dots = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(
      () => setActiveIndex((index) => (index + 1) % SLIDE_COUNT),
      SHOWCASE_INTERVAL_MS,
    );
    return () => window.clearTimeout(timer);
  }, [activeIndex, paused]);

  const goTo = (index: number) =>
    setActiveIndex((index + SLIDE_COUNT) % SLIDE_COUNT);

  /** Arrow-key navigation: keyboard focus follows the active dot. */
  const goToWithFocus = (index: number) => {
    const next = (index + SLIDE_COUNT) % SLIDE_COUNT;
    setActiveIndex(next);
    dots.current[next]?.focus();
  };

  return (
    <aside
      aria-roledescription="carousel"
      aria-label="What Adviserz offers"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn(
        "relative flex-col justify-between overflow-clip rounded-[32px] p-10",
        className,
      )}
      style={{ backgroundImage: PANEL_GRADIENT }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-[calc(50%+32px)] h-[121%] w-[111%] -translate-x-1/2 -translate-y-1/2 mix-blend-luminosity"
      >
        <Image
          src="/images/auth/curtain.png"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 55vw, 0px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[416px] bg-linear-to-t from-[rgba(0,1,3,0)] to-[#000103]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 -bottom-7 h-[416px] bg-linear-to-b from-[rgba(0,1,3,0)] to-[#000103]"
      />

      <Logo className="relative h-[60px] pl-[9px]" />

      <div className="relative flex w-full flex-col items-center gap-4">
        <div
          role="tablist"
          aria-label="Slides"
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") goToWithFocus(activeIndex + 1);
            if (event.key === "ArrowLeft") goToWithFocus(activeIndex - 1);
          }}
          className="flex h-3 items-center gap-[5px]"
        >
          {SHOWCASE_SLIDES.map((slide, index) => {
            const active = index === activeIndex;
            return (
              <button
                key={slide.title}
                ref={(element) => {
                  dots.current[index] = element;
                }}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`Slide ${index + 1} of ${SLIDE_COUNT}`}
                tabIndex={active ? 0 : -1}
                onClick={() => goTo(index)}
                className={cn(
                  "h-3 cursor-pointer rounded-full transition-[width,background-color] duration-500 ease-out motion-reduce:transition-none",
                  active ? "w-[21px] bg-white" : "w-3 bg-white/[0.42]",
                )}
              />
            );
          })}
        </div>

        <div className="w-full overflow-hidden">
          <div
            className="flex items-end transition-transform duration-500 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {SHOWCASE_SLIDES.map((slide, index) => (
              <div
                key={slide.title}
                role="tabpanel"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${SLIDE_COUNT}`}
                aria-hidden={index !== activeIndex}
                className="flex w-full shrink-0 flex-col gap-[7px] font-semibold text-white"
              >
                <p
                  className={cn(
                    "font-display text-[40px] leading-[1.2] tracking-[-0.855px] xl:text-[57px]",
                    slide.titleClassName,
                  )}
                >
                  {slide.title}
                </p>
                <p
                  className={cn(
                    "text-lg leading-[30px] tracking-[-0.3px] xl:text-xl",
                    slide.descriptionClassName,
                  )}
                >
                  {slide.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
