import { useEffect, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Trash2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import {
  useCategories,
  useCreateProduct,
  useUpdateProduct,
} from "./products.queries";
import {
  deleteProductImage,
  getProductImages,
  uploadProductImage,
} from "./products.api";
import type {
  PetType,
  Product,
  ProductImage,
  ProductPayload,
} from "./products.api";

import { getApiErrorMessage } from "../../services/api/getApiErrorMessage";

interface ProductFormModalProps {
  product: Product | null;
  onClose: () => void;
}

const petTypes: { label: string; value: PetType }[] = [
  { label: "Dog", value: "DOG" },
  { label: "Cat", value: "CAT" },
  { label: "Bird", value: "BIRD" },
  { label: "Fish", value: "FISH" },
  { label: "Small Pet", value: "SMALL_PET" },
  { label: "Other", value: "OTHER" },
];

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#49866E] focus:ring-2 focus:ring-[#49866E]/15";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ProductFormModal({
  product,
  onClose,
}: ProductFormModalProps) {
  const isEditing = Boolean(product);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: categories = [], isPending: categoriesLoading } =
    useCategories();

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const [form, setForm] = useState<ProductPayload>({
    name: "",
    slug: "",
    description: "",
    brand: "",
    petType: "DOG",
    categoryId: "",
    isActive: true,
  });

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [images, setImages] = useState<ProductImage[]>(product?.images ?? []);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const isBusy = isSaving || uploading;

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        slug: product.slug,
        description: product.description,
        brand: product.brand,
        petType: product.petType,
        categoryId: product.categoryId,
        isActive: product.isActive,
      });

      setSlugManuallyEdited(true);
      setImages(product.images ?? []);
    }
  }, [product]);

  useEffect(() => {
    if (!product) {
      setImages([]);
      return;
    }

    let cancelled = false;

    async function loadImages() {
      setImagesLoading(true);

      try {
        const result = await getProductImages(product!.id);

        if (!cancelled) {
          setImages(result);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error("Could not load product images.");
        }
      } finally {
        if (!cancelled) {
          setImagesLoading(false);
        }
      }
    }

    void loadImages();

    return () => {
      cancelled = true;
    };
  }, [product]);

  useEffect(() => {
    return () => {
      selectedFiles.forEach((file) => {
        const previewUrl = URL.createObjectURL(file);
        URL.revokeObjectURL(previewUrl);
      });
    };
  }, [selectedFiles]);

  function updateField<K extends keyof ProductPayload>(
    key: K,
    value: ProductPayload[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleNameChange(value: string) {
    setForm((current) => ({
      ...current,
      name: value,
      ...(!slugManuallyEdited ? { slug: makeSlug(value) } : {}),
    }));
  }

  function handleFileSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!files.length) return;

    const validFiles: File[] = [];

    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast.error(`${file.name}: Use JPG, PNG, WEBP or AVIF.`);
        continue;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(`${file.name}: Image must be 5 MB or smaller.`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length) {
      setSelectedFiles((current) => [...current, ...validFiles]);
    }
  }

  function removeSelectedFile(indexToRemove: number) {
    setSelectedFiles((current) =>
      current.filter((_, index) => index !== indexToRemove),
    );
  }

  async function handleDeleteImage(image: ProductImage) {
    if (!product) return;

    const confirmed = window.confirm("Remove this image from the product?");

    if (!confirmed) return;

    try {
      await deleteProductImage(product.id, image.id);

      setImages((current) => current.filter((item) => item.id !== image.id));

      toast.success("Image removed from product.");
    } catch {
      toast.error("Could not remove this image.");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: ProductPayload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      brand: form.brand.trim(),
      petType: form.petType,
      categoryId: form.categoryId,
      isActive: form.isActive,
    };

    if (
      payload.name.length < 2 ||
      payload.slug.length < 2 ||
      !payload.description ||
      !payload.brand ||
      !payload.categoryId
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug)) {
      toast.error("Slug must use lowercase letters, numbers and hyphens only.");
      return;
    }

    let savedProduct: Product;

    try {
      if (product) {
        savedProduct = await updateMutation.mutateAsync({
          id: product.id,
          payload,
        });

        toast.success("Product details saved.");
      } else {
        savedProduct = await createMutation.mutateAsync(payload);

        toast.success("Product created successfully.");
      }
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Could not save the product. Check the details and try again.",
        ),
      );
      return;
    }

    if (selectedFiles.length > 0) {
      setUploading(true);

      let uploadedCount = 0;
      let failedCount = 0;
      const failedFiles: File[] = [];

      try {
        for (let index = 0; index < selectedFiles.length; index += 1) {
          const file = selectedFiles[index];

          setUploadProgress(
            `Uploading image ${index + 1} of ${selectedFiles.length}...`,
          );

          try {
            const uploadedImage = await uploadProductImage(
              savedProduct.id,
              file,
              images.length + uploadedCount,
            );

            setImages((current) => [...current, uploadedImage]);
            uploadedCount += 1;
          } catch (error) {
            failedCount += 1;
            failedFiles.push(file);

            toast.error(
              `${file.name}: ${getApiErrorMessage(
                error,
                "Image upload failed.",
              )}`,
            );
          }
        }
      } finally {
        setUploading(false);
        setUploadProgress("");
      }

      if (failedCount > 0) {
        setSelectedFiles(failedFiles);

        toast.error(
          `${uploadedCount} image(s) uploaded; ${failedCount} failed. Please retry the failed images.`,
        );

        return;
      }

      setSelectedFiles([]);
      toast.success("All product images uploaded successfully.");
    }

    onClose();
  }

  const allCategories = categories.flatMap((category) => [
    category,
    ...(category.children ?? []),
  ]);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isBusy) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-title"
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2
              id="product-form-title"
              className="text-lg font-bold text-slate-900 sm:text-xl"
            >
              {isEditing ? "Edit product" : "Add new product"}
            </h2>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Enter product details and upload images.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            aria-label="Close product form"
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="overflow-y-auto">
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:gap-5 sm:p-6">
            <label className="text-sm font-semibold text-slate-700">
              Product name *
              <input
                required
                minLength={2}
                maxLength={200}
                value={form.name}
                onChange={(event) => handleNameChange(event.target.value)}
                placeholder="e.g. Premium Dog Food"
                className={inputClass}
              />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Brand *
              <input
                required
                value={form.brand}
                onChange={(event) => updateField("brand", event.target.value)}
                placeholder="e.g. PawNest"
                className={inputClass}
              />
            </label>

            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
              Product slug *
              <input
                required
                minLength={2}
                value={form.slug}
                onChange={(event) => {
                  setSlugManuallyEdited(true);
                  updateField("slug", makeSlug(event.target.value));
                }}
                placeholder="premium-dog-food"
                className={inputClass}
              />
              <span className="mt-1 block text-xs font-normal text-slate-400">
                Lowercase letters, numbers and hyphens only.
              </span>
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Pet type *
              <select
                value={form.petType}
                onChange={(event) =>
                  updateField("petType", event.target.value as PetType)
                }
                className={inputClass}
              >
                {petTypes.map((pet) => (
                  <option key={pet.value} value={pet.value}>
                    {pet.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Category *
              <select
                required
                value={form.categoryId}
                onChange={(event) =>
                  updateField("categoryId", event.target.value)
                }
                disabled={categoriesLoading}
                className={inputClass}
              >
                <option value="">
                  {categoriesLoading
                    ? "Loading categories..."
                    : "Select category"}
                </option>

                {allCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.parentId ? "— " : ""}
                    {category.name}
                  </option>
                ))}
              </select>
              {!categoriesLoading && categories.length === 0 && (
                <span className="mt-1 block text-xs font-normal text-amber-700">
                  No active categories found. Add a category first.
                </span>
              )}
            </label>

            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
              Description *
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="Describe the product..."
                className={`${inputClass} resize-y`}
              />
            </label>

            {/* Product images */}
            <div className="sm:col-span-2">
              <div className="mb-3">
                <h3 className="text-sm font-bold text-slate-800">
                  Product images
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  JPG, PNG, WEBP or AVIF · Maximum 5 MB per image.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                onChange={handleFileSelection}
                className="hidden"
              />

              <button
                type="button"
                disabled={isBusy}
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#49866E]/40 bg-[#49866E]/5 px-4 py-7 text-center transition hover:border-[#49866E] hover:bg-[#49866E]/10 disabled:opacity-50"
              >
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#295F4C] shadow-sm">
                  <ImagePlus size={24} />
                </span>

                <span className="text-sm font-bold text-slate-800">
                  Choose product images
                </span>

                <span className="mt-1 text-xs text-slate-500">
                  Select one or more images from your computer
                </span>
              </button>

              {selectedFiles.length > 0 && (
                <div className="mt-4">
                  <p className="mb-3 text-xs font-semibold text-slate-600">
                    Selected images ({selectedFiles.length})
                  </p>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${file.size}-${index}`}
                        className="relative overflow-hidden rounded-xl border border-slate-200 bg-white"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="h-32 w-full object-contain p-2"
                        />

                        <button
                          type="button"
                          onClick={() => removeSelectedFile(index)}
                          disabled={isBusy}
                          aria-label={`Remove ${file.name}`}
                          className="absolute right-2 top-2 rounded-lg bg-white p-1.5 text-red-600 shadow hover:bg-red-50 disabled:opacity-50"
                        >
                          <X size={16} />
                        </button>

                        <p className="truncate border-t border-slate-100 px-2 py-2 text-xs text-slate-600">
                          {file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isEditing && (
                <div className="mt-5">
                  <p className="mb-3 text-xs font-semibold text-slate-600">
                    Uploaded images ({images.length})
                  </p>

                  {imagesLoading ? (
                    <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
                      <LoaderCircle size={16} className="animate-spin" />
                      Loading images...
                    </div>
                  ) : images.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      No images uploaded for this product yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {images.map((image) => (
                        <div
                          key={image.id}
                          className="relative overflow-hidden rounded-xl border border-slate-200 bg-white"
                        >
                          <img
                            src={image.url}
                            alt={`${form.name || "Product"} image`}
                            className="h-32 w-full object-contain p-2"
                          />

                          <button
                            type="button"
                            onClick={() => void handleDeleteImage(image)}
                            disabled={isBusy}
                            aria-label="Remove product image"
                            className="absolute right-2 top-2 rounded-lg bg-white p-1.5 text-red-600 shadow transition hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                          </button>

                          <p className="border-t border-slate-100 px-2 py-2 text-xs text-slate-500">
                            Image position: {image.position}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {uploading && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#49866E]/10 px-4 py-3 text-sm font-medium text-[#295F4C]">
                  <LoaderCircle size={17} className="animate-spin" />
                  {uploadProgress || "Uploading images..."}
                </div>
              )}

              {!product && selectedFiles.length > 0 && (
                <p className="mt-3 text-xs text-amber-700">
                  Images will upload after the product is created.
                </p>
              )}
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 sm:col-span-2">
              <input
                type="checkbox"
                checked={Boolean(form.isActive)}
                onChange={(event) =>
                  updateField("isActive", event.target.checked)
                }
                className="h-4 w-4 accent-[#295F4C]"
              />

              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  Active product
                </span>
                <span className="mt-0.5 block text-xs font-normal text-slate-500">
                  Active products can be shown in the storefront.
                </span>
              </span>
            </label>
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isBusy || categoriesLoading || imagesLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#295F4C] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#214d3e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBusy ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <UploadCloud size={16} />
              )}

              {isSaving
                ? "Saving product..."
                : uploading
                  ? "Uploading images..."
                  : isEditing
                    ? "Save changes"
                    : "Create product"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
