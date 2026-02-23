import { NextRequest } from 'next/server';
import { proxyToExpress } from '@/lib/api-proxy';

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyToExpress(req, params.path, 'lookup');
}
