import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, PenLine, Upload } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

interface Props {
  value: string | null; // data URL
  onChange: (dataUrl: string | null) => void;
}

export const SignaturePad = ({ value, onChange }: Props) => {
  const { t } = useLang();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const [mode, setMode] = useState<"draw" | "upload">("draw");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [hasInk, setHasInk] = useState(false);

  // Set up canvas pixel ratio + redraw existing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || mode !== "draw") return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = "#111";
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, rect.width, rect.height);

    // If a value exists already and it was drawn, redraw it
    if (value && value.startsWith("data:image")) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasInk(true);
      };
      img.src = value;
    } else {
      setHasInk(false);
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const getPos = (e: PointerEvent | React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastRef.current = getPos(e);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const p = getPos(e);
    if (lastRef.current) {
      ctx.beginPath();
      ctx.moveTo(lastRef.current.x, lastRef.current.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    lastRef.current = p;
    setHasInk(true);
  };
  const onPointerUp = () => {
    drawingRef.current = false;
    lastRef.current = null;
    const canvas = canvasRef.current;
    if (canvas && hasInk) {
      onChange(canvas.toDataURL("image/png"));
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasInk(false);
    onChange(null);
  };

  const onUpload = (file: File | null) => {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert("Signature image must be smaller than 3MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <div className="inline-flex rounded-lg border bg-muted p-1">
        <button
          type="button"
          onClick={() => setMode("draw")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md inline-flex items-center gap-1.5 transition-colors ${
            mode === "draw" ? "bg-card shadow-sm text-primary" : "text-muted-foreground"
          }`}
        >
          <PenLine className="size-3.5" /> {t.reg.sigDraw}
        </button>
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md inline-flex items-center gap-1.5 transition-colors ${
            mode === "upload" ? "bg-card shadow-sm text-primary" : "text-muted-foreground"
          }`}
        >
          <Upload className="size-3.5" /> {t.reg.sigUpload}
        </button>
      </div>

      {mode === "draw" ? (
        <div className="space-y-2">
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            className="w-full h-40 sm:h-48 rounded-xl border-2 border-dashed border-border bg-white touch-none cursor-crosshair"
          />
          <Button type="button" variant="outline" size="sm" onClick={clear}>
            <Eraser className="size-4" /> {t.reg.sigClear}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
          />
          {value && value.startsWith("data:image") ? (
            <div className="rounded-xl border bg-white p-3 flex items-center justify-center">
              <img src={value} alt="Signature" className="max-h-40 object-contain" />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors p-8 flex flex-col items-center gap-2 text-muted-foreground hover:text-primary"
            >
              <Upload className="size-7" />
              <span className="text-sm font-medium">{t.reg.sigUpload}</span>
              <span className="text-xs">PNG, JPG, WEBP · max 3MB</span>
            </button>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" /> {t.common.replace}
            </Button>
            {value && (
              <Button type="button" variant="outline" size="sm" onClick={() => onChange(null)}>
                <Eraser className="size-4" /> {t.reg.sigClear}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
