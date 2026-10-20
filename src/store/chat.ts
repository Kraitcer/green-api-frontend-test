import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { api } from "../api/greenApi";
import type { Credentials } from "./auth";

interface CheckAccountResponse {
  exist?: boolean;
  chatId?: string;
  status?: boolean;
  reason?: string;
}

interface SendMessageResponse {
  idMessage: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  text: string;
  direction: "incoming" | "outgoing";
  timestamp: number;
  senderName?: string;
  senderPhoneNumber?: string;
}

export interface Conversation {
  chatId: string;
  phoneNumber: string;
  displayName?: string;
  lastMessage?: string;
}

interface ChatState {
  activeChatId: string | null;
  conversations: Conversation[];
  messages: Record<string, ChatMessage[]>;
}

const initialState: ChatState = {
  activeChatId: null,
  conversations: [],
  messages: {},
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    openChat(state, action: PayloadAction<Conversation>) {
      const { chatId, phoneNumber, displayName } = action.payload;
      const existing = state.conversations.find(
        (conversation) =>
          conversation.chatId === chatId ||
          conversation.phoneNumber === phoneNumber,
      );

      if (existing) {
        existing.displayName = displayName ?? existing.displayName;
        state.activeChatId = existing.chatId;
        return;
      }

      state.conversations.unshift({ chatId, phoneNumber, displayName });
      state.activeChatId = chatId;
    },
    selectChat(state, action: PayloadAction<string | null>) {
      state.activeChatId = action.payload;
    },
    addMessage(state, action: PayloadAction<ChatMessage>) {
      const messages = (state.messages[action.payload.chatId] ??= []);
      if (!messages.some((message) => message.id === action.payload.id)) {
        messages.push(action.payload);
      }

      let conversation = state.conversations.find(
        (item) => item.chatId === action.payload.chatId,
      );
      if (!conversation && action.payload.direction === "incoming") {
        conversation = {
          chatId: action.payload.chatId,
          phoneNumber:
            action.payload.senderPhoneNumber ?? action.payload.chatId,
          displayName: action.payload.senderName,
        };
        state.conversations.unshift(conversation);
      } else if (conversation && action.payload.senderName) {
        conversation.displayName = action.payload.senderName;
      }

      if (conversation) {
        conversation.lastMessage = action.payload.text;
        state.conversations = [
          conversation,
          ...state.conversations.filter(
            (item) => item.chatId !== conversation.chatId,
          ),
        ];
      }
    },
    clearChat: () => initialState,
  },
});

export const chatApi = api.injectEndpoints({
  endpoints: (builder) => ({
    checkAccount: builder.mutation<
      CheckAccountResponse,
      { credentials: Credentials; phoneNumber: string }
    >({
      query: ({ credentials, phoneNumber }) => ({
        url: `waInstance${credentials.idInstance}/checkAccount/${credentials.apiTokenInstance}`,
        method: "POST",
        body: { phoneNumber: Number(phoneNumber) },
      }),
    }),
    sendMessage: builder.mutation<
      SendMessageResponse,
      { credentials: Credentials; chatId: string; message: string }
    >({
      query: ({ credentials, chatId, message }) => ({
        url: `waInstance${credentials.idInstance}/sendMessage/${credentials.apiTokenInstance}`,
        method: "POST",
        body: { chatId, message },
      }),
    }),
    receiveNotification: builder.mutation<
      { receiptId: number; body: unknown } | null,
      Credentials
    >({
      query: ({ idInstance, apiTokenInstance }) => ({
        url: `waInstance${idInstance}/receiveNotification/${apiTokenInstance}?receiveTimeout=10`,
        method: "GET",
      }),
    }),
    deleteNotification: builder.mutation<
      { result: boolean; reason?: string },
      { credentials: Credentials; receiptId: number }
    >({
      query: ({ credentials, receiptId }) => ({
        url: `waInstance${credentials.idInstance}/deleteNotification/${credentials.apiTokenInstance}/${receiptId}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const { openChat, selectChat, addMessage, clearChat } =
  chatSlice.actions;
export const {
  useCheckAccountMutation,
  useSendMessageMutation,
  useReceiveNotificationMutation,
  useDeleteNotificationMutation,
} = chatApi;
export default chatSlice.reducer;
