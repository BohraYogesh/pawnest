
import apiClient from '../../services/api/axios'

export type PetType =
  | 'DOG'
  | 'CAT'
  | 'BIRD'
  | 'FISH'
  | 'SMALL_PET'
  | 'OTHER'

export interface ProductVariant {
  id: string
  productId: string
  label: string
  sku: string
  pricePaise: number
  stockQty: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ProductImage {
  id: string
  productId: string
  url: string
  position: number
}

export interface Category {
  id: string
  name: string
  slug: string
  parentId?: string | null
  isActive: boolean
  children?: Category[]
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  brand: string
  petType: PetType
  categoryId: string
  category?: Category
  isActive: boolean
  avgRating: number | string
  reviewCount: number
  createdAt: string
  updatedAt: string
  variants: ProductVariant[]
  images: ProductImage[]
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  pagination?: Pagination
}

export interface ProductPayload {
  name: string
  slug: string
  description: string
  brand: string
  petType: PetType
  categoryId: string
  isActive?: boolean
}

export interface ProductListParams {
  page: number
  limit: number
  search?: string
  category?: string
  petType?: PetType | ''
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating'
}

export async function getProducts(params: ProductListParams) {
  const response = await apiClient.get<ApiResponse<Product[]>>('/products', {
    params,
  })

  return {
    items: response.data.data,
    pagination: response.data.pagination ?? {
      page: params.page,
      limit: params.limit,
      total: response.data.data.length,
      totalPages: 1,
    },
  }
}

export async function getProduct(id: string) {
  const response = await apiClient.get<ApiResponse<Product>>(
    `/products/${id}`,
  )

  return response.data.data
}

export async function getCategories() {
  const response = await apiClient.get<ApiResponse<Category[]>>('/categories')

  return response.data.data
}

export async function createProduct(payload: ProductPayload) {
  const response = await apiClient.post<ApiResponse<Product>>(
    '/products',
    payload,
  )

  return response.data.data
}

export async function updateProduct(
  id: string,
  payload: Partial<ProductPayload>,
) {
  const response = await apiClient.patch<ApiResponse<Product>>(
    `/products/${id}`,
    payload,
  )

  return response.data.data
}

export async function deleteProduct(id: string) {
  const response = await apiClient.delete<ApiResponse<null>>(
    `/products/${id}`,
  )

  return response.data
}


export async function uploadProductImage(
  productId: string,
  file: File,
  position = 0,
) {
  const formData = new FormData()
  formData.append('image', file)
  formData.append('position', String(position))

  const response = await apiClient.post<ApiResponse<ProductImage>>(
    `/products/${productId}/images`,
    formData,
  )

  return response.data.data
}



export async function getProductImages(productId: string) {
  const response = await apiClient.get<ApiResponse<ProductImage[]>>(
    `/products/${productId}/images`,
  )

  return response.data.data
}

export async function deleteProductImage(
  productId: string,
  imageId: string,
) {
  const response = await apiClient.delete<ApiResponse<{ id: string }>>(
    `/products/${productId}/images/${imageId}`,
  )

  return response.data.data
}


export interface VariantPayload {
  label: string
  sku: string
  pricePaise: number
  stockQty: number
  isActive?: boolean
}

interface VariantApiResponse {
  success: boolean
  message?: string
  data: ProductVariant | ProductVariant[]
}

export async function getProductVariants(productId: string) {
  const response = await apiClient.get<VariantApiResponse>(
    `/products/${productId}/variants`,
  )

  return Array.isArray(response.data.data)
    ? response.data.data
    : [response.data.data]
}

export async function createProductVariant(
  productId: string,
  payload: VariantPayload,
) {
  const response = await apiClient.post<{
    success: boolean
    data: ProductVariant
  }>(`/products/${productId}/variants`, payload)

  return response.data.data
}

export async function updateProductVariant(
  productId: string,
  variantId: string,
  payload: Partial<VariantPayload>,
) {
  const response = await apiClient.patch<{
    success: boolean
    data: ProductVariant
  }>(`/products/${productId}/variants/${variantId}`, payload)

  return response.data.data
}

export async function deleteProductVariant(
  productId: string,
  variantId: string,
) {
  const response = await apiClient.delete<{
    success: boolean
    data: unknown
  }>(`/products/${productId}/variants/${variantId}`)

  return response.data
}
