import { NextRequest } from 'next/server';
import { proxyToExpress } from '@/lib/api-proxy';

/** GET  /api/assessments/types | list */
export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyToExpress(req, params.path, 'assessments');
}

/** POST /api/assessments/types | list */
export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyToExpress(req, params.path, 'assessments');
}

/** DELETE /api/assessments/types/:id | list/:id */
export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyToExpress(req, params.path, 'assessments');
}
