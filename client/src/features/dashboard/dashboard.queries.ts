
import { useQuery } from '@tanstack/react-query'
import { getDashboardSummary } from './dashboard.api'

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'summary'],
    queryFn: getDashboardSummary,
  })
}
