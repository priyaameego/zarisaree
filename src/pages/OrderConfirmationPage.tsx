import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight } from 'lucide-react';
import type { Order } from '../types';
import { formatDateTime, formatINR } from '../utils/format';
import { SafeImage } from '../components/SafeImage';

export function OrderConfirmationPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderNumber) return;
    fetch(`/api/orders/${encodeURIComponent(orderNumber)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.order) setOrder(data.order);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-sm text-[#6B6560]">
        Loading order confirmation...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="font-display text-4xl text-[#1C1917]">Order Not Found</h1>
        <p className="text-sm text-[#6B6560] mt-3">
          We could not locate order {orderNumber}. Please verify your order ID.
        </p>
        <Link
          to="/shop"
          className="inline-block mt-6 px-6 py-3 bg-[#1C1917] text-white text-sm font-medium"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <div className="bg-[#FAF8F5] border border-[#EAE4DC] p-6 sm:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-[#E5DEC9]">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="w-8 h-8 text-[#2F6B48] shrink-0 mt-1" />
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-[#9A7B4F]">
                Order Confirmed
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-medium text-[#1C1917] mt-1">
                Thank you, {order.customerName}
              </h1>
              <p className="text-sm text-[#5C554F] mt-1">
                Placed on {formatDateTime(order.createdAt)}
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#E5DEC9] px-5 py-3 text-left sm:text-right">
            <p className="text-[11px] uppercase tracking-wider text-[#7D766F]">Order ID</p>
            <p className="text-base font-semibold text-[#1C1917] tabular-nums mt-0.5">
              {order.orderNumber}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-7 border-b border-[#E5DEC9] text-sm">
          <div>
            <p className="text-xs uppercase tracking-wider text-[#7D766F] mb-1.5">
              Order Status
            </p>
            <div className="inline-flex items-center gap-2 font-semibold text-[#1C1917]">
              <Package className="w-4 h-4 text-[#9A7B4F]" />
              <span>{order.status}</span>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-[#7D766F] mb-1.5">
              Payment Details
            </p>
            <p className="font-medium text-[#1C1917]">
              {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'} ({order.paymentStatus})
            </p>
            <p className="text-xs text-[#6B6560] mt-0.5 tabular-nums">{order.paymentReference}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-[#7D766F] mb-1.5">
              Delivery Address
            </p>
            <p className="text-[#1C1917]">{order.shippingAddress}</p>
            <p className="text-xs text-[#6B6560]">
              {order.city}, {order.state} — {order.postalCode}
            </p>
            <p className="text-xs text-[#6B6560] mt-0.5 tabular-nums">{order.customerPhone}</p>
          </div>
        </div>

        <div className="py-6 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#1C1917]">
            Pieces Reserved
          </h2>
          <div className="divide-y divide-[#EAE4DC]">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-4 flex items-center gap-4">
                <div className="w-16 h-20 bg-white shrink-0 overflow-hidden">
                  <SafeImage
                    src={item.imageUrl}
                    alt={item.productName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1C1917]">{item.productName}</p>
                  <p className="text-xs text-[#6B6560] mt-0.5">
                    {item.colorName} <span aria-hidden="true">·</span> {item.size}
                    <span aria-hidden="true"> · </span> Qty {item.quantity}
                  </p>
                </div>
                <div className="text-sm font-semibold text-[#1C1917] tabular-nums">
                  {formatINR(item.lineTotal)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-5 border-t border-[#E5DEC9] space-y-2 text-sm max-w-xs ml-auto">
          <div className="flex justify-between text-[#5C554F]">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatINR(order.subtotal)}</span>
          </div>
          {order.discountTotal > 0 && (
            <div className="flex justify-between text-[#B85D6E]">
              <span>Savings</span>
              <span className="tabular-nums">−{formatINR(order.discountTotal)}</span>
            </div>
          )}
          <div className="flex justify-between text-[#5C554F]">
            <span>Shipping</span>
            <span className="tabular-nums">
              {order.shippingFee === 0 ? 'Complimentary' : formatINR(order.shippingFee)}
            </span>
          </div>
          <div className="flex justify-between text-base font-semibold text-[#1C1917] pt-2 border-t border-[#E5DEC9]">
            <span>Total</span>
            <span className="tabular-nums">{formatINR(order.totalAmount)}</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#E5DEC9] flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/account"
            className="text-sm font-medium text-[#5C554F] hover:text-[#1C1917]"
          >
            View in Account &amp; Order History
          </Link>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1C1917] text-white text-sm font-medium hover:bg-[#332E2A]"
          >
            <span>Continue Exploring</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
