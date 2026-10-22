
import apiClient from '../../services/api/axios'

export interface DashboardSummary {
  totalUsers: number
  totalProducts: number
  totalOrders: number
  paidRevenuePaise: number
  pendingOrders: number
  lowStockVariants: number
  pendingReviews: number
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await apiClient.get<ApiResponse<DashboardSummary>>(
    '/admin/dashboard/summary',
  )

  return response.data.data
}
