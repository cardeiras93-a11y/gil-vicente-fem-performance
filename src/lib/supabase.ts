// Supabase is completely disabled because the remote project smvktaiecabzubtfeepa has exceeded
// its egress quota (HTTP 402 Payment Required) and stalls/hangs all HTTP and WebSocket connections for minutes.
// All persistence and real-time syncing is handled via GitHub data_store/ and fast local caches.

export const isSupabaseConfigured = false;
export const supabase: any = null;

export function initRealtimeCloudSync(_onSync: () => void): () => void {
  return () => {};
}
