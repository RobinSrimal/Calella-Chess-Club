import type { AdminUserSummary, PublicUser } from "../../lib/browser-api";

const GENERIC_ERROR_MESSAGE = "Could not complete the request.";

const ENGLISH_ERROR_MESSAGES: Record<string, string> = {
  API_AUTH_REQUIRED: "Log in again.",
  API_AUTH_INVALID: "The session is not valid. Log in again.",
  API_FORBIDDEN: "You need admin access to manage users.",
  API_USER_NOT_FOUND: "Could not find that user.",
  API_VALIDATION_FAILED: "Check the selected filters or user action.",
  WEB_REQUEST_FAILED: "Could not connect to the server.",
};

export type AdminUserActionState = {
  canApprove: boolean;
  canReject: boolean;
  canRestore: boolean;
  canDisable: boolean;
};

export function sortedAdminUsers(users: AdminUserSummary[]): AdminUserSummary[] {
  return users.toSorted((left, right) => {
    const groupComparison = adminUserSortGroup(left) - adminUserSortGroup(right);
    if (groupComparison !== 0) {
      return groupComparison;
    }

    return right.updatedAt.localeCompare(left.updatedAt);
  });
}

export function adminUserActions(
  user: AdminUserSummary,
  currentAdminId: string,
): AdminUserActionState {
  if (user.accountStatus === "disabled") {
    return {
      canApprove: false,
      canReject: false,
      canRestore: false,
      canDisable: false,
    };
  }

  return {
    canApprove:
      user.membershipStatus === "pending" ||
      user.membershipStatus === "rejected" ||
      user.membershipStatus === "none",
    canReject: user.membershipStatus === "pending" || user.membershipStatus === "none",
    canRestore: user.membershipStatus === "rejected",
    canDisable: user.id !== currentAdminId,
  };
}

export function canUseAdminUsers(user: PublicUser | undefined): boolean {
  return user?.role === "admin";
}

export function messageForAdminUserErrorCode(code: string): string {
  return ENGLISH_ERROR_MESSAGES[code] ?? GENERIC_ERROR_MESSAGE;
}

function adminUserSortGroup(user: AdminUserSummary): number {
  if (user.accountStatus === "disabled") {
    return 4;
  }

  if (user.membershipStatus === "pending") {
    return 0;
  }

  if (user.membershipStatus === "none" || user.membershipStatus === "rejected") {
    return 1;
  }

  if (user.role === "admin") {
    return 3;
  }

  return 2;
}
