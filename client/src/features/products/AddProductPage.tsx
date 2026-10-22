import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  ImagePlus,
  LoaderCircle,
  PlusCircle,
  Save,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  createProduct,
  getCategories,
  getProduct,
  getProductImages,
  uploadProductImage,
  deleteProductImage,
  updateProduct,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  getProductVariants,
} from "./products.api";

import type {
  Category,
  PetType,
  Product,
  ProductImage,
  ProductPayload,
  ProductVariant,
  VariantPayload,
} from "./products.api";

// interface AddProductPageProps {
//   productId?: string;
// }

interface VariantDraft {
  id?: string;
  label: string;
  sku: string;
  price: string;
  stock: string;
  isActive: boolean;
}

interface SelectedImage {
  file: File;
  preview: string;
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
  "w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#49866E] focus:ring-2 focus:ring-[#49866E]/15";

const cardClass =
  "rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 lg:p-6";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function flattenCategories(categories: Category[]): Category[] {
  return categories.flatMap((category) => [
    category,
    ...(category.children ?? []),
  ]);
}

function variantToDraft(variant: ProductVariant): VariantDraft {
  return {
    id: variant.id,
    label: variant.label,
    sku: variant.sku,
    price: (variant.pricePaise / 100).toString(),
    stock: variant.stockQty.toString(),
    isActive: variant.isActive,
  };
}

function newVariant(): VariantDraft {
  return {
    label: "",
    sku: "",
    price: "",
    stock: "0",
    isActive: true,
  };
}

export default function AddProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = Boolean(productId);

