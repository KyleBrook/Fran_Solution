import React from "react";
import { cn } from "@/lib/utils";

type ScrollTiltCardProps = {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  glare?: boolean;
  scale?: number;
};

const ScrollTiltCard: React.FC<ScrollTiltCardProps> = ({
  children,
  className,
  intensity = 12,
  glare = true,
  scale = 1.03,
}) => {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const cardRef = React.useRef<HTMLDivElement | null>(null);
  const glareRef = React.useRef<HTMLDivElement | null>(null);
  const animationRef = React.useRef<number>();
  const targetRef = React.useRef({ x: 0, y: 0 });
  const currentRef = React.useRef({ x: 0, y: 0 });
  const pointerRef = React.useRef({ x: 0.5, y: 0.5 });
  const scaleTargetRef = React.useRef(1);
  const scaleCurrentRef = React.useRef(1);
  const [isHovered, setIsHovered] = React.useState(false);

  const animate = React.useCallback(() => {
    const { x: targetX, y: targetY } = targetRef.current;
    const { x: currentX, y: currentY } = currentRef.current;

    const nextX = currentX + (targetX - currentX) * 0.12;
    const nextY = currentY + (targetY - currentY) * 0.12;

    currentRef.current.x = nextX;
    currentRef.current.y = nextY;

    const nextScale =
      scaleCurrentRef.current +
      (scaleTargetRef.current - scaleCurrentRef.current) * 0.12;
    scaleCurrentRef.current = nextScale;

    if (cardRef.current) {
      const rotateX = nextY * intensity * -1;
      const rotateY = nextX * intensity;
      cardRef.current.style.transform = `perspective(1400px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${nextScale}, ${nextScale}, ${nextScale})`;
    }

    if (glare && glareRef.current) {
      const lightX = pointerRef.current.x * 100;
      const lightY = pointerRef.current.y * 100;
      glareRef.current.style.opacity = isHovered ? "1" : "0";
      glareRef.current.style.background = `radial-gradient(circle at ${lightX}% ${lightY}%, rgba(255,255,255,${
        isHovered ? 0.2 : 0
      }) 0%, rgba(14,165,233,0.12) 40%, transparent 70%)`;
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [glare, intensity, isHovered]);

  React.useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [animate]);

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!rootRef.current) return;
      const rect = rootRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const relativeX = (event.clientX - rect.left) / rect.width;
      const relativeY = (event.clientY - rect.top) / rect.height;

      pointerRef.current.x = Math.max(0, Math.min(1, relativeX));
      pointerRef.current.y = Math.max(0, Math.min(1, relativeY));

      targetRef.current.x = (pointerRef.current.x - 0.5) * 2;
      targetRef.current.y = (pointerRef.current.y - 0.5) * 2;
    },
    [],
  );

  const handlePointerEnter = React.useCallback(() => {
    setIsHovered(true);
    scaleTargetRef.current = scale;
  }, [scale]);

  const handlePointerLeave = React.useCallback(() => {
    setIsHovered(false);
    targetRef.current.x = 0;
    targetRef.current.y = 0;
    pointerRef.current.x = 0.5;
    pointerRef.current.y = 0.5;
    scaleTargetRef.current = 1;
  }, []);

  return (
    <div
      ref={rootRef}
      className={cn("group relative w-full", className)}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerLeave}
    >
      <div
        ref={cardRef}
        className="relative h-full w-full rounded-[inherit] shadow-[0_35px_120px_-60px_rgba(56,189,248,0.6)] transition-[box-shadow] duration-300 ease-out [transform-style:preserve-3d]"
      >
        {glare ? (
          <div
            ref={glareRef}
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 ease-out mix-blend-screen"
          />
        ) : null}
        <div className="relative h-full w-full rounded-[inherit] [transform:translateZ(0)]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ScrollTiltCard;