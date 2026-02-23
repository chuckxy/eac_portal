import { NextRequest } from 'next/server';
import { proxyToExpress } from '@/lib/api-proxy';

/** GET  /api/institution/faculties | departments | programmes | levels */
export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyToExpress(req, params.path, 'institution');
}

/** POST /api/institution/faculties | departments | programmes */
export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyToExpress(req, params.path, 'institution');
}

/** DELETE /api/institution/faculties/:id | departments/:id | programmes/:id */
export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyToExpress(req, params.path, 'institution');
}
