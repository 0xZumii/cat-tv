export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-warm-bg flex flex-col items-center justify-center z-50">
      <div className="text-6xl animate-bounce mb-4">
        🐱
      </div>
      <p className="font-display text-xl text-text-soft">
        Loading Cat TV...
      </p>
    </div>
  );
}
