import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useChat } from "../hooks/useChat";
import "./chat.css";

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

const Chat = () => {
  const navigate = useNavigate();
  const {
    activeChat,
    conversations,
    credentials,
    messages,
    error,
    pollingError,
    isReceiving,
    isSearching,
    isSending,
    searchByPhone,
    selectConversation,
    showConversationList,
    send,
    signOut,
  } = useChat();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [filterText, setFilterText] = useState("");
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [showPhoneSearch, setShowPhoneSearch] = useState(false);
  const [draft, setDraft] = useState("");
  const messageListRef = useRef<HTMLOListElement>(null);
  const normalizedFilter = filterText.trim().toLocaleLowerCase();
  const visibleConversations = conversations.filter((conversation) =>
    `${conversation.displayName ?? ""} ${conversation.phoneNumber}`
      .toLocaleLowerCase()
      .includes(normalizedFilter),
  );

  useEffect(() => {
    if (!credentials) void navigate("/", { replace: true });
  }, [credentials, navigate]);

  useEffect(() => {
    const list = messageListRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!showPhoneSearch) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setShowPhoneSearch(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [showPhoneSearch]);

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await searchByPhone(phoneNumber)) {
      setShowPhoneSearch(false);
      setIsNewMenuOpen(false);
      setFilterText("");
    }
  }

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await send(draft)) setDraft("");
  }

  return (
    <main className="chat-page">
      <header className="chat-topbar">
        <a className="chat-brand" href="/chat" aria-label="MAX, чат">
          <img src="/max-logo.png" alt="" width="40" height="40" />
          <span>
            MAX <span className="chat-brand-divider">/</span> GREEN-API
          </span>
        </a>
        <div className="chat-account">
          <span className={`chat-connection ${isReceiving ? "is-online" : ""}`}>
            <span aria-hidden="true" />
            {pollingError
              ? "Нет связи"
              : isReceiving
                ? "На связи"
                : "Отключено"}
          </span>
          <button
            className="chat-signout"
            type="button"
            onClick={async () => {
              await signOut();
              void navigate("/", { replace: true });
            }}
          >
            Выйти
          </button>
        </div>
      </header>

      <section
        className={`chat-workspace ${activeChat ? "is-chat-open" : "is-list-open"}`}
        aria-label="Чат MAX"
      >
        <aside className="chat-sidebar">
          <div className="chat-sidebar-heading">
            <h1>Чаты</h1>
            <div className="chat-new-wrap">
              <button
                className="chat-new-button"
                type="button"
                aria-label="Создать чат"
                aria-expanded={isNewMenuOpen}
                onClick={() => setIsNewMenuOpen((open) => !open)}
              >
                +
              </button>
              {isNewMenuOpen && (
                <div className="chat-new-menu">
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneNumber("");
                      setShowPhoneSearch(true);
                      setIsNewMenuOpen(false);
                    }}
                  >
                    <span aria-hidden="true">⌕</span>
                    Найти по номеру
                  </button>
                </div>
              )}
            </div>
          </div>

          <label className="chat-list-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Найти"
              aria-label="Фильтр чатов"
              value={filterText}
              onChange={(event) => setFilterText(event.target.value)}
            />
          </label>

          <div className="chat-conversation-label">ВСЕ СООБЩЕНИЯ</div>
          <div className="chat-conversation-list">
            {visibleConversations.length ? (
              visibleConversations.map((conversation) => {
                const isSelected = activeChat?.chatId === conversation.chatId;
                const title =
                  conversation.displayName || `+${conversation.phoneNumber}`;
                return (
                  <button
                    className={`chat-contact ${isSelected ? "is-selected" : ""}`}
                    type="button"
                    key={conversation.chatId}
                    onClick={() => selectConversation(conversation.chatId)}
                  >
                    <span className="chat-avatar" aria-hidden="true">
                      {(conversation.displayName ?? conversation.phoneNumber)
                        .slice(-2)
                        .toLocaleUpperCase()}
                    </span>
                    <span className="chat-contact-copy">
                      <strong>{title}</strong>
                      <small>{conversation.lastMessage ?? "Новый чат"}</small>
                    </span>
                    {isSelected && (
                      <span
                        className="chat-contact-indicator"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })
            ) : (
              <p className="chat-no-contact">
                {filterText
                  ? "Ничего не найдено"
                  : "Здесь появятся ваши диалоги"}
              </p>
            )}
          </div>
        </aside>

        <section className="chat-thread" aria-label="Сообщения">
          {activeChat ? (
            <>
              <header className="chat-thread-header">
                <button
                  className="chat-back-button"
                  type="button"
                  aria-label="К списку чатов"
                  onClick={showConversationList}
                >
                  ←
                </button>
                <span
                  className="chat-avatar chat-avatar-large"
                  aria-hidden="true"
                >
                  {activeChat.phoneNumber.slice(-2)}
                </span>
                <div className="chat-thread-person">
                  <h2>+{activeChat.phoneNumber}</h2>
                  <p>
                    {pollingError ? "Ожидание соединения" : "MAX · личный чат"}
                  </p>
                </div>
                <span className="chat-thread-tag">ТЕКСТОВЫЙ ЧАТ</span>
              </header>

              <ol
                className="chat-messages"
                ref={messageListRef}
                aria-live="polite"
              >
                {messages.length ? (
                  messages.map((message) => (
                    <li
                      className={`chat-message ${message.direction === "outgoing" ? "is-outgoing" : "is-incoming"}`}
                      key={message.id}
                    >
                      <p>{message.text}</p>
                      <time
                        dateTime={new Date(message.timestamp).toISOString()}
                      >
                        {formatTime(message.timestamp)}
                      </time>
                    </li>
                  ))
                ) : (
                  <li className="chat-empty-thread">
                    <span className="chat-empty-icon" aria-hidden="true">
                      ✳
                    </span>
                    <h2>Диалог готов</h2>
                    <p>Отправьте первое сообщение, чтобы начать переписку.</p>
                  </li>
                )}
              </ol>

              <form className="chat-composer" onSubmit={handleSend}>
                <label className="chat-sr-only" htmlFor="message-draft">
                  Текст сообщения
                </label>
                <textarea
                  id="message-draft"
                  rows={1}
                  maxLength={4000}
                  placeholder="Напишите сообщение"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  disabled={isSending}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                />
                <div className="chat-composer-bottom">
                  <span>{draft.length}/4000</span>
                  <button
                    type="submit"
                    disabled={isSending || !draft.trim()}
                    aria-label="Отправить сообщение"
                    title="Отправить сообщение"
                  >
                    {isSending ? "…" : "↑"}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="chat-welcome">
              <span className="chat-welcome-mark" aria-hidden="true">
                ✦
              </span>
              <h2>Выберите чат</h2>
              <p>
                Выберите диалог слева или создайте новый по номеру телефона.
              </p>
            </div>
          )}
          {!showPhoneSearch && (error || pollingError) && (
            <p className="chat-error" id="chat-error" role="alert">
              {error ?? pollingError}
            </p>
          )}
        </section>
      </section>
      {showPhoneSearch && (
        <div
          className="chat-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowPhoneSearch(false);
            }
          }}
        >
          <section
            className="chat-phone-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="phone-modal-title"
          >
            <header className="chat-phone-modal-header">
              <h2 id="phone-modal-title">Найти по номеру</h2>
              <button
                className="chat-phone-modal-close"
                type="button"
                aria-label="Закрыть окно"
                onClick={() => setShowPhoneSearch(false)}
              >
                ×
              </button>
            </header>
            <form className="chat-phone-form" onSubmit={handleSearch}>
              <label htmlFor="recipient-phone">Номер телефона</label>
              <input
                id="recipient-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                autoFocus
                placeholder="+7 999 123-45-67"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                disabled={isSearching}
                aria-describedby={error ? "phone-search-error" : undefined}
              />
              {error && (
                <p
                  className="chat-phone-error"
                  id="phone-search-error"
                  role="alert"
                >
                  {error}
                </p>
              )}
              <button
                className="chat-phone-submit"
                type="submit"
                disabled={isSearching || !phoneNumber.trim()}
              >
                {isSearching ? "Ищем в MAX..." : "Найти в MAX"}
              </button>
            </form>
          </section>
        </div>
      )}
      <footer className="chat-footer">
        <span>СООБЩЕНИЯ ПЕРЕДАЮТСЯ ЧЕРЕЗ GREEN-API</span>
        <span>MAX · 2026</span>
      </footer>
    </main>
  );
};

export default Chat;
