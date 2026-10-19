---
name: green-api-max
description: Use when implementing, debugging, or reviewing GREEN-API integration for MAX, including SendMessage, ReceiveNotification, DeleteNotification, incoming message parsing, credentials, or polling.
---

# GREEN-API MAX Integration

Use this skill for the current React + TypeScript chat assignment. Keep the implementation text-only and within the assignment's minimal feature set.

## Official documentation

- [Getting started and instance credentials](https://green-api.com/v3/docs/before-start/)
- [SendMessage](https://green-api.com/v3/docs/api/sending/SendMessage/)
- [HTTP API receiving](https://green-api.com/v3/docs/api/receiving/technology-http-api/)
- [ReceiveNotification](https://green-api.com/v3/docs/api/receiving/technology-http-api/ReceiveNotification/)
- [DeleteNotification](https://green-api.com/v3/docs/api/receiving/technology-http-api/DeleteNotification/)
- [Incoming message format](https://green-api.com/v3/docs/api/receiving/notifications-format/incoming-message/Webhook-IncomingMessageReceived/)
- [Text message format](https://green-api.com/v3/docs/api/receiving/notifications-format/incoming-message/TextMessage/)

Check the official docs when an endpoint, field, limit, or error behavior is uncertain. The API contract can change; do not treat this summary as a replacement for the docs.

## API contract

- Instance parameters are `apiUrl`, `idInstance`, and `apiTokenInstance`; obtain them from the user's GREEN-API cabinet. Never put real values in source, examples, logs, or commits.
- Send text with `POST {apiUrl}/waInstance{idInstance}/sendMessage/{apiTokenInstance}` and JSON `{ "chatId": "...", "message": "..." }`. The response includes `idMessage`. The documented text limit is 4000 characters.
- For HTTP API receiving, the instance must have an empty `webhookUrl` and the required notification types enabled (at least `incomingWebhook`). If a custom webhook URL is set, `ReceiveNotification` cannot be used.
- Poll with `GET {apiUrl}/waInstance{idInstance}/receiveNotification/{apiTokenInstance}`. `receiveTimeout` is optional and documented as 5-60 seconds; a timeout may return an empty response.
- A received notification contains `receiptId` and `body`. Notifications are queued FIFO and retained for 24 hours.
- After successfully handling a notification, acknowledge it with `DELETE {apiUrl}/waInstance{idInstance}/deleteNotification/{apiTokenInstance}/{receiptId}`. Do not delete before processing; deletion removes it from the queue.
- For incoming messages, inspect `body.typeWebhook`, `body.senderData.chatId`, `body.senderData.senderName`, and `body.messageData.typeMessage`. Display only supported text messages (`textMessage` and its documented text field); ignore unsupported media without rendering fake text content.

## Implementation guidance

- Keep API calls in the existing API layer and app state in the established Redux Toolkit pattern; inspect the repository before adding abstractions.
- Run at most one polling loop per configured instance. Avoid overlapping `ReceiveNotification` calls and stop polling when credentials change or the owning UI unmounts.
- Validate notification shape before adding a message to the chat. Use `chatId` to associate incoming messages with the conversation and preserve message IDs when available.
- Acknowledge only after the notification has been accepted into application state. Handle empty timeout responses as normal; surface actual request failures instead of silently discarding them.
- Credentials are entered at runtime in this frontend assignment. Do not hard-code or log them, and do not persist them in local storage unless explicitly requested. A browser-only app cannot hide credentials from its user or browser tooling.
- Keep the UI limited to text messaging. Do not add media, groups, or unrelated API methods unless the user changes the assignment scope.
