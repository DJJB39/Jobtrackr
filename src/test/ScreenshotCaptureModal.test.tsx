/**
 * Test: ScreenshotCaptureModal — rendering, file upload, extraction flow
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders, createMockJob } from "./test-utils";
import ScreenshotCaptureModal from "@/components/ScreenshotCaptureModal";

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn(() => Promise.resolve({
        data: { session: { access_token: "test-token", user: { id: "user-1" } } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "new-job-1" }, error: null }),
    })),
  },
}));

vi.mock("@/integrations/lovable/index", () => ({
  lovable: { auth: { signInWithOAuth: vi.fn() } },
}));

describe("ScreenshotCaptureModal", () => {
  it("renders upload zone when open", () => {
    renderWithProviders(
      <ScreenshotCaptureModal open={true} onOpenChange={() => {}} />
    );
    expect(screen.getByText(/drop a screenshot here/i)).toBeInTheDocument();
  });

  it("shows privacy disclaimer", () => {
    renderWithProviders(
      <ScreenshotCaptureModal open={true} onOpenChange={() => {}} />
    );
    expect(screen.getByText(/processed privately/i)).toBeInTheDocument();
  });

  it("shows supported file format badges", () => {
    renderWithProviders(
      <ScreenshotCaptureModal open={true} onOpenChange={() => {}} />
    );
    expect(screen.getByText("PNG")).toBeInTheDocument();
    expect(screen.getByText("JPG")).toBeInTheDocument();
    expect(screen.getByText("WebP")).toBeInTheDocument();
  });

  it("shows paste hint", () => {
    renderWithProviders(
      <ScreenshotCaptureModal open={true} onOpenChange={() => {}} />
    );
    expect(screen.getByText(/paste from clipboard/i)).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    const { container } = renderWithProviders(
      <ScreenshotCaptureModal open={false} onOpenChange={() => {}} />
    );
    expect(container.querySelector("[role='dialog']")).toBeNull();
  });
});
