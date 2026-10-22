
import apiClient from "../../services/api/axios";

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PLACED"
  | "PACKED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED";

export interface OrderItem {
  id: string;
  productName: string;
  variantLabel: string;
  sku: string;
  unitPricePaise: number;
  quantity: number;
  totalPaise: number;
  imageUrl?: string | null;
}

export interface OrderHistory {
  id: string;
  status: OrderStatus;
  note: string | null;
  createdAt: string;
  changedById?: string | null;
}

export interface OrderCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string | null;
}

export interface AdminOrder {
  id: string;
  orderNumber: number;
  userId: string;
  status: OrderStatus;
  subtotalPaise: number;
  shippingPaise: number;
  discountPaise: number;
  totalPaise: number;
  addressSnapshot: unknown;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  transactionRef: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  history: OrderHistory[];
  user: OrderCustomer;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export async function getAdminOrders(): Promise<AdminOrder[]> {
  const response =
    await apiClient.get<ApiResponse<AdminOrder[]>>("/admin/orders");

  return response.data.data;
}

export async function updateAdminOrderStatus(
  orderId: string,
  status: OrderStatus,
  note?: string,
): Promise<AdminOrder> {
  const response = await apiClient.patch<ApiResponse<AdminOrder>>(
    `/admin/orders/${orderId}/status`,
    { status, note },
  );

  return response.data.data;
}
