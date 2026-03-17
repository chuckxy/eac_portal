import { NextRequest, NextResponse } from 'next/server';

const EXPRESS_BASE = process.env.NODE_ENV === 'production' ? process.env.EXPRESS_API_URL_REMOTE : process.env.EXPRESS_API_URL_REMOTE ?? 'http://localhost:5001';

/**
 * Forward a Next.js API request to the Express server and return its response.
 *
 * Usage (inside a route.ts):
 *   return proxyToExpress(req, params.path, 'academic');
 *
 * This builds the target URL:  http://localhost:5001/api/{basePath}/{...path}?query
 */
export async function proxyToExpress(req: NextRequest, pathSegments: string[], basePath: string) {
    const subPath = pathSegments.map((s) => encodeURIComponent(s)).join('/');
    const targetUrl = new URL(`/api/${basePath}/${subPath}`, EXPRESS_BASE);

    // Forward query parameters
    req.nextUrl.searchParams.forEach((value, key) => {
        targetUrl.searchParams.append(key, value);
    });

    // Build outgoing headers
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };
    const authHeader = req.headers.get('authorization');
    if (authHeader) headers['Authorization'] = authHeader;

    const fetchOptions: RequestInit = {
        method: req.method,
        headers
    };

    // Forward JSON body for mutating requests
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        try {
            const body = await req.json();
            fetchOptions.body = JSON.stringify(body);
        } catch {
            // Request had no JSON body — that's fine
        }
    }

    try {
        const response = await fetch(targetUrl.toString(), fetchOptions);
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json({ message: error.message || 'Failed to connect to API server' }, { status: 502 });
    }
}
