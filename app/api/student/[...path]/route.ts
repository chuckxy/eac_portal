import { NextRequest } from 'next/server';
import { proxyToExpress } from '@/lib/api-proxy';

/** GET  /api/student/profile/:studentIndex | results/:studentIndex | transcript/:studentIndex | courses/:studentIndex */
export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyToExpress(req, params.path, 'student');
}

/** PATCH /api/student/profile/:studentIndex */
export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyToExpress(req, params.path, 'student');
}
