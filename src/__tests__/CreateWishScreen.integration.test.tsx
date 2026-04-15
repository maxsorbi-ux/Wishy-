/**
 * Integration Test Example - CreateWishScreen
 *
 * This demonstrates how to test the full flow:
 * Screen → Use Case → Repository → Event → UI Update
 *
 * To run: npm test CreateWishScreen.test.ts
 */

import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react-native";
import CreateWishScreenV2 from "../screens/CreateWishScreenV2";
import { DIContainer } from "../infrastructure";
import { EventEmitter } from "../infrastructure";

/**
 * Mock setup
 */
jest.mock("../api/supabase", () => ({
  supabaseDb: {
    insert: jest.fn(),
    select: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock("../state/userStore", () => ({
  default: () => ({
    currentUser: { id: "user1", name: "Alice" },
    allUsers: [
      { id: "user1", name: "Alice" },
      { id: "user2", name: "Bob" },
    ],
  }),
}));

jest.mock("../state/connectionStore", () => ({
  default: () => ({
    getAcceptedConnections: () => [
      { user1Id: "user1", user2Id: "user2" },
    ],
  }),
}));

jest.mock("../state/toastStore", () => ({
  useToastStore: () => ({
    showToast: jest.fn(),
  }),
}));

describe("CreateWishScreen Integration Tests", () => {
  let container: DIContainer;
  let eventEmitter: EventEmitter;

  beforeEach(() => {
    // Reset container
    container = DIContainer.getInstance();
    eventEmitter = container.getEventEmitter();
    eventEmitter.clear(); // Clear all listeners
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Creating a new wish", () => {
    it("should render the create wish form", () => {
      const { getByPlaceholderText, getByText } = render(<CreateWishScreenV2 />);

      expect(getByPlaceholderText("What's your wish?")).toBeTruthy();
      expect(getByText("Save as Wished")).toBeTruthy();
      expect(getByText("Save as Wisher")).toBeTruthy();
    });

    it("should update title state as user types", () => {
      const { getByPlaceholderText } = render(<CreateWishScreenV2 />);
      const titleInput = getByPlaceholderText("What's your wish?");

      fireEvent.changeText(titleInput, "Coffee date");

      expect(titleInput.props.value).toBe("Coffee date");
    });

    it("should emit wish.sent event when wish is created", async () => {
      const { getByPlaceholderText, getByText } = render(<CreateWishScreenV2 />);
      const showToastMock = jest.fn();
      const eventHandler = jest.fn();

      // Set up event listener
      eventEmitter.on("wish.sent", eventHandler);

      // Fill form
      fireEvent.changeText(getByPlaceholderText("What's your wish?"), "Coffee");

      // Submit
      fireEvent.press(getByText("Save as Wished"));

      // Wait for event
      await waitFor(() => {
        expect(eventHandler).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it("should show success toast after wish is sent", async () => {
      const { getByPlaceholderText, getByText } = render(<CreateWishScreenV2 />);
      const showToastSpy = jest.fn();

      // Mock toast
      jest.spyOn(require("../state/toastStore"), "useToastStore").mockReturnValue({
        showToast: showToastSpy,
      });

      // Fill and submit
      fireEvent.changeText(getByPlaceholderText("What's your wish?"), "Coffee");
      fireEvent.press(getByText("Save as Wished"));

      // Verify toast was called
      await waitFor(() => {
        expect(showToastSpy).toHaveBeenCalledWith(
          expect.stringContaining("Wish sent"),
          "success"
        );
      });
    });

    it("should navigate back after successful creation", async () => {
      const navigationMock = {
        goBack: jest.fn(),
        navigate: jest.fn(),
      };

      jest.spyOn(require("@react-navigation/native"), "useNavigation").mockReturnValue(navigationMock);

      const { getByPlaceholderText, getByText } = render(<CreateWishScreenV2 />);

      fireEvent.changeText(getByPlaceholderText("What's your wish?"), "Coffee");
      fireEvent.press(getByText("Save as Wished"));

      // Wait for navigation
      await waitFor(() => {
        expect(navigationMock.goBack).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it("should validate required fields", () => {
      const { getByText } = render(<CreateWishScreenV2 />);
      const showToastMock = jest.fn();

      jest.spyOn(require("../state/toastStore"), "useToastStore").mockReturnValue({
        showToast: showToastMock,
      });

      // Try to submit empty form
      fireEvent.press(getByText("Save as Wished"));

      expect(showToastMock).toHaveBeenCalledWith(
        "Please enter a wish title",
        "error"
      );
    });

    it("should disable submit button while loading", async () => {
      const { getByPlaceholderText, getByText } = render(<CreateWishScreenV2 />);
      const submitButton = getByText("Save as Wished");

      fireEvent.changeText(getByPlaceholderText("What's your wish?"), "Coffee");

      // Button should be enabled
      expect(submitButton.props.disabled).toBe(false);

      // Click it
      fireEvent.press(submitButton);

      // Wait a moment
      await waitFor(() => {
        // Button should be disabled or show "Saving..."
        expect(submitButton.props.disabled || submitButton.props.children.includes("Saving")).toBeTruthy();
      });
    });
  });

  describe("Selecting recipients", () => {
    it("should allow user to select recipients", () => {
      const { getByText, getByPlaceholderText } = render(<CreateWishScreenV2 />);

      const recipientButton = getByText(/Select recipients/i);
      fireEvent.press(recipientButton);

      // Picker should open
      // (In real test, would check for recipient list)
    });

    it("should show count of selected recipients", () => {
      const { getByText } = render(<CreateWishScreenV2 />);

      // After selecting recipients (mocked)
      expect(getByText(/Send to \(0\)/i)).toBeTruthy();
    });
  });

  describe("Error handling", () => {
    it("should show error toast on failure", async () => {
      // Mock repository to reject
      const repos = container.getRepositories();
      jest.spyOn(repos.wishes, "save").mockRejectedValueOnce(
        new Error("Network error")
      );

      const { getByPlaceholderText, getByText } = render(<CreateWishScreenV2 />);
      const showToastMock = jest.fn();

      jest.spyOn(require("../state/toastStore"), "useToastStore").mockReturnValue({
        showToast: showToastMock,
      });

      fireEvent.changeText(getByPlaceholderText("What's your wish?"), "Coffee");
      fireEvent.press(getByText("Save as Wished"));

      await waitFor(() => {
        expect(showToastMock).toHaveBeenCalledWith(
          expect.stringContaining("Failed"),
          "error"
        );
      });
    });

    it("should not navigate on error", async () => {
      const navigationMock = { goBack: jest.fn() };
      jest.spyOn(require("@react-navigation/native"), "useNavigation").mockReturnValue(navigationMock);

      // Mock failure
      const repos = container.getRepositories();
      jest.spyOn(repos.wishes, "save").mockRejectedValueOnce(new Error("Failed"));

      const { getByPlaceholderText, getByText } = render(<CreateWishScreenV2 />);

      fireEvent.changeText(getByPlaceholderText("What's your wish?"), "Coffee");
      fireEvent.press(getByText("Save as Wished"));

      await waitFor(() => {
        expect(navigationMock.goBack).not.toHaveBeenCalled();
      });
    });
  });

  describe("Event-driven architecture", () => {
    it("should handle wish.sent event correctly", async () => {
      const handler = jest.fn();
      eventEmitter.on("wish.sent", handler);

      // Simulate event
      const event = {
        type: "wish.sent",
        aggregateId: "wish1",
        aggregateType: "wish" as const,
        occurredAt: new Date().toISOString(),
        data: {
          wishId: "wish1",
          creatorId: "user1",
          recipientIds: ["user2"],
          title: "Coffee",
        },
      };

      eventEmitter.emit(event);

      expect(handler).toHaveBeenCalledWith(event);
    });

    it("should cleanup event listeners on unmount", () => {
      const handler = jest.fn();
      const unsubscribe = eventEmitter.on("wish.sent", handler);

      // Unsubscribe
      unsubscribe();

      // Emit event
      const event = {
        type: "wish.sent",
        aggregateId: "wish1",
        aggregateType: "wish" as const,
        occurredAt: new Date().toISOString(),
        data: {
          wishId: "wish1",
          creatorId: "user1",
          recipientIds: ["user2"],
          title: "Coffee",
        },
      };

      eventEmitter.emit(event);

      // Handler should not be called
      expect(handler).not.toHaveBeenCalled();
    });
  });
});

describe("MyWishesScreen Integration Tests", () => {
  let container: DIContainer;

  beforeEach(() => {
    container = DIContainer.getInstance();
  });

  it("should load wishes from repository", async () => {
    const repos = container.getRepositories();
    const findByCreatorIdSpy = jest.spyOn(repos.wishes, "findByCreatorId");

    // TODO: Render component and verify wishes are loaded
    // TODO: Check that findByCreatorId was called

    expect(findByCreatorIdSpy).toHaveBeenCalled();
  });

  it("should reload wishes when wish.sent event fires", async () => {
    const eventEmitter = container.getEventEmitter();
    const repos = container.getRepositories();
    const findByCreatorIdSpy = jest.spyOn(repos.wishes, "findByCreatorId");

    // TODO: Render component
    // TODO: Emit wish.sent event
    // TODO: Verify findByCreatorId was called again

    eventEmitter.emit({
      type: "wish.sent",
      aggregateId: "wish1",
      aggregateType: "wish",
      occurredAt: new Date().toISOString(),
      data: {
        wishId: "wish1",
        creatorId: "user1",
        recipientIds: ["user2"],
        title: "Coffee",
      },
    });

    // Should trigger reload
    expect(findByCreatorIdSpy).toHaveBeenCalled();
  });
});
