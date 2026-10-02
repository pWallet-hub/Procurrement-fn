import { useCallback, useEffect, useRef } from 'react';
import { Button } from '../../ui/Button';

/**
 * Canvas signature pad. Pointer events cover mouse, pen and touch (touch-action:none in CSS stops scrolling).
 * Calls onChange with a PNG data URL after each stroke, or null when cleared.
 */
export function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const dirty = useRef(false);

  // size the backing store to the displayed size for crisp lines
  const resize = useCallback(() => {
    const c = canvas.current;
    if (!c) return;
    const ratio = window.devicePixelRatio || 1;
    const { width, height } = c.getBoundingClientRect();
    c.width = Math.round(width * ratio);
    c.height = Math.round(height * ratio);
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#111';
    }
    dirty.current = false;
    onChange(null);
  }, [onChange]);

  useEffect(() => {
    resize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    canvas.current!.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = canvas.current!.getContext('2d')!;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 0.01, p.y + 0.01); // dot on tap
    ctx.stroke();
    dirty.current = true;
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvas.current!.getContext('2d')!;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(dirty.current ? canvas.current!.toDataURL('image/png') : null);
  };

  const clear = () => {
    const c = canvas.current!;
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height);
    dirty.current = false;
    onChange(null);
  };

  return (
    <div className="stack">
      <canvas
        ref={canvas}
        className="sig-pad"
        role="img"
        aria-label="Signature drawing area"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      />
      <Button size="sm" onClick={clear}>
        Clear
      </Button>
    </div>
  );
}
