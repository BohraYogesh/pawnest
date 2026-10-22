import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "../config/env";
import { errorHandler, notFound } from "../middleware/errorHandler";
import authRoutes from "../modules/auth/auth.routes";
import petsRoutes from "../modules/pets/pets.routes";
import categoriesRoutes from "../modules/categories/categories.routes";
import productsRoutes from "../modules/products/products.routes";
import wishlistRoutes from "../modules/wishlist/wishlist.routes";
import addressRoutes from "../modules/addresses/address.routes";
import cartRoutes from "../modules/cart/cart.routes";
import adminProfileRoutes from "../modules/admin/profile/profile.routes";

import {
  userOrdersRoutes,
  adminOrdersRoutes,
} from "../modules/orders/orders.routes";
import paymentsRoutes from "../modules/payments/payments.routes";
import {
  productReviewsRoutes,
  userReviewsRoutes,
  adminReviewsRoutes,
} from "../modules/reviews/reviews.routes";
import notificationRoutes from "../modules/notifications/notifications.routes";
import dashboardRoutes from "../modules/admin/dashboard/dashboard.routes";
import usersRoutes from "../modules/users/users.routes";
import adminSettingsRoutes from "../modules/admin/settings/settings.routes";
import adminSearchRoutes from "../modules/admin/search/search.routes";



export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/pets", petsRoutes);
app.use("/api/v1/categories", categoriesRoutes);
app.use("/api/v1/products", productsRoutes);
app.use("/api/v1/user/wishlist", wishlistRoutes);
app.use("/api/v1/user/addresses", addressRoutes);
app.use("/api/v1/user/cart", cartRoutes);
app.use("/api/v1/user/orders", userOrdersRoutes);
app.use("/api/v1/admin/orders", adminOrdersRoutes);
app.use("/api/v1/user", paymentsRoutes);
app.use("/api/v1/products", productReviewsRoutes);
app.use("/api/v1/user/reviews", userReviewsRoutes);
app.use("/api/v1/admin/reviews", adminReviewsRoutes);
app.use("/api/v1/user/notifications", notificationRoutes);
app.use("/api/v1/admin/dashboard", dashboardRoutes);
app.use("/api/v1/admin/users", usersRoutes);
app.use("/api/v1/admin/profile", adminProfileRoutes);
app.use("/api/v1/admin/settings", adminSettingsRoutes);
app.use("/api/v1/admin/search", adminSearchRoutes);


app.use(notFound);
app.use(errorHandler);