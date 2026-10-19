import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { setCredentials, useCheckCredentialsMutation } from "../store/auth";
import type { Credentials } from "../store/auth";
import type { AppDispatch } from "../store/store";

const stateErrors: Record<string, string> = {
  notAuthorized: "Подключите аккаунт MAX в кабинете GREEN-API.",
  blocked: "Аккаунт MAX заблокирован.",
  starting: "Инстанс запускается. Попробуйте позже.",
  suspended: "На аккаунте действуют временные ограничения.",
  pendingPassword: "Завершите двухфакторную авторизацию в GREEN-API.",
};

function getErrorMessage(error: unknown): string {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return "Не удалось выполнить вход. Попробуйте снова.";
  }

  switch (error.status) {
    case 401:
      return "Проверьте idInstance и apiTokenInstance.";
    case 403:
      return "Доступ запрещён. Проверьте реквизиты и состояние инстанса.";
    case 429:
      return "Слишком много запросов. Попробуйте позже.";
    case "FETCH_ERROR":
      return "Ошибка соединения: проверьте сеть и адрес API.";
    case "TIMEOUT_ERROR":
      return "Сервер не ответил вовремя. Попробуйте снова.";
    case "PARSING_ERROR":
      return "Сервер вернул некорректный ответ.";
    default:
      return "Ошибка API. Проверьте настройки и попробуйте позже.";
  }
}

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const [checkCredentials] = useCheckCredentialsMutation();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const activeRequest = useRef<ReturnType<typeof checkCredentials> | null>(
    null,
  );

  useEffect(
    () => () => {
      const request = activeRequest.current;
      activeRequest.current = null;
      request?.abort();
    },
    [],
  );

  async function login(input: Credentials): Promise<boolean> {
    if (activeRequest.current) return false;

    setError(null);
    const credentials = {
      idInstance: input.idInstance.trim(),
      apiTokenInstance: input.apiTokenInstance.trim(),
    };

    if (
      !/^\d+$/.test(credentials.idInstance) ||
      !/^[A-Za-z0-9_-]+$/.test(credentials.apiTokenInstance)
    ) {
      setError("Введите числовой idInstance и токен без пробелов.");
      return false;
    }

    setIsLoading(true);
    const request = checkCredentials(credentials);
    activeRequest.current = request;

    try {
      const response: unknown = await request.unwrap();
      if (activeRequest.current !== request) return false;

      if (
        typeof response !== "object" ||
        response === null ||
        !("stateInstance" in response) ||
        typeof response.stateInstance !== "string"
      ) {
        setError("Сервер вернул некорректное состояние инстанса.");
        return false;
      }

      if (response.stateInstance !== "authorized") {
        setError(
          Object.hasOwn(stateErrors, response.stateInstance)
            ? stateErrors[response.stateInstance]
            : "Неизвестное состояние инстанса.",
        );
        return false;
      }

      dispatch(setCredentials(credentials));
      return true;
    } catch (error: unknown) {
      if (activeRequest.current === request) {
        setError(getErrorMessage(error));
      }
      return false;
    } finally {
      request.reset();
      if (activeRequest.current === request) {
        activeRequest.current = null;
        setIsLoading(false);
      }
    }
  }

  return { login, isLoading, error };
}
