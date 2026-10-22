
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminReviews,
  updateAdminReviewStatus,
  type ReviewStatus,
} from "./reviews.api";

export const reviewsQueryKey = ["admin-reviews"] as const;

export function useAdminReviews() {
  return useQuery({
    queryKey: reviewsQueryKey,
    queryFn: getAdminReviews,
  });
}

export function useUpdateAdminReviewStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      status,
    }: {
      reviewId: string;
      status: ReviewStatus;
    }) => updateAdminReviewStatus(reviewId, status),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: reviewsQueryKey,
      });
    },
  });
}
