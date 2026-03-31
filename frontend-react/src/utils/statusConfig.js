export const STATUS_CONFIG = {
  NORMAL: {
    label: 'NORMAL',
    badgeClass: 'bg-wg-normal-bg text-wg-normal border-wg-normal-bd',
    pillClass: 'bg-wg-normal/20 text-emerald-400 border-wg-normal/30',
    color: 'text-wg-normal',
    dotColor: 'bg-wg-normal',
  },
  WATCH: {
    label: 'WATCH',
    badgeClass: 'bg-wg-watch-bg text-wg-watch border-wg-watch-bd',
    pillClass: 'bg-wg-watch/20 text-yellow-300 border-wg-watch/30',
    color: 'text-wg-watch',
    dotColor: 'bg-wg-watch',
  },
  MODERATE: {
    label: 'MODERATE',
    badgeClass: 'bg-amber-50 text-amber-600 border-amber-200',
    pillClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    color: 'text-amber-600',
    dotColor: 'bg-amber-500',
  },
  WARNING: {
    label: 'WARNING',
    badgeClass: 'bg-wg-warn-bg text-wg-warn border-wg-warn-bd',
    pillClass: 'bg-wg-warn/20 text-red-400 border-wg-warn/30',
    color: 'text-wg-warn',
    dotColor: 'bg-wg-warn',
  },
  OFFLINE: {
    label: 'OFFLINE',
    badgeClass: 'bg-gray-100 text-wg-muted-2 border-wg-border',
    pillClass: 'bg-white/10 text-gray-400 border-white/20',
    color: 'text-wg-muted-2',
    dotColor: 'bg-wg-muted-2',
  },
};

export function getStatusConfig(status) {
  return STATUS_CONFIG[(status || 'NORMAL').toUpperCase()] || STATUS_CONFIG.NORMAL;
}
