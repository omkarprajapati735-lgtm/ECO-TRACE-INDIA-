/**
 * Haversine formula calculation utility for geospatial proximity.
 * Earth mean radius: 6371.0 km
 */

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculates great-circle distance between two coordinate points in kilometers
 * using the Haversine formula.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  }

  const R = 6371.0; // Mean Earth radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const radLat1 = toRadians(lat1);
  const radLat2 = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
  const distance = R * c;

  return Number(distance.toFixed(3));
}

/**
 * Computes bounding box coordinates for fast SQL indexing pre-filtering.
 * 1 degree latitude ~= 111.045 km
 */
export function calculateBoundingBox(
  lat: number,
  lng: number,
  radiusKm: number
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  const latDelta = radiusKm / 111.045;
  const cosLat = Math.cos(toRadians(lat));
  const lngDelta =
    Math.abs(cosLat) > 0.0001 ? radiusKm / (111.045 * Math.abs(cosLat)) : radiusKm / 111.045;

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
