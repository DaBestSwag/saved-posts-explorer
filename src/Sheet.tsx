import { useEffect, useRef, type PointerEvent, type ReactNode } from 'react';

// Past the top edge the sheet resists more the further it is pulled (Apple's rubber-band curve).
const rubber = (d: number, dim: number, c = 0.55) => (d * dim * c) / (dim + c * Math.abs(d));

/** Bottom sheet for phones: slides up, drag the grabber down (or flick) to dismiss. */
export function Sheet({ open, onClose, title, footer, children }: { open: boolean; onClose: () => void; title: string; footer?: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y0: number; last: number; t: number; v: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const back = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    ref.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
      back?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  const down = (e: PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { y0: e.clientY, last: e.clientY, t: e.timeStamp, v: 0 };
    ref.current!.style.transition = 'none';
  };
  const move = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dt = e.timeStamp - d.t;
    if (dt > 0) d.v = (e.clientY - d.last) / dt; // px per ms, for the flick check on release
    d.last = e.clientY;
    d.t = e.timeStamp;
    const dy = e.clientY - d.y0;
    ref.current!.style.transform = `translateY(${dy > 0 ? dy : rubber(dy, ref.current!.offsetHeight)}px)`;
  };
  const up = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    // Clearing the inline styles hands the motion back to CSS, which animates from where the finger let go.
    ref.current!.style.transition = '';
    ref.current!.style.transform = '';
    if (e.clientY - d.y0 > 120 || d.v > 0.5) onClose();
  };

  return (
    <div className={`sheet-wrap ${open ? 'open' : ''}`} inert={!open}>
      <div className="scrim" onClick={onClose} />
      <div className="sheet" ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
        <div className="grab" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} aria-hidden>
          <span />
        </div>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="btn sm" onClick={onClose}>Done</button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>
  );
}
