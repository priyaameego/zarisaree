import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';

const OCCASIONS = ['Wedding', 'Festive', 'Party Wear', 'Everyday Wear'];
const PAGE_SIZE = 6;

export function ShopPage() {
  const { categories } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const selectedCategory = searchParams.get('category') || 'all';
  const selectedOccasion = searchParams.get('occasion') || 'all';
  const selectedFabric = searchParams.get('fabric') || 'all';
  const selectedColor = searchParams.get('color') || 'all';
  const selectedAvailability = searchParams.get('availability') || 'all';
  const searchQuery = searchParams.get('search') || '';
  const sortBy = searchParams.get('sort') || 'latest';
  const maxPriceParam = Number(searchParams.get('maxPrice') || 80000);

  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setLoading(true);
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => setAllProducts(data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fabrics = useMemo(() => {
    const set = new Set<string>();
    allProducts.forEach((p) => p.fabric && set.add(p.fabric));
    return Array.from(set).sort();
  }, [allProducts]);

  const colors = useMemo(() => {
    const map = new Map<string, string>();
    allProducts.forEach((p) =>
      p.variants.forEach((v) => {
        if (!map.has(v.name)) map.set(v.name, v.hex);
      })
    );
    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
  }, [allProducts]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setVisibleCount(PAGE_SIZE);
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setLocalSearch('');
    setVisibleCount(PAGE_SIZE);
    setSearchParams({});
  };

  const filteredProducts = useMemo(() => {
    let list = [...allProducts];

    if (selectedCategory !== 'all') {
      list = list.filter(
        (p) =>
          p.categoryId === selectedCategory ||
          p.categoryName.toLowerCase() === selectedCategory.toLowerCase() ||
          p.categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-') === selectedCategory.toLowerCase()
      );
    }

    if (selectedOccasion !== 'all') {
      list = list.filter((p) =>
        p.occasions.some(
          (o) =>
            o.toLowerCase() === selectedOccasion.toLowerCase() ||
            o.toLowerCase().replace(/[^a-z0-9]+/g, '-') === selectedOccasion.toLowerCase()
        )
      );
    }

    if (selectedFabric !== 'all') {
      list = list.filter((p) => p.fabric.toLowerCase() === selectedFabric.toLowerCase());
    }

    if (selectedColor !== 'all') {
      list = list.filter((p) =>
        p.variants.some((v) => v.name.toLowerCase() === selectedColor.toLowerCase())
      );
    }

    if (selectedAvailability === 'in_stock') {
      list = list.filter((p) => p.totalStock > 0);
    }

    if (maxPriceParam < 80000) {
      list = list.filter((p) => p.salePrice <= maxPriceParam);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q) ||
          p.fabric.toLowerCase().includes(q) ||
          p.variants.some((v) => v.name.toLowerCase().includes(q))
      );
    }

    if (sortBy === 'price_asc') {
      list.sort((a, b) => a.salePrice - b.salePrice);
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => b.salePrice - a.salePrice);
    } else if (sortBy === 'popular') {
      list.sort((a, b) => Number(b.isBestSeller) - Number(a.isBestSeller) || b.reviewCount - a.reviewCount);
    } else {
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    return list;
  }, [
    allProducts,
    selectedCategory,
    selectedOccasion,
    selectedFabric,
    selectedColor,
    selectedAvailability,
    maxPriceParam,
    searchQuery,
    sortBy,
  ]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedOccasion !== 'all' ||
    selectedFabric !== 'all' ||
    selectedColor !== 'all' ||
    selectedAvailability !== 'all' ||
    maxPriceParam < 80000 ||
    Boolean(searchQuery);

  const FilterPanel = (
    <div className="space-y-7">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#1C1917] mb-3">
          Category
        </h3>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => updateParam('category', 'all')}
            className={`block w-full text-left py-1 text-sm transition-colors ${
              selectedCategory === 'all'
                ? 'font-semibold text-[#1C1917]'
                : 'text-[#6B6560] hover:text-[#1C1917]'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => updateParam('category', cat.slug)}
              className={`block w-full text-left py-1 text-sm transition-colors ${
                selectedCategory === cat.slug || selectedCategory === cat.id
                  ? 'font-semibold text-[#1C1917]'
                  : 'text-[#6B6560] hover:text-[#1C1917]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-5 border-t border-[#EAE4DC]">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#1C1917] mb-3">
          Occasion
        </h3>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => updateParam('occasion', 'all')}
            className={`block w-full text-left py-1 text-sm transition-colors ${
              selectedOccasion === 'all'
                ? 'font-semibold text-[#1C1917]'
                : 'text-[#6B6560] hover:text-[#1C1917]'
            }`}
          >
            All Occasions
          </button>
          {OCCASIONS.map((occ) => {
            const slug = occ.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            return (
              <button
                key={occ}
                type="button"
                onClick={() => updateParam('occasion', slug)}
                className={`block w-full text-left py-1 text-sm transition-colors ${
                  selectedOccasion === slug || selectedOccasion === occ.toLowerCase()
                    ? 'font-semibold text-[#1C1917]'
                    : 'text-[#6B6560] hover:text-[#1C1917]'
                }`}
              >
                {occ}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-5 border-t border-[#EAE4DC]">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#1C1917] mb-3">
          Fabric
        </h3>
        <select
          value={selectedFabric}
          onChange={(e) => updateParam('fabric', e.target.value)}
          aria-label="Filter by fabric"
          className="w-full bg-white border border-[#D8CFC2] px-3 py-2 text-sm text-[#1C1917] focus:outline-none focus:border-[#1C1917]"
        >
          <option value="all">All Fabrics</option>
          {fabrics.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      <div className="pt-5 border-t border-[#EAE4DC]">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#1C1917] mb-3">
          Color Shade
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => updateParam('color', 'all')}
            className={`px-2.5 py-1 text-xs border transition-colors ${
              selectedColor === 'all'
                ? 'border-[#1C1917] bg-[#1C1917] text-white'
                : 'border-[#D8CFC2] text-[#5C554F] hover:border-[#1C1917]'
            }`}
          >
            Any
          </button>
          {colors.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => updateParam('color', c.name)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border transition-colors ${
                selectedColor.toLowerCase() === c.name.toLowerCase()
                  ? 'border-[#1C1917] bg-[#FAF8F5] font-semibold text-[#1C1917]'
                  : 'border-[#E5DEC9] text-[#5C554F] hover:border-[#1C1917]'
              }`}
            >
              <span
                className="w-3 h-3 rounded-full border border-black/15"
                style={{ backgroundColor: c.hex }}
              />
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="pt-5 border-t border-[#EAE4DC]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#1C1917]">
            Max Price
          </h3>
          <span className="text-xs font-medium text-[#1C1917] tabular-nums">
            {maxPriceParam >= 80000 ? 'Any' : `₹${maxPriceParam.toLocaleString('en-IN')}`}
          </span>
        </div>
        <input
          type="range"
          min={5000}
          max={80000}
          step={2500}
          value={maxPriceParam}
          onChange={(e) =>
            updateParam('maxPrice', Number(e.target.value) >= 80000 ? '' : e.target.value)
          }
          aria-label="Maximum price filter"
          className="w-full accent-[#1C1917]"
        />
      </div>

      <div className="pt-5 border-t border-[#EAE4DC]">
        <label className="flex items-center gap-2.5 cursor-pointer text-sm text-[#1C1917]">
          <input
            type="checkbox"
            checked={selectedAvailability === 'in_stock'}
            onChange={(e) => updateParam('availability', e.target.checked ? 'in_stock' : 'all')}
            className="w-4 h-4 accent-[#1C1917]"
          />
          <span>In Stock Only</span>
        </label>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearAllFilters}
          className="w-full py-2.5 border border-[#D8CFC2] text-xs font-medium text-[#1C1917] hover:border-[#1C1917] transition-colors"
        >
          Reset All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <div className="pb-8 border-b border-[#EAE4DC] flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-[#9A7B4F]">
            Zari &amp; Loom Catalog
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-medium text-[#1C1917] mt-1">
            {selectedCategory !== 'all'
              ? categories.find((c) => c.slug === selectedCategory)?.name || 'Curated Pieces'
              : 'All Handloom & Couture Pieces'}
          </h1>
          <p className="text-sm text-[#6B6560] mt-2 tabular-nums">
            Showing {visibleProducts.length} of {filteredProducts.length} pieces
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateParam('search', localSearch.trim());
            }}
            className="relative flex-1 sm:w-64"
          >
            <Search className="w-4 h-4 text-[#8A8279] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                if (!e.target.value.trim()) updateParam('search', '');
              }}
              placeholder="Search silk, shade, style..."
              className="w-full pl-9 pr-3 py-2.5 border border-[#D8CFC2] text-sm text-[#1C1917] placeholder:text-[#8A8279] focus:outline-none focus:border-[#1C1917]"
            />
          </form>

          <select
            value={sortBy}
            onChange={(e) => updateParam('sort', e.target.value)}
            aria-label="Sort products"
            className="bg-white border border-[#D8CFC2] px-3 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:border-[#1C1917]"
          >
            <option value="latest">Sort: Latest</option>
            <option value="popular">Sort: Popularity</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>

          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 border border-[#1C1917] text-sm font-medium text-[#1C1917]"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-24">{FilterPanel}</div>
        </aside>

        <div className="lg:col-span-9">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="space-y-3 animate-pulse">
                  <div className="aspect-[3/4] bg-[#F3EFEA]" />
                  <div className="h-3 w-24 bg-[#F3EFEA]" />
                  <div className="h-4 w-48 bg-[#F3EFEA]" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center bg-[#FAF8F5] border border-[#EAE4DC] px-6">
              <p className="font-display text-3xl text-[#1C1917]">No matching pieces found</p>
              <p className="text-sm text-[#6B6560] mt-2">
                Try broadening your selected fabric, color shade, or price range.
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-6 px-6 py-2.5 bg-[#1C1917] text-white text-sm font-medium"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                {visibleProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {hasMore && (
                <div className="mt-12 text-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="px-8 py-3 border border-[#1C1917] text-sm font-medium text-[#1C1917] hover:bg-[#1C1917] hover:text-white transition-colors"
                  >
                    Load More Pieces ({filteredProducts.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-80 max-w-[85vw] bg-white h-full overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#EAE4DC]">
              <h2 className="font-display text-2xl font-medium text-[#1C1917]">Filter Pieces</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Close filters"
                className="p-2 text-[#1C1917]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {FilterPanel}
          </div>
        </div>
      )}
    </div>
  );
}