  const [loading, setLoading] = useState(Boolean(productId));
  const [saving, setSaving] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [, setExistingProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [dragging, setDragging] = useState(false);
  const [variants, setVariants] = useState<VariantDraft[]>([newVariant()]);
  const [, setOriginalVariants] = useState<ProductVariant[]>(
    [],
  );
  const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [slugTouched, setSlugTouched] = useState(false);

  const [form, setForm] = useState<ProductPayload>({
    name: "",
    slug: "",
    description: "",
    brand: "",
    petType: "DOG",
    categoryId: "",
    isActive: true,
  });

  const allCategories = useMemo(
    () => flattenCategories(categories),
    [categories],
  );

  useEffect(() => {
    let cancelled = false;

    async function initialise() {
      setLoading(true);

      try {
        const categoryList = await getCategories();
        if (!cancelled) setCategories(categoryList);

        if (!productId) return;

        const [product, productImages, productVariants] = await Promise.all([
          getProduct(productId),
          getProductImages(productId),
          getProductVariants(productId),
        ]);

        if (cancelled) return;

        setExistingProduct(product);
        setForm({
          name: product.name,
          slug: product.slug,
          description: product.description,
          brand: product.brand,
          petType: product.petType,
          categoryId: product.categoryId,
          isActive: product.isActive,
        });
        setSlugTouched(true);
        setImages(productImages);
        setOriginalVariants(productVariants);
        setVariants(
          productVariants.length
            ? productVariants.map(variantToDraft)
            : [newVariant()],
        );
      } catch {
        if (!cancelled) {
          toast.error("Could not load product details.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void initialise();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const selectedImagesRef = useRef<SelectedImage[]>([]);

  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  useEffect(() => {
    return () => {
      selectedImagesRef.current.forEach((item) => {
        URL.revokeObjectURL(item.preview);
      });
    };
  }, []);

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
      ...(!slugTouched ? { slug: slugify(value) } : {}),
    }));
  }

  function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    const accepted: SelectedImage[] = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: use JPG, PNG, WEBP or AVIF.`);
        continue;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(`${file.name}: maximum size is 5 MB.`);
        continue;
      }

      accepted.push({
        file,
        preview: URL.createObjectURL(file),
      });
    }

    setSelectedImages((current) => [...current, ...accepted]);
  }

  function removeSelectedImage(index: number) {
    setSelectedImages((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  function updateVariant(
    index: number,
    key: keyof VariantDraft,
    value: string | boolean,
  ) {
    setVariants((current) =>
      current.map((variant, currentIndex) =>
        currentIndex === index ? { ...variant, [key]: value } : variant,
      ),
    );
  }

  function removeVariant(index: number) {
    const variant = variants[index];

    if (variant?.id) {
      setDeletedVariantIds((current) => [...current, variant.id!]);
    }

    setVariants((current) => current.filter((_, i) => i !== index));
  }

  function removeExistingImage(image: ProductImage) {
    setDeletedImageIds((current) =>
      current.includes(image.id) ? current : [...current, image.id],
    );
    setImages((current) => current.filter((item) => item.id !== image.id));
  }

  function validateForm() {
    if (
      form.name.trim().length < 2 ||
      !form.slug.trim() ||
      !form.description.trim() ||
      !form.brand.trim() ||
      !form.categoryId
    ) {
      toast.error("Please complete all required product fields.");
      return false;
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) {
      toast.error("Slug must contain lowercase letters, numbers and hyphens.");
      return false;
    }

    const filledVariants = variants.filter(
      (variant) =>
        variant.label.trim() || variant.sku.trim() || variant.price.trim(),
    );

    for (const variant of filledVariants) {
      const price = Number(variant.price);
      const stock = Number(variant.stock);

      if (
        !variant.label.trim() ||
        variant.sku.trim().length < 3 ||
        !Number.isFinite(price) ||
        price <= 0 ||
        !Number.isFinite(stock) ||
        !Number.isInteger(stock) ||
        stock < 0
      ) {
        toast.error("Check variant label, SKU, price and stock.");
        return false;
      }

      if (!Number.isSafeInteger(Math.round(price * 100))) {
        toast.error("Variant price is too large.");
        return false;
      }
    }

    return true;
  }

  async function saveVariants(savedProductId: string) {
    const filledVariants = variants.filter(
      (variant) =>
        variant.label.trim() || variant.sku.trim() || variant.price.trim(),
    );

    const usedSkus = new Set<string>();

    for (const variant of filledVariants) {
      const normalizedSku = variant.sku.trim().toLowerCase();

      if (usedSkus.has(normalizedSku)) {
        throw new Error(`Duplicate SKU: ${variant.sku}`);
      }

      usedSkus.add(normalizedSku);
    }

    for (const variantId of deletedVariantIds) {
      await deleteProductVariant(savedProductId, variantId);
    }

    for (const variant of filledVariants) {
      const payload: VariantPayload = {
        label: variant.label.trim(),
        sku: variant.sku.trim(),
        pricePaise: Math.round(Number(variant.price) * 100),
        stockQty: Number(variant.stock),
        isActive: variant.isActive,
      };

      if (variant.id) {
        await updateProductVariant(savedProductId, variant.id, payload);
      } else {
        await createProductVariant(savedProductId, payload);
      }
    }
  }

  async function saveImages(savedProductId: string) {
    for (const imageId of deletedImageIds) {
      await deleteProductImage(savedProductId, imageId);
    }

    for (let index = 0; index < selectedImages.length; index += 1) {
      setUploadMessage(
        `Uploading image ${index + 1} of ${selectedImages.length}...`,
      );

      await uploadProductImage(
        savedProductId,
        selectedImages[index].file,
        images.length + index,
      );
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) return;

    setSaving(true);
    setUploadMessage("");

    try {
      const payload: ProductPayload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        brand: form.brand.trim(),
        petType: form.petType,
        categoryId: form.categoryId,
        isActive: Boolean(form.isActive),
      };

      const savedProduct = productId
        ? await updateProduct(productId, payload)
        : await createProduct(payload);

      // Product must exist before its images and variants can be saved.
      await saveVariants(savedProduct.id);
      await saveImages(savedProduct.id);

      toast.success(
        isEditing
          ? "Product updated successfully!"
          : "Product created successfully!",
      );

      navigate("/products");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not save product. Please try again.";

      toast.error(message);
    } finally {
      setSaving(false);
      setUploadMessage("");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3 text-[#295F4C]">
        <LoaderCircle className="animate-spin" size={24} />
        <span className="text-sm font-medium">Loading product...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7F6] p-2 sm:p-5 lg:p-7">
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="rounded-full bg-white p-2.5 text-slate-600  hover:bg-slate-100"
            aria-label="Back to products"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {isEditing ? "Edit Product" : "Add Product"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {isEditing
                ? "Update your product details, images and variants."
                : "Add a new product to your store."}
            </p>
          </div>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.95fr)]">
            {/* Product information and variants */}
            <div className="space-y-5">
              <section className={cardClass}>
                <div className="mb-5 flex items-center gap-3">
                  <FileText className="text-[#295F4C]" size={23} />
                  <h2 className="text-lg font-bold text-slate-900">
                    Product Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Product Name <span className="text-red-500">*</span>
                    <input
                      required
                      value={form.name}
                      onChange={(event) => handleNameChange(event.target.value)}
                      placeholder="Premium Dry Dog Food"
                      className={`${inputClass} mt-2`}
                    />
                  </label>

                  <label className="text-sm font-semibold text-slate-700">
                    Slug <span className="text-red-500">*</span>
                    <input
                      required
                      value={form.slug}
                      onChange={(event) => {
                        setSlugTouched(true);
                        updateField("slug", slugify(event.target.value));
                      }}
                      placeholder="premium-dry-dog-food"
                      className={`${inputClass} mt-2`}
                    />
                    <span className="mt-1 block text-xs font-normal text-slate-400">
                      Used in the product URL.
                    </span>
                  </label>

                  <label className="text-sm font-semibold text-slate-700 md:col-span-2">
                    Description <span className="text-red-500">*</span>
                    <textarea
                      required
                      rows={4}
                      value={form.description}
                      onChange={(event) =>
                        updateField("description", event.target.value)
                      }
                      placeholder="Describe product features and benefits..."
                      className={`${inputClass} mt-2 resize-y`}
                    />
                  </label>

                  <label className="text-sm font-semibold text-slate-700">
                    Category <span className="text-red-500">*</span>
                    <select
                      required
                      value={form.categoryId}
                      onChange={(event) =>
                        updateField("categoryId", event.target.value)
                      }
                      className={`${inputClass} mt-2`}
                    >
                      <option value="">Select category</option>
                      {allCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.parentId ? "— " : ""}
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-sm font-semibold text-slate-700">
                    Pet Type <span className="text-red-500">*</span>
                    <select
                      value={form.petType}
                      onChange={(event) =>
                        updateField("petType", event.target.value as PetType)
                      }
                      className={`${inputClass} mt-2`}
                    >
                      {petTypes.map((pet) => (
                        <option key={pet.value} value={pet.value}>
                          {pet.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-sm font-semibold text-slate-700 md:col-span-2">
                    Brand <span className="text-red-500">*</span>
                    <input
                      required
                      value={form.brand}
                      onChange={(event) =>
                        updateField("brand", event.target.value)
                      }
                      placeholder="Royal Canin"
                      className={`${inputClass} mt-2`}
                    />
                  </label>
                </div>
              </section>

              {/* Variants */}
              <section className={cardClass}>
                <div className="mb-1 flex items-center gap-3">
                  <FileText className="text-[#295F4C]" size={23} />
                  <h2 className="text-lg font-bold text-slate-900">Variants</h2>
                </div>

                <p className="mb-5 text-sm text-slate-500">
                  Add different sizes, flavors or variants for this product.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] border-separate border-spacing-y-2 text-left">
                    <thead>
                      <tr className="text-xs font-semibold text-slate-500">
                        <th className="px-2 pb-1">Size / Flavor *</th>
                        <th className="px-2 pb-1">SKU *</th>
                        <th className="px-2 pb-1">Price (₹) *</th>
                        <th className="px-2 pb-1">Stock *</th>
                        <th className="px-2 pb-1 text-center">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {variants.map((variant, index) => (
                        <tr key={variant.id ?? `new-${index}`}>
                          <td className="px-1">
                            <input
                              aria-label="Variant label"
                              value={variant.label}
                              onChange={(event) =>
                                updateVariant(
                                  index,
                                  "label",
                                  event.target.value,
                                )
                              }
                              placeholder="1 kg"
                              className={inputClass}
                            />
                          </td>

                          <td className="px-1">
                            <input
                              aria-label="Variant SKU"
                              value={variant.sku}
                              onChange={(event) =>
                                updateVariant(index, "sku", event.target.value)
                              }
                              placeholder="RC-ADF-1KG"
                              className={inputClass}
                            />
                          </td>

                          <td className="px-1">
                            <input
                              aria-label="Variant price in rupees"
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={variant.price}
                              onChange={(event) =>
                                updateVariant(
                                  index,
                                  "price",
                                  event.target.value,
                                )
                              }
                              placeholder="1250"
                              className={inputClass}
                            />
                          </td>

                          <td className="px-1">
                            <input
                              aria-label="Variant stock"
                              type="number"
                              min="0"
                              step="1"
                              value={variant.stock}
                              onChange={(event) =>
                                updateVariant(
                                  index,
                                  "stock",
                                  event.target.value,
                                )
                              }
                              className={inputClass}
                            />
                          </td>

                          <td className="px-1 text-center">
                            <button
                              type="button"
                              onClick={() => removeVariant(index)}
                              className="rounded-lg p-2.5 text-red-500 transition hover:bg-red-50"
                              aria-label="Remove variant"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setVariants((current) => [...current, newVariant()])
                  }
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-semibold text-[#295F4C] transition hover:bg-green-100"
                >
                  <PlusCircle size={18} />
                  Add Variant
                </button>

                <p className="mt-3 text-xs text-slate-400">
                  Leave a blank row empty if you do not need that variant.
                </p>
              </section>
            </div>

            {/* Images and product status */}
            <div className="space-y-5">
              <section className={cardClass}>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <ImagePlus className="text-[#295F4C]" size={23} />
                    <h2 className="text-lg font-bold text-slate-900">
                      Product Images
                    </h2>
                  </div>

                  <span className="text-xs text-slate-400">
                    Max 5 MB · JPG, PNG, WEBP, AVIF
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="hidden"
                  onChange={(event) => {
                    if (event.target.files) addFiles(event.target.files);
                    event.target.value = "";
                  }}
                />

                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    addFiles(event.dataTransfer.files);
                  }}
                  className={`flex min-h-48 flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-7 text-center transition ${
                    dragging
                      ? "border-[#295F4C] bg-green-50"
                      : "border-slate-200 bg-slate-50/40"
                  }`}
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-[#295F4C]">
                    <ImagePlus size={27} />
                  </div>

                  <p className="text-sm font-semibold text-slate-700">
                    Drag & drop images here
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    or click to browse
                  </p>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 rounded-lg bg-[#E4F2EB] px-5 py-2.5 text-sm font-semibold text-[#295F4C] transition hover:bg-[#D4EADF]"
                  >
                    Choose Images
                  </button>
                </div>

                {(images.length > 0 || selectedImages.length > 0) && (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {images.map((image) => (
                      <div
                        key={image.id}
                        className="relative overflow-hidden rounded-xl border border-slate-200 bg-white"
                      >
                        <img
                          src={image.url}
                          alt="Product"
                          className="h-28 w-full object-contain p-2"
                        />

                        <button
                          type="button"
                          onClick={() => removeExistingImage(image)}
                          className="absolute right-1.5 top-1.5 rounded-full bg-white p-1.5 text-red-500  hover:bg-red-50"
                          aria-label="Remove existing image"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}

                    {selectedImages.map((image, index) => (
                      <div
                        key={image.preview}
                        className="relative overflow-hidden rounded-xl border border-green-200 bg-white"
                      >
                        <img
                          src={image.preview}
                          alt={image.file.name}
                          className="h-28 w-full object-contain p-2"
                        />

                        <button
                          type="button"
                          onClick={() => removeSelectedImage(index)}
                          className="absolute right-1.5 top-1.5 rounded-full bg-white p-1.5 text-red-500 hover:bg-red-50"
                          aria-label="Remove selected image"
                        >
                          <X size={15} />
                        </button>

                        <p className="truncate border-t border-slate-100 px-2 py-1.5 text-xs text-slate-500">
                          {image.file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {uploadMessage && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-3 text-sm text-[#295F4C]">
                    <LoaderCircle size={17} className="animate-spin" />
                    {uploadMessage}
                  </div>
                )}
              </section>

              <section className={cardClass}>
                <div className="mb-4 flex items-center gap-3">
                  <Settings className="text-[#295F4C]" size={23} />
                  <h2 className="text-lg font-bold text-slate-900">
                    Product Status
                  </h2>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {form.isActive ? "Active" : "Inactive"}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Inactive products will not be visible on your store.
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(form.isActive)}
                    aria-label="Product active status"
                    onClick={() =>
                      updateField("isActive", !Boolean(form.isActive))
                    }
                    className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                      form.isActive ? "bg-[#167B5A]" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                        form.isActive ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              </section>

              <section className={`${cardClass} xl:sticky xl:top-5`}>
                <div className="mb-4">
                  <p className="text-sm font-bold text-slate-800">
                    Save your product
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Product details, variants and images will be saved.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row xl:flex-col 2xl:flex-row">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => navigate("/products")}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#E87516] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#D8670D] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <LoaderCircle size={17} className="animate-spin" />
                    ) : (
                      <Save size={17} />
                    )}

                    {saving
                      ? "Saving..."
                      : isEditing
                        ? "Save Changes"
                        : "Save Product"}
                  </button>
                </div>
              </section>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
