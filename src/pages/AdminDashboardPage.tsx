import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Edit2,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import type {
  AdminOverview,
  Category,
  CustomerSummary,
  Order,
  OrderStatus,
  Product,
} from '../types';
import { useStore } from '../context/StoreContext';
import { formatDateTime, formatINR } from '../utils/format';
import { SafeImage } from '../components/SafeImage';
import { AdminProductModal } from '../components/AdminProductModal';

type AdminTab = 'overview' | 'products' | 'categories' | 'orders' | 'customers';

const ORDER_STATUSES: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

function statusStyle(status: OrderStatus): string {
  switch (status) {
    case 'Delivered':
      return 'bg-[#EDF7F1] text-[#225B3A] border-[#C5E2D0]';
    case 'Cancelled':
      return 'bg-[#FFF5F5] text-[#8B1E24] border-[#E8B4B8]';
    case 'Shipped':
    case 'Processing':
      return 'bg-[#F5F2EB] text-[#7A5D33] border-[#DFD2BC]';
    case 'Confirmed':
      return 'bg-[#F7ECEE] text-[#9A4252] border-[#E6C7CD]';
    default:
      return 'bg-[#FAF8F5] text-[#5C554F] border-[#E2DBD1]';
  }
}

export function AdminDashboardPage() {
  const { user, authLoading, logout, refreshCategories, notify } = useStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');

  // Modals / Drawers
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Category editor
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catImageUrl, setCatImageUrl] = useState('');
  const [catOrder, setCatOrder] = useState('1');
  const [catSaving, setCatSaving] = useState(false);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [ovRes, prodRes, catRes, ordRes, custRes] = await Promise.all([
        fetch('/api/admin/overview'),
        fetch('/api/products?includeInactive=true'),
        fetch('/api/categories'),
        fetch('/api/admin/orders'),
        fetch('/api/admin/customers'),
      ]);

      if (ovRes.status === 401) {
        navigate('/admin/login', { replace: true });
        return;
      }

      const [ov, prod, cat, ord, cust] = await Promise.all([
        ovRes.json(),
        prodRes.json(),
        catRes.json(),
        ordRes.json(),
        custRes.json(),
      ]);

      setOverview(ov.overview);
      setProducts(prod.products || []);
      setCategories(cat.categories || []);
      setOrders(ord.orders || []);
      setCustomers(cust.customers || []);
    } catch {
      notify('Unable to load admin data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [navigate, notify]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      navigate('/admin/login', { replace: true });
      return;
    }
    loadAdminData();
  }, [authLoading, user, navigate, loadAdminData]);

  const handleOrderStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || 'Failed to update status.', 'error');
        return;
      }
      setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
      if (selectedOrder?.id === orderId) setSelectedOrder(data.order);
      notify(`Order ${data.order.orderNumber} updated to ${nextStatus}.`, 'success');
      // Refresh overview & products (in case cancellation restored stock)
      loadAdminData();
    } catch {
      notify('Could not update order status.', 'error');
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/products/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        notify(`Deleted ${deleteTarget.name}.`, 'info');
        setDeleteTarget(null);
        loadAdminData();
      } else {
        notify('Unable to delete product.', 'error');
      }
    } catch {
      notify('Unable to delete product.', 'error');
    }
  };

  const startEditCategory = (cat: Category | null) => {
    setEditingCategory(cat);
    setCatName(cat?.name || '');
    setCatDescription(cat?.description || '');
    setCatImageUrl(cat?.imageUrl || '');
    setCatOrder(String(cat?.displayOrder ?? categories.length + 1));
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setCatSaving(true);
    try {
      const res = await fetch(
        editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories',
        {
          method: editingCategory ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: catName.trim(),
            description: catDescription.trim(),
            imageUrl: catImageUrl.trim(),
            displayOrder: Number(catOrder),
            isFeatured: true,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || 'Failed to save category.', 'error');
        return;
      }
      notify(editingCategory ? 'Category updated.' : 'Category created.', 'success');
      startEditCategory(null);
      await refreshCategories();
      await loadAdminData();
    } catch {
      notify('Unable to save category.', 'error');
    } finally {
      setCatSaving(false);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    try {
      const res = await fetch(`/api/categories/${catId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || 'Cannot delete category.', 'error');
        return;
      }
      notify('Category deleted.', 'info');
      await refreshCategories();
      await loadAdminData();
    } catch {
      notify('Unable to delete category.', 'error');
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.categoryName.toLowerCase().includes(q) ||
      p.fabric.toLowerCase().includes(q)
    );
  });

  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter !== 'All' && o.status !== orderStatusFilter) return false;
    const q = orderSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerEmail.toLowerCase().includes(q) ||
      o.customerPhone.toLowerCase().includes(q)
    );
  });

  if (authLoading || (!user && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[#6B6560]">
        Loading Atelier Admin...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-[#EAE4DC] shrink-0 flex flex-col justify-between">
        <div>
          <div className="px-6 py-5 border-b border-[#EAE4DC] flex items-center justify-between">
            <div>
              <Link to="/" className="font-display text-2xl font-semibold text-[#1C1917]">
                Zari &amp; Loom
              </Link>
              <p className="text-[11px] uppercase tracking-widest text-[#9A7B4F] mt-0.5">
                Admin Console
              </p>
            </div>
          </div>

          <nav className="p-3 flex lg:flex-col gap-1 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'orders', label: 'Orders', icon: ShoppingBag },
              { id: 'products', label: 'Products', icon: Package },
              { id: 'categories', label: 'Categories', icon: FolderTree },
              { id: 'customers', label: 'Customers', icon: Users },
            ].map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id as AdminTab)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-[#1C1917] text-white'
                      : 'text-[#5C554F] hover:bg-[#FAF8F5] hover:text-[#1C1917]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="hidden lg:block p-4 border-t border-[#EAE4DC] space-y-2">
          <Link
            to="/"
            className="block w-full text-center py-2 border border-[#D8CFC2] text-xs font-medium text-[#1C1917] hover:border-[#1C1917]"
          >
            View Live Storefront
          </Link>
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/admin/login');
            }}
            className="w-full inline-flex items-center justify-center gap-2 py-2 text-xs text-[#6B6560] hover:text-[#1C1917]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-5 sm:p-8 lg:p-10 max-w-6xl">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5DEC9]">
          <div>
            <p className="text-xs text-[#7D766F]">
              Atelier Admin / <span className="capitalize text-[#1C1917]">{activeTab}</span>
            </p>
            <h1 className="font-display text-3xl font-medium text-[#1C1917] mt-1 capitalize">
              {activeTab}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setProductModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1C1917] text-white text-xs font-medium hover:bg-[#332E2A] whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && overview && (
          <div className="mt-8 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-[#EAE4DC] p-5">
                <p className="text-xs text-[#7D766F]">Total Revenue</p>
                <p className="text-2xl font-semibold text-[#1C1917] mt-1.5 tabular-nums">
                  {formatINR(overview.totalRevenue)}
                </p>
              </div>
              <div className="bg-white border border-[#EAE4DC] p-5">
                <p className="text-xs text-[#7D766F]">Total Orders</p>
                <p className="text-2xl font-semibold text-[#1C1917] mt-1.5 tabular-nums">
                  {overview.totalOrders}
                </p>
              </div>
              <div className="bg-white border border-[#EAE4DC] p-5">
                <p className="text-xs text-[#7D766F]">Pending Orders</p>
                <p className="text-2xl font-semibold text-[#B85D6E] mt-1.5 tabular-nums">
                  {overview.pendingOrders}
                </p>
              </div>
              <div className="bg-white border border-[#EAE4DC] p-5">
                <p className="text-xs text-[#7D766F]">Catalog Products</p>
                <p className="text-2xl font-semibold text-[#1C1917] mt-1.5 tabular-nums">
                  {overview.totalProducts}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white border border-[#EAE4DC] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-[#1C1917]">Recent Orders</h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className="text-xs text-[#9A7B4F] hover:underline"
                  >
                    Manage All Orders
                  </button>
                </div>
                {orders.length === 0 ? (
                  <p className="text-sm text-[#6B6560] py-8 text-center">
                    No customer orders placed yet. Orders from the storefront appear here
                    immediately.
                  </p>
                ) : (
                  <div className="divide-y divide-[#F0EBE4]">
                    {orders.slice(0, 5).map((ord) => (
                      <div
                        key={ord.id}
                        className="py-3 flex items-center justify-between gap-4 text-sm"
                      >
                        <div>
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(ord)}
                            className="font-semibold text-[#1C1917] hover:underline tabular-nums"
                          >
                            {ord.orderNumber}
                          </button>
                          <p className="text-xs text-[#6B6560]">{ord.customerName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-[#1C1917] tabular-nums">
                            {formatINR(ord.totalAmount)}
                          </p>
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 text-[11px] border ${statusStyle(ord.status)}`}
                          >
                            {ord.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="lg:col-span-5 bg-white border border-[#EAE4DC] p-6">
                <h2 className="text-sm font-semibold text-[#1C1917] mb-4">
                  Low Stock Inventory (&le; 5 units)
                </h2>
                {products.filter((p) => p.totalStock <= 5).length === 0 ? (
                  <p className="text-sm text-[#6B6560] py-6">
                    All catalog pieces are sufficiently stocked.
                  </p>
                ) : (
                  <div className="divide-y divide-[#F0EBE4]">
                    {products
                      .filter((p) => p.totalStock <= 5)
                      .map((p) => (
                        <div
                          key={p.id}
                          className="py-3 flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="text-[#1C1917] truncate">{p.name}</span>
                          <span className="text-xs font-semibold text-[#B85D6E] tabular-nums shrink-0">
                            {p.totalStock} left
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="mt-8 space-y-5">
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <div className="relative sm:w-80">
                <Search className="w-4 h-4 text-[#8A8279] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search order ID, name, phone..."
                  className="w-full bg-white border border-[#D8CFC2] pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#1C1917]"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto">
                {['All', ...ORDER_STATUSES].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1.5 text-xs font-medium border whitespace-nowrap ${
                      orderStatusFilter === st
                        ? 'bg-[#1C1917] text-white border-[#1C1917]'
                        : 'bg-white text-[#5C554F] border-[#E2DBD1] hover:border-[#1C1917]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-[#EAE4DC] overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#EAE4DC] text-xs uppercase tracking-wider text-[#7D766F] bg-[#FAF8F5]">
                    <th className="py-3 px-4 font-medium">Order ID</th>
                    <th className="py-3 px-4 font-medium">Customer</th>
                    <th className="py-3 px-4 font-medium">Payment</th>
                    <th className="py-3 px-4 font-medium text-right">Total</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE4]">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#6B6560]">
                        No orders match your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-[#FAF8F5]/60">
                        <td className="py-3 px-4 font-semibold text-[#1C1917] tabular-nums whitespace-nowrap">
                          {ord.orderNumber}
                          <span className="block text-[11px] font-normal text-[#7D766F]">
                            {formatDateTime(ord.createdAt)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-[#1C1917]">{ord.customerName}</span>
                          <span className="block text-xs text-[#6B6560]">{ord.customerPhone}</span>
                        </td>
                        <td className="py-3 px-4 text-xs text-[#5C554F]">
                          {ord.paymentMethod === 'cod' ? 'COD' : 'Online'} · {ord.paymentStatus}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-[#1C1917] tabular-nums">
                          {formatINR(ord.totalAmount)}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={ord.status}
                            onChange={(e) =>
                              handleOrderStatusChange(ord.id, e.target.value as OrderStatus)
                            }
                            aria-label={`Update status for ${ord.orderNumber}`}
                            className={`text-xs font-medium px-2.5 py-1.5 border ${statusStyle(ord.status)}`}
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(ord)}
                            className="text-xs font-medium text-[#1C1917] underline hover:text-[#9A7B4F]"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="mt-8 space-y-5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative sm:w-80">
                <Search className="w-4 h-4 text-[#8A8279] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products, fabric, category..."
                  className="w-full bg-white border border-[#D8CFC2] pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#1C1917]"
                />
              </div>
              <p className="text-xs text-[#6B6560] tabular-nums">
                {filteredProducts.length} product(s)
              </p>
            </div>

            <div className="bg-white border border-[#EAE4DC] overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#EAE4DC] text-xs uppercase tracking-wider text-[#7D766F] bg-[#FAF8F5]">
                    <th className="py-3 px-4 font-medium">Piece</th>
                    <th className="py-3 px-4 font-medium">Category</th>
                    <th className="py-3 px-4 font-medium">Colors</th>
                    <th className="py-3 px-4 font-medium text-right">Sale Price</th>
                    <th className="py-3 px-4 font-medium text-right">Stock</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE4]">
                  {filteredProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-[#FAF8F5]/60">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-14 bg-[#FAF8F5] shrink-0 overflow-hidden">
                            <SafeImage
                              src={prod.variants[0]?.images[0] || ''}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-[#1C1917]">{prod.name}</p>
                            <p className="text-xs text-[#7D766F]">
                              {prod.fabric} {!prod.isActive && '· Hidden'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-[#5C554F]">{prod.categoryName}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {prod.variants.map((v) => (
                            <span
                              key={v.id}
                              title={`${v.name}: ${v.stock} left`}
                              className="w-4 h-4 rounded-full border border-black/15"
                              style={{ backgroundColor: v.hex }}
                            />
                          ))}
                          <span className="text-xs text-[#6B6560] ml-1 tabular-nums">
                            ({prod.variants.length})
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums">
                        <span className="font-semibold text-[#1C1917]">
                          {formatINR(prod.salePrice)}
                        </span>
                        {prod.discountPercent > 0 && (
                          <span className="block text-[11px] text-[#B85D6E]">
                            {prod.discountPercent}% off
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums font-medium">
                        <span
                          className={
                            prod.totalStock <= 5 ? 'text-[#B85D6E]' : 'text-[#1C1917]'
                          }
                        >
                          {prod.totalStock}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(prod);
                              setProductModalOpen(true);
                            }}
                            aria-label={`Edit ${prod.name}`}
                            className="p-2 text-[#1C1917] hover:bg-[#FAF8F5]"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(prod)}
                            aria-label={`Delete ${prod.name}`}
                            className="p-2 text-[#B85D6E] hover:bg-[#FFF5F5]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-white border border-[#EAE4DC] p-6 self-start">
              <h2 className="font-display text-2xl font-medium text-[#1C1917] mb-4">
                {editingCategory ? `Edit: ${editingCategory.name}` : 'Create Category'}
              </h2>
              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#4A443F] mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    className="w-full border border-[#D8CFC2] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A443F] mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={catDescription}
                    onChange={(e) => setCatDescription(e.target.value)}
                    className="w-full border border-[#D8CFC2] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A443F] mb-1">
                    Cover Image URL
                  </label>
                  <input
                    type="text"
                    value={catImageUrl}
                    onChange={(e) => setCatImageUrl(e.target.value)}
                    placeholder="/src/assets/images/..."
                    className="w-full border border-[#D8CFC2] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A443F] mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={catOrder}
                    onChange={(e) => setCatOrder(e.target.value)}
                    className="w-full border border-[#D8CFC2] px-3 py-2 text-sm tabular-nums"
                  />
                </div>

                <div className="flex gap-2">
                  {editingCategory && (
                    <button
                      type="button"
                      onClick={() => startEditCategory(null)}
                      className="px-4 py-2 border border-[#D8CFC2] text-xs font-medium"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={catSaving}
                    className="flex-1 py-2.5 bg-[#1C1917] text-white text-xs font-medium hover:bg-[#332E2A]"
                  >
                    {catSaving
                      ? 'Saving...'
                      : editingCategory
                        ? 'Save Category'
                        : 'Add Category'}
                  </button>
                </div>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white border border-[#EAE4DC] divide-y divide-[#F0EBE4]">
              {categories.map((cat) => (
                <div key={cat.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-14 bg-[#FAF8F5] shrink-0 overflow-hidden">
                      <SafeImage
                        src={cat.imageUrl}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1C1917]">{cat.name}</p>
                      <p className="text-xs text-[#6B6560] truncate">{cat.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEditCategory(cat)}
                      className="p-2 text-[#1C1917] hover:bg-[#FAF8F5]"
                      aria-label={`Edit ${cat.name}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-2 text-[#B85D6E] hover:bg-[#FFF5F5]"
                      aria-label={`Delete ${cat.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CUSTOMERS TAB */}
        {activeTab === 'customers' && (
          <div className="mt-8 bg-white border border-[#EAE4DC] overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#EAE4DC] text-xs uppercase tracking-wider text-[#7D766F] bg-[#FAF8F5]">
                  <th className="py-3 px-4 font-medium">Customer</th>
                  <th className="py-3 px-4 font-medium">Contact</th>
                  <th className="py-3 px-4 font-medium">City</th>
                  <th className="py-3 px-4 font-medium text-right">Orders</th>
                  <th className="py-3 px-4 font-medium text-right">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE4]">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[#6B6560]">
                      Customer records will appear automatically as orders are placed.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.email}>
                      <td className="py-3 px-4 font-medium text-[#1C1917]">{c.name}</td>
                      <td className="py-3 px-4 text-xs text-[#5C554F]">
                        {c.email}
                        <span className="block text-[#8A8279]">{c.phone}</span>
                      </td>
                      <td className="py-3 px-4 text-xs text-[#5C554F]">{c.city}</td>
                      <td className="py-3 px-4 text-right tabular-nums">{c.orderCount}</td>
                      <td className="py-3 px-4 text-right font-semibold tabular-nums">
                        {formatINR(c.totalSpent)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Product Add/Edit Modal */}
      {productModalOpen && (
        <AdminProductModal
          product={editingProduct}
          categories={categories}
          onClose={() => setProductModalOpen(false)}
          onSaved={() => {
            setProductModalOpen(false);
            loadAdminData();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white max-w-sm w-full p-6 border border-[#EAE4DC] space-y-4">
            <h3 className="font-display text-2xl font-medium text-[#1C1917]">
              Delete Product?
            </h3>
            <p className="text-sm text-[#5C554F]">
              Are you sure you want to permanently remove <strong>{deleteTarget.name}</strong> from
              the catalog?
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border border-[#D8CFC2] text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                className="flex-1 py-2.5 bg-[#8B1E24] text-white text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/45"
            onClick={() => setSelectedOrder(null)}
            aria-hidden="true"
          />
          <aside className="relative w-full max-w-lg bg-white h-full overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAE4DC]">
              <div>
                <p className="text-xs uppercase tracking-wider text-[#9A7B4F]">Order Record</p>
                <h2 className="font-display text-2xl font-medium text-[#1C1917] tabular-nums">
                  {selectedOrder.orderNumber}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close order details"
                className="p-2 text-[#6B6560] hover:text-[#1C1917]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-[#7D766F]">Update Fulfillment Status</p>
                <select
                  value={selectedOrder.status}
                  onChange={(e) =>
                    handleOrderStatusChange(selectedOrder.id, e.target.value as OrderStatus)
                  }
                  className="mt-1 w-full border border-[#1C1917] px-3 py-2 text-sm font-medium bg-white"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-[#FAF8F5] p-4 border border-[#EAE4DC] space-y-1.5">
                <p className="font-semibold text-[#1C1917]">{selectedOrder.customerName}</p>
                <p className="text-xs text-[#5C554F]">{selectedOrder.customerEmail}</p>
                <p className="text-xs text-[#5C554F] tabular-nums">{selectedOrder.customerPhone}</p>
                <p className="text-xs text-[#5C554F] pt-1">
                  {selectedOrder.shippingAddress}, {selectedOrder.city}, {selectedOrder.state} —{' '}
                  {selectedOrder.postalCode}
                </p>
                {selectedOrder.notes && (
                  <p className="text-xs text-[#9A7B4F] pt-1">Note: {selectedOrder.notes}</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#1C1917]">
                Items ({selectedOrder.items.length})
              </h3>
              <div className="divide-y divide-[#F0EBE4]">
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="py-3 flex gap-3">
                    <div className="w-14 h-18 bg-[#FAF8F5] shrink-0 overflow-hidden">
                      <SafeImage
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 text-xs">
                      <p className="font-semibold text-sm text-[#1C1917]">{item.productName}</p>
                      <p className="text-[#6B6560] mt-0.5">
                        {item.colorName} · {item.size} · Qty {item.quantity}
                      </p>
                      <p className="font-semibold text-[#1C1917] mt-1 tabular-nums">
                        {formatINR(item.lineTotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#EAE4DC] space-y-1.5 text-sm">
              <div className="flex justify-between text-[#5C554F]">
                <span>Payment</span>
                <span>
                  {selectedOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online'} (
                  {selectedOrder.paymentStatus})
                </span>
              </div>
              <div className="flex justify-between text-[#5C554F]">
                <span>Shipping</span>
                <span className="tabular-nums">
                  {selectedOrder.shippingFee === 0
                    ? 'Complimentary'
                    : formatINR(selectedOrder.shippingFee)}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-base text-[#1C1917] pt-2 border-t border-[#F0EBE4]">
                <span>Order Total</span>
                <span className="tabular-nums">{formatINR(selectedOrder.totalAmount)}</span>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
