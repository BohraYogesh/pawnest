
import axios from "axios";

interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  error?: {
    code?: string;
    message?: string;
    details?: Array<{
      field?: string;
      message?: string;
    }>;
  };
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallback;
  }

  if (!error.response) {
    if (error.code === "ECONNABORTED") {
      return "The request took too long. Please try again.";
    }

    return "Unable to connect to the server. Please check your connection.";
  }

  const status = error.response.status;
  const data = error.response.data;
  const code = data?.error?.code;
  const message = data?.error?.message || data?.message;

  if (code === "SKU_ALREADY_EXISTS") {
    return "This SKU already exists. Please use a different SKU.";
  }

  if (code === "PRODUCT_SLUG_EXISTS") {
    return "This product URL slug already exists. Please use a different slug.";
  }

  if (code === "VALIDATION_ERROR") {
    return (
      data?.error?.details?.[0]?.message ||
      message ||
      "Please check the entered information."
    );
  }

  if (code === "INVALID_IMAGE_TYPE") {
    return "Unsupported image format. Use JPG, PNG, WEBP or AVIF.";
  }

  if (code === "IMAGE_TOO_LARGE" || status === 413) {
    return "Image size must not exceed 5 MB.";
  }

  if (status === 401) {
    return "Your session has expired. Please log in again.";
  }

  if (status === 403) {
    return "You don't have permission to perform this action.";
  }

  if (status === 404) {
    return message || "The requested item was not found.";
  }

  if (status >= 500) {
    return "Server error. Please try again later.";
  }

  return message || fallback;
}
