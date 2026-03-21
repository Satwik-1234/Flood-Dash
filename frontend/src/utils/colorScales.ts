// SINGLE SOURCE OF TRUTH for all color mappings across map + charts
export type AlertLevel = 0 | 1 | 2 | 3 | 4 | 5;

export const ALERT_COLORS: Record<AlertLevel, { bg: string; text: string; label: string }> = {
  0: { bg: '#374151', text: '#9CA3AF', label: 'No data'    },
  1: { bg: '#14532D', text: '#86EFAC', label: 'Normal'     },
  2: { bg: '#713F12', text: '#FDE68A', label: 'Watch'      },
  3: { bg: '#7C2D12', text: '#FED7AA', label: 'Warning'    },
  4: { bg: '#7F1D1D', text: '#FCA5A5', label: 'Alert'      },
  5: { bg: '#450A0A', text: '#FECACA', label: 'Emergency'  },
};

export function rainfallToColor(mm: number): string {
  if (mm <= 0)   return 'transparent';
  if (mm <= 5)   return '#BAE6FD';
  if (mm <= 25)  return '#38BDF8';
  if (mm <= 50)  return '#0284C7';
  if (mm <= 100) return '#EAB308';
  if (mm <= 200) return '#EA580C';
  return '#991B1B';
}

export function dischargeToAlertLevel(
  current: number, warning: number, danger: number, extreme: number
): AlertLevel {
  if (current >= extreme)  return 5;
  if (current >= danger)   return 4;
  if (current >= warning)  return 3;
  if (current >= warning * 0.7) return 2;
  return 1;
}
