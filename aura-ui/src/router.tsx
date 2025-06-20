import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import { LoginForm } from "./pages/Login";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./routes/ProtectedRoute";
import RegisterForm from "./pages/Register";
import MoodHistory from "./components/history/MoodHistory";
import MoodEntryForm from "./components/MoodEntryForm";
import HomePage from "./pages/Home";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />, // ✅ Public wrapper for all pages
    children: [
      { index: true, element: <HomePage /> }, // ✅ Public Home at "/"
      { path: "home", element: <HomePage /> },
      { path: "login", element: <LoginForm /> },
      { path: "register", element: <RegisterForm /> },
      { path: "*", element: <NotFound /> },

      // 👇 Protected children nested inside ProtectedRoute
      {
        element: <ProtectedRoute />,
        children: [
          { path: "dashboard", element: <Dashboard /> },
          { path: "log-mood", element: <MoodEntryForm /> },
          { path: "history", element: <MoodHistory /> },
        ],
      },
    ],
  },
]);
