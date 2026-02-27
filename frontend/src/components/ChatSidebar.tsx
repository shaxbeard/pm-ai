import type { FormEvent } from "react";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatSidebarProps = {
  messages: ChatMessage[];
  input: string;
  status: "idle" | "loading" | "error";
  error: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
};

export const ChatSidebar = ({
  messages,
  input,
  status,
  error,
  onInputChange,
  onSend,
}: ChatSidebarProps) => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSend();
  };

  return (
    <aside className="flex h-full flex-col rounded-3xl border border-[var(--stroke)] bg-white/90 p-5 shadow-[var(--shadow)] backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--gray-text)]">
            AI Assistant
          </p>
          <p className="mt-2 text-sm font-medium text-[var(--navy-dark)]">
            Ask for updates or changes.
          </p>
        </div>
        <span className="rounded-full border border-[var(--stroke)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--primary-blue)]">
          Beta
        </span>
      </div>

      <div className="mt-4 flex min-h-[280px] flex-1 flex-col gap-3 overflow-y-auto rounded-2xl border border-[var(--stroke)] bg-[var(--surface)] p-4">
        {messages.length === 0 ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]">
            No messages yet.
          </p>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={
                message.role === "user"
                  ? "ml-auto max-w-[85%] rounded-2xl bg-[var(--primary-blue)] px-3 py-2 text-xs font-semibold text-white"
                  : "mr-auto max-w-[85%] rounded-2xl border border-[var(--stroke)] bg-white px-3 py-2 text-xs text-[var(--navy-dark)]"
              }
            >
              {message.content}
            </div>
          ))
        )}
      </div>

      {error ? (
        <p className="mt-3 text-xs font-semibold text-[var(--secondary-purple)]">
          {error}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <textarea
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder="Ask the assistant..."
          rows={3}
          className="w-full resize-none rounded-2xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)]"
          aria-label="Chat input"
        />
        <button
          type="submit"
          disabled={status === "loading" || !input.trim()}
          className="w-full rounded-full bg-[var(--secondary-purple)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? "Sending..." : "Send"}
        </button>
      </form>
    </aside>
  );
};
