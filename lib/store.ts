"use client";

// Local app state — drafts, decisions, sent items. No persistence.
// Lives only in the running session, which is correct for a prototype.

import { create } from "zustand";

export type Draft = {
  id: string;
  // Identity for what this draft is about.
  kind: "shortfall-question" | "eta-change" | "weekly-digest";
  customerId: string;
  customerName: string;
  subject: string;
  body: string;
  // For ETA-change drafts: which container shifted.
  containerId?: string;
  // For shortfall drafts: source shortfall id.
  shortfallId?: string;
  createdAt: string;
};

export type SentMessage = Draft & { sentAt: string };

export type ResolvedShortfall = {
  id: string;
  customerId: string;
  customerName: string;
  subject: string;
  sentAt: string;
};

type State = {
  drafts: Draft[];
  sent: SentMessage[];
  resolvedShortfalls: ResolvedShortfall[];
  resolvedEtaChanges: string[];
  digestSent: boolean;

  // Actions
  upsertDraft: (d: Draft) => void;
  updateDraftBody: (id: string, body: string) => void;
  removeDraft: (id: string) => void;
  sendDraft: (id: string) => void;
  sendDrafts: (ids: string[]) => void;
  resolveShortfall: (r: ResolvedShortfall) => void;
  resolveEtaChange: (containerId: string) => void;
  markDigestSent: () => void;
};

export const useStore = create<State>((set) => ({
  drafts: [],
  sent: [],
  resolvedShortfalls: [],
  resolvedEtaChanges: [],
  digestSent: false,

  upsertDraft: (d) =>
    set((s) => {
      const i = s.drafts.findIndex((x) => x.id === d.id);
      if (i === -1) return { drafts: [...s.drafts, d] };
      const next = [...s.drafts];
      next[i] = d;
      return { drafts: next };
    }),

  updateDraftBody: (id, body) =>
    set((s) => ({
      drafts: s.drafts.map((d) => (d.id === id ? { ...d, body } : d)),
    })),

  removeDraft: (id) =>
    set((s) => ({ drafts: s.drafts.filter((d) => d.id !== id) })),

  sendDraft: (id) =>
    set((s) => {
      const d = s.drafts.find((x) => x.id === id);
      if (!d) return {};
      const sentAt = new Date().toISOString().slice(0, 10);
      return {
        drafts: s.drafts.filter((x) => x.id !== id),
        sent: [...s.sent, { ...d, sentAt }],
      };
    }),

  sendDrafts: (ids) =>
    set((s) => {
      const sentAt = new Date().toISOString().slice(0, 10);
      const moved = s.drafts.filter((d) => ids.includes(d.id));
      return {
        drafts: s.drafts.filter((d) => !ids.includes(d.id)),
        sent: [...s.sent, ...moved.map((d) => ({ ...d, sentAt }))],
      };
    }),

  resolveShortfall: (r) =>
    set((s) => ({ resolvedShortfalls: [...s.resolvedShortfalls, r] })),

  resolveEtaChange: (containerId) =>
    set((s) => ({
      resolvedEtaChanges: [...s.resolvedEtaChanges, containerId],
    })),

  markDigestSent: () => set({ digestSent: true }),
}));
