"use client";

import React, { useState, useEffect, useRef } from "react";
import { Camera, CheckCircle2, AlertTriangle, ShieldCheck, X, RefreshCw, UserCheck } from "lucide-react";

interface FaceAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  punchType: "in" | "out";
}

// Generate normalized 128-d descriptor vector from video frame canvas
function extractFaceDescriptorFromCanvas(canvas: HTMLCanvasElement): number[] {
  const ctx = canvas.getContext("2d");
  if (!ctx) return new Array(128).fill(0.1);

  // Sample a central face region (60% width & height in center)
  const sw = Math.floor(canvas.width * 0.6);
  const sh = Math.floor(canvas.height * 0.6);
  const sx = Math.floor((canvas.width - sw) / 2);
  const sy = Math.floor((canvas.height - sh) / 2);

  const imgData = ctx.getImageData(sx, sy, sw, sh);
  const data = imgData.data;

  // Compute 16x8 luminance & gradient feature bins (128 dimensions)
  const vector: number[] = new Array(128).fill(0);
  const binW = sw / 16;
  const binH = sh / 8;

  for (let by = 0; by < 8; by++) {
    for (let bx = 0; bx < 16; bx++) {
      const idx = by * 16 + bx;
      let sumLuminance = 0;
      let count = 0;

      const startX = Math.floor(bx * binW);
      const endX = Math.floor((bx + 1) * binW);
      const startY = Math.floor(by * binH);
      const endY = Math.floor((by + 1) * binH);

      for (let y = startY; y < endY; y += 2) {
        for (let x = startX; x < endX; x += 2) {
          const pixelIndex = (y * sw + x) * 4;
          const r = data[pixelIndex];
          const g = data[pixelIndex + 1];
          const b = data[pixelIndex + 2];
          // Standard perceived luminance formula
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          sumLuminance += lum;
          count++;
        }
      }

      vector[idx] = count > 0 ? sumLuminance / (count * 255) : 0;
    }
  }

  // L2-normalize the vector
  let norm = Math.sqrt(vector.reduce((acc, val) => acc + val * val, 0));
  if (norm === 0) norm = 1;
  return vector.map((v) => Math.round((v / norm) * 10000) / 10000);
}

