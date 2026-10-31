import { create } from 'zustand';

export interface DraftReply {
  messageId: string;
  senderName: string;
  contentSnippet: string;
}
interface ComposerState {
  activeReplyTo: DraftReply | null;
  setReplyToMessage: (reply: DraftReply | null) => void;
  clearReplyToMessage: () => void;
  resetComposer: () => void;
}
export const useComposerStore = create<ComposerState>((set) => ({
  activeReplyTo: null,
  setReplyToMessage: (activeReplyTo) => set({ activeReplyTo }),
  clearReplyToMessage: () => set({ activeReplyTo: null }),
  resetComposer: () => set({ activeReplyTo: null }),
}));
