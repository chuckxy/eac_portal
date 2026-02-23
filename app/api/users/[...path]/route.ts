import { NextRequest } from 'next/server';
import { proxyToExpress } from '@/lib/api-proxy';

/** GET  /api/users/students | students/:index | lecturers | lecturers/:id */
export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyToExpress(req, params.path, 'users');
}

/** POST /api/users/students | lecturers */
export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyToExpress(req, params.path, 'users');
}

/** PATCH /api/users/students/:index/status | lecturers/:id/status */
export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyToExpress(req, params.path, 'users');
}
