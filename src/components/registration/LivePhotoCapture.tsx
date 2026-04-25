import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCcw, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { loadFaceModels, detectFace } from "@/lib/faceDetection";

interface Props {
  onCapture: (dataUrl: string) => void;
  capturedUrl: string | null;
}

export const LivePhotoCapture = ({ onCapture, capturedUrl }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [faceOk, setFaceOk] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const start = async () => {
    try {
      setStatus("loading");
      setErrorMsg("");
      await loadFaceModels();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus("ready");
    } catch (e: any) {
      setErrorMsg(e?.message || "Could not access camera");
      setStatus("error");
    }
  };

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => () => stop(), []);

  useEffect(() => {
    if (status !== "ready") return;
    let alive = true;
    const loop = async () => {
      while (alive && status === "ready" && videoRef.current) {
        try {
          const ok = await detectFace(videoRef.current);
          if (alive) setFaceOk(ok);
        } catch {
          /* ignore */
        }
        await new Promise((r) => setTimeout(r, 600));
      }
    };
    loop();
    return () => {
      alive = false;
    };
  }, [status]);

  const capture = () => {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    const url = canvas.toDataURL("image/jpeg", 0.9);
    onCapture(url);
    stop();
    setStatus("idle");
    setFaceOk(false);
  };

  const retake = () => {
    onCapture("");
    start();
  };

  if (capturedUrl) {
    return (
      <div className="space-y-3">
        <div className="relative rounded-xl overflow-hidden border-2 border-primary/40 bg-muted aspect-[4/3] max-w-md">
          <img src={capturedUrl} alt="Captured live photo" className="w-full h-full object-cover" />
          <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500 text-white text-xs font-semibold">
            <CheckCircle2 className="size-3.5" /> Verified
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={retake}>
          <RefreshCcw className="size-4" /> Retake
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative rounded-xl overflow-hidden border-2 border-dashed border-border bg-muted/40 aspect-[4/3] max-w-md grid place-items-center">
        {status === "idle" && (
          <div className="text-center p-6">
            <Camera className="size-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Optional — start camera to capture a verified live selfie.</p>
            <Button type="button" variant="hero" onClick={start}>
              <Camera className="size-4" /> Start Camera
            </Button>
          </div>
        )}
        {status === "loading" && (
          <div className="text-center">
            <Loader2 className="size-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Loading face detection…</p>
          </div>
        )}
        {status === "error" && (
          <div className="text-center p-6">
            <AlertCircle className="size-10 mx-auto text-destructive mb-3" />
            <p className="text-sm text-destructive mb-1">Camera unavailable</p>
            <p className="text-xs text-muted-foreground mb-4">{errorMsg}</p>
            <Button type="button" variant="outline" onClick={start}>Try again</Button>
          </div>
        )}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${status === "ready" ? "block" : "hidden"}`}
        />
        {status === "ready" && (
          <>
            <div className={`absolute inset-6 rounded-[50%] border-4 pointer-events-none transition-colors ${faceOk ? "border-green-500" : "border-amber-400"}`} />
            <div className={`absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${faceOk ? "bg-green-500 text-white" : "bg-amber-400 text-secondary"}`}>
              {faceOk ? <><CheckCircle2 className="size-3.5" /> Face detected</> : <>Looking for face…</>}
            </div>
          </>
        )}
      </div>
      {status === "ready" && (
        <Button type="button" variant="hero" onClick={capture} disabled={!faceOk}>
          <Camera className="size-4" /> {faceOk ? "Capture Photo" : "Align your face in the frame"}
        </Button>
      )}
    </div>
  );
};
