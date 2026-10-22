
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminOrders,
  updateAdminOrderStatus,
  type OrderStatus,
} from "./orders.api";

export const ordersQueryKey = ["admin-orders"] as const;

export function useAdminOrders() {
  return useQuery({
    queryKey: ordersQueryKey,
    queryFn: getAdminOrders,
  });
}

export function useUpdateAdminOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      status,
      note,
    }: {
      orderId: string;
      status: OrderStatus;
      note?: string;
    }) => updateAdminOrderStatus(orderId, status, note),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ordersQueryKey,
      });
    },
  });
}
