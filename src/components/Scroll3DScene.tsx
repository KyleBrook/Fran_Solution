import React from "react";

const Scroll3DScene: React.FC = () => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const targetRef = React.useRef(0);
  const currentRef = React.useRef(0);
  const rafRef = React.useRef<number>();

  const measure = React.useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight || 1;
    const center = rect.top + rect.height / 2;
    const distance = viewportHeight / 2 - center;
    const normalized = distance / (viewportHeight / 1.25);
    targetRef.current = Math.max(-1, Math.min(1, normalized));
  }, []);

  React.useEffect(() => {
    const animate = () => {
      currentRef.current += (targetRef.current - currentRef.current) * 0.08;
      if (containerRef.current) {
        containerRef.current.style.setProperty(
          "--scroll-progress",
          currentRef.current.toString(),
        );
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    measure();
    animate();

    const handle = () => {
      measure();
    };

    window.addEventListener("scroll", handle, { passive: true });
    window.addEventListener("resize", handle);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", handle);
      window.removeEventListener("resize", handle);
    };
  }, [measure]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none relative h-[320px] w-full max-w-[420px] self-center lg:h-[420px]"
      style={{ "--scroll-progress": 0 } as React.CSSProperties}
    >
      <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-sky-400/20 via-transparent to-sky-500/10 blur-3xl" />
      <div
        className="relative h-full w-full"
        style={{
          transform:
            "perspective(1600px) rotateX(calc(var(--scroll-progress) * -6deg)) rotateY(calc(var(--scroll-progress) * 10deg)) translate3d(calc(var(--scroll-progress) * -40px), calc(var(--scroll-progress) * -20px), 0)",
        }}
      >
        <div
          className="absolute left-8 top-6 h-24 w-24 rounded-3xl bg-gradient-to-br from-sky-400 via-cyan-300 to-purple-400 opacity-80 shadow-[0_30px_80px_-20px_rgba(56,189,248,0.55)]"
          style={{
            transform:
              "translate3d(calc(var(--scroll-progress) * -60px), calc(var(--scroll-progress) * -50px), 0) rotateZ(calc(var(--scroll-progress) * -8deg))",
          }}
        />
        <div
          className="absolute right-10 top-16 h-16 w-16 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 opacity-60 blur-[1px]"
          style={{
            transform:
              "translate3d(calc(var(--scroll-progress) * 70px), calc(var(--scroll-progress) * -60px), 0)",
          }}
        />
        <div
          className="absolute inset-x-4 bottom-4 top-20 rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-[6px]"
          style={{
            transform:
              "perspective(1600px) rotateX(calc(var(--scroll-progress) * 10deg)) rotateY(calc(var(--scroll-progress) * -12deg)) translate3d(calc(var(--scroll-progress) * 45px), calc(var(--scroll-progress) * 35px), 0)",
            boxShadow: "0 40px 120px -45px rgba(14, 165, 233, 0.6)",
          }}
        >
          <div className="absolute inset-x-8 top-10 grid gap-4 text-left text-sm text-slate-100/90">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.8)]" />
              <span className="font-semibold uppercase tracking-[0.3em] text-sky-200/95">
                Flow 01
              </span>
            </div>
            <p className="text-lg font-medium text-white">
              Conteúdo inteligente, pronto para exportar.
            </p>
            <div className="flex gap-3">
              <span className="h-10 flex-1 rounded-2xl bg-gradient-to-r from-sky-400/40 to-transparent" />
              <span className="h-10 flex-1 rounded-2xl bg-gradient-to-r from-cyan-400/40 to-transparent delay-75" />
            </div>
          </div>
          <div className="absolute inset-x-8 bottom-10 flex items-center justify-between text-xs text-slate-200/80">
            <span>AI assisted</span>
            <span>Paginação 3D</span>
          </div>
        </div>
        <div
          className="absolute left-16 bottom-6 h-20 w-20 rounded-full bg-gradient-to-br from-blue-500/80 to-sky-300/60 blur-xl"
          style={{
            transform:
              "translate3d(calc(var(--scroll-progress) * -40px), calc(var(--scroll-progress) * 30px), 0)",
          }}
        />
      </div>
    </div>
  );
};

export default Scroll3DScene;