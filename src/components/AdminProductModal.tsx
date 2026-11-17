import React, { useState } from 'react';
import { Plus, Trash2, Upload, X } from 'lucide-react';
import type { Category, Product, ProductColorVariant } from '../types';
import { useStore } from '../context/StoreContext';
import { SafeImage } from './SafeImage';

interface AdminProductModalProps {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}

const OCCASION_OPTIONS = ['Wedding', 'Festive', 'Party Wear', 'Everyday Wear'];

export function AdminProductModal({
  product,
  categories,
  onClose,
  onSaved,
}: AdminProductModalProps) {
  const { notify } = useStore();
  const isEditing = Boolean(product);

  const [name, setName] = useState(product?.name || '');
  const [subtitle, setSubtitle] = useState(product?.subtitle || '');
  const [description, setDescription] = useState(product?.description || '');
  const [categoryId, setCategoryId] = useState(product?.categoryId || categories[0]?.id || '');
  const [fabric, setFabric] = useState(product?.fabric || 'Katan Silk');
  const [careInstructions, setCareInstructions] = useState(
    product?.careInstructions || 'Dry clean only. Store wrapped in unbleached muslin cloth.'
  );
  const [occasions, setOccasions] = useState<string[]>(product?.occasions || ['Festive']);
  const [price, setPrice] = useState(String(product?.price || 18500));
  const [discountPercent, setDiscountPercent] = useState(String(product?.discountPercent ?? 0));
  const [sizesInput, setSizesInput] = useState(
    product?.sizes.join(', ') || 'Free Size (5.5m + 0.9m Blouse)'
  );
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [isNewArrival, setIsNewArrival] = useState(product?.isNewArrival ?? true);
  const [isBestSeller, setIsBestSeller] = useState(product?.isBestSeller ?? false);
  const [isActive, setIsActive] = useState(product?.isActive ?? true);

  const [variants, setVariants] = useState<ProductColorVariant[]>(
    product?.variants && product.variants.length > 0
      ? product.variants
      : [
          {
            id: `var-${Date.now()}`,
            name: 'Royal Crimson',
            hex: '#8B1E24',
            images: [],
            stock: 5,
            sku: `ZL-${Math.floor(1000 + Math.random() * 9000)}`,
          },
        ]
  );

  const [newImageUrlInputs, setNewImageUrlInputs] = useState<Record<number, string>>({});
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleOccasion = (occ: string) => {
    setOccasions((prev) =>
      prev.includes(occ) ? prev.filter((o) => o !== occ) : [...prev, occ]
    );
  };

  const updateVariant = (idx: number, patch: Partial<ProductColorVariant>) => {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
  };

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        id: `var-${Date.now()}-${prev.length}`,
        name: '',
        hex: '#C47D88',
        images: [],
        stock: 5,
        sku: `ZL-${Math.floor(1000 + Math.random() * 9000)}`,
      },
    ]);
  };

  const removeVariant = (idx: number) => {
    if (variants.length <= 1) {
      notify('At least one color variation is required.', 'error');
      return;
    }
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleFileUpload = async (variantIdx: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingIdx(variantIdx);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl, filename: file.name }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Image upload failed');
        }
        uploadedUrls.push(data.url);
      }

      const current = variants[variantIdx];
      updateVariant(variantIdx, { images: [...current.images, ...uploadedUrls] });
      notify(`Uploaded ${uploadedUrls.length} image(s).`, 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Upload failed.', 'error');
    } finally {
      setUploadingIdx(null);
    }
  };

  const handleAddImageUrl = (variantIdx: number) => {
    const url = (newImageUrlInputs[variantIdx] || '').trim();
    if (!url) return;
    const current = variants[variantIdx];
    updateVariant(variantIdx, { images: [...current.images, url] });
    setNewImageUrlInputs((prev) => ({ ...prev, [variantIdx]: '' }));
  };

  const removeImageFromVariant = (variantIdx: number, imgIdx: number) => {
    const current = variants[variantIdx];
    updateVariant(variantIdx, {
      images: current.images.filter((_, i) => i !== imgIdx),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId) {
      notify('Product name and category are required.', 'error');
      return;
    }
    if (variants.some((v) => !v.name.trim() || v.images.length === 0)) {
      notify('Every color variation needs a shade name and at least one image.', 'error');
      return;
    }

    setSaving(true);
    try {
      const sizes = sizesInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        name: name.trim(),
        subtitle: subtitle.trim(),
        description: description.trim(),
        categoryId,
        occasions,
        fabric: fabric.trim(),
        careInstructions: careInstructions.trim(),
        price: Number(price),
        discountPercent: Number(discountPercent),
        sizes,
        variants,
        isFeatured,
        isNewArrival,
        isBestSeller,
        isActive,
      };

      const res = await fetch(isEditing ? `/api/products/${product!.id}` : '/api/products', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || 'Failed to save product.', 'error');
        return;
      }

      notify(isEditing ? 'Product updated.' : 'New product published.', 'success');
      onSaved();
    } catch {
      notify('Failed to save product.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] overflow-y-auto border border-[#EAE4DC] shadow-2xl">
        <div className="sticky top-0 z-10 bg-white px-6 py-4 border-b border-[#EAE4DC] flex items-center justify-between">
          <h2 className="font-display text-2xl font-medium text-[#1C1917]">
            {isEditing ? `Edit: ${product?.name}` : 'Add New Product'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close product modal"
            className="p-2 text-[#6B6560] hover:text-[#1C1917]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#4A443F] mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-[#D8CFC2] px-3 py-2 text-sm focus:outline-none focus:border-[#1C1917]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A443F] mb-1">
                Subtitle / Weave Note
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full border border-[#D8CFC2] px-3 py-2 text-sm focus:outline-none focus:border-[#1C1917]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4A443F] mb-1">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-white border border-[#D8CFC2] px-3 py-2 text-sm focus:outline-none focus:border-[#1C1917]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A443F] mb-1">Fabric *</label>
              <input
                type="text"
                required
                value={fabric}
                onChange={(e) => setFabric(e.target.value)}
                className="w-full border border-[#D8CFC2] px-3 py-2 text-sm focus:outline-none focus:border-[#1C1917]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4A443F] mb-1">
                Price (INR) *
              </label>
              <input
                type="number"
                min={100}
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border border-[#D8CFC2] px-3 py-2 text-sm tabular-nums focus:outline-none focus:border-[#1C1917]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A443F] mb-1">
                Discount (%)
              </label>
              <input
                type="number"
                min={0}
                max={80}
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="w-full border border-[#D8CFC2] px-3 py-2 text-sm tabular-nums focus:outline-none focus:border-[#1C1917]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4A443F] mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-[#D8CFC2] px-3 py-2 text-sm focus:outline-none focus:border-[#1C1917]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#4A443F] mb-1">
                Sizes / Options (comma separated)
              </label>
              <input
                type="text"
                value={sizesInput}
                onChange={(e) => setSizesInput(e.target.value)}
                className="w-full border border-[#D8CFC2] px-3 py-2 text-sm focus:outline-none focus:border-[#1C1917]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A443F] mb-1">
                Care Instructions
              </label>
              <input
                type="text"
                value={careInstructions}
                onChange={(e) => setCareInstructions(e.target.value)}
                className="w-full border border-[#D8CFC2] px-3 py-2 text-sm focus:outline-none focus:border-[#1C1917]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div>
              <span className="block text-xs font-medium text-[#4A443F] mb-2">Occasions</span>
              <div className="flex flex-wrap gap-2">
                {OCCASION_OPTIONS.map((occ) => (
                  <button
                    key={occ}
                    type="button"
                    onClick={() => toggleOccasion(occ)}
                    className={`px-3 py-1.5 text-xs border transition-colors ${
                      occasions.includes(occ)
                        ? 'bg-[#1C1917] text-white border-[#1C1917]'
                        : 'bg-white text-[#5C554F] border-[#D8CFC2]'
                    }`}
                  >
                    {occ}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-[#4A443F] mb-2">
                Visibility &amp; Merchandising
              </span>
              <div className="flex flex-wrap gap-4 text-xs text-[#1C1917]">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="accent-[#1C1917]"
                  />
                  <span>Active on Storefront</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="accent-[#1C1917]"
                  />
                  <span>Featured</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNewArrival}
                    onChange={(e) => setIsNewArrival(e.target.checked)}
                    className="accent-[#1C1917]"
                  />
                  <span>New Arrival</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBestSeller}
                    onChange={(e) => setIsBestSeller(e.target.checked)}
                    className="accent-[#1C1917]"
                  />
                  <span>Best Seller</span>
                </label>
              </div>
            </div>
          </div>

          {/* Color Variations & Images */}
          <div className="pt-5 border-t border-[#EAE4DC] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#1C1917]">
                  Color Variations &amp; Variant Galleries *
                </h3>
                <p className="text-xs text-[#6B6560]">
                  Each color variation holds its own stock count and separate product gallery images.
                </p>
              </div>
              <button
                type="button"
                onClick={addVariant}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#1C1917] text-xs font-medium text-[#1C1917] hover:bg-[#FAF8F5]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Color</span>
              </button>
            </div>

            <div className="space-y-4">
              {variants.map((variant, idx) => (
                <div
                  key={variant.id}
                  className="border border-[#E5DEC9] bg-[#FAF8F5] p-4 space-y-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#1C1917]">
                      Color Variation {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeVariant(idx)}
                      className="text-xs text-[#B85D6E] hover:underline inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] text-[#5C554F] mb-1">
                        Color Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={variant.name}
                        onChange={(e) => updateVariant(idx, { name: e.target.value })}
                        placeholder="e.g. Dusty Rose"
                        className="w-full bg-white border border-[#D8CFC2] px-2.5 py-1.5 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#5C554F] mb-1">
                        Swatch Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={variant.hex}
                          onChange={(e) => updateVariant(idx, { hex: e.target.value })}
                          className="w-9 h-8 border border-[#D8CFC2] bg-white p-0.5 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={variant.hex}
                          onChange={(e) => updateVariant(idx, { hex: e.target.value })}
                          className="w-full bg-white border border-[#D8CFC2] px-2 py-1.5 text-xs tabular-nums"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#5C554F] mb-1">
                        Stock Qty *
                      </label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={variant.stock}
                        onChange={(e) =>
                          updateVariant(idx, { stock: Math.max(0, Number(e.target.value)) })
                        }
                        className="w-full bg-white border border-[#D8CFC2] px-2.5 py-1.5 text-sm tabular-nums"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#5C554F] mb-1">SKU</label>
                      <input
                        type="text"
                        value={variant.sku}
                        onChange={(e) => updateVariant(idx, { sku: e.target.value })}
                        className="w-full bg-white border border-[#D8CFC2] px-2.5 py-1.5 text-xs tabular-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-medium text-[#4A443F]">
                        Images for {variant.name || `Variation ${idx + 1}`} ({variant.images.length})
                      </span>

                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#1C1917] text-xs font-medium text-[#1C1917] cursor-pointer hover:bg-[#F3EFEA]">
                        <Upload className="w-3.5 h-3.5" />
                        <span>
                          {uploadingIdx === idx ? 'Uploading...' : 'Upload Images'}
                        </span>
                        <input
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => handleFileUpload(idx, e.target.files)}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newImageUrlInputs[idx] || ''}
                        onChange={(e) =>
                          setNewImageUrlInputs((prev) => ({ ...prev, [idx]: e.target.value }))
                        }
                        placeholder="Or paste image path/URL (e.g. /src/assets/images/...)"
                        className="flex-1 bg-white border border-[#D8CFC2] px-2.5 py-1.5 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddImageUrl(idx)}
                        className="px-3 py-1.5 bg-[#1C1917] text-white text-xs font-medium"
                      >
                        Add URL
                      </button>
                    </div>

                    {variant.images.length > 0 && (
                      <div className="flex flex-wrap gap-2.5">
                        {variant.images.map((imgUrl, imgIdx) => (
                          <div
                            key={`${imgUrl}-${imgIdx}`}
                            className="relative w-16 h-20 bg-white border border-[#D8CFC2] overflow-hidden group"
                          >
                            <SafeImage
                              src={imgUrl}
                              alt={`Variant preview ${imgIdx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImageFromVariant(idx, imgIdx)}
                              aria-label="Remove image"
                              className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#EAE4DC] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-[#D8CFC2] text-sm font-medium text-[#1C1917]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#1C1917] text-white text-sm font-medium hover:bg-[#332E2A] disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
