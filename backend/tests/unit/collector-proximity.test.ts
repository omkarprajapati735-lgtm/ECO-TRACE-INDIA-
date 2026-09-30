import { describe, it, expect } from 'vitest';
import { calculateHaversineDistance, calculateBoundingBox } from '../../src/utils/haversine';

describe('Unit Tests: Collector Proximity & Haversine Distance', () => {
  // Test coordinates
  // Collector origin: Gurugram Sector 45 (28.4595, 77.0722)
  const collectorLat = 28.4595;
  const collectorLng = 77.0722;

  // Nearby point: DLF Phase 1 (~3.2 km away)
  const dlfLat = 28.4795;
  const dlfLng = 77.0985;

  // Distant point: Connaught Place, New Delhi (~23.7 km away)
  const cpLat = 28.6304;
  const cpLng = 77.2177;

  it('should return 0.0 km for identical coordinates', () => {
    const distance = calculateHaversineDistance(collectorLat, collectorLng, collectorLat, collectorLng);
    expect(distance).toBe(0);
  });

  it('should accurately calculate distance between Gurugram Sector 45 and DLF Phase 1 (~3.2 km)', () => {
    const distance = calculateHaversineDistance(collectorLat, collectorLng, dlfLat, dlfLng);
    expect(distance).toBeGreaterThan(2.8);
    expect(distance).toBeLessThan(3.8);
  });

  it('should accurately calculate distance to Connaught Place (~23.7 km)', () => {
    const distance = calculateHaversineDistance(collectorLat, collectorLng, cpLat, cpLng);
    expect(distance).toBeGreaterThan(20.0);
    expect(distance).toBeLessThan(26.0);
  });

  it('should generate valid bounding box for 10 km radius', () => {
    const bbox = calculateBoundingBox(collectorLat, collectorLng, 10);

    expect(bbox.minLat).toBeLessThan(collectorLat);
    expect(bbox.maxLat).toBeGreaterThan(collectorLat);
    expect(bbox.minLng).toBeLessThan(collectorLng);
    expect(bbox.maxLng).toBeGreaterThan(collectorLng);

    // Any point within bbox latitude must be within ~10km delta
    const latSpanKm = (bbox.maxLat - bbox.minLat) * 111.045;
    expect(latSpanKm).toBeCloseTo(20.0, 1);
  });

  it('should strictly exclude points beyond radius threshold', () => {
    const radiusKm = 10.0;
    const testPoints = [
      { name: 'Close', lat: 28.465, lng: 77.075, expectedInside: true },
      { name: 'Boundary Inside', lat: 28.53, lng: 77.0722, expectedInside: true }, // ~7.8 km
      { name: 'Far Outside', lat: cpLat, lng: cpLng, expectedInside: false }, // ~23.7 km
    ];

    testPoints.forEach((point) => {
      const distance = calculateHaversineDistance(collectorLat, collectorLng, point.lat, point.lng);
      const isInside = distance <= radiusKm;
      expect(isInside).toBe(point.expectedInside);
    });
  });

  it('should sort jobs in ascending order of proximity', () => {
    const jobs = [
      { id: 'job-far', lat: cpLat, lng: cpLng },
      { id: 'job-near', lat: dlfLat, lng: dlfLng },
      { id: 'job-closest', lat: 28.4601, lng: 77.0725 },
    ];

    const sorted = jobs
      .map((job) => ({
        ...job,
        distanceKm: calculateHaversineDistance(collectorLat, collectorLng, job.lat, job.lng),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    expect(sorted[0].id).toBe('job-closest');
    expect(sorted[1].id).toBe('job-near');
    expect(sorted[2].id).toBe('job-far');
    expect(sorted[0].distanceKm).toBeLessThan(sorted[1].distanceKm);
    expect(sorted[1].distanceKm).toBeLessThan(sorted[2].distanceKm);
  });

  it('should execute 10,000 Haversine calculations in under 50 ms (performance benchmark)', () => {
    const startTime = performance.now();
    for (let i = 0; i < 10000; i++) {
      calculateHaversineDistance(
        collectorLat + (i % 50) * 0.001,
        collectorLng + (i % 50) * 0.001,
        dlfLat,
        dlfLng
      );
    }
    const elapsedMs = performance.now() - startTime;
    expect(elapsedMs).toBeLessThan(50);
  });
});
