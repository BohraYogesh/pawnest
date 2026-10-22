import apiClient from '../../services/api/axios'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

interface AuthResponse {
  user: AuthUser
}

export async function loginUser(credentials: {
  email: string
  password: string
}): Promise<AuthUser> {
  const response = await apiClient.post<ApiResponse<AuthResponse>>(
    '/auth/login',
    credentials,
  )

  return response.data.data.user
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiClient.get<ApiResponse<AuthResponse>>('/auth/me')

  return response.data.data.user
}

export async function logoutUser(): Promise<void> {
  await apiClient.post('/auth/logout')
}