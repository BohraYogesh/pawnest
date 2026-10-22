
import apiClient from "./axios";

export type UserStatus = "ACTIVE" | "BLOCKED";
export type UserRole = "CUSTOMER" | "ADMIN";

export interface UsersFilters {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  sort?: "newest" | "oldest";
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  _count: {
    pets: number;
    orders: number;
  };
  totalSpentPaise: number;
}

export async function getUsers(filters: UsersFilters = {}) {
  const response = await apiClient.get("/admin/users", {
    params: filters,
  });

  return response.data.data as {
    users: AdminUser[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export async function getUserDetails(userId: string) {
  const response = await apiClient.get(`/admin/users/${userId}`);
  return response.data.data;
}

export async function updateUserStatus(
  userId: string,
  status: UserStatus,
) {
  const response = await apiClient.patch(
    `/admin/users/${userId}/status`,
    { status },
  );

  return response.data.data;
}
