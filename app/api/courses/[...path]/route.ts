import { NextRequest } from 'next/server';
import { proxyToExpress } from '@/lib/api-proxy';

/** GET  /api/courses/list | assignments */
export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyToExpress(req, params.path, 'courses');
}

/** POST /api/courses/list | assignments */
export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyToExpress(req, params.path, 'courses');
}

/** DELETE /api/courses/list/:id | assignments/:id */
export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyToExpress(req, params.path, 'courses');
}
