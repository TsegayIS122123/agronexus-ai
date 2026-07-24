"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function DiseaseDetection() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [cropType, setCropType] = useState('teff');
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectionMode, setDetectionMode] = useState<'upload' | 'camera'>('upload');

  // Load user and history
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    
    if (parsedUser.id) {
      loadHistory(parsedUser.id);
    }
  }, [router]);

  const loadHistory = async (farmerId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/disease/history/${farmerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data.data || []);
    } catch (err) {
      console.log('No history yet');
    }
  };

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 640, height: 480 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
        setError('');
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions.');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageDataUrl);
        setImagePreview(imageDataUrl);
        
        // Convert to file
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            if (fileInputRef.current) {
              fileInputRef.current.files = dataTransfer.files;
              setFileName('camera-capture.jpg');
            }
          }
        }, 'image/jpeg', 0.9);
        
        stopCamera();
        setDetectionMode('upload');
        setError('');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
        setCapturedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.length) {
      setError('Please select an image or capture one with camera');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', fileInputRef.current.files[0]);
    formData.append('crop_type', cropType);
    formData.append('language', user?.language || 'am');
    if (user?.id) {
      formData.append('farmer_id', user.id);
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/disease/detect', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        timeout: 30000 // 30 second timeout
      });

      setResult(response.data.data);
      
      if (user?.id) {
        await loadHistory(user.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Detection failed. Please try again.');
      console.error('Detection error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleModeSwitch = (mode: 'upload' | 'camera') => {
    setDetectionMode(mode);
    setResult(null);
    setError('');
    if (mode === 'camera' && !cameraActive) {
      startCamera();
    } else if (mode === 'upload' && cameraActive) {
      stopCamera();
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="text-4xl mb-2">🌾</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🌾</span>
              <h1 className="text-xl font-bold text-green-700">AgroNexus AI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.name}</span>
              <button onClick={handleLogout} className="text-red-600 hover:text-red-700 transition">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">🔬 Crop Disease Detection</h2>
              <p className="text-gray-600 mt-1">Upload or capture a photo for instant AI diagnosis</p>
            </div>
            <div className="flex gap-2">
              <button
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Upload/Camera Section */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Crop Type
                  </label>
                  <select
                    value={cropType}
                    onChange={(e) => setCropType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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

                {/* Camera View */}
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
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
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

                {/* Upload Area */}
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

                {/* Image Preview */}
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
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
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

            {/* Quick Tips */}
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

          {/* Results & History Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-20">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span>📊</span> Detection Results
              </h3>
              
              {loading && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 animate-pulse">🔬</div>
                  <p className="text-gray-600">Analyzing your crop...</p>
                  <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full animate-pulse w-full"></div>
                  </div>
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Disease Detected</p>
                        <p className="text-2xl font-bold text-green-700">{result.disease_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Confidence</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {(result.confidence * 100).toFixed(1)}%
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

                  {result.recommendations?.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <p className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2">
                        <span>✅</span> Recommendations
                      </p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {result.recommendations.map((rec: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
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
                  <p className="text-sm">Upload an image or</p>
                  <p className="text-sm">capture with camera</p>
                </div>
              )}

              {/* History */}
              {history.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-500">📜 Recent Detections</p>
                    <span className="text-xs text-gray-400">{history.length} total</span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {history.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">🌾</span>
                          <span className="text-sm text-gray-700">{item.disease_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-blue-600 font-medium">
                            {(item.confidence * 100).toFixed(0)}%
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

        {/* Back Button */}
        <div className="mt-8">
          <button
            onClick={() => router.push('/farmer/dashboard')}
            className="text-green-600 hover:text-green-700 transition flex items-center gap-2"
          >
            <span>←</span> Back to Dashboard
          </button>
        </div>
      </main>

      {/* Hidden canvas for camera capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
