import { render, screen } from "@testing-library/react";
import LoadingSpinner from "../LoadingSpinner";

describe("LoadingSpinner", () => {
  test("renders with default props", () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole("status", { hidden: true });
    expect(spinner).toBeInTheDocument();
  });

  test("renders with text", () => {
    render(<LoadingSpinner text="加载中..." />);
    expect(screen.getByText("加载中...")).toBeInTheDocument();
  });

  test("renders small size", () => {
    const { container } = render(<LoadingSpinner size="sm" />);
    const spinner = container.querySelector(".h-4.w-4");
    expect(spinner).toBeInTheDocument();
  });

  test("renders large size", () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    const spinner = container.querySelector(".h-12.w-12");
    expect(spinner).toBeInTheDocument();
  });

  test("renders inline mode", () => {
    const { container } = render(<LoadingSpinner inline />);
    const span = container.querySelector("span");
    expect(span).toHaveClass("flex", "items-center", "justify-center");
  });

  test("renders fullscreen mode", () => {
    const { container } = render(
      <LoadingSpinner fullScreen text="加载中..." />,
    );
    const fullscreenDiv = container.querySelector(".fixed.inset-0");
    expect(fullscreenDiv).toBeInTheDocument();
    expect(screen.getByText("加载中...")).toBeInTheDocument();
  });

  test("applies custom className", () => {
    const { container } = render(<LoadingSpinner className="custom-class" />);
    const div = container.querySelector(".custom-class");
    expect(div).toBeInTheDocument();
  });
});
