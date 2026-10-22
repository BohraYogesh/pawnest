
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from './categories.api'

export const categoryKeys = {
  all: ['categories'] as const,
}

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: getCategories,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCategory,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: categoryKeys.all,
      }),
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateCategory,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: categoryKeys.all,
      }),
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: categoryKeys.all,
      }),
  })
}
