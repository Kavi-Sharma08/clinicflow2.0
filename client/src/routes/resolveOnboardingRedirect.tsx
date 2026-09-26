import type { User } from "../context/UserContext";

export type OnboardingDecision =
  | { action: "allow" }
  | { action: "redirect"; to: string };


export const resolveOnboardingRedirect = (
  user: User,
  destination: "dashboard" | "verification" | "status"
): OnboardingDecision => {
  if (user.role !== "DOCTOR") {
    if (destination === "dashboard") {
      return { action: "allow" };
    }
    return { action: "redirect", to: `/${user.role.toLowerCase()}/dashboard/${user.id}` };
  }

  const status = user.verificationStatus ?? "NOT_SUBMITTED";

  switch (status) {
    case "NOT_SUBMITTED":
      return destination === "verification"
        ? { action: "allow" }
        : { action: "redirect", to: "/onboarding/verification" };

    case "PENDING":
      return destination === "status"
        ? { action: "allow" }
        : { action: "redirect", to: "/onboarding/status" };

    case "REJECTED":
      return destination === "dashboard"
        ? { action: "redirect", to: "/onboarding/status" }
        : { action: "allow" };

    case "VERIFIED":
      return destination === "dashboard"
        ? { action: "allow" }
        : { action: "redirect", to: `/doctor/dashboard/${user.id}` };

    default:
      return { action: "redirect", to: "/onboarding/status" };
  }
};

export const getRoleDefaultPath = (user: User): string => {
  if (user.role === "ADMIN") {
    return "/admin";
  }
  if (user.role === "PATIENT") {
    return `/patient/dashboard/${user.id}`;
  }
  if (user.role === "DOCTOR") {
    const decision = resolveOnboardingRedirect(user, "dashboard");
    if (decision.action === "redirect") {
      return decision.to;
    }
    return `/doctor/dashboard/${user.id}`;
  }
  return "/login";
};