import type { VercelRequest, VercelResponse } from '@vercel/node';

type Location = { latitude: number; longitude: number };

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { start, locations }: { start: Location; locations: Location[] } = req.body;

  if (!start || !Array.isArray(locations)) {
    return res.status(400).json({ error: 'Invalid input format' });
  }

  const allPoints = [start, ...locations];

  const distanceMatrix = allPoints.map((a, i) =>
    allPoints.map((b, j) => (i === j ? 0 : haversineDistance(a, b)))
  );

  const orderedIndexes = dijkstraTSP(distanceMatrix);
  const optimizedRoute = orderedIndexes.map((idx) => allPoints[idx]);

  return res.status(200).json({ optimizedRoute });
}

function haversineDistance(a: Location, b: Location): number {
  const R = 6371;
  const dLat = deg2rad(b.latitude - a.latitude);
  const dLon = deg2rad(b.longitude - a.longitude);
  const lat1 = deg2rad(a.latitude);
  const lat2 = deg2rad(b.latitude);

  const aVal =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));

  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

function dijkstraTSP(matrix: number[][]): number[] {
  const n = matrix.length;
  const visited = Array(n).fill(false);
  const order = [0];
  visited[0] = true;
  let current = 0;

  for (let step = 1; step < n; step++) {
    let nearest = -1;
    let minDist = Infinity;

    for (let i = 1; i < n; i++) {
      if (!visited[i] && matrix[current][i] < minDist) {
        nearest = i;
        minDist = matrix[current][i];
      }
    }

    if (nearest !== -1) {
      order.push(nearest);
      visited[nearest] = true;
      current = nearest;
    }
  }

  return order;
}
