import { create } from "zustand";

export interface DraftReply {
    messageId: string;
    senderName: string;
    contentSnippet: string;
}

interface ComposerState {
    activeReplyTo: DraftReply | null;
    setReplyToMessage: (reply: DraftReply | null) => void;
    clearReplyToMessage: () => void;
}

export const useComposerStore = create<ComposerState>((set) => ({
    activeReplyTo: null,
    setReplyToMessage: (reply) => set({ activeReplyTo: reply }),
    clearReplyToMessage: () => set({ activeReplyTo: null }),
}));