export function loadFaceModels(): Promise<void> {
  return Promise.resolve();
}

export async function detectFace(video: HTMLVideoElement): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!video || video.readyState < 2) return false;
  const FaceDetector = (window as any).FaceDetector;
  if (!FaceDetector) return video.videoWidth > 0 && video.videoHeight > 0;
  const detector = new FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
  const faces = await detector.detect(video);
  return faces.length > 0;
}
