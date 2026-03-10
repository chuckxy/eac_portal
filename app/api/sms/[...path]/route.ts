import { NextRequest } from 'next/server';
import { proxyToExpress } from '@/lib/api-proxy';

/** GET /api/sms/recipients | balance | sender-ids */
export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyToExpress(req, params.path, 'sms');
}

/** POST /api/sms/send | sender-ids */
export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyToExpress(req, params.path, 'sms');
}

/** DELETE /api/sms/sender-ids/:id */
export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyToExpress(req, params.path, 'sms');
}

/** PATCH /api/sms/sender-ids/:id/default */
export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyToExpress(req, params.path, 'sms');
}
