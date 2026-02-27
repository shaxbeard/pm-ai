import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { ChatSidebar, type ChatMessage } from "@/components/ChatSidebar";

const noop = () => {};

describe("ChatSidebar", () => {
  it("shows empty state when no messages", () => {
    render(
      <ChatSidebar
        messages={[]}
        input=""
        status="idle"
        error=""
        onInputChange={noop}
        onSend={noop}
      />
    );
    expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
  });

  it("renders user and assistant messages", () => {
    const messages: ChatMessage[] = [
      { role: "user", content: "Move card to done" },
      { role: "assistant", content: "Done! Card moved." },
    ];
    render(
      <ChatSidebar
        messages={messages}
        input=""
        status="idle"
        error=""
        onInputChange={noop}
        onSend={noop}
      />
    );
    expect(screen.getByText("Move card to done")).toBeInTheDocument();
    expect(screen.getByText("Done! Card moved.")).toBeInTheDocument();
  });

  it("calls onInputChange when typing", async () => {
    const onInputChange = vi.fn();
    render(
      <ChatSidebar
        messages={[]}
        input=""
        status="idle"
        error=""
        onInputChange={onInputChange}
        onSend={noop}
      />
    );
    await userEvent.type(screen.getByLabelText(/chat input/i), "hello");
    expect(onInputChange).toHaveBeenCalled();
  });

  it("calls onSend when form is submitted", async () => {
    const onSend = vi.fn();
    render(
      <ChatSidebar
        messages={[]}
        input="hello"
        status="idle"
        error=""
        onInputChange={noop}
        onSend={onSend}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: /send/i }));
    expect(onSend).toHaveBeenCalledOnce();
  });

  it("disables send button while loading", () => {
    render(
      <ChatSidebar
        messages={[]}
        input="hello"
        status="loading"
        error=""
        onInputChange={noop}
        onSend={noop}
      />
    );
    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();
  });

  it("disables send button when input is empty", () => {
    render(
      <ChatSidebar
        messages={[]}
        input=""
        status="idle"
        error=""
        onInputChange={noop}
        onSend={noop}
      />
    );
    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
  });

  it("shows error message when error is set", () => {
    render(
      <ChatSidebar
        messages={[]}
        input=""
        status="error"
        error="Unable to reach assistant."
        onInputChange={noop}
        onSend={noop}
      />
    );
    expect(screen.getByText("Unable to reach assistant.")).toBeInTheDocument();
  });
});
