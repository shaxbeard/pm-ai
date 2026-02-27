import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { KanbanBoard } from "@/components/KanbanBoard";
import { initialData } from "@/lib/kanban";

const getFirstColumn = () => screen.getAllByTestId(/column-/i)[0];
const updatedBoard = {
  ...initialData,
  columns: initialData.columns.map((column, index) =>
    index === 0 ? { ...column, title: "Next Up" } : column
  ),
};

describe("KanbanBoard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn().mockImplementation((input, init) => {
      const url = typeof input === "string" ? input : input.url;
      if (url.includes("/api/ai/chat")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ message: "Done", board: updatedBoard }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          )
        );
      }
      const method = (init?.method ?? "GET").toUpperCase();
      const body =
        method === "PUT" && init?.body
          ? JSON.parse(init.body as string)
          : initialData;
      return Promise.resolve(
        new Response(JSON.stringify(body), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    }) as unknown as typeof fetch;
  });

  it("renders five columns", () => {
    render(<KanbanBoard />);
    return screen
      .findAllByTestId(/column-/i)
      .then((columns) => expect(columns).toHaveLength(5));
  });

  it("renames a column", async () => {
    render(<KanbanBoard />);
    await screen.findAllByTestId(/column-/i);
    const column = getFirstColumn();
    const input = within(column).getByLabelText("Column title");
    await userEvent.clear(input);
    await userEvent.type(input, "New Name");
    expect(input).toHaveValue("New Name");
  });

  it("adds and removes a card", async () => {
    render(<KanbanBoard />);
    await screen.findAllByTestId(/column-/i);
    const column = getFirstColumn();
    const addButton = within(column).getByRole("button", {
      name: /add a card/i,
    });
    await userEvent.click(addButton);

    const titleInput = within(column).getByPlaceholderText(/card title/i);
    await userEvent.type(titleInput, "New card");
    const detailsInput = within(column).getByPlaceholderText(/details/i);
    await userEvent.type(detailsInput, "Notes");

    await userEvent.click(within(column).getByRole("button", { name: /add card/i }));

    expect(within(column).getByText("New card")).toBeInTheDocument();

    const deleteButton = within(column).getByRole("button", {
      name: /delete new card/i,
    });
    await userEvent.click(deleteButton);

    expect(within(column).queryByText("New card")).not.toBeInTheDocument();
  });

  it("sends chat and applies board updates", async () => {
    render(<KanbanBoard />);
    await screen.findAllByTestId(/column-/i);

    const input = screen.getByPlaceholderText(/ask the assistant/i);
    await userEvent.type(input, "Rename backlog to next up");
    await userEvent.click(screen.getByRole("button", { name: /send/i }));

    // "Done" appears twice: once as a column header pill, once as the AI chat reply
    expect(await screen.findAllByText("Done")).toHaveLength(2);
    expect(screen.getByDisplayValue("Next Up")).toBeInTheDocument();
  });
});
