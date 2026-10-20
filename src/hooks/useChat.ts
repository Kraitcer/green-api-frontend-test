import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { Credentials } from "../store/auth";
import { logout } from "../store/auth";
import {
  addMessage,
  clearChat,
  openChat,
  selectChat,
  useCheckAccountMutation,
  useDeleteNotificationMutation,
  useReceiveNotificationMutation,
  useSendMessageMutation,
} from "../store/chat";
import type { ChatMessage } from "../store/chat";
import type { AppDispatch, RootState } from "../store/store";

type ApiError = { status?: string | number; data?: unknown };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getErrorMessage(error: unknown): string {
  const apiError = error as ApiError;
  switch (apiError?.status) {
    case 401:
      return "Проверьте учетные данные GREEN-API.";
    case 403:
      return "Запрос запрещен. Проверьте состояние инстанса.";
    case 429:
    case 469:
      return "Достигнут лимит запросов. Попробуйте позже.";
    case "FETCH_ERROR":
      return "Нет соединения с GREEN-API.";
    case "TIMEOUT_ERROR":
      return "GREEN-API не ответил вовремя.";
    default:
      return "Не удалось выполнить запрос. Попробуйте еще раз.";
  }
}

function getIncomingMessage(notification: {
  receiptId: number;
  body: unknown;
}): ChatMessage | null {
  if (!isRecord(notification.body)) return null;
  const body = notification.body;
  if (body.typeWebhook !== "incomingMessageReceived") return null;
  if (!isRecord(body.senderData) || !isRecord(body.messageData)) return null;

  const { senderData, messageData } = body;
  if (typeof senderData.chatId !== "string") return null;
  if (messageData.typeMessage !== "textMessage") return null;
  if (!isRecord(messageData.textMessageData)) return null;

  const text = messageData.textMessageData.textMessage;
  if (typeof text !== "string") return null;

  return {
    id:
      typeof body.idMessage === "string"
        ? body.idMessage
        : String(notification.receiptId),
    chatId: senderData.chatId,
    text,
    direction: "incoming",
    timestamp:
      typeof body.timestamp === "number" ? body.timestamp * 1000 : Date.now(),
    senderName:
      typeof senderData.senderName === "string"
        ? senderData.senderName
        : undefined,
    senderPhoneNumber:
      (typeof senderData.senderPhoneNumber === "number" ||
        typeof senderData.senderPhoneNumber === "string") &&
      Number(senderData.senderPhoneNumber) > 0
        ? String(senderData.senderPhoneNumber)
        : undefined,
  };
}

export function useChat() {
  const dispatch = useDispatch<AppDispatch>();
  const credentials = useSelector((state: RootState) => state.auth.credentials);
  const conversations = useSelector(
    (state: RootState) => state.chat.conversations,
  );
  const activeChat = useSelector(
    (state: RootState) =>
      state.chat.conversations.find(
        (conversation) => conversation.chatId === state.chat.activeChatId,
      ) ?? null,
  );
  const messages = useSelector((state: RootState) =>
    state.chat.activeChatId
      ? (state.chat.messages[state.chat.activeChatId] ?? [])
      : [],
  );
  const [checkAccount, checkState] = useCheckAccountMutation();
  const [sendMessage, sendState] = useSendMessageMutation();
  const [receiveNotification] = useReceiveNotificationMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [error, setError] = useState<string | null>(null);
  const [pollingError, setPollingError] = useState<string | null>(null);
  const [isReceiving, setIsReceiving] = useState(false);

  useEffect(() => {
    if (!credentials) return;
    const activeCredentials = credentials;

    let active = true;
    let abortRequest: (() => void) | undefined;

    async function pollNotifications() {
      setIsReceiving(true);

      while (active) {
        try {
          const receiveRequest = receiveNotification(activeCredentials);
          abortRequest = () => receiveRequest.abort();
          const notification = await receiveRequest.unwrap();
          abortRequest = undefined;
          if (!active) break;
          if (!notification) continue;

          if (
            !Number.isSafeInteger(notification.receiptId) ||
            !isRecord(notification.body)
          ) {
            throw new Error("Некорректное уведомление GREEN-API.");
          }

          const message = getIncomingMessage(notification);
          if (message) dispatch(addMessage(message));

          const deleteRequest = deleteNotification({
            credentials: activeCredentials,
            receiptId: notification.receiptId,
          });
          abortRequest = () => deleteRequest.abort();
          const deletion = await deleteRequest.unwrap();
          abortRequest = undefined;
          if (!deletion.result) {
            throw new Error("Не удалось подтвердить получение уведомления.");
          }
          if (active) setPollingError(null);
        } catch (pollError: unknown) {
          abortRequest = undefined;
          if (!active) break;
          setPollingError(
            pollError instanceof Error
              ? pollError.message
              : getErrorMessage(pollError),
          );
          await new Promise((resolve) => window.setTimeout(resolve, 2000));
        }
      }

      if (active) setIsReceiving(false);
    }

    void pollNotifications();
    return () => {
      active = false;
      abortRequest?.();
    };
  }, [credentials, deleteNotification, dispatch, receiveNotification]);

  async function searchByPhone(input: string): Promise<boolean> {
    setError(null);
    const phoneNumber = input.replace(/\D/g, "");

    if (!/^(7\d{10}|375\d{9})$/.test(phoneNumber)) {
      setError("Введите номер РФ или Беларуси в международном формате.");
      return false;
    }
    if (!credentials) {
      setError("Сначала войдите в GREEN-API.");
      return false;
    }

    try {
      const result = await checkAccount({ credentials, phoneNumber }).unwrap();
      if (!result.exist || !result.chatId) {
        setError("Аккаунт MAX для этого номера не найден.");
        return false;
      }
      dispatch(openChat({ chatId: result.chatId, phoneNumber }));
      return true;
    } catch (searchError: unknown) {
      setError(getErrorMessage(searchError));
      return false;
    }
  }

  async function send(text: string): Promise<boolean> {
    setError(null);
    const message = text.trim();
    if (!message || message.length > 4000 || !activeChat || !credentials) {
      if (message.length > 4000) {
        setError("Сообщение не должно превышать 4000 символов.");
      }
      return false;
    }

    try {
      const result = await sendMessage({
        credentials,
        chatId: activeChat.chatId,
        message,
      }).unwrap();
      dispatch(
        addMessage({
          id: result.idMessage,
          chatId: activeChat.chatId,
          text: message,
          direction: "outgoing",
          timestamp: Date.now(),
        }),
      );
      return true;
    } catch (sendError: unknown) {
      setError(getErrorMessage(sendError));
      return false;
    }
  }

  function signOut() {
    dispatch(logout());
    dispatch(clearChat());
  }

  function selectConversation(chatId: string) {
    dispatch(selectChat(chatId));
    setError(null);
  }

  function showConversationList() {
    dispatch(selectChat(null));
  }

  return {
    activeChat,
    conversations,
    credentials,
    messages,
    error,
    pollingError,
    isReceiving,
    isSearching: checkState.isLoading,
    isSending: sendState.isLoading,
    searchByPhone,
    selectConversation,
    showConversationList,
    send,
    signOut,
  };
}

export type { Credentials };
