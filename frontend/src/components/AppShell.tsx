"use client";

import { useEffect, useState, type FormEvent } from "react";
import { KanbanBoard } from "@/components/KanbanBoard";

const AUTH_KEY = "pm-auth";
const VALID_USERNAME = "user";
const VALID_PASSWORD = "password";

const readAuthState = () => {
  if (typeof window === "undefined") {
    return false;
  }
  return window.localStorage.getItem(AUTH_KEY) == "true";
};

type FormState = {
  username: string;
  password: string;
};

const initialFormState: FormState = { username: "", password: "" };

export const AppShell = () => {
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setIsAuthed(readAuthState());
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isValid =
      formState.username.trim() === VALID_USERNAME &&
      formState.password === VALID_PASSWORD;

    if (!isValid) {
      setError("Invalid credentials.");
      return;
    }
    window.localStorage.setItem(AUTH_KEY, "true");
    setIsAuthed(true);
    setFormState(initialFormState);
    setError("");
  };

  const handleLogout = () => {
    window.localStorage.removeItem(AUTH_KEY);
    setIsAuthed(false);
  };

  if (isAuthed === null) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[680px] items-center justify-center px-6">
        <p className="text-sm font-medium text-[var(--gray-text)]">Loading...</p>
      </main>
    );
  }

  if (!isAuthed) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[680px] flex-col justify-center px-6">
        <section className="rounded-[28px] border border-[var(--stroke)] bg-white/90 p-8 shadow-[var(--shadow)]">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--gray-text)]">
            Sign in
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold text-[var(--navy-dark)]">
            Project Management MVP
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--gray-text)]">
            Use the demo credentials to access the Kanban board.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                value={formState.username}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    username: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm font-medium text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)]"
                autoComplete="username"
                required
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formState.password}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    password: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm font-medium text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)]"
                autoComplete="current-password"
                required
              />
            </div>
            {error ? (
              <p className="text-sm font-medium text-[var(--secondary-purple)]">
                {error}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="rounded-full bg-[var(--secondary-purple)] px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:brightness-110"
              >
                Sign in
              </button>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]">
                user / password
              </p>
            </div>
          </form>
        </section>
      </main>
    );
  }

  return (
    <div className="relative">
      <div className="absolute right-6 top-6 z-10">
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-[var(--stroke)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--navy-dark)] shadow-[var(--shadow)] transition hover:border-[var(--primary-blue)]"
        >
          Log out
        </button>
      </div>
      <KanbanBoard />
    </div>
  );
};
