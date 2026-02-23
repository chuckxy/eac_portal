import { NextRequest } from 'next/server';
import { proxyToExpress } from '@/lib/api-proxy';

/** GET  /api/academic/years | /api/academic/years/:id | /api/academic/semesters */
export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyToExpress(req, params.path, 'academic');
}

/** POST /api/academic/years | /api/academic/semesters */
export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyToExpress(req, params.path, 'academic');
}

/** DELETE /api/academic/years/:id | /api/academic/semesters/:id */
export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyToExpress(req, params.path, 'academic');
}
