import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import { LoginForm } from "./pages/Login";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./routes/ProtectedRoute";
import OnboardingGate from "./routes/OnboardingGate";
import Onboarding from "./pages/Onboarding";
import RegisterForm from "./pages/Register";
import MoodHistory from "./components/history/MoodHistory";
import MoodEntryForm from "./components/MoodEntryForm";
import HomePage from "./pages/Home";
import MediaGallery from "./pages/MediaGallery";
import Insights from "./pages/Insights";
import ReflectionRead from "./pages/ReflectionRead";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Pathways from "./pages/Pathways";
import GuidedPrayer from "./pages/GuidedPrayer";
import BreathingTimer from "./pages/pathways/BreathingTimer";
import { passwordResetEnabled } from "./features/auth/models/PasswordResetSchema";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />, // ✅ Public wrapper for all pages
    children: [
      { index: true, element: <HomePage /> }, // ✅ Public Home at "/"
      { path: "home", element: <HomePage /> },
      { path: "login", element: <LoginForm /> },
      { path: "register", element: <RegisterForm /> },
      // Account recovery (#329) is only routed while the API can deliver reset email.
      ...(passwordResetEnabled
        ? [
            { path: "forgot-password", element: <ForgotPassword /> },
            { path: "reset-password", element: <ResetPassword /> },
          ]
        : []),
      { path: "*", element: <NotFound /> },

      // 👇 Protected children nested inside ProtectedRoute
      {
        element: <ProtectedRoute />,
        children: [
          {
            // #342: pending onboarding redirects here before any other signed-in page.
            element: <OnboardingGate />,
            children: [
              { path: "onboarding", element: <Onboarding /> },
              { path: "dashboard", element: <Dashboard /> },
              { path: "log-mood", element: <MoodEntryForm /> },
              { path: "history", element: <MoodHistory /> },
              // Full-page reading view for one reflection.
              { path: "history/:id", element: <ReflectionRead /> },
              { path: "gallery", element: <MediaGallery /> },
              { path: "insights", element: <Insights /> },
              // #385: selected pathway modules, plus the shared #386 breathing guide.
              { path: "pathways", element: <Pathways /> },
              { path: "pathways/:moduleKey", element: <Pathways /> },
              { path: "pathways/breathing", element: <BreathingTimer /> },
              { path: "guided-prayer", element: <GuidedPrayer /> },
            ],
          },
        ],
      },
    ],
  },
]);
