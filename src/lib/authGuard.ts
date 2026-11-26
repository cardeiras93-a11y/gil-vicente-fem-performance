import { NextResponse } from 'next/server';

export const APP_AUTH_TOKEN_HEADER = 'x-app-auth-token';
export const DEFAULT_APP_SECURITY_TOKEN = process.env.APP_SECURITY_TOKEN || 'GVFC_PERF_SECURE_2026_TOKEN';

export function verifyApiAuth(request: Request): NextResponse | null {
  try {
    const tokenHeader = request.headers.get(APP_AUTH_TOKEN_HEADER);
    const authHeader = request.headers.get('authorization');
    
    let token = tokenHeader;
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (token === DEFAULT_APP_SECURITY_TOKEN) {
      // Authorization successful
      return null;
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Acesso restrito ao Gil Vicente FC. Autenticação requerida.',
        code: 'UNAUTHORIZED_ACCESS'
      },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro de validação de segurança.',
        code: 'SECURITY_VALIDATION_ERROR'
      },
      { status: 401 }
    );
  }
}

const RENDER_FALLBACK_BASE = 'https://gil-vicente-fem-performance.onrender.com';

export async function secureFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers || {});
  if (!headers.has(APP_AUTH_TOKEN_HEADER)) {
    headers.set(APP_AUTH_TOKEN_HEADER, DEFAULT_APP_SECURITY_TOKEN);
  }

  let urlStr = '';
  if (typeof input === 'string') {
    urlStr = input;
  } else if (input instanceof URL) {
    urlStr = input.toString();
  } else if (typeof Request !== 'undefined' && input instanceof Request) {
    urlStr = input.url;
  }

  const isVercelHost = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
  const isApiRelative = urlStr.startsWith('/api/');

  // If on Vercel and calling /api/, directly route to Render because Vercel deployment is disabled (402)
  if (isVercelHost && isApiRelative) {
    const targetUrl = `${RENDER_FALLBACK_BASE}${urlStr}`;
    try {
      const renderRes = await fetch(targetUrl, {
        ...init,
        headers,
      });
      if (renderRes.ok) return renderRes;
    } catch {}
  }

  try {
    const res = await fetch(input, {
      ...init,
      headers,
    });

    if (res.ok) {
      return res;
    }

    // If HTTP error (e.g. 402 Payment Required, 500, 502), fallback to Render
    if (isApiRelative || !urlStr.includes('onrender.com')) {
      const fallbackUrl = urlStr.startsWith('http')
        ? urlStr.replace(/https:\/\/[^/]+/, RENDER_FALLBACK_BASE)
        : `${RENDER_FALLBACK_BASE}${urlStr.startsWith('/') ? '' : '/'}${urlStr}`;
      
      try {
        const fallbackRes = await fetch(fallbackUrl, {
          ...init,
          headers,
        });
        if (fallbackRes.ok) {
          return fallbackRes;
        }
      } catch {}
    }

    return res;
  } catch (networkErr) {
    // If fetch failed completely, attempt Render fallback
    if (isApiRelative || !urlStr.includes('onrender.com')) {
      const fallbackUrl = urlStr.startsWith('http')
        ? urlStr.replace(/https:\/\/[^/]+/, RENDER_FALLBACK_BASE)
        : `${RENDER_FALLBACK_BASE}${urlStr.startsWith('/') ? '' : '/'}${urlStr}`;
      
      try {
        return await fetch(fallbackUrl, {
          ...init,
          headers,
        });
      } catch {}
    }
    throw networkErr;
  }
}
