// Standard 16 Academic Periods for Timetable
export const RAW_PERIODS = [
  { period: 1, start: "07:00", end: "07:50", startH: 7, startM: 0, endH: 7, endM: 50, shift: "Sáng" },
  { period: 2, start: "07:50", end: "08:40", startH: 7, startM: 50, endH: 8, endM: 40, shift: "Sáng" },
  { period: 3, start: "08:45", end: "09:35", startH: 8, startM: 45, endH: 9, endM: 35, shift: "Sáng" },
  { period: 4, start: "09:40", end: "10:30", startH: 9, startM: 40, endH: 10, endM: 30, shift: "Sáng" },
  { period: 5, start: "10:35", end: "11:25", startH: 10, startM: 35, endH: 11, endM: 25, shift: "Sáng" },
  { period: 6, start: "11:25", end: "12:15", startH: 11, startM: 25, endH: 12, endM: 15, shift: "Sáng" },
  { period: 7, start: "12:30", end: "13:20", startH: 12, startM: 30, endH: 13, endM: 20, shift: "Chiều" },
  { period: 8, start: "13:20", end: "14:10", startH: 13, startM: 20, endH: 14, endM: 10, shift: "Chiều" },
  { period: 9, start: "14:15", end: "15:05", startH: 14, startM: 15, endH: 15, endM: 5, shift: "Chiều" },
  { period: 10, start: "15:10", end: "16:00", startH: 15, startM: 10, endH: 16, endM: 0, shift: "Chiều" },
  { period: 11, start: "16:05", end: "16:55", startH: 16, startM: 5, endH: 16, endM: 55, shift: "Chiều" },
  { period: 12, start: "16:55", end: "17:45", startH: 16, startM: 55, endH: 17, endM: 45, shift: "Chiều" },
  { period: 13, start: "18:00", end: "18:50", startH: 18, startM: 0, endH: 18, endM: 50, shift: "Tối" },
  { period: 14, start: "18:50", end: "19:40", startH: 18, startM: 50, endH: 19, endM: 40, shift: "Tối" },
  { period: 15, start: "19:45", end: "20:35", startH: 19, startM: 45, endH: 20, endM: 35, shift: "Tối" },
  { period: 16, start: "20:35", end: "21:25", startH: 20, startM: 35, endH: 21, endM: 25, shift: "Tối" },
];

export const PERIODS_MAP = {
  7: { name: "Tiết 1", time: "07:00 - 07:50", period: 1 },
  8: { name: "Tiết 2", time: "07:50 - 08:40", period: 2 },
  9: { name: "Tiết 3", time: "08:45 - 09:35", period: 3 },
  10: { name: "Tiết 4", time: "09:40 - 10:30", period: 4 },
  11: { name: "Tiết 5", time: "10:35 - 11:25", period: 5 },
  12: { name: "Tiết 6", time: "11:25 - 12:15", period: 6 },
  13: { name: "Tiết 7", time: "12:30 - 13:20", period: 7 },
  14: { name: "Tiết 8", time: "13:20 - 14:10", period: 8 },
  15: { name: "Tiết 9", time: "14:15 - 15:05", period: 9 },
  16: { name: "Tiết 10", time: "15:10 - 16:00", period: 10 },
  17: { name: "Tiết 11", time: "16:05 - 16:55", period: 11 },
  18: { name: "Tiết 12", time: "16:55 - 17:45", period: 12 },
  19: { name: "Tiết 13", time: "18:00 - 18:50", period: 13 },
  20: { name: "Tiết 14", time: "18:50 - 19:40", period: 14 },
  21: { name: "Tiết 15", time: "19:45 - 20:35", period: 15 },
  22: { name: "Tiết 16", time: "20:35 - 21:25", period: 16 },
};

/**
 * Calculates end period, time strings, and period label
 */
export const calculatePeriodRange = (startPeriod, duration = 1) => {
  const p1 = Math.max(1, Math.min(16, Number(startPeriod) || 1));
  const dur = Math.max(1, Math.min(16 - p1 + 1, Number(duration) || 1));
  const p2 = p1 + dur - 1;

  const startInfo = RAW_PERIODS[p1 - 1];
  const endInfo = RAW_PERIODS[p2 - 1];

  const startTimeStr = startInfo.start;
  const endTimeStr = endInfo.end;
  const periodLabel = p1 === p2 ? `Tiết ${p1}` : `Tiết ${p1} - ${p2}`;
  const timeRangeText = `${startTimeStr} - ${endTimeStr}`;

  return {
    startPeriod: p1,
    endPeriod: p2,
    duration: dur,
    startH: startInfo.startH,
    startM: startInfo.startM,
    endH: endInfo.endH,
    endM: endInfo.endM,
    startTimeStr,
    endTimeStr,
    periodLabel,
    timeRangeText,
  };
};

/**
 * Builds ISO-8601 UTC string for start & end datetime aligned with Asia/Ho_Chi_Minh (UTC+7)
 */
export const buildEventIsoStrings = (dateStr, startPeriod, duration) => {
  const range = calculatePeriodRange(startPeriod, duration);
  const pad = (n) => String(n).padStart(2, "0");

  const startIso = `${dateStr}T${pad(range.startH)}:${pad(range.startM)}:00+07:00`;
  const endIso = `${dateStr}T${pad(range.endH)}:${pad(range.endM)}:00+07:00`;

  return {
    startDatetime: new Date(startIso).toISOString(),
    endDatetime: new Date(endIso).toISOString(),
    ...range,
  };
};
