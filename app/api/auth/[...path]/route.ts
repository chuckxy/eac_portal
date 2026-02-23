import { NextRequest } from 'next/server';
import { proxyToExpress } from '@/lib/api-proxy';

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyToExpress(req, params.path, 'auth');
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyToExpress(req, params.path, 'auth');
}
