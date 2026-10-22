
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getAdminProfile,
  getRecentActivity,
  updateAdminProfile,
  uploadProfilePhoto,
  type ProfileUpdateInput,
} from "./profile.api";

export const profileKeys = {
  all: ["admin", "profile"] as const,
  details: () => [...profileKeys.all, "details"] as const,
  activity: () => [...profileKeys.all, "activity"] as const,
};

export function useAdminProfile() {
  return useQuery({
    queryKey: profileKeys.details(),
    queryFn: getAdminProfile,
    retry: false,
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: profileKeys.activity(),
    queryFn: getRecentActivity,
    retry: false,
  });
}

export function useUpdateAdminProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ProfileUpdateInput) =>
      updateAdminProfile(input),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: profileKeys.details(),
        }),
        queryClient.invalidateQueries({
          queryKey: profileKeys.activity(),
        }),
        queryClient.invalidateQueries({
          queryKey: ["auth", "me"],
        }),
      ]);
    },
  });
}

export function useUploadProfilePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadProfilePhoto,

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: profileKeys.details(),
        }),
        queryClient.invalidateQueries({
          queryKey: profileKeys.activity(),
        }),
        queryClient.invalidateQueries({
          queryKey: ["auth", "me"],
        }),
      ]);
    },
  });
}
