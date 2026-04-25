import * as faceapi from "@vladmandic/face-api";

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";
let loadingPromise: Promise<void> | null = null;

export function loadFaceModels(): Promise<void> {
  if (loadingPromise) return loadingPromise;
  loadingPromise = faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  return loadingPromise;
}

export async function detectFace(video: HTMLVideoElement): Promise<boolean> {
  if (!video || video.readyState < 2) return false;
  const result = await faceapi.detectSingleFace(
    video,
    new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.55 })
  );
  return !!result && result.score > 0.6 && result.box.width > 80;
}
