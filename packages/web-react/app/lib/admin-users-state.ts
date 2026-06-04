import type { AdminUserSummary } from "./account-api";

export type AdminUserActionKind =
  | "approve-membership"
  | "reject-membership"
  | "restore-membership"
  | "disable";

export function sortAdminUsers(users: AdminUserSummary[]) {
  return [...users].sort((left, right) => {
    const leftRank = adminUserRank(left);
    const rightRank = adminUserRank(right);
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return left.username.localeCompare(right.username);
  });
}

export function visibleAdminUserActions(
  user: AdminUserSummary,
  currentUserId: string,
): AdminUserActionKind[] {
  if (user.accountStatus === "disabled") {
    return [];
  }

  const actions: AdminUserActionKind[] = [];
  if (user.membershipStatus === "pending") {
    actions.push("approve-membership", "reject-membership");
  }
  if (user.membershipStatus === "rejected") {
    actions.push("restore-membership");
  }
  if (user.id !== currentUserId) {
    actions.push("disable");
  }

  return actions;
}

export function messageForAdminUserErrorCode(code: string) {
  const messages: Record<string, string> = {
    API_AUTH_REQUIRED: "Log in before using the admin area.",
    API_AUTH_INVALID: "Your session has expired. Log in again.",
    API_FORBIDDEN: "Only active admins can manage users.",
    API_USER_NOT_FOUND: "The selected user no longer exists.",
    API_VALIDATION_FAILED: "The request contains invalid filter values.",
    NETWORK_ERROR: "Network error. Check your connection and try again.",
  };

  return messages[code] ?? "Unexpected admin user error.";
}

function adminUserRank(user: AdminUserSummary) {
  if (user.accountStatus === "disabled") {
    return 5;
  }
  if (user.role === "admin") {
    return 4;
  }
  if (user.membershipStatus === "pending") {
    return 0;
  }
  if (user.membershipStatus === "none") {
    return 1;
  }
  if (user.membershipStatus === "rejected") {
    return 2;
  }

  return 3;
}
