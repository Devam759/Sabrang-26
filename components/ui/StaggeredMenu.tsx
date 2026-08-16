"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { gsap } from 'gsap';
import './StaggeredMenu.css';

export interface StaggeredMenuItem {
  label: string;
  ariaLabel?: string;
  link: string;
}

export interface StaggeredSocialItem {
  label: string;
  link: string;
}

export interface StaggeredMenuProps {
  position?: 'left' | 'right';
  colors?: string[];
  items?: StaggeredMenuItem[];
  socialItems?: StaggeredSocialItem[];
  displaySocials?: boolean;
  displayItemNumbering?: boolean;
  className?: string;
  logoUrl?: string;
  customLogo?: React.ReactNode;
  headerExtra?: React.ReactNode;
  extraPanelContent?: React.ReactNode;
  menuButtonColor?: string;
  openMenuButtonColor?: string;
  accentColor?: string;
  changeMenuColorOnOpen?: boolean;
  isFixed?: boolean;
  closeOnClickAway?: boolean;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
}

const TRAIL_COLORS = [
  '#f967fb',
  '#7C3AED',
  '#53bc28',
  '#fe8a2e',
  '#6958d5',
  '#ff008a',
  '#60aed5',
  '#83f36e',
  '#fe8a2e',
  '#f967fb',
];

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';

