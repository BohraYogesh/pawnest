
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createProduct,
  deleteProduct,
  getCategories,
  getProduct,
  getProducts,
  updateProduct,  
  createProductVariant,
  deleteProductVariant,
  getProductVariants,
  updateProductVariant,
  type VariantPayload,
  type ProductListParams,
  type ProductPayload,
} from './products.api'

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (params: ProductListParams) =>
    [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  categories: ['categories'] as const,
}

export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => getProducts(params),
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => getProduct(id),
    enabled: Boolean(id),
  })
}

export function useCategories() {
  return useQuery({
    queryKey: productKeys.categories,
    queryFn: getCategories,
    staleTime: 60_000,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ProductPayload) => createProduct(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: Partial<ProductPayload>
    }) => updateProduct(id, payload),
    onSuccess: async (_product, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: productKeys.all }),
        queryClient.invalidateQueries({
          queryKey: productKeys.detail(variables.id),
        }),
      ])
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
  })
}


export const variantKeys = {
  all: ['product-variants'] as const,
  list: (productId: string) =>
    [...variantKeys.all, productId] as const,
}

export function useProductVariants(productId: string) {
  return useQuery({
    queryKey: variantKeys.list(productId),
    queryFn: () => getProductVariants(productId),
    enabled: Boolean(productId),
  })
}

export function useCreateProductVariant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      productId,
      payload,
    }: {
      productId: string
      payload: VariantPayload
    }) => createProductVariant(productId, payload),

    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: variantKeys.list(variables.productId),
        }),
        queryClient.invalidateQueries({
          queryKey: productKeys.detail(variables.productId),
        }),
        queryClient.invalidateQueries({
          queryKey: productKeys.lists(),
        }),
      ])
    },
  })
}

export function useUpdateProductVariant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      productId,
      variantId,
      payload,
    }: {
      productId: string
      variantId: string
      payload: Partial<VariantPayload>
    }) => updateProductVariant(productId, variantId, payload),

    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: variantKeys.list(variables.productId),
        }),
        queryClient.invalidateQueries({
          queryKey: productKeys.detail(variables.productId),
        }),
        queryClient.invalidateQueries({
          queryKey: productKeys.lists(),
        }),
      ])
    },
  })
}

export function useDeleteProductVariant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      productId,
      variantId,
    }: {
      productId: string
      variantId: string
    }) => deleteProductVariant(productId, variantId),

    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: variantKeys.list(variables.productId),
        }),
        queryClient.invalidateQueries({
          queryKey: productKeys.detail(variables.productId),
        }),
        queryClient.invalidateQueries({
          queryKey: productKeys.lists(),
        }),
      ])
    },
  })
}
