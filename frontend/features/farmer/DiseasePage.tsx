'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { DashboardShell } from '@/components/DashboardShell';
import { getAccessToken, useSession } from '@/features/auth/session';

const AI_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

interface Detection {
  id: string;
  disease_name?: string;
  diseaseName?: string;
  confidence: number;
  treatment?: string;
  recommendations?: string[];
  created_at?: string;
  createdAt?: string;
}

export default function DiseaseDetection() {
  const { user } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Detection | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [cropType, setCropType] = useState('teff');
  const [error, setError] = useState('');
  const [history, setHistory] = useState<Detection[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectionMode, setDetectionMode] = useState<'upload' | 'camera'>('upload');

  const authedFetch = useCallback(
    async <T,>(url: string, init?: RequestInit): Promise<T> => {
      const token = getAccessToken();
      const isForm = init?.body instanceof FormData;
      const res = await fetch(url, {
        ...init,
        headers: {
          ...(init?.headers ?? {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(isForm ? {} : { 'Content-Type': 'application/json' }),
        },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          (body as { message?: string; detail?: string })?.message ??
          (body as { detail?: string })?.detail ??
          `Request failed (${res.status})`;
        throw new Error(msg);
      }
      return body as T;
    },
    [],
  );

  const loadHistory = useCallback(
    async (farmerId: string) => {
      try {
        const body = await authedFetch<{ data?: Detection[] } | Detection[]>(
          `${AI_BASE}/api/v1/disease/history/${farmerId}`,
        );
        const data = Array.isArray(body) ? body : body.data ?? [];
        setHistory(data);
      } catch {
        // history is secondary
      }
    },
    [authedFetch],
  );

  useEffect(() => {
    if (user?.id) void loadHistory(user.id);
  }, [user?.id, loadHistory]);

  const stopCamera = useCallback(() => {
    const video = videoRef.current;
    if (video && video.srcObject) {
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 640, height: 480 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
        setError('');
      }
    } catch {
      setError(
        'Camera access was denied. Please allow camera permissions, or use Upload instead.',
      );
    }
  };

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    setImagePreview(dataUrl);

    canvas.toBlob(
      (blob) => {
        if (!blob || !fileInputRef.current) return;
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInputRef.current.files = dt.files;
        setFileName('camera-capture.jpg');
      },
      'image/jpeg',
      0.9,
    );

    stopCamera();
    setDetectionMode('upload');
    setError('');
  };

  const handleModeSwitch = (mode: 'upload' | 'camera') => {
    setDetectionMode(mode);
    setResult(null);
    setError('');
    if (mode === 'camera' && !cameraActive) void startCamera();
    if (mode === 'upload' && cameraActive) stopCamera();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setCapturedImage(null);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.length) {
      setError('Please select an image or capture one with the camera');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', fileInputRef.current.files[0]);
    formData.append('crop_type', cropType);
    formData.append('language', user?.language ?? 'en');

    try {
      const body = await authedFetch<{ data?: Detection } | Detection>(
        `${AI_BASE}/api/v1/disease/detect`,
        {
          method: 'POST',
          body: formData,
          signal: AbortSignal.timeout(30_000),
        },
      );
      const data = 'data' in body && body.data ? body.data : (body as Detection);
      setResult(data);
      if (user?.id) await loadHistory(user.id);
    } catch (err) {
      setError((err as Error)?.message ?? 'Detection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell role="farmer">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">🔬 Crop Disease Detection</h2>
          <p className="text-gray-600 mt-1">Upload or capture a photo for instant AI diagnosis</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <button
            type="button"
            onClick={() => handleModeSwitch('upload')}
            className={`px-4 py-2 rounded-lg transition ${
              detectionMode === 'upload'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📁 Upload
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch('camera')}
            className={`px-4 py-2 rounded-lg transition ${
              detectionMode === 'camera'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📸 Camera
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Crop Type</label>
                <select
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                >
                  <option value="teff">🌾 Teff</option>
                  <option value="wheat">🌾 Wheat</option>
                  <option value="maize">🌽 Maize</option>
                  <option value="coffee">☕ Coffee</option>
                  <option value="barley">🌾 Barley</option>
                  <option value="sorghum">🌾 Sorghum</option>
                  <option value="millet">🌾 Millet</option>
                </select>
              </div>

              {detectionMode === 'camera' && (
                <div className="mb-4">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      className="w-full max-h-96 object-cover"
                      playsInline
                      autoPlay
                    />
                    {!cameraActive && !capturedImage && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                          📸 Start Camera
                        </button>
                      </div>
                    )}
                  </div>
                  {cameraActive && (
                    <button
                      type="button"
                      onClick={captureImage}
                      className="mt-3 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                    >
                      <span className="text-2xl">📷</span> Capture Image
                    </button>
                  )}
                </div>
              )}

              {detectionMode === 'upload' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Image
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer block">
                      <div className="text-5xl mb-3">📸</div>
                      <p className="text-gray-600 font-medium">
                        {fileName ? `📎 ${fileName}` : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">PNG, JPG, JPEG up to 10MB</p>
                    </label>
                  </div>
                </div>
              )}

              {imagePreview && (
                <div className="mb-4 relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-h-96 object-contain rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setFileName('');
                      setCapturedImage(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition"
                  >
                    ✕
                  </button>
                </div>
              )}

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 text-sm border border-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !imagePreview}
                className="w-full bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">🔬</span>
                    Analyzing...
                  </span>
                ) : (
                  '🔍 Detect Disease'
                )}
              </button>
            </form>
          </div>

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm font-medium text-blue-700 mb-2">💡 Tips for Best Results</p>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• 📸 Use clear, well-lit photos</li>
              <li>• 🌿 Focus on the affected plant parts</li>
              <li>• 📏 Keep camera 20-30cm from the plant</li>
              <li>• ☀️ Avoid shadows or reflections</li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6 sticky top-20">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>📊</span> Detection Results
            </h3>

            {loading && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 animate-pulse">🔬</div>
                <p className="text-gray-600">Analyzing your crop...</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Disease Detected</p>
                      <p className="text-2xl font-bold text-green-700">
                        {result.disease_name ?? result.diseaseName ?? '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Confidence</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {((result.confidence ?? 0) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {result.treatment && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-yellow-700 mb-2 flex items-center gap-2">
                      <span>💊</span> Treatment
                    </p>
                    <p className="text-sm text-gray-700">{result.treatment}</p>
                  </div>
                )}

                {result.recommendations && result.recommendations.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2">
                      <span>✅</span> Recommendations
                    </p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {result.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-blue-500">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {!loading && !result && (
              <div className="text-center py-8 text-gray-400">
                <div className="text-6xl mb-4">📷</div>
                <p className="text-sm">Upload or capture an image to see results</p>
              </div>
            )}

            {history.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-500">📜 Recent Detections</p>
                  <span className="text-xs text-gray-400">{history.length} total</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🌾</span>
                        <span className="text-sm text-gray-700">
                          {item.disease_name ?? item.diseaseName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {new Date(item.created_at ?? item.createdAt ?? '').toLocaleDateString()}
                        </span>
                        <span className="text-xs text-blue-600 font-medium">
                          {((item.confidence ?? 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Link
          href="/farmer/dashboard"
          className="text-green-600 hover:text-green-700 transition flex items-center gap-2"
        >
          <span>←</span> Back to Dashboard
        </Link>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </DashboardShell>
  );
}
