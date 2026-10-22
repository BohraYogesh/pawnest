
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getGeneralSettings,
  updateGeneralSettings,
  uploadStoreLogo,
  type UpdateGeneralSettingsInput,
} from "./settings.api";

export const settingsQueryKey = ["admin-settings"] as const;

export function useGeneralSettings() {
  return useQuery({
    queryKey: settingsQueryKey,
    queryFn: getGeneralSettings,
  });
}

export function useUpdateGeneralSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateGeneralSettingsInput) =>
      updateGeneralSettings(input),
    onSuccess: (settings) => {
      queryClient.setQueryData(settingsQueryKey, settings);
    },
  });
}

export function useUploadStoreLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadStoreLogo,
    onSuccess: (settings) => {
      queryClient.setQueryData(settingsQueryKey, settings);
    },
  });
}
