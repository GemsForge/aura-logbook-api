import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./routes/ProtectedRoute";

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
    element: <Login />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
