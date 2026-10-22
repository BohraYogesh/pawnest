import { useQuery } from "@tanstack/react-query";
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { LoaderCircle, PawPrint } from "lucide-react";

import AdminLayout from "../components/layout/AdminLayout";
import DashboardPage from "../features/dashboard/DashboardPage";
import LoginPage from "../features/auth/LoginPage";
import { getCurrentUser } from "../features/auth/auth.api";
import ProductsPage from "../features/products/ProductsPage";
import CategoriesPage from "../features/categories/CategoriesPage";
import AddProductPage from "../features/products/AddProductPage";
import UsersPage from "../features/users/UsersPage";
import ReviewsPage from "../features/reviews/ReviewsPage";
import OrdersPage from "../features/orders/OrdersPage";
import OrderDetailsPage from "../features/orders/OrderDetailsPage";
import NotificationsPage from "../features/notifications/NotificationsPage";
import ProfilePage from "../features/profile/ProfilePage";
import SettingsPage from "../features/settings/SettingsPage";

function AuthGuard() {
  const location = useLocation();

  const {
    data: user,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getCurrentUser,
    retry: false,
  });

  if (isPending) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F5F7F5]">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#295F4C] text-white">
          <PawPrint size={28} />
        </div>
        <LoaderCircle size={24} className="animate-spin text-[#49866E]" />
        <p className="text-sm text-slate-500">Checking your admin session...</p>
      </div>
    );
  }

  if (isError || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user.role !== "ADMIN") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function NotFoundPage() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <h1 className="text-xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500">
        The page you&apos;re looking for doesn&apos;t exist yet.
      </p>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    element: <AuthGuard />,
    children: [
      {
        path: "/",
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          { path: "products", element: <ProductsPage /> },
          { path: "products/new", element: <AddProductPage /> },
          {
            path: "products/:productId/edit",
            element: <AddProductPage />,
          },
          { path: "categories", element: <CategoriesPage /> },
          { path: "orders", element: <OrdersPage /> },
          { path: "orders/:orderId", element: <OrderDetailsPage /> },
          { path: "users", element: <UsersPage /> },
          { path: "reviews", element: <ReviewsPage /> },
          {
            path: "notifications",
            element: <NotificationsPage />,
          },
          {
            path: "profile",
            element: <ProfilePage />,
          },
          {
            path: "settings",
            element: <SettingsPage />,
          },
          {
            path: "*",
            element: <NotFoundPage />,
          },
        ],
      },
    ],
  },
]);