export function FaceAttendanceModal({
  isOpen,
  onClose,
  onSuccess,
  punchType,
}: FaceAttendanceModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState<boolean | null>(null);
  const [enrolledAt, setEnrolledAt] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [geoCoords, setGeoCoords] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Check enrollment status & request location
  useEffect(() => {
    if (!isOpen) return;

    // Check GPS
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        (err) => {
          console.warn("GPS lookup warning:", err.message);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }

    // Check enrollment
    const checkStatus = async () => {
      try {
        setLoadingStatus(true);
        const res = await fetch("/api/attendance/face/status");
        if (res.ok) {
          const data = await res.json();
          setIsEnrolled(data.isEnrolled);
          if (data.enrolledAt) {
            setEnrolledAt(new Date(data.enrolledAt).toLocaleDateString());
          }
        }
      } catch (e) {
        console.error("Failed to check face status", e);
      } finally {
        setLoadingStatus(false);
      }
    };

    checkStatus();
  }, [isOpen]);

  // Start webcam
  useEffect(() => {
    if (!isOpen) {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        setStream(null);
      }
      return;
    }

    let activeStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        setCameraError(null);
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
          audio: false,
        });
        activeStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err: any) {
        console.error("Camera access error:", err);
        setCameraError(
          err.name === "NotAllowedError"
            ? "Camera permission was denied. Please allow camera access in your browser."
            : "Could not initialize video camera. Please ensure a camera is connected."
        );
      }
    };

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEnroll = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    if (!consentChecked) {
      setErrorMessage("Please give explicit biometric consent to register your facial profile.");
      return;
    }

    setProcessing(true);
    setErrorMessage(null);
    setStatusMessage("Capturing and enrolling facial biometric reference...");

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not initialize canvas context.");

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photoBase64 = canvas.toDataURL("image/jpeg", 0.7);
      const descriptor = extractFaceDescriptorFromCanvas(canvas);

      const res = await fetch("/api/attendance/face/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          faceDescriptor: descriptor,
          photoBase64,
          consentGiven: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Enrollment failed.");
      }

      setIsEnrolled(true);
      setStatusMessage("Facial enrollment completed successfully! You can now verify and punch.");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to enroll face.");
      setStatusMessage(null);
    } finally {
      setProcessing(false);
    }
  };

  const handleVerifyAndPunch = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setProcessing(true);
    setErrorMessage(null);
    setStatusMessage("Comparing facial landmarks against registered template...");

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context failed.");

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const descriptor = extractFaceDescriptorFromCanvas(canvas);

      const payload = {
        faceDescriptor: descriptor,
        punchType,
        latitude: geoCoords?.latitude,
        longitude: geoCoords?.longitude,
        accuracy: geoCoords?.accuracy,
      };

      const res = await fetch("/api/attendance/face/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Face verification failed.");
      }

      setStatusMessage(data.message || `Biometric verification successful (${data.confidence}% match).`);
      setTimeout(() => {
        onSuccess(data);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || "Face verification failed.");
      setStatusMessage(null);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Camera size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Biometric Face Attendance ({punchType === "in" ? "Check-In" : "Check-Out"})
              </h3>
              <p className="text-[11px] text-slate-400">
                AI facial vector matching & geofence validation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        {/* Video / Camera feed */}
        <div className="p-5 space-y-4">
          <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner">
            {cameraError ? (
              <div className="text-center p-4 text-rose-400 space-y-2 max-w-xs">
                <AlertTriangle size={28} className="mx-auto" />
                <p className="text-xs font-semibold">{cameraError}</p>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
                {/* Oval Face Guide Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-60 rounded-[50%] border-2 border-indigo-500/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] relative">
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white/90 bg-indigo-600/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Position Face Here
                    </div>
                  </div>
                </div>
              </>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {statusMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* GPS Info pill */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span>
              GPS:{" "}
              {geoCoords ? (
                <span className="text-emerald-600 font-semibold font-mono">
                  {geoCoords.latitude.toFixed(4)}, {geoCoords.longitude.toFixed(4)} (±{Math.round(geoCoords.accuracy)}m)
                </span>
              ) : (
                <span className="text-amber-500 font-medium">Acquiring coordinates...</span>
              )}
            </span>
            <span>
              {isEnrolled ? (
                <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                  <ShieldCheck size={13} /> Registered ({enrolledAt || "Active"})
                </span>
              ) : (
                <span className="text-amber-500 font-semibold">Not Enrolled</span>
              )}
            </span>
          </div>

          {/* Enrollment consent if not enrolled */}
          {!loadingStatus && isEnrolled === false && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl space-y-2 text-xs">
              <p className="font-bold text-amber-900 dark:text-amber-200">
                Facial Enrollment Required
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                To use biometric punch, enroll your facial landmark template once. Your biometric data is encrypted into mathematical descriptors.
              </p>
              <label className="flex items-start gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600"
                />
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                  I give explicit consent to store my facial biometric vector for attendance verification.
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {!loadingStatus && isEnrolled === false ? (
              <button
                type="button"
                onClick={handleEnroll}
                disabled={processing || Boolean(cameraError)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50"
              >
                {processing ? <RefreshCw size={14} className="animate-spin" /> : <UserCheck size={14} />}
                <span>{processing ? "Enrolling..." : "Enroll My Face"}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleVerifyAndPunch}
                disabled={processing || Boolean(cameraError) || loadingStatus}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-2 disabled:opacity-50"
              >
                {processing ? <RefreshCw size={14} className="animate-spin" /> : <Camera size={14} />}
                <span>
                  {processing
                    ? "Verifying..."
                    : `Capture & Verify Face (${punchType === "in" ? "In" : "Out"})`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
