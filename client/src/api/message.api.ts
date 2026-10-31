import { api } from "#lib/api";
import type {
  CreateMessageDto,
  UpdateMessageDto,
  StoredMessage,
  MessagePage,
  MessageQuery,
} from "../types/message";

export const messagesApi = {
  getPage: async (
    roomId: string,
    params: MessageQuery = {},
    signal?: AbortSignal,
  ): Promise<MessagePage> =>
    (
      await api.get<MessagePage>(`/rooms/${roomId}/messages/page`, {
        params,
        signal,
      })
    ).data,
  getMessage: async (
    roomId: string,
    messageId: string,
    signal?: AbortSignal,
  ): Promise<StoredMessage> =>
    (
      await api.get<StoredMessage>(`/rooms/${roomId}/messages/${messageId}`, {
        signal,
      })
    ).data,
  createMessage: async (
    roomId: string,
    dto: CreateMessageDto,
  ): Promise<StoredMessage> =>
    (await api.post<StoredMessage>(`/rooms/${roomId}/messages`, dto)).data,
  updateMessage: async (
    roomId: string,
    messageId: string,
    dto: UpdateMessageDto,
  ): Promise<StoredMessage> =>
    (
      await api.patch<StoredMessage>(
        `/rooms/${roomId}/messages/${messageId}`,
        dto,
      )
    ).data,
  deleteMessage: async (roomId: string, messageId: string): Promise<void> => {
    await api.delete(`/rooms/${roomId}/messages/${messageId}`);
  },
  setReaction: async (
    roomId: string,
    messageId: string,
    emoji: string,
    add: boolean,
  ): Promise<StoredMessage> =>
    (
      await (add
        ? api.post<StoredMessage>(
            `/rooms/${roomId}/messages/${messageId}/reactions`,
            { emoji },
          )
        : api.delete<StoredMessage>(
            `/rooms/${roomId}/messages/${messageId}/reactions`,
            { data: { emoji } },
          ))
    ).data,
};
