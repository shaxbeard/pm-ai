# Frontend

Next.js App Router frontend that renders a single-board Kanban demo.

Key files
- src/app/layout.tsx: App layout, metadata, and font setup
- src/app/page.tsx: Renders the Kanban board
- src/app/globals.css: Theme variables and base styles
- src/components/KanbanBoard.tsx: Board state, drag/drop wiring, and column/card handlers
- src/components/KanbanColumn.tsx: Column UI with editable title and card list
- src/components/KanbanCard.tsx: Sortable card UI with delete action
- src/components/KanbanCardPreview.tsx: Drag overlay card preview
- src/components/NewCardForm.tsx: Add-card form and open/close behavior
- src/lib/kanban.ts: Types, initial data, and card movement helpers

Tests
- src/components/KanbanBoard.test.tsx
- src/lib/kanban.test.ts
- tests/kanban.spec.ts (Playwright)
