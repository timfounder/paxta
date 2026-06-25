import { useRef } from 'react';

interface LookLayerProps {
  /** Emits the raw pointer delta in pixels since the last move. */
  readonly onLook: (deltaX: number, deltaY: number) => void;
}

/**
 * A full-screen drag surface that turns swipes into look deltas. It sits beneath
 * the on-screen controls (which capture their own pointers), so dragging
 * anywhere else rotates the camera. Tracks a single pointer for stable look.
 */
export const LookLayer = ({ onLook }: LookLayerProps): React.JSX.Element => {
  const pointerId = useRef<number | null>(null);
  const last = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (pointerId.current !== null) return;
    pointerId.current = event.pointerId;
    last.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (event.pointerId !== pointerId.current) return;
    onLook(event.clientX - last.current.x, event.clientY - last.current.y);
    last.current = { x: event.clientX, y: event.clientY };
  };

  const release = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (event.pointerId !== pointerId.current) return;
    pointerId.current = null;
  };

  return (
    <div
      className="look-layer"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={release}
      onPointerCancel={release}
    />
  );
};
