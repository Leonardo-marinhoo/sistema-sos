export function formatRelativeTime(dateValue: string | Date): string {
  const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
  const diffMs = date.getTime() - Date.now();
  const diffSeconds = Math.round(diffMs / 1000);
  const absSeconds = Math.abs(diffSeconds);

  const units = [
    { limit: 60, divisor: 1, singular: "segundo", plural: "segundos" },
    { limit: 3600, divisor: 60, singular: "minuto", plural: "minutos" },
    { limit: 86400, divisor: 3600, singular: "hora", plural: "horas" },
    { limit: 2592000, divisor: 86400, singular: "dia", plural: "dias" },
    { limit: 31536000, divisor: 2592000, singular: "mês", plural: "meses" },
    { limit: Infinity, divisor: 31536000, singular: "ano", plural: "anos" },
  ];

  const unit = units.find((entry) => absSeconds < entry.limit) ?? units[units.length - 1];
  const value = Math.max(1, Math.floor(absSeconds / unit.divisor));
  const label = value === 1 ? unit.singular : unit.plural;

  return diffSeconds >= 0 ? `há ${value} ${label}` : `em ${value} ${label}`;
}