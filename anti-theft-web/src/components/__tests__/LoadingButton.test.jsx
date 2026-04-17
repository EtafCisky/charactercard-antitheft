import { fireEvent, render, screen } from "@testing-library/react";
import LoadingButton from "../LoadingButton";

describe("LoadingButton", () => {
  test("renders children when not loading", () => {
    render(<LoadingButton>提交</LoadingButton>);
    expect(screen.getByText("提交")).toBeInTheDocument();
  });

  test("shows loading state", () => {
    render(<LoadingButton loading={true}>提交</LoadingButton>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveClass("cursor-not-allowed", "opacity-75");
  });

  test("shows custom loading text", () => {
    render(
      <LoadingButton loading={true} loadingText="提交中...">
        提交
      </LoadingButton>,
    );
    expect(screen.getByText("提交中...")).toBeInTheDocument();
  });

  test("is disabled when loading", () => {
    render(<LoadingButton loading={true}>提交</LoadingButton>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  test("is disabled when disabled prop is true", () => {
    render(<LoadingButton disabled={true}>提交</LoadingButton>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  test("calls onClick when clicked and not loading", () => {
    const handleClick = jest.fn();
    render(<LoadingButton onClick={handleClick}>提交</LoadingButton>);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test("does not call onClick when loading", () => {
    const handleClick = jest.fn();
    render(
      <LoadingButton loading={true} onClick={handleClick}>
        提交
      </LoadingButton>,
    );
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  test("applies custom className", () => {
    render(<LoadingButton className="custom-class">提交</LoadingButton>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
  });

  test("supports different button types", () => {
    render(<LoadingButton type="submit">提交</LoadingButton>);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("type", "submit");
  });

  test("passes through additional props", () => {
    render(
      <LoadingButton data-testid="test-button" aria-label="提交按钮">
        提交
      </LoadingButton>,
    );
    const button = screen.getByTestId("test-button");
    expect(button).toHaveAttribute("aria-label", "提交按钮");
  });
});
