import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useGetCurrentUserQuery } from "@/store/authApi";

/**
 * Sends signed-in users whose profile reports `onboardingCompleted === false` to /onboarding (#342),
 * and keeps finished users out of it. Profiles from older APIs omit the flag and are left alone.
 */
export default function OnboardingGate() {
  const { pathname } = useLocation();
  const { data: profile } = useGetCurrentUserQuery();
  const onOnboarding = pathname.startsWith("/onboarding");
  if (profile?.onboardingCompleted === false && !onOnboarding) return <Navigate to="/onboarding" replace />;
  if (profile?.onboardingCompleted === true && onOnboarding) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
