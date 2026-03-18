const GT_TIME_ZONE = "America/Guatemala";

const toInt = (value: string | undefined, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toTwoDigits = (value: number): string => String(value).padStart(2, "0");

export const formatDateTimeGt = (value?: string | number | Date): string => {
  if (!value) return "-";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: GT_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes): string | undefined =>
    parts.find((part) => part.type === type)?.value;

  const year = toInt(get("year"));
  const month = toInt(get("month"));
  const day = toInt(get("day"));
  const hour24 = toInt(get("hour"));
  const minute = toInt(get("minute"));
  const second = toInt(get("second"));

  const hour12 = hour24 % 12 || 12;
  const period = hour24 >= 12 ? "p. m." : "a. m.";

  return `${day}/${month}/${year}, ${hour12}:${toTwoDigits(minute)}:${toTwoDigits(second)} ${period}`;
};
