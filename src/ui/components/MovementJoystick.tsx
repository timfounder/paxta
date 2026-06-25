import { useCallback, useRef, useState } from 'react';

/** Maximum thumb travel from the joystick centre, in pixels. */
const RADIUS = 52;

interface MovementJoystickProps {
  /** Emits the normalised intent: `x` = strafe, `y` = forward (each −1..1). */
  readonly onChange: (x: number, y: number) => void;
}

/**
 * A fixed-base virtual thumbstick for one-thumb movement. Tracks a single
 * pointer (so it can be used simultaneously with the look layer for true
 * twin-stick touch control) and emits a normalised vector.
 */
export const MovementJoystick = ({ onChange }: MovementJoystickProps): React.JSX.Element => {
  const baseRef = useRef<HTMLDivElement>(null);
  const pointerId = useRef<number | null>(null);
  const [thumb, setThumb] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const track = useCallback(
    (clientX: number, clientY: number): void => {
      const base = baseRef.current;
      if (!base) return;
      const rect = base.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > RADIUS) {
        dx = (dx / dist) * RADIUS;
        dy = (dy / dist) * RADIUS;
      }
      setThumb({ x: dx, y: dy });
      // Screen-y grows downward; forward is "up", hence the negation.
      onChange(dx / RADIUS, -dy / RADIUS);
    },
    [onChange],
  );

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (pointerId.current !== null) return;
    pointerId.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    track(event.clientX, event.clientY);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (event.pointerId !== pointerId.current) return;
    track(event.clientX, event.clientY);
  };

  const release = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (event.pointerId !== pointerId.current) return;
    pointerId.current = null;
    setThumb({ x: 0, y: 0 });
    onChange(0, 0);
  };

  return (
    <div
      ref={baseRef}
      className="joystick"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <div
        className="joystick__thumb"
        style={{ transform: `translate(${thumb.x}px, ${thumb.y}px)` }}
      />
    </div>
  );
};
