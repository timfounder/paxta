/** Shown while the engine and game systems are being constructed. */
export const LoadingScreen = (): React.JSX.Element => (
  <div className="screen">
    <div className="spinner" />
    <p className="subtitle">Descending…</p>
  </div>
);
