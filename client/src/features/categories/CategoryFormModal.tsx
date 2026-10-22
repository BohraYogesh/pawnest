
import { useEffect, useState } from 'react'
import { LoaderCircle, X } from 'lucide-react'
import { toast } from 'sonner'
import type { Category, CategoryPayload } from './categories.api'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
} from './categories.queries'

interface Props {
  category: Category | null
  onClose: () => void
}

const inputClass =
  'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#49866E] focus:ring-2 focus:ring-[#49866E]/15'

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function CategoryFormModal({
  category,
  onClose,
}: Props) {
  const editing = Boolean(category)

  const { data: categories = [], isPending: categoriesLoading } =
    useCategories()

  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()

  const saving =
    createMutation.isPending || updateMutation.isPending

  const [form, setForm] = useState<CategoryPayload>({
    name: '',
    slug: '',
    parentId: '',
    isActive: true,
  })

  const [slugManuallyEdited, setSlugManuallyEdited] =
    useState(false)

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name,
        slug: category.slug,
        parentId: category.parentId ?? '',
        isActive: category.isActive,
      })
      setSlugManuallyEdited(true)
    } else {
      setForm({
        name: '',
        slug: '',
        parentId: '',
        isActive: true,
      })
      setSlugManuallyEdited(false)
    }
  }, [category])

  // Only main categories can be selected as parents.
  // Do not allow a category to be its own parent.
  const parentOptions = categories.filter(
    (item) => item.id !== category?.id,
  )

  function setField<K extends keyof CategoryPayload>(
    key: K,
    value: CategoryPayload[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function handleNameChange(name: string) {
    setForm((current) => ({
      ...current,
      name,
      ...(!slugManuallyEdited
        ? { slug: makeSlug(name) }
        : {}),
    }))
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const payload: CategoryPayload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      ...(form.parentId ? { parentId: form.parentId } : {}),
      isActive: form.isActive,
    }

    if (
      payload.name.length < 2 ||
      payload.slug.length < 2
    ) {
      toast.error(
        'Category name and slug must contain at least 2 characters.',
      )
      return
    }

    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug)
    ) {
      toast.error(
        'Slug must use lowercase letters, numbers and hyphens only.',
      )
      return
    }

    if (category && payload.parentId === category.id) {
      toast.error('A category cannot be its own parent.')
      return
    }

    try {
      if (category) {
        await updateMutation.mutateAsync({
          id: category.id,
          payload,
        })
        toast.success('Category updated successfully.')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Category created successfully.')
      }

      onClose()
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ??
          'Could not save the category. Check the details and try again.',
      )
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !saving
        ) {
          onClose()
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-form-title"
        className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2
              id="category-form-title"
              className="text-lg font-bold text-slate-900 sm:text-xl"
            >
              {editing ? 'Edit category' : 'Add new category'}
            </h2>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Organize products into categories and subcategories.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close category form"
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="overflow-y-auto">
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:gap-5 sm:p-6">
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
              Category name *
              <input
                required
                minLength={2}
                maxLength={120}
                value={form.name}
                onChange={(event) =>
                  handleNameChange(event.target.value)
                }
                placeholder="e.g. Dog Food"
                className={inputClass}
              />
            </label>

            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
              Slug *
              <input
                required
                minLength={2}
                value={form.slug}
                onChange={(event) => {
                  setSlugManuallyEdited(true)
                  setField(
                    'slug',
                    makeSlug(event.target.value),
                  )
                }}
                placeholder="dog-food"
                className={inputClass}
              />
              <span className="mt-1 block text-xs font-normal text-slate-400">
                Lowercase letters, numbers and hyphens only.
              </span>
            </label>

            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
              Parent category
              <select
                value={form.parentId ?? ''}
                onChange={(event) =>
                  setField('parentId', event.target.value)
                }
                disabled={categoriesLoading}
                className={inputClass}
              >
                <option value="">
                  None — top-level category
                </option>

                {parentOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>

              <span className="mt-1 block text-xs font-normal text-slate-400">
                Leave empty to create a main category.
              </span>
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setField('isActive', event.target.checked)
                }
                className="h-4 w-4 accent-[#295F4C]"
              />

              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  Active category
                </span>
                <span className="mt-0.5 block text-xs font-normal text-slate-500">
                  Active categories can be shown in the storefront.
                </span>
              </span>
            </label>
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || categoriesLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#295F4C] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#214d3e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && (
                <LoaderCircle size={16} className="animate-spin" />
              )}

              {saving
                ? 'Saving...'
                : editing
                  ? 'Save changes'
                  : 'Create category'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
