// frontend/src/hooks/useWebSocket.ts
/**
 * Real-time WebSocket hook for Pravhatattva v4.0
 * Only connects when a backend server is available (not on GitHub Pages).
 * In production (GitHub Pages), data comes from static JSON files via
 * GitHub Actions — no WebSocket needed.
 */
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useRealtimeTelemetry() {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Skip WebSocket entirely on GitHub Pages (production build)
    // The static JSON pipeline handles data freshness via GitHub Actions.
    const apiUrl = (import.meta.env.VITE_API_URL as string) || '';
    if (!apiUrl || import.meta.env.PROD) {
      return; // No WebSocket in production — data comes from JSON files
    }

    const wsUrl = apiUrl.replace('http', 'ws') + '/ws/telemetry';

    const connect = () => {
      try {
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
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
          reconnectTimer.current = setTimeout(connect, 5000);
        };

        wsRef.current.onerror = () => {
          wsRef.current?.close();
        };
      } catch {
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
