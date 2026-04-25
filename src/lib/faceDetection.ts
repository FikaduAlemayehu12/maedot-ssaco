// Browser-only face detection. The @vladmandic/face-api package ships a Node
// build that requires @tensorflow/tfjs-node and would crash during SSR, so we
// import it lazily inside browser-only code paths.
const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";
let loadingPromise: Promise<any> | null = null;
let faceapiMod: any = null;

async function getFaceApi() {
  if (typeof window === "undefined") throw new Error("face-api is browser-only");
  if (faceapiMod) return faceapiMod;
  faceapiMod = await import("@vladmandic/face-api/dist/face-api.esm.js");
  return faceapiMod;
}

export function loadFaceModels(): Promise<void> {
  if (loadingPromise) return loadingPromise as Promise<void>;
  loadingPromise = (async () => {
    const faceapi = await getFaceApi();
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  })();
  return loadingPromise as Promise<void>;
}

export async function detectFace(video: HTMLVideoElement): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!video || video.readyState < 2) return false;
  const faceapi = await getFaceApi();
  const result = await faceapi.detectSingleFace(
    video,
    new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.55 })
  );
  return !!result && result.score > 0.6 && result.box.width > 80;
}
