'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function AdminOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const VALID_STATUSES = ['PENDING', 'AWAITING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (status === 'authenticated') {
      fetchOrders();
    }
  }, [status]);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders');
      if (!res.ok) {
        if (res.status === 403) {
          setError('Forbidden: You do not have admin access.');
        } else {
          setError('Failed to fetch orders.');
        }
        setLoading(false);
        return;
      }
      const data = await res.json();
      setOrders(data.orders || []);
      setLoading(false);
    } catch (err) {
      setError('An error occurred.');
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      } else {
        alert('Failed to update status');
      }
    } catch (err) {
      alert('An error occurred while updating status');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0a0f] text-white">
        <Navbar />
        <div className="pt-32 px-6 max-w-7xl mx-auto">
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#0a0a0f] text-white">
        <Navbar />
        <div className="pt-32 px-6 max-w-7xl mx-auto">
          <div className="bg-red-500/10 border border-red-500 p-6 rounded-xl text-red-200">
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p>{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />
      <div className="pt-32 px-6 max-w-7xl mx-auto pb-24">
        <h1 className="text-3xl font-bold mb-8">Admin Order Management</h1>

        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/10 text-white/60">
              <tr>
                <th className="px-4 py-3 font-medium">Order ID</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">ETH Paid</th>
                <th className="px-4 py-3 font-medium">Tx Hash</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-4 font-mono text-xs text-white/80">{order.id.slice(0, 8)}...</td>
                  <td className="px-4 py-4 text-white/60">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-4">
                    <div className="font-medium">{order.name}</div>
                    <div className="text-xs text-white/50">{order.email}</div>
                  </td>
                  <td className="px-4 py-4">{order.itemColor}</td>
                  <td className="px-4 py-4 text-[#c87941]">
                    {order.eth_amount ? (Number(order.eth_amount)).toFixed(4) : '-'}
                  </td>
                  <td className="px-4 py-4">
                    {order.payment_tx_hash ? (
                      <a href={`#`} className="text-blue-400 hover:underline font-mono text-xs" title={order.payment_tx_hash}>
                        {order.payment_tx_hash.slice(0, 6)}...{order.payment_tx_hash.slice(-4)}
                      </a>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="bg-[#0a0a0f] border border-white/20 text-white text-xs rounded px-2 py-1 outline-none focus:border-[#c87941]"
                    >
                      {VALID_STATUSES.map(s => (
                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-white/50">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
