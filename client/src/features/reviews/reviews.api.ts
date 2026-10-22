
import apiClient from "../../services/api/axios";

export type ReviewStatus = "PENDING" | "APPROVED" | "HIDDEN";

export interface AdminReview {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  isVerifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
  };
  product: {
    id: string;
    name: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export async function getAdminReviews(): Promise<AdminReview[]> {
  const response =
    await apiClient.get<ApiResponse<AdminReview[]>>("/admin/reviews");

  return response.data.data;
}

export async function updateAdminReviewStatus(
  reviewId: string,
  status: ReviewStatus,
): Promise<AdminReview> {
  const response = await apiClient.patch<ApiResponse<AdminReview>>(
    `/admin/reviews/${reviewId}/status`,
    { status },
  );

  return response.data.data;
}
