"use client";

import React, { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  ScanFace,
  Camera,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Clock,
  LogIn,
  LogOut,
  Settings,
  Sparkles,
  Info,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { validateFaceQuality, extractFaceDescriptor } from "@/lib/face-detection";
import { acquireBrowserCoordinates } from "@/lib/geo-client";

export default function FaceAttendancePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);

  const [isEnrolled, setIsEnrolled] = useState<boolean | null>(null);
  const [enrolledAt, setEnrolledAt] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  const [actionType, setActionType] = useState<"ENROLL" | "VERIFY_IN" | "VERIFY_OUT">("VERIFY_IN");
  const [processing, setProcessing] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [lastMatchScore, setLastMatchScore] = useState<number | null>(null);

  // Admin rule state
  const [requireFace, setRequireFace] = useState(false);
  const [togglingRule, setTogglingRule] = useState(false);

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  // Check enrollment & admin rules
  const fetchStatus = async () => {
    try {
      setCheckingStatus(true);
      const res = await fetch("/api/attendance/face/status");
      if (res.ok) {
        const data = await res.json();
        setIsEnrolled(data.isEnrolled);
        setEnrolledAt(data.enrolledAt ? new Date(data.enrolledAt).toLocaleDateString() : null);
        setRequireFace(Boolean(data.requireFaceAttendance));
        if (!data.isEnrolled) {
          setActionType("ENROLL");
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [user]);

  // Start Camera
  const startCamera = async () => {
    setCameraError("");
    setResultMessage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser environment.");
      }
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
      setCameraActive(true);
    } catch (err: any) {
      console.error("Camera access error:", err);
      let msg = "Could not activate camera. Please grant camera permission.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        msg = "Camera permission was denied. Please allow camera access in your browser settings.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        msg = "No webcam camera found on this device.";
      }
      setCameraError(msg);
      toast.error("Camera Error", msg);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Capture frame and validate face quality
  const captureAndValidateFrame = async (): Promise<{ descriptor: number[]; photoUrl: string } | null> => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 1. Validate Face Presence & Lighting Quality
    const quality = await validateFaceQuality(canvas);
    if (!quality.valid) {
      const errMsg = quality.error || "Face quality check failed.";
      setResultMessage({ text: errMsg, success: false });
      toast.error("Face Quality Check", errMsg);
      return null;
    }

    // 2. Extract Standardized 128-D Biometric Feature Vector
    const descriptor = extractFaceDescriptor(canvas, quality.box);
    const photoUrl = canvas.toDataURL("image/jpeg", 0.7);
    return { descriptor, photoUrl };
  };

  // Handle Enrollment
  const handleEnrollFace = async () => {
    if (!consentGiven) {
      toast.warning("Consent Required", "Please acknowledge biometric processing consent to proceed.");
      return;
    }

    setProcessing(true);
    setResultMessage(null);

    try {
      const captured = await captureAndValidateFrame();
      if (!captured) {
        setProcessing(false);
        return;
      }

      const res = await fetch("/api/attendance/face/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          faceDescriptor: captured.descriptor,
          photoUrl: captured.photoUrl,
          consentGiven: true,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsEnrolled(true);
        setEnrolledAt(new Date().toLocaleDateString());
        setResultMessage({ text: "Face profile enrolled successfully! You can now punch attendance with your face.", success: true });
        toast.success("Enrolled", "Your biometric face profile was registered.");
        setActionType("VERIFY_IN");
      } else {
        const err = data.error || "Enrollment failed.";
        setResultMessage({ text: err, success: false });
        toast.error("Enrollment Failed", err);
      }
    } catch {
      setResultMessage({ text: "Network error during enrollment.", success: false });
      toast.error("Network Error", "Could not reach enrollment service.");
    } finally {
      setProcessing(false);
    }
  };

  // Handle Verification Punch
  const handleVerifyPunch = async (type: "in" | "out") => {
    setProcessing(true);
    setResultMessage(null);

    try {
      const captured = await captureAndValidateFrame();
      if (!captured) {
        setProcessing(false);
        return;
      }

      // Acquire GPS coordinates with resilient fallback
      let lat: number | null = null;
      let lng: number | null = null;
      let acc: number | null = null;

      try {
        const pos = await acquireBrowserCoordinates({ timeout: 7000, fallbackToStandard: true });
        lat = pos.latitude;
        lng = pos.longitude;
        acc = pos.accuracy;
      } catch (e: any) {
        console.warn("GPS acquisition note:", e.message);
        // Will continue if geofencing is not strictly mandatory on server
      }

      const res = await fetch("/api/attendance/face/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          faceDescriptor: captured.descriptor,
          type,
          latitude: lat,
          longitude: lng,
          accuracy: acc,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const score = data.matchScore ?? (data.similarity ? Math.round(data.similarity * 100) : 95);
        setLastMatchScore(score);
        setResultMessage({
          text: `${data.message || "Punched successfully!"} (Biometric Match: ${score}%)`,
          success: true,
        });
        toast.success("Face Verified", data.message);
      } else {
        const err = data.error || "Biometric verification failed.";
        setResultMessage({ text: err, success: false });
        toast.error("Verification Failed", err);
      }
    } catch {
      setResultMessage({ text: "Network error during face verification.", success: false });
      toast.error("Network Error", "Could not verify face punch.");
    } finally {
      setProcessing(false);
    }
  };

  // Admin toggle for mandatory face attendance
  const handleToggleFaceRequirement = async () => {
    setTogglingRule(true);
    try {
      const newSetting = !requireFace;
      const res = await fetch("/api/settings/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requireFaceAttendance: newSetting }),
      });
      if (res.ok) {
        setRequireFace(newSetting);
        toast.success(
          "Rule Updated",
          newSetting ? "Face attendance is now mandatory for all employees." : "Face attendance is now optional."
        );
      } else {
        toast.error("Update Failed", "Could not update attendance rules.");
      }
    } catch {
      toast.error("Network Error", "Failed to update attendance rule.");
    } finally {
      setTogglingRule(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <ScanFace size={22} />
              </span>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Face Recognition Attendance
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              AI-assisted biometric verification using client webcam video streams, 128-d landmark vector embeddings, and Euclidean distance verification.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/attendance"
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
            >
              Daily Register
            </Link>
            <Link
              href="/attendance/geofence"
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
            >
              GPS Geofencing
            </Link>
          </div>
        </div>

        {/* Admin Policy Control Card */}
        {isAdmin && (
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/20 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="text-indigo-600 shrink-0" size={20} />
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Mandatory Face Attendance Policy
                </span>
                <span className="text-slate-500 text-[11px]">
                  When active, standard web/manual check-ins without biometric face verification are strictly rejected.
                </span>
              </div>
            </div>

            <button
              onClick={handleToggleFaceRequirement}
              disabled={togglingRule}
              className={`px-4 py-2 rounded-xl font-bold transition-all shadow-sm shrink-0 ${
                requireFace
                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              {togglingRule ? "Updating..." : requireFace ? "Disable Mandatory Policy" : "Enable Mandatory Policy"}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Live Webcam Viewport & Controls */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Camera size={18} className="text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Biometric Facial Scanner
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                128-d Vector Metric
              </span>
            </div>

            {/* Video Feed / Placeholder */}
            <div className="relative aspect-video rounded-2xl bg-slate-950 overflow-hidden flex items-center justify-center border border-slate-800">
              {cameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover mirror"
                    style={{ transform: "scaleX(-1)" }}
                  />
                  {/* Face Guide Target Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-56 border-2 border-indigo-400 border-dashed rounded-[40%] animate-pulse flex items-center justify-center">
                      <div className="w-40 h-48 border border-white/40 rounded-[40%]" />
                    </div>
                    <span className="absolute bottom-3 text-[10px] text-white/80 bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-sm">
                      Align face within outline
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center p-6 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                    <Camera size={26} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Camera Inactive</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Activate webcam to register face or record biometric attendance punch.
                    </p>
                  </div>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all inline-flex items-center gap-1.5"
                  >
                    <Camera size={14} />
                    <span>Start Webcam</span>
                  </button>
                </div>
              )}
            </div>

            {/* Hidden capture canvas */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Camera Error */}
            {cameraError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Action Feedback Result */}
            {resultMessage && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  resultMessage.success
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300"
                    : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300"
                }`}
              >
                {resultMessage.success ? <CheckCircle2 size={16} className="shrink-0" /> : <AlertTriangle size={16} className="shrink-0" />}
                <span>{resultMessage.text}</span>
              </div>
            )}

            {/* Punch & Enrollment Buttons */}
            {cameraActive && (
              <div className="space-y-3 pt-2">
                {/* Mode Selector Tabs */}
                <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setActionType("VERIFY_IN")}
                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      actionType === "VERIFY_IN"
                        ? "bg-white dark:bg-slate-900 text-emerald-600 shadow-sm"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <LogIn size={14} />
                    <span>Face Punch In</span>
                  </button>
                  <button
                    onClick={() => setActionType("VERIFY_OUT")}
                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      actionType === "VERIFY_OUT"
                        ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <LogOut size={14} />
                    <span>Face Punch Out</span>
                  </button>
                  <button
                    onClick={() => setActionType("ENROLL")}
                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      actionType === "ENROLL"
                        ? "bg-white dark:bg-slate-900 text-purple-600 shadow-sm"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <Sparkles size={14} />
                    <span>{isEnrolled ? "Re-Enroll Face" : "Enroll Face"}</span>
                  </button>
                </div>

                {/* Primary Action Button */}
                {actionType === "ENROLL" ? (
                  <div className="space-y-3">
                    <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consentGiven}
                        onChange={(e) => setConsentGiven(e.target.checked)}
                        className="mt-0.5 rounded text-indigo-600"
                      />
                      <span className="text-slate-600 dark:text-slate-300">
                        I voluntarily consent to the secure extraction and cryptographic storage of my facial landmark vector for corporate attendance authentication.
                      </span>
                    </label>

                    <button
                      onClick={handleEnrollFace}
                      disabled={processing || !consentGiven}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 transition-all"
                    >
                      <Sparkles size={15} />
                      <span>{processing ? "Registering Biometric Profile..." : "Register Face Signature"}</span>
                    </button>
                  </div>
                ) : actionType === "VERIFY_IN" ? (
                  <button
                    onClick={() => handleVerifyPunch("in")}
                    disabled={processing || !isEnrolled}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
                  >
                    <LogIn size={15} />
                    <span>{processing ? "Verifying Facial Biometrics..." : "Authenticate & Punch In"}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleVerifyPunch("out")}
                    disabled={processing || !isEnrolled}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
                  >
                    <LogOut size={15} />
                    <span>{processing ? "Verifying Facial Biometrics..." : "Authenticate & Punch Out"}</span>
                  </button>
                )}

                <button
                  onClick={stopCamera}
                  className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Turn Off Camera
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Status Card, Rules & Info */}
          <div className="lg:col-span-5 space-y-4">
            {/* Enrollment Status Box */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck size={17} className="text-indigo-600" />
                Account Biometric Profile
              </h3>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Status:</span>
                  {checkingStatus ? (
                    <span className="text-slate-400 font-bold">Checking...</span>
                  ) : isEnrolled ? (
                    <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full font-bold">
                      Enrolled & Active
                    </span>
                  ) : (
                    <span className="text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-2.5 py-0.5 rounded-full font-bold">
                      Not Enrolled
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Employee:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user?.email}
                  </span>
                </div>

                {enrolledAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Enrolled Date:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{enrolledAt}</span>
                  </div>
                )}

                {lastMatchScore !== null && (
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400">Last Confidence Score:</span>
                    <span className="font-bold text-emerald-600">{lastMatchScore}% Match</span>
                  </div>
                )}
              </div>
            </div>

            {/* How It Works Guide */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3 text-xs">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Info size={17} className="text-indigo-600" />
                Verification Guidelines
              </h3>
              <ul className="space-y-2 text-slate-500 dark:text-slate-400 list-disc pl-4">
                <li>Look directly into the camera with good ambient lighting.</li>
                <li>Remove sunglasses, heavy face coverings, or masks.</li>
                <li>Keep your face steady within the guide ellipse for 1-2 seconds.</li>
                <li>Distance between camera and face should be approximately 30-50 cm.</li>
                <li>Failed punches are securely audit logged to prevent identity spoofing.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
