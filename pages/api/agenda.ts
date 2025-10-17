import type { NextApiRequest, NextApiResponse } from 'next';

// Proxy simple a actividades públicas para construir agenda
// Usa NEXT_PUBLIC_API_URL para el backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || process.env.API_URL || 'http://localhost:5213';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Permitir filtros básicos: day, type, from, to
    const { day, type, from, to } = req.query;
    const params = new URLSearchParams();
    if (type && typeof type === 'string') params.set('type', type);
    if (from && typeof from === 'string') params.set('from', from);
    if (to && typeof to === 'string') params.set('to', to);

    const url = `${API_BASE_URL}/api/activities${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      return res.status(500).json({ ok: false, error: 'Error fetching activities', details: text });
    }
    const data = await response.json();

    // Mapear a estructura de agenda coherente
    const items = Array.isArray(data) ? data.map((item: any) => ({
      id: String(item.id ?? item.activityId ?? ''),
      title: item.title ?? 'Sin título',
      startISO: item.startTime ?? item.startISO ?? new Date().toISOString(),
      endISO: item.endTime ?? item.endISO ?? new Date().toISOString(),
      place: item.location ?? item.place ?? undefined,
      speakerId: item.speakerId ?? undefined,
      day: String((item.startTime ?? item.startISO ?? new Date().toISOString()).split('T')[0]),
      type: item.activityType?.toLowerCase() ?? 'actividad'
    })) : [];

    const filtered = typeof day === 'string' ? items.filter((i: any) => i.day === day) : items;

    return res.status(200).json(filtered);
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: 'Agenda proxy failed', details: String(error?.message || error) });
  }
}