import { prisma } from "@/lib/prisma";

export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // Distance in metres
}

export interface GeofenceResult {
  inGeofence: boolean;
  nearestLocationName?: string;
  nearestDistance?: number;
  allowedRadius?: number;
}

export async function verifyGeofence(
  latitude?: number | null,
  longitude?: number | null,
  employeeBranchId?: string | null
): Promise<GeofenceResult> {
  if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
    return { inGeofence: false, nearestDistance: 0, allowedRadius: 0 };
  }

  // Fetch all active office locations
  const locations = await prisma.officeLocation.findMany({
    where: { isActive: true },
  });

  // Also check if employee's branch has geocoordinates
  if (employeeBranchId) {
    const branch = await prisma.branch.findUnique({
      where: { id: employeeBranchId },
    });
    if (branch && branch.latitude && branch.longitude) {
      locations.push({
        id: branch.id,
        name: branch.name,
        code: branch.code || branch.id,
        address: branch.address || null,
        latitude: branch.latitude,
        longitude: branch.longitude,
        radiusMeters: branch.radiusMeters || 500,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  if (locations.length === 0) {
    // If no locations defined, geofence check passes by default
    return { inGeofence: true, nearestDistance: 0, allowedRadius: 0 };
  }

  let minDistance = Infinity;
  let nearestLoc: typeof locations[0] | null = null;
  let matched = false;

  for (const loc of locations) {
    const dist = getDistanceMeters(latitude, longitude, loc.latitude, loc.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      nearestLoc = loc;
    }
    if (dist <= loc.radiusMeters) {
      matched = true;
      nearestLoc = loc;
      minDistance = dist;
      break;
    }
  }

  return {
    inGeofence: matched,
    nearestLocationName: nearestLoc?.name,
    nearestDistance: minDistance,
    allowedRadius: nearestLoc?.radiusMeters || 500,
  };
}
