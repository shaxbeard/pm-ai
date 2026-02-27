"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  type CollisionDetection,
  useSensor,
  useSensors,
  rectIntersection,
  pointerWithin,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { ChatSidebar, type ChatMessage } from "@/components/ChatSidebar";
import { KanbanColumn } from "@/components/KanbanColumn";
import { KanbanCardPreview } from "@/components/KanbanCardPreview";
import { createId, moveCard, type BoardData } from "@/lib/kanban";

type AiChatResponse = {
  message: string;
  board: BoardData | null;
};

export const KanbanBoard = () => {
  const [board, setBoard] = useState<BoardData | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatStatus, setChatStatus] = useState<"idle" | "loading" | "error">(
    "idle"
  );
  const [chatError, setChatError] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const cardsById = useMemo(() => board?.cards ?? {}, [board]);

  const collisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args).filter(
      (collision) => collision.id !== args.active.id
    );
    const columnCollisions = pointerCollisions.filter(
      (collision) =>
        typeof collision.id === "string" && collision.id.startsWith("col-")
    );
    if (columnCollisions.length > 0) {
      return columnCollisions;
    }
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }

    const intersections = rectIntersection(args).filter(
      (collision) => collision.id !== args.active.id
    );
    return intersections;
  };

  const loadBoard = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const response = await fetch("/api/board");
      if (!response.ok) {
        throw new Error("Unable to load board.");
      }
      const data = (await response.json()) as BoardData;
      setBoard(data);
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unable to load board.");
    }
  }, []);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  const saveBoard = useCallback(async (nextBoard: BoardData) => {
    try {
      const response = await fetch("/api/board", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextBoard),
      });
      if (!response.ok) {
        throw new Error("Unable to save board.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save board.");
    }
  }, []);

  const updateBoard = useCallback(
    (updater: (prev: BoardData) => BoardData) => {
      setBoard((prev) => {
        if (!prev) {
          return prev;
        }
        const next = updater(prev);
        void saveBoard(next);
        return next;
      });
    },
    [saveBoard]
  );

  const applyBoardUpdate = useCallback(
    (nextBoard: BoardData) => {
      setBoard(nextBoard);
      void saveBoard(nextBoard);
    },
    [saveBoard]
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (!board) {
      return;
    }
    setActiveCardId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!board) {
      return;
    }
    const { active, over } = event;
    setActiveCardId(null);

    const activeId = active.id as string;
    const overId = over?.id as string | undefined;

    const resolvedOverId = (() => {
      if (overId && overId !== activeId) {
        return overId;
      }
      if (typeof document === "undefined") {
        return undefined;
      }
      const pointerEvent = event.activatorEvent as MouseEvent | PointerEvent;
      const clientX = pointerEvent?.clientX;
      const clientY = pointerEvent?.clientY;
      if (clientX == null || clientY == null) {
        return undefined;
      }
      const targetX = clientX + event.delta.x;
      const targetY = clientY + event.delta.y;
      const element = document.elementFromPoint(targetX, targetY);
      const columnElement = element?.closest<HTMLElement>("[data-column-id]");
      return columnElement?.dataset.columnId;
    })();

    if (!resolvedOverId || resolvedOverId === activeId) {
      return;
    }

    updateBoard((prev) => ({
      ...prev,
      columns: moveCard(prev.columns, activeId, resolvedOverId),
    }));
  };

  const handleRenameColumn = (columnId: string, title: string) => {
    updateBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((column) =>
        column.id === columnId ? { ...column, title } : column
      ),
    }));
  };

  const handleAddCard = (columnId: string, title: string, details: string) => {
    const id = createId("card");
    updateBoard((prev) => ({
      ...prev,
      cards: {
        ...prev.cards,
        [id]: { id, title, details: details || "No details yet." },
      },
      columns: prev.columns.map((column) =>
        column.id === columnId
          ? { ...column, cardIds: [...column.cardIds, id] }
          : column
      ),
    }));
  };

  const handleDeleteCard = (columnId: string, cardId: string) => {
    updateBoard((prev) => {
      return {
        ...prev,
        cards: Object.fromEntries(
          Object.entries(prev.cards).filter(([id]) => id !== cardId)
        ),
        columns: prev.columns.map((column) =>
          column.id === columnId
            ? {
                ...column,
                cardIds: column.cardIds.filter((id) => id !== cardId),
              }
            : column
        ),
      };
    });
  };

  const handleSendChat = useCallback(async () => {
    if (!board) {
      return;
    }
    const trimmed = chatInput.trim();
    if (!trimmed || chatStatus === "loading") {
      return;
    }

    setChatStatus("loading");
    setChatError("");
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: trimmed }]);

    const historySnapshot = chatMessages;

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: historySnapshot,
          board,
        }),
      });
      if (!response.ok) {
        throw new Error("Unable to reach assistant.");
      }
      const data = (await response.json()) as AiChatResponse;
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);
      if (data.board) {
        applyBoardUpdate(data.board);
      }
      setChatStatus("idle");
    } catch (err) {
      setChatStatus("error");
      setChatError(
        err instanceof Error ? err.message : "Unable to reach assistant."
      );
    }
  }, [applyBoardUpdate, board, chatInput, chatMessages, chatStatus]);

  const activeCard = activeCardId && board ? cardsById[activeCardId] : null;

  if (!board) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[720px] flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-medium text-[var(--gray-text)]">
          {status === "error" ? error || "Unable to load board." : "Loading..."}
        </p>
        {status === "error" ? (
          <button
            type="button"
            onClick={loadBoard}
            className="mt-4 rounded-full border border-[var(--stroke)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--navy-dark)]"
          >
            Retry
          </button>
        ) : null}
      </main>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] -translate-x-1/3 -translate-y-1/3 rounded-full bg-[radial-gradient(circle,_rgba(32,157,215,0.25)_0%,_rgba(32,157,215,0.05)_55%,_transparent_70%)]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[520px] w-[520px] translate-x-1/4 translate-y-1/4 rounded-full bg-[radial-gradient(circle,_rgba(117,57,145,0.18)_0%,_rgba(117,57,145,0.05)_55%,_transparent_75%)]" />

      <main className="relative mx-auto flex min-h-screen max-w-[1500px] flex-col gap-10 px-6 pb-16 pt-12">
        <header className="flex flex-col gap-6 rounded-[32px] border border-[var(--stroke)] bg-white/80 p-8 shadow-[var(--shadow)] backdrop-blur">
          {error ? (
            <div className="rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm text-[var(--secondary-purple)]">
              {error}
            </div>
          ) : null}
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--gray-text)]">
                Single Board Kanban
              </p>
              <h1 className="mt-3 font-display text-4xl font-semibold text-[var(--navy-dark)]">
                Kanban Studio
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--gray-text)]">
                Keep momentum visible. Rename columns, drag cards between stages,
                and capture quick notes without getting buried in settings.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--stroke)] bg-[var(--surface)] px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--gray-text)]">
                Focus
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--primary-blue)]">
                One board. Five columns. Zero clutter.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {board.columns.map((column) => (
              <div
                key={column.id}
                className="flex items-center gap-2 rounded-full border border-[var(--stroke)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--navy-dark)]"
              >
                <span className="h-2 w-2 rounded-full bg-[var(--accent-yellow)]" />
                {column.title}
              </div>
            ))}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,_1fr)_320px]">
          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <section className="grid gap-6 lg:grid-cols-5">
              {board.columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  cards={column.cardIds.map((cardId) => board.cards[cardId])}
                  onRename={handleRenameColumn}
                  onAddCard={handleAddCard}
                  onDeleteCard={handleDeleteCard}
                />
              ))}
            </section>
            <DragOverlay>
              {activeCard ? (
                <div className="w-[260px]">
                  <KanbanCardPreview card={activeCard} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
          <ChatSidebar
            messages={chatMessages}
            input={chatInput}
            status={chatStatus}
            error={chatError}
            onInputChange={setChatInput}
            onSend={handleSendChat}
          />
        </div>
      </main>
    </div>
  );
};
