import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

function getStoredEntries(filename: string): any[] {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customUrl = searchParams.get('url');
    const readUrl = customUrl || process.env.GOOGLE_SHEETS_READ_URL;

    if (!readUrl) {
      const wellness = getStoredEntries('wellness_entries.json');
      const rpe = getStoredEntries('rpe_entries.json');
      const hydration = getStoredEntries('hydration_entries.json');
      return NextResponse.json({
        success: true,
        data: {
          wellness,
          rpe,
          hydration
        }
      });
    }

    const response = await fetch(readUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 30 }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Falha ao consultar Google Sheets URL' }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      data
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao sincronizar do Google Sheets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const googleSheetWebhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

    if (!googleSheetWebhookUrl) {
      return NextResponse.json({
        success: true,
        message: 'Endpoint de sincronização pronto. Define GOOGLE_SHEETS_WEBHOOK_URL nas variáveis de ambiente da Vercel para ativar o envio automático.',
        received: body,
      });
    }

    const response = await fetch(googleSheetWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Erro ao enviar dados para Google Sheets' }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: 'Dados sincronizados com Google Sheets com sucesso!' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro na sincronização' }, { status: 500 });
  }
}

