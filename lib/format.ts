// Formatting helpers — kept here so dates and numbers look identical everywhere.

import { TODAY } from "./data";

const monthShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtDate(iso: string): string {
  // "May 12"
  const d = new Date(iso + "T00:00:00Z");
  return `${monthShort[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export function fmtDateLong(iso: string): string {
  // "Tue, May 12"
  const d = new Date(iso + "T00:00:00Z");
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()];
  return `${dow}, ${monthShort[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export function fmtYards(n: number): string {
  return n.toLocaleString("en-US") + " yd";
}

export function fmtUsd(n: number): string {
  return "$" + n.toLocaleString("en-US");
}

export function daysFromToday(iso: string): number {
  const t = new Date(TODAY + "T00:00:00Z").getTime();
  const d = new Date(iso + "T00:00:00Z").getTime();
  return Math.round((d - t) / 86400000);
}

export function relativeFromToday(iso: string): string {
  const n = daysFromToday(iso);
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n === -1) return "yesterday";
  if (n > 1) return `in ${n} days`;
  return `${-n} days ago`;
}