function scrambleText(
  el: HTMLElement,
  finalText: string,
  duration: number = 350
) {
  // Lock width so changing characters NEVER reflow the inline or parent container
  const rect = el.getBoundingClientRect();
  const originalWidth = el.style.width;
  const originalDisplay = el.style.display;
  if (rect.width > 0) {
    el.style.width = `${Math.ceil(rect.width)}px`;
    el.style.display = 'inline-block';
  }

  let frame = 0;
  const totalFrames = Math.round((duration / 1000) * 60);
  const originalText = finalText;
  let raf: number;

  const restore = () => {
    el.style.width = originalWidth;
    el.style.display = originalDisplay;
    el.textContent = originalText;
  };

  const tick = () => {
    frame++;
    // Update DOM every 2 frames to eliminate excessive reflow churn
    if (frame % 2 === 0 || frame >= totalFrames) {
      const progress = frame / totalFrames;
      const revealCount = Math.floor(progress * originalText.length);
      let display = '';
      for (let i = 0; i < originalText.length; i++) {
        if (originalText[i] === ' ') {
          display += ' ';
        } else if (i < revealCount) {
          display += originalText[i];
        } else {
          display +=
            SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }
      }
      el.textContent = display;
    }

    if (frame <= totalFrames) {
      raf = requestAnimationFrame(tick);
    } else {
      restore();
    }
  };

  raf = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(raf);
    restore();
  };
}

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export const StaggeredMenu: React.FC<StaggeredMenuProps> = ({
  position = 'right',
  colors = ['#ff006e', '#8338ec', '#3a86ef', '#ffbe0b'],
  items = [],
  socialItems = [],
  displaySocials = false,
  displayItemNumbering = false,
  className,
  logoUrl = '/sabrang-logo/sabrang-logo.png',
  customLogo,
  headerExtra,
  extraPanelContent,
  menuButtonColor = '#fff',
  openMenuButtonColor = '#fff',
  accentColor = '#8338ec',
  changeMenuColorOnOpen = true,
  isFixed = true,
  closeOnClickAway = true,
  onMenuOpen,
  onMenuClose,
}) => {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const panelRef = useRef<HTMLElement | null>(null);
  const preLayersRef = useRef<HTMLDivElement | null>(null);
  const preLayerElsRef = useRef<HTMLElement[]>([]);
  const plusHRef = useRef<HTMLSpanElement | null>(null);
  const plusVRef = useRef<HTMLSpanElement | null>(null);
  const iconRef = useRef<HTMLSpanElement | null>(null);
  const textInnerRef = useRef<HTMLSpanElement | null>(null);
  const textWrapRef = useRef<HTMLSpanElement | null>(null);
  const [textLines, setTextLines] = useState<string[]>(['Menu', 'Close']);

  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Tween | null>(null);
  const spinTweenRef = useRef<gsap.core.Tween | null>(null);
  const textCycleAnimRef = useRef<gsap.core.Tween | null>(null);
  const colorTweenRef = useRef<gsap.core.Tween | null>(null);
  const toggleBtnRef = useRef<HTMLButtonElement | null>(null);
  const busyRef = useRef(false);
  const itemEntranceTweenRef = useRef<gsap.core.Tween | null>(null);
  const scrambleCancelsRef = useRef<Map<HTMLElement, () => void>>(new Map());

  // Lock body scroll when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [open]);

  useIsomorphicLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const preContainer = preLayersRef.current;
      const plusH = plusHRef.current;
      const plusV = plusVRef.current;
      const icon = iconRef.current;
      const textInner = textInnerRef.current;
      if (!panel || !plusH || !plusV || !icon || !textInner) return;

      let preLayers: HTMLElement[] = [];
      if (preContainer) {
        preLayers = Array.from(preContainer.querySelectorAll('.sm-prelayer'));
      }
      preLayerElsRef.current = preLayers;

      const offscreen = position === 'left' ? -100 : 100;
      gsap.set([panel, ...preLayers], { xPercent: offscreen, opacity: 1 });
      if (preContainer) {
        gsap.set(preContainer, { xPercent: 0, opacity: 1 });
      }
      gsap.set(plusH, { transformOrigin: '50% 50%', rotate: 0 });
      gsap.set(plusV, { transformOrigin: '50% 50%', rotate: 90 });
      gsap.set(icon, { rotate: 0, transformOrigin: '50% 50%' });
      gsap.set(textInner, { yPercent: 0 });
      if (toggleBtnRef.current)
        gsap.set(toggleBtnRef.current, { color: menuButtonColor });
    });
    return () => ctx.revert();
  }, [menuButtonColor, position]);

  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return null;

    openTlRef.current?.kill();
    if (closeTweenRef.current) {
      closeTweenRef.current.kill();
      closeTweenRef.current = null;
    }
    itemEntranceTweenRef.current?.kill();

    const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel'));

    const offscreen = position === 'left' ? -100 : 100;
    const layerStates = layers.map((el) => ({ el, start: offscreen }));
    const panelStart = offscreen;

    if (itemEls.length) {
      gsap.set(itemEls, { xPercent: 60, opacity: 0, skewX: -12 });
    }

    const tl = gsap.timeline({ paused: true });

    layerStates.forEach((ls, i) => {
      tl.fromTo(
        ls.el,
        { xPercent: ls.start },
        { xPercent: 0, duration: 0.4, ease: 'power4.out' },
        i * 0.055
      );
    });

    const lastTime = layerStates.length ? (layerStates.length - 1) * 0.055 : 0;
    const panelInsertTime = lastTime + (layerStates.length ? 0.055 : 0);
    const panelDuration = 0.55;

    tl.fromTo(
      panel,
      { xPercent: panelStart },
      { xPercent: 0, duration: panelDuration, ease: 'expo.out' },
      panelInsertTime
    );

    if (itemEls.length) {
      const itemsStart = panelInsertTime + 0.1;
      tl.to(
        itemEls,
        {
          xPercent: 0,
          opacity: 1,
          skewX: 0,
          duration: 0.7,
          ease: 'expo.out',
          stagger: { each: 0.055, from: 'start' },
        },
        itemsStart
      );
    }


    openTlRef.current = tl;
    return tl;
  }, [position]);

  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    const tl = buildOpenTimeline();
    if (tl) {
      tl.eventCallback('onComplete', () => {
        busyRef.current = false;
      });
      tl.play(0);
    } else {
      busyRef.current = false;
    }
  }, [buildOpenTimeline]);

  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    openTlRef.current = null;
    itemEntranceTweenRef.current?.kill();

    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return;

    const all = [...layers, panel];
    closeTweenRef.current?.kill();
    const offscreen = position === 'left' ? -100 : 100;
    closeTweenRef.current = gsap.to(all, {
      xPercent: offscreen,
      duration: 0.3,
      ease: 'power3.in',
      overwrite: 'auto',
      onComplete: () => {
        const itemEls = Array.from(
          panel.querySelectorAll('.sm-panel-itemLabel')
        );
        if (itemEls.length) {
          gsap.set(itemEls, { xPercent: 60, opacity: 0, skewX: -12 });
        }
        busyRef.current = false;
      },
    });
  }, [position]);

  const animateIcon = useCallback((opening: boolean) => {
    const icon = iconRef.current;
    if (!icon) return;
    spinTweenRef.current?.kill();
    if (opening) {
      spinTweenRef.current = gsap.to(icon, {
        rotate: 225,
        duration: 0.7,
        ease: 'back.out(1.7)',
        overwrite: 'auto',
      });
    } else {
      spinTweenRef.current = gsap.to(icon, {
        rotate: 0,
        duration: 0.35,
        ease: 'power3.inOut',
        overwrite: 'auto',
      });
    }
  }, []);

  const animateColor = useCallback(
    (opening: boolean) => {
      const btn = toggleBtnRef.current;
      if (!btn) return;
      colorTweenRef.current?.kill();
      if (changeMenuColorOnOpen) {
        const targetColor = opening ? openMenuButtonColor : menuButtonColor;
        colorTweenRef.current = gsap.to(btn, {
          color: targetColor,
          delay: 0.15,
          duration: 0.3,
          ease: 'power2.out',
        });
      } else {
        gsap.set(btn, { color: menuButtonColor });
      }
    },
    [openMenuButtonColor, menuButtonColor, changeMenuColorOnOpen]
  );

  useEffect(() => {
    if (toggleBtnRef.current) {
      if (changeMenuColorOnOpen) {
        const targetColor = openRef.current
          ? openMenuButtonColor
          : menuButtonColor;
        gsap.set(toggleBtnRef.current, { color: targetColor });
      } else {
        gsap.set(toggleBtnRef.current, { color: menuButtonColor });
      }
    }
  }, [changeMenuColorOnOpen, menuButtonColor, openMenuButtonColor]);

  const animateText = useCallback((opening: boolean) => {
    const inner = textInnerRef.current;
    if (!inner) return;
    textCycleAnimRef.current?.kill();

    const currentLabel = opening ? 'Menu' : 'Close';
    const targetLabel = opening ? 'Close' : 'Menu';
    const cycles = 3;
    const seq = [currentLabel];
    let last = currentLabel;
    for (let i = 0; i < cycles; i++) {
      last = last === 'Menu' ? 'Close' : 'Menu';
      seq.push(last);
    }
    if (last !== targetLabel) seq.push(targetLabel);
    seq.push(targetLabel);
    setTextLines(seq);

    gsap.set(inner, { yPercent: 0 });
    const lineCount = seq.length;
    const finalShift = ((lineCount - 1) / lineCount) * 100;
    textCycleAnimRef.current = gsap.to(inner, {
      yPercent: -finalShift,
      duration: 0.5 + lineCount * 0.07,
      ease: 'power4.out',
    });
  }, []);

  const toggleMenu = useCallback(() => {
    const target = !openRef.current;
    openRef.current = target;
    setOpen(target);
    if (target) {
      onMenuOpen?.();
      playOpen();
    } else {
      onMenuClose?.();
      playClose();
    }
    animateIcon(target);
    animateColor(target);
    animateText(target);
  }, [
    playOpen,
    playClose,
    animateIcon,
    animateColor,
    animateText,
    onMenuOpen,
    onMenuClose,
  ]);

  const closeMenu = useCallback(() => {
    if (openRef.current) {
      openRef.current = false;
      setOpen(false);
      onMenuClose?.();
      playClose();
      animateIcon(false);
      animateColor(false);
      animateText(false);
    }
  }, [playClose, animateIcon, animateColor, animateText, onMenuClose]);

  useEffect(() => {
    if (!closeOnClickAway || !open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [closeOnClickAway, open, closeMenu]);

  // Scramble on hover
  const handleItemMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, label: string) => {
      const labelEl = e.currentTarget.querySelector(
        '.sm-panel-itemLabel'
      ) as HTMLElement | null;
      if (!labelEl) return;

      const prev = scrambleCancelsRef.current.get(labelEl);
      if (prev) prev();

      const cancel = scrambleText(labelEl, label.toUpperCase(), 500);
      scrambleCancelsRef.current.set(labelEl, cancel);
    },
    []
  );

  const handleItemMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, label: string) => {
      const labelEl = e.currentTarget.querySelector(
        '.sm-panel-itemLabel'
      ) as HTMLElement | null;
      if (!labelEl) return;
      const prev = scrambleCancelsRef.current.get(labelEl);
      if (prev) prev();
      labelEl.textContent = label.toUpperCase();
    },
    []
  );

  return (
    <div
      className={
        (className ? className + ' ' : '') +
        'staggered-menu-wrapper' +
        (isFixed ? ' fixed-wrapper' : '')
      }
      style={
        accentColor
          ? ({ ['--sm-accent' as string]: accentColor } as React.CSSProperties)
          : undefined
      }
      data-position={position}
      data-open={open || undefined}
    >
      <div ref={preLayersRef} className="sm-prelayers" aria-hidden="true">
        {(() => {
          const raw =
            colors && colors.length
              ? colors
              : ['#ff006e', '#8338ec', '#3a86ef', '#ffbe0b'];
          return raw.map((c, i) => (
            <div key={i} className="sm-prelayer" style={{ background: c }} />
          ));
        })()}
      </div>

      <header
        className="staggered-menu-header"
        aria-label="Main navigation header"
      >
        <div className="sm-logo" aria-label="Logo">
          {customLogo ? (
            customLogo
          ) : (
            <Link href="/">
              <Image
                src={logoUrl}
                alt="Sabrang Logo"
                className="sm-logo-img"
                draggable={false}
                width={40}
                height={32}
              />
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          {headerExtra}
          <button
            ref={toggleBtnRef}
            className="sm-toggle"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="staggered-menu-panel"
            onClick={toggleMenu}
            type="button"
          >
            <span
              ref={textWrapRef}
              className="sm-toggle-textWrap"
              aria-hidden="true"
            >
              <span ref={textInnerRef} className="sm-toggle-textInner">
                {textLines.map((l, i) => (
                  <span className="sm-toggle-line" key={i}>
                    {l}
                  </span>
                ))}
              </span>
            </span>
            <span ref={iconRef} className="sm-icon" aria-hidden="true">
              <span ref={plusHRef} className="sm-icon-line" />
              <span ref={plusVRef} className="sm-icon-line sm-icon-line-v" />
            </span>
          </button>
        </div>
      </header>

      <aside
        id="staggered-menu-panel"
        ref={panelRef}
        className="staggered-menu-panel"
        aria-hidden={!open}
      >
        <div className="sm-panel-inner">
          <ul
            className="sm-panel-list"
            role="list"
            data-numbering={displayItemNumbering || undefined}
          >
            {items && items.length ? (
              items.map((it, idx) => {
                const isInternal = it.link.startsWith('/');
                const color = TRAIL_COLORS[idx % TRAIL_COLORS.length];
                return (
                  <li
                    className="sm-panel-itemWrap"
                    key={it.label + idx}
                    style={{ '--item-color': color } as React.CSSProperties}
                  >
                    {isInternal ? (
                      <Link
                        className="sm-panel-item"
                        href={it.link}
                        aria-label={it.ariaLabel || it.label}
                        data-index={idx + 1}
                        onClick={closeMenu}
                        onMouseEnter={(e) =>
                          handleItemMouseEnter(e, it.label)
                        }
                        onMouseLeave={(e) =>
                          handleItemMouseLeave(e, it.label)
                        }
                      >
                        <span className="sm-panel-itemLabel">
                          {it.label.toUpperCase()}
                        </span>
                      </Link>
                    ) : (
                      <a
                        className="sm-panel-item"
                        href={it.link}
                        aria-label={it.ariaLabel || it.label}
                        data-index={idx + 1}
                        onClick={closeMenu}
                        onMouseEnter={(e) =>
                          handleItemMouseEnter(e, it.label)
                        }
                        onMouseLeave={(e) =>
                          handleItemMouseLeave(e, it.label)
                        }
                      >
                        <span className="sm-panel-itemLabel">
                          {it.label.toUpperCase()}
                        </span>
                      </a>
                    )}
                  </li>
                );
              })
            ) : (
              <li className="sm-panel-itemWrap" aria-hidden="true">
                <span className="sm-panel-item">
                  <span className="sm-panel-itemLabel">No items</span>
                </span>
              </li>
            )}
          </ul>

          {extraPanelContent && (
            <div className="sm-extra-content mt-auto pt-4 border-t border-white/10">
              {extraPanelContent}
            </div>
          )}

          {displaySocials && socialItems && socialItems.length > 0 && (
            <div className="sm-socials" aria-label="Social links">
              <h3 className="sm-socials-title">Socials</h3>
              <ul className="sm-socials-list" role="list">
                {socialItems.map((s, i) => (
                  <li key={s.label + i} className="sm-socials-item">
                    <a
                      href={s.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sm-socials-link"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default StaggeredMenu;
