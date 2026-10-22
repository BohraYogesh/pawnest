
import apiClient from "../../services/api/axios";

export interface GeneralSettings {
  id: number;
  storeName: string;
  supportEmail: string;
  phone: string;
  address: string;
  currency: "INR";
  lowStockThreshold: number;
  updatedAt: string;
  logoUrl?: string | null;
}


export interface UpdateGeneralSettingsInput {
  storeName: string;
  supportEmail: string;
  phone: string;
  address: string;
  lowStockThreshold: number;
}

export async function getGeneralSettings(): Promise<GeneralSettings> {
  const response = await apiClient.get("/admin/settings");
  return response.data.data;
}

export async function updateGeneralSettings(
  input: UpdateGeneralSettingsInput,
): Promise<GeneralSettings> {
  const response = await apiClient.patch("/admin/settings", input);
  return response.data.data;
}

export async function uploadStoreLogo(
  file: File,
): Promise<GeneralSettings> {
  const formData = new FormData();
  formData.append("logo", file);

  const response = await apiClient.post(
    "/admin/settings/logo",
    formData,
  );

  return response.data.data;
}
