import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import { LoginForm } from "./pages/Login";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./routes/ProtectedRoute";
import RegisterForm from "./pages/Register";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <ProtectedRoute />, // 👈 Protect everything inside here
    children: [
      {
        element: <AppLayout />, // 👈 Layout wraps protected content
        children: [
          { path: "dashboard", element: <Dashboard /> },
          // Add more protected routes here
        ],
      },
    ],
  },
  {
    path: "login",
    element: <LoginForm />,
  },
  {
    path: "register",
    element: <RegisterForm />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
