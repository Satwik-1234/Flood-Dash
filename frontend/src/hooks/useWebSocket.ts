// frontend/src/hooks/useWebSocket.ts
/**
 * Real-time WebSocket hook for Pravhatattva v4.0
 * Connects to /ws/telemetry, receives CWC and IMD updates
 * pushed by the Celery worker via Redis pub/sub.
 * Updates TanStack Query cache so all components re-render automatically.
 * Auto-reconnects on connection drop.
 */
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const WS_URL = ((import.meta.env.VITE_API_URL as string) || 'http://localhost')
               .replace('http', 'ws') + '/ws/telemetry';

export function useRealtimeTelemetry() {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const connect = () => {
      try {
        wsRef.current = new WebSocket(WS_URL);

        wsRef.current.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            // Backend sends tagged messages: { type: 'cwc_update', data: [...] }
            if (payload.type === 'cwc_update' && payload.data) {
              queryClient.setQueryData(['cwc-stations'], payload.data);
            }
            if (payload.type === 'imd_update' && payload.data) {
              queryClient.setQueryData(['imd-warnings'], payload.data);
            }
          } catch {
            // Ignore malformed messages
          }
        };

        wsRef.current.onopen = () => {
          console.log('[WS] Connected to telemetry stream');
        };

        wsRef.current.onclose = () => {
          console.log('[WS] Disconnected — reconnecting in 5s');
          // Reconnect after 5 seconds if connection drops
          reconnectTimer.current = setTimeout(connect, 5000);
        };

        wsRef.current.onerror = () => {
          // Will trigger onclose, which handles reconnect
          wsRef.current?.close();
        };
      } catch {
        // WebSocket constructor can throw if URL is invalid
        reconnectTimer.current = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [queryClient]);
}
