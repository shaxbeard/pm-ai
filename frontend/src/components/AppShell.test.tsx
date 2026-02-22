import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "@/components/AppShell";

describe("AppShell", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the sign-in screen when logged out", async () => {
    render(<AppShell />);
    expect(await screen.findByRole("heading", { name: /project management mvp/i }))
      .toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /kanban studio/i })
    ).not.toBeInTheDocument();
  });

  it("logs in with valid credentials", async () => {
    render(<AppShell />);
    const usernameInput = await screen.findByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await userEvent.type(usernameInput, "user");
    await userEvent.type(passwordInput, "password");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByRole("heading", { name: /kanban studio/i })
    ).toBeInTheDocument();
  });

  it("logs out and returns to sign-in", async () => {
    render(<AppShell />);
    const usernameInput = await screen.findByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await userEvent.type(usernameInput, "user");
    await userEvent.type(passwordInput, "password");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await userEvent.click(
      await screen.findByRole("button", { name: /log out/i })
    );

    expect(
      await screen.findByRole("heading", { name: /project management mvp/i })
    ).toBeInTheDocument();
  });
});
