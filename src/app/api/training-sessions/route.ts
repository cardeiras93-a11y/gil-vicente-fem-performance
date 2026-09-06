import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'training_sessions.json');

function ensureFileExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(FILE_PATH, JSON.stringify({ sessions: {}, schedule: {} }, null, 2), 'utf-8');
  }
}

export async function GET() {
  try {
    ensureFileExists();
    const raw = fs.readFileSync(FILE_PATH, 'utf-8');
    const data = JSON.parse(raw);
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao ler sessões de treino' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    ensureFileExists();
    const body = await request.json();
    const raw = fs.readFileSync(FILE_PATH, 'utf-8');
    const currentData = JSON.parse(raw);

    if (body.type === 'session' && body.info) {
      currentData.sessions[body.info.date] = body.info;
      if (body.info.dayType) {
        currentData.schedule[body.info.date] = body.info.dayType;
      }
    } else if (body.type === 'schedule' && body.schedule) {
      currentData.schedule = { ...currentData.schedule, ...body.schedule };
    } else if (body.date && body.dayType) {
      currentData.sessions[body.date] = body;
      currentData.schedule[body.date] = body.dayType;
    }

    fs.writeFileSync(FILE_PATH, JSON.stringify(currentData, null, 2), 'utf-8');
    return NextResponse.json({ success: true, message: 'Informação de treino guardada com sucesso' }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao guardar sessão de treino' }, { status: 500 });
  }
}
