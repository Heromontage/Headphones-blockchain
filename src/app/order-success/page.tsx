"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { MotionProps, Variants, motion } from 'framer-motion';

function OrderSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState<string>('');
  const [orderData, setOrderData] = useState<any>(null);
  const [pointsEarned, setPointsEarned] = useState<number>(0);
  const [pointsAnimation, setPointsAnimation] = useState<number>(0);

  useEffect(() => {
    // Get order ID from query params
    const idFromParams = searchParams.get('orderId');
    if (idFromParams) {
      setOrderId(idFromParams);
      loadOrderDetails(idFromParams);
    }
  }, [searchParams]);

  const loadOrderDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/orders/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }
      const resData = await response.json();
      setOrderData(resData);

      // Extract points earned from order
      if (resData.points_earned) {
        const earned = parseFloat(resData.points_earned);
        setPointsEarned(earned);

        // Animate the points counter
        setPointsAnimation(0);
        setTimeout(() => {
          setPointsAnimation(earned);
        }, 100);
      }
    } catch (error) {
      console.error('Failed to load order details:', error);
    }
  };

  const counterVariants: Variants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.5, duration: 1.5 } }
  };

  if (!orderId) {
    return <div className="p-8">Loading order details...</div>;
  }

  if (!orderData) {
    return <div className="p-8">Order not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-md p-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
            Order Confirmed!
          </h1>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-2">Order Details</h2>
                <p className="text-gray-600"><strong>Order ID:</strong> {orderData.id}</p>
                <p className="text-gray-600"><strong>Date:</strong> {new Date(orderData.createdAt).toLocaleDateString()}</p>
                <p className="text-gray-600"><strong>Total:</strong> ${parseFloat(orderData.total).toFixed(2)}</p>
                <p className="text-gray-600"><strong>Status:</strong> <span className={`px-2 py-1 rounded text-sm ${orderData.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{orderData.status}</span></p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-2">Rewards Earned</h2>
                {pointsEarned > 0 ? (
                  <motion.div
                    variants={counterVariants}
                    initial="hidden"
                    animate="visible"
                    className="text-center"
                  >
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      {pointsAnimation.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-500">AETHER Points</p>
                  </motion.div>
                ) : (
                  <p className="text-gray-500">No points earned on this order.</p>
                )}

                {orderData.points_tx_hash && (
                  <div className="mt-4 text-sm text-blue-600">
                    Transaction: <a
                      href={`https://mumbai.polygonscan.com/tx/${orderData.points_tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View on Polygonscan
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 text-center">
              <a
                href="/"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded transition-colors"
              >
                Continue Shopping
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading order details...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}