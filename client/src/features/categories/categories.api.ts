
import apiClient from '../../services/api/axios'

export interface Category {
  id: string
  name: string
  slug: string
  parentId?: string | null
  isActive: boolean
  children?: Category[]
}

export interface CategoryPayload {
  name: string
  slug: string
  parentId?: string
  isActive: boolean
}

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export async function getCategories(): Promise<Category[]> {
  const response = await apiClient.get<ApiResponse<Category[]>>(
    '/categories',
  )
  return response.data.data
}

export async function createCategory(
  payload: CategoryPayload,
): Promise<Category> {
  const response = await apiClient.post<ApiResponse<Category>>(
    '/categories',
    payload,
  )
  return response.data.data
}

export async function updateCategory({
  id,
  payload,
}: {
  id: string
  payload: Partial<CategoryPayload>
}): Promise<Category> {
  const response = await apiClient.patch<ApiResponse<Category>>(
    `/categories/${id}`,
    payload,
  )
  return response.data.data
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/categories/${id}`)
}
