"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  MapPin,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Navigation,
  ShieldCheck,
  Clock,
  LogIn,
  LogOut,
  RefreshCw,
  LocateFixed,
  MapPinned,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export default function GeofenceAttendancePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [currentCoords, setCurrentCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
  } | null>(null);

  const [locating, setLocating] = useState(false);
  const [gpsError, setGpsError] = useState("");

  const [locations, setLocations] = useState<any[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  const [punching, setPunching] = useState(false);
  const [punchResult, setPunchResult] = useState<any>(null);

  // Admin policy state
  const [requireGeofence, setRequireGeofence] = useState(false);
  const [togglingRule, setTogglingRule] = useState(false);

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  // Haversine distance in meters
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  // Fetch office locations & rule
  const fetchOfficeLocations = async () => {
    try {
      setLoadingLocations(true);
      const [locRes, attRes] = await Promise.all([
        fetch("/api/settings/locations"),
        fetch("/api/settings/attendance"),
      ]);

      if (locRes.ok) {
        const d = await locRes.json();
        setLocations(d.locations || []);
      }
      if (attRes.ok) {
        const a = await attRes.json();
        setRequireGeofence(Boolean(a.attendance?.requireGeofencing));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLocations(false);
    }
  };

  useEffect(() => {
    fetchOfficeLocations();
    acquireLocation();
  }, []);

  // Acquire GPS Location
  const acquireLocation = () => {
    setGpsError("");
    setPunchResult(null);

    if (!navigator.geolocation) {
      const err = "Geolocation is not supported by your current browser.";
      setGpsError(err);
      toast.error("GPS Unavailable", err);
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          timestamp: new Date(pos.timestamp),
        });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        let msg = "Could not obtain GPS coordinates.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "GPS permission was denied. Please allow location permissions in your browser to verify geofence attendance.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = "GPS satellite position unavailable. Please ensure location services are enabled.";
        } else if (err.code === err.TIMEOUT) {
          msg = "GPS location request timed out. Please retry in an open area.";
        }
        setGpsError(msg);
        toast.error("Location Error", msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Evaluate Geofence against active locations
  let nearestLocation: any = null;
  let nearestDistance = 9999999;
  let isInsideGeofence = false;

  if (currentCoords && locations.length > 0) {
    locations.forEach((loc) => {
      if (loc.isActive !== false) {
        const dist = calculateDistance(currentCoords.latitude, currentCoords.longitude, loc.latitude, loc.longitude);
        if (dist < nearestDistance) {
          nearestDistance = dist;
          nearestLocation = loc;
        }
      }
    });

    if (nearestLocation) {
      isInsideGeofence = nearestDistance <= (nearestLocation.radiusMeters || 500);
    }
  }

  // Handle Geo Punch In / Out
  const handleGeoPunch = async (type: "in" | "out") => {
    if (!currentCoords) {
      toast.warning("Location Required", "Please acquire high-accuracy GPS coordinates before punching.");
      return;
    }

    if (requireGeofence && !isInsideGeofence) {
      toast.error(
        "Geofence Restriction",
        `You are ${nearestDistance}m away from ${nearestLocation?.name || "the office"}. Max radius is ${nearestLocation?.radiusMeters || 500}m.`
      );
      return;
    }

    setPunching(true);
    setPunchResult(null);
    try {
      const endpoint = type === "in" ? "/api/attendance/check-in" : "/api/attendance/check-out";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: currentCoords.latitude,
          longitude: currentCoords.longitude,
          accuracy: currentCoords.accuracy,
          location: nearestLocation ? `${nearestLocation.name} (GPS Verified)` : "Verified Work Location",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setPunchResult({ success: true, message: data.message || `Successfully punched ${type === "in" ? "in" : "out"}!` });
        toast.success("Punch Recorded", data.message);
      } else {
        setPunchResult({ success: false, message: data.error || "Punch failed." });
        toast.error("Punch Failed", data.error);
      }
    } catch {
      setPunchResult({ success: false, message: "Network error during geo-punch." });
      toast.error("Network Error", "Could not submit geo-punch.");
    } finally {
      setPunching(false);
    }
  };

  // Toggle admin policy
  const handleToggleGeofenceRule = async () => {
    setTogglingRule(true);
    try {
      const newRule = !requireGeofence;
      const res = await fetch("/api/settings/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requireGeofencing: newRule }),
      });
      if (res.ok) {
        setRequireGeofence(newRule);
        toast.success("Policy Updated", newRule ? "Strict GPS geofencing is now mandatory." : "GPS geofencing is now advisory.");
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
                <MapPin size={22} />
              </span>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                GPS Geofence Attendance
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time latitude, longitude, and accuracy acquisition with Haversine distance validation against authorized office perimeters.
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
              href="/attendance/face"
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
            >
              Face Attendance
            </Link>
          </div>
        </div>

        {/* Admin Policy Banner */}
        {isAdmin && (
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="text-emerald-600 shrink-0" size={20} />
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Mandatory Geofence Enforcement Policy
                </span>
                <span className="text-slate-500 text-[11px]">
                  When active, attendance punches outside the authorized office boundary radius are rejected.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/settings"
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-50 text-[11px]"
              >
                Manage Locations
              </Link>
              <button
                onClick={handleToggleGeofenceRule}
                disabled={togglingRule}
                className={`px-4 py-2 rounded-xl font-bold transition-all shadow-sm ${
                  requireGeofence
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                {togglingRule ? "Updating..." : requireGeofence ? "Disable Mandatory Policy" : "Enable Mandatory Policy"}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Live GPS Radar & Punch Actions */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Compass size={18} className="text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Live GPS Geolocation Terminal
                </h3>
              </div>

              <button
                onClick={acquireLocation}
                disabled={locating}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all"
              >
                <RefreshCw size={13} className={locating ? "animate-spin" : ""} />
                <span>{locating ? "Locating..." : "Refresh GPS"}</span>
              </button>
            </div>

            {/* GPS Status Card */}
            {currentCoords ? (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-800/60 dark:to-indigo-950/20 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Device GPS Coordinates
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    ±{currentCoords.accuracy}m Accuracy
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Latitude</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {currentCoords.latitude.toFixed(6)}° N
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Longitude</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {currentCoords.longitude.toFixed(6)}° E
                    </span>
                  </div>
                </div>

                {nearestLocation && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Nearest Authorized Office:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {nearestLocation.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Distance / Allowed Radius:</span>
                      <span
                        className={`font-black ${
                          isInsideGeofence ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {nearestDistance}m / {nearestLocation.radiusMeters || 500}m
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : locating ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                <LocateFixed size={28} className="text-indigo-600 animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Acquiring High-Precision GPS...</p>
                <p className="text-[11px] text-slate-400">Locking satellite and network triangulation</p>
              </div>
            ) : null}

            {/* GPS Error */}
            {gpsError && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{gpsError}</span>
              </div>
            )}

            {/* Geofence Status Badge */}
            {currentCoords && nearestLocation && (
              <div
                className={`p-4 rounded-2xl border flex items-center gap-3 text-xs ${
                  isInsideGeofence
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200"
                    : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200"
                }`}
              >
                {isInsideGeofence ? (
                  <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle size={20} className="text-amber-600 shrink-0" />
                )}
                <div>
                  <span className="font-bold block">
                    {isInsideGeofence
                      ? "Inside Authorized Office Geofence"
                      : "Outside Authorized Office Perimeter"}
                  </span>
                  <span className="text-[11px] opacity-90">
                    {isInsideGeofence
                      ? `You are within the ${nearestLocation.radiusMeters}m perimeter of ${nearestLocation.name}. Attendance is authorized.`
                      : `You are ${nearestDistance}m away from ${nearestLocation.name}. Maximum allowed boundary is ${nearestLocation.radiusMeters}m.`}
                  </span>
                </div>
              </div>
            )}

            {/* Punch Result Feedback */}
            {punchResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  punchResult.success
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300"
                    : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300"
                }`}
              >
                {punchResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                <span>{punchResult.message}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleGeoPunch("in")}
                disabled={punching || !currentCoords}
                className="py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
              >
                <LogIn size={15} />
                <span>{punching ? "Processing Punch..." : "Geo Check-In"}</span>
              </button>

              <button
                onClick={() => handleGeoPunch("out")}
                disabled={punching || !currentCoords}
                className="py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
              >
                <LogOut size={15} />
                <span>{punching ? "Processing Punch..." : "Geo Check-Out"}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Office Locations Directory */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 size={17} className="text-indigo-600" />
                  Authorized Office Perimeters
                </h3>
                <span className="text-[10px] font-bold text-slate-400">
                  {locations.length} Active
                </span>
              </div>

              {loadingLocations ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading office locations...</div>
              ) : locations.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                  <p>No office locations defined yet.</p>
                  {isAdmin && (
                    <Link
                      href="/settings"
                      className="inline-block text-xs font-bold text-indigo-600 hover:underline"
                    >
                      Configure Locations in Settings
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto">
                  {locations.map((loc) => {
                    const dist = currentCoords
                      ? calculateDistance(currentCoords.latitude, currentCoords.longitude, loc.latitude, loc.longitude)
                      : null;
                    const inRange = dist !== null && dist <= (loc.radiusMeters || 500);

                    return (
                      <div
                        key={loc.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {loc.name}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                            {loc.radiusMeters || 500}m Radius
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {loc.address || "Main Corporate Center"}
                        </p>

                        <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-200/60 dark:border-slate-700/40">
                          <span>
                            {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                          </span>
                          {dist !== null && (
                            <span className={`font-bold ${inRange ? "text-emerald-600" : "text-slate-500"}`}>
                              {dist}m away {inRange ? "✓ (In Range)" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
