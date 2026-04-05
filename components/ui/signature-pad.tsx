"use client";

import { useEffect, useId, useRef } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Point = { x: number; y: number };

interface SignaturePadProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSignedChange?: (signed: boolean) => void;
  className?: string;
  required?: boolean;
}

const BASE_BG = "#f3faf6";

export function SignaturePad({
  label,
  value,
  onChange,
  onSignedChange,
  className,
  required = false,
}: SignaturePadProps) {
  const id = useId();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  const signedRef = useRef(false);

  const paintBase = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = BASE_BG;
    ctx.fillRect(0, 0, width, height);
  };

  const setupCanvas = (restoreDataUrl?: string) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const cssWidth = Math.max(rect.width, 240);
    const cssHeight = Math.max(rect.height, 170);
    const dpr = Math.max(window.devicePixelRatio || 1, 1);

    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.resetTransform();
    ctx.scale(dpr, dpr);
    paintBase(ctx, cssWidth, cssHeight);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = "#111111";

    ctxRef.current = ctx;

    if (restoreDataUrl) {
      const image = new Image();
      image.onload = () => {
        ctx.drawImage(image, 0, 0, cssWidth, cssHeight);
      };
      image.src = restoreDataUrl;
    }
  };

  useEffect(() => {
    setupCanvas(value || undefined);
    const ro = new ResizeObserver(() => {
      const current = signedRef.current && canvasRef.current ? canvasRef.current.toDataURL("image/png") : undefined;
      setupCanvas(current);
    });

    if (containerRef.current) {
      ro.observe(containerRef.current);
    }

    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getPointFromEvent = (event: PointerEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const syncValue = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onChange(dataUrl);
    onSignedChange?.(true);
  };

  const drawSegment = (from: Point, to: Point) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    event.preventDefault();
    const point = getPointFromEvent(event.nativeEvent);
    if (!point) return;

    pointerIdRef.current = event.pointerId;
    drawingRef.current = true;
    lastPointRef.current = point;

    drawSegment(point, point);
    signedRef.current = true;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    if (pointerIdRef.current !== event.pointerId) return;

    event.preventDefault();
    const point = getPointFromEvent(event.nativeEvent);
    const lastPoint = lastPointRef.current;
    if (!point || !lastPoint) return;

    drawSegment(lastPoint, point);
    lastPointRef.current = point;
  };

  const finishDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;

    drawingRef.current = false;
    pointerIdRef.current = null;
    lastPointRef.current = null;

    if (signedRef.current) {
      syncValue();
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const width = Number.parseFloat(canvas.style.width || "0") || canvas.getBoundingClientRect().width;
    const height = Number.parseFloat(canvas.style.height || "0") || canvas.getBoundingClientRect().height;
    ctx.clearRect(0, 0, width, height);
    paintBase(ctx, width, height);

    signedRef.current = false;
    onChange("");
    onSignedChange?.(false);
  };

  useEffect(() => {
    if (!value) {
      signedRef.current = false;
      onSignedChange?.(false);
    }
  }, [value, onSignedChange]);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
          {required ? " *" : ""}
        </label>
        <Button type="button" variant="ghost" size="sm" onClick={clear}>
          <RotateCcw className="h-4 w-4" />
          Limpar
        </Button>
      </div>

      <div
        ref={containerRef}
        className="h-[176px] w-full rounded-lg border border-emerald-200/80 bg-emerald-50/60 p-2"
      >
        <canvas
          id={id}
          ref={canvasRef}
          className="h-full w-full touch-none rounded-md border border-emerald-200/70 bg-emerald-50/60"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrawing}
          onPointerCancel={finishDrawing}
          aria-label={label}
        />
      </div>
    </div>
  );
}
