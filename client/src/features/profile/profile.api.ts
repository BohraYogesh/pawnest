
import apiClient from "../../services/api/axios";

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: "ADMIN";
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileUpdateInput {
  name: string;
  phone: string | null;
}

export interface AdminActivity {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: unknown;
  createdAt: string;
}

export async function getAdminProfile(): Promise<AdminProfile> {
  const response = await apiClient.get("/admin/profile");
  return response.data.data;
}

export async function updateAdminProfile(
  input: ProfileUpdateInput,
): Promise<AdminProfile> {
  const response = await apiClient.patch("/admin/profile", input);
  return response.data.data;
}

export async function uploadProfilePhoto(
  file: File,
): Promise<AdminProfile> {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await apiClient.post(
    "/admin/profile/avatar",
    formData,
  );

  return response.data.data;
}

export async function getRecentActivity(): Promise<AdminActivity[]> {
  const response = await apiClient.get("/admin/profile/activity");
  const data = response.data.data;

  if (Array.isArray(data)) {
    return data;
  }

  return data?.activities ?? [];
}
