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

export async function secureFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers || {});
  if (!headers.has(APP_AUTH_TOKEN_HEADER)) {
    headers.set(APP_AUTH_TOKEN_HEADER, DEFAULT_APP_SECURITY_TOKEN);
  }
  return fetch(input, {
    ...init,
    headers,
  });
}
