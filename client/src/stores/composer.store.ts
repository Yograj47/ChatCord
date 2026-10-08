import { create } from 'zustand';

export interface DraftReply {
    messageId: string;
    senderName: string;
    contentSnippet: string;
}

interface ComposerState {
    draft: string;
    activeReplyTo: DraftReply | null;
    editingMessageId: string | null;

    setDraft: (draft: string) => void;
    setReplyToMessage: (reply: DraftReply | null) => void;
    clearReplyToMessage: () => void;
    setEditingMessage: (messageId: string | null) => void;
    resetComposer: () => void;
}

export const useComposerStore = create<ComposerState>((set) => ({
    draft: '',
    activeReplyTo: null,
    editingMessageId: null,

    setDraft: (draft) => set({ draft }),

    setReplyToMessage: (reply) =>
        set({ activeReplyTo: reply, editingMessageId: null }),

    clearReplyToMessage: () => set({ activeReplyTo: null }),

    setEditingMessage: (messageId) =>
        set({ editingMessageId: messageId, activeReplyTo: null }),

    resetComposer: () =>
        set({
            draft: '',
            activeReplyTo: null,
            editingMessageId: null,
        }),
}));