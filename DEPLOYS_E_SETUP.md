# Guia Completo de Alojamento Cloud (24/7) e Instalação PWA

Este manual explica como colocar a Web App **FemPerf** a funcionar online 24 horas por dia, 7 dias por semana, acessível a todas as jogadoras e equipa técnica através da internet, sem depender de nenhum computador local.

---

## 1. Criar a Base de Dados Gratuita no Supabase (PostgreSQL Cloud)

1. Acede a [supabase.com](https://supabase.com) e cria uma conta gratuita (ou entra com o GitHub).
2. Clica em **"New Project"**, escolhe um nome (ex: `FemPerf-DB`) e define uma palavra-passe para a base de dados.
3. No painel do projeto Supabase, acede ao menu lateral esquerdo em **SQL Editor**.
4. Clica em **"New query"** e cola todo o conteúdo do ficheiro [`src/supabase/schema.sql`](file:///Users/guilhermecardeiras/.gemini/antigravity/scratch/fem-performance-app/src/supabase/schema.sql).
5. Clica em **"Run"** (no canto inferior direito). As tabelas `athletes`, `wellness_entries`, `rpe_entries` e `hydration_entries` serão criadas e a lista das 26 jogadoras será automaticamente inserida!
6. Vai às definições do projeto (**Project Settings** -> **API**) e copia:
   - **URL do Projeto** (ex: `https://xyzcompany.supabase.co`)
   - **Chave anon / public** (ex: `eyJhbGciOi...`)

---

## 2. Deploy Gratuito na Vercel (Online 24/7 em 1 Clique)

1. Cria uma conta em [vercel.com](https://vercel.com).
2. Associa a tua conta do GitHub/GitLab.
3. Faz o push do projeto `fem-performance-app` para um repositório no GitHub.
4. Na Vercel, clica em **"Add New"** -> **"Project"** e seleciona o repositório `fem-performance-app`.
5. Em **Environment Variables**, adiciona as duas variáveis obtidas no Supabase:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://o-teu-projeto.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `a-tua-chave-anon`
6. Clica em **"Deploy"**. Em menos de 2 minutos terás o URL público com HTTPS ativo (ex: `https://femperf-equipa.vercel.app`).
7. **Partilha o URL no grupo de WhatsApp do plantel!**

---

## 3. Sincronização Híbrida com Google Sheets (Opcional)

Se a equipa técnica desejar que cada submissão também alimente automaticamente uma folha do Google Sheets:

1. Cria um Google Form ou Google Sheet com as colunas pretendidas.
2. No Google Sheets, acede a **Extensões** -> **Apps Script**.
3. Cria uma Web App simples que recebe requisições `POST` em JSON e insere uma linha no Sheet.
4. Copia o URL de execução da Web App do Google Apps Script.
5. Na Vercel (em **Environment Variables** do teu projeto), adiciona:
   - `GOOGLE_SHEETS_WEBHOOK_URL` = `https://script.google.com/macros/s/.../exec`
6. Sempre que uma jogadora submeter Wellness ou RPE, o endpoint serverless da app enviará os dados diretamente para o Google Sheets em segundo plano.

---

## 4. Instruções para as Atletas: Guardar no Ecrã Principal (PWA)

### No iPhone (iOS / Safari):
1. Abre o link da aplicação no **Safari** (ex: `https://femperf-equipa.vercel.app`).
2. Clica no botão de **Partilhar** (ícone do quadrado com seta a apontar para cima no fundo do ecrã).
3. Desce nas opções e seleciona **"Adicionar ao Ecrã Principal"** (*Add to Home Screen*).
4. Clica em **"Adicionar"**. A app ficará com o ícone no ecrã inicial do iPhone e abrirá em ecrã inteiro sem barras de navegação, parecendo uma app nativa da App Store!

### No Android (Chrome):
1. Abre o link da aplicação no **Google Chrome**.
2. O Chrome exibirá automaticamente um aviso no fundo: *"Adicionar FemPerf ao Ecrã Principal"*.
3. Se não aparecer, clica nos **3 pontos verticais** no canto superior direito e seleciona **"Instalar Aplicação"** ou **"Adicionar ao Ecrã Principal"**.
4. Confirmar a instalação.

---

## 5. Funcionamento Offline e Balneário com Fraca Rede

A aplicação foi desenhada com tecnologia **Service Worker** e **LocalStorage**:
- Se a atleta abrir a app no balneário e a rede móvel estiver fraca ou nula, a app abre instantaneamente a partir da cache estática local.
- Todas as submissões efetuadas offline são guardadas no telemóvel da atleta e sincronizadas automaticamente com o Supabase assim que o dispositivo recuperar ligação à internet.
