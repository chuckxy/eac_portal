import { NextRequest } from 'next/server';
import { proxyToExpress } from '@/lib/api-proxy';

/** GET  /api/grading/scales */
export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyToExpress(req, params.path, 'grading');
}

/** POST /api/grading/scales | scales/bulk */
export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyToExpress(req, params.path, 'grading');
}
