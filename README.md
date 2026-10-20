# MAX Chat на GREEN-API

Текстовый клиент MAX на React, TypeScript и Vite. Для работы нужны авторизованный инстанс GREEN-API для MAX и параметры доступа из личного кабинета.

## Настройка GREEN-API

1. Установите мобильное приложение MAX и войдите в аккаунт, который будет подключён к GREEN-API.
2. В [личном кабинете GREEN-API](https://console.green-api.com/) создайте инстанс и авторизуйте его, отсканировав QR-код через MAX.
3. В кабинете откройте параметры инстанса. Для запросов HTTP API понадобятся `apiUrl` — ссылка на хост API, `idInstance` — уникальный номер инстанса и `apiTokenInstance` — ключ доступа инстанса.
4. Для получения входящих сообщений через HTTP API настройте получение уведомлений: оставьте `webhookUrl` пустым и включите `incomingWebhook`.

Подробности: [Перед началом работы с MAX](https://green-api.com/v3/docs/before-start/) и [Получение уведомлений через HTTP API](https://green-api.com/v3/docs/api/receiving/technology-http-api/).

## Установка и запуск

1. Клонируйте репозиторий и перейдите в его каталог:

   ```sh
   git clone <URL репозитория>
   cd green-api
   ```

2. Установите зависимости:

   ```sh
   npm install
   ```

3. В корне проекта, рядом с `package.json`, создайте файл `.env.local`. Добавьте в него `VITE_GREEN_API_URL` и укажите значение параметра `apiUrl` из личного кабинета GREEN-API:

   ```dotenv
   VITE_GREEN_API_URL=<apiUrl из личного кабинета GREEN-API>
   ```

   Замените текст в угловых скобках реальным адресом хоста API из параметров инстанса.

4. Запустите приложение:

   ```sh
   npm run dev
   ```

5. Откройте адрес, который Vite покажет в терминале. На экране входа укажите `idInstance` и `apiTokenInstance` из параметров того же инстанса.

## Проверки

```sh
npm run build
npm run lint
```
