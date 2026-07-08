import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const POINTS_TO_DOLLAR_VALUE = parseFloat(process.env.POINTS_TO_DOLLAR_VALUE || '0.5');

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/");
  }

  let orders: any[] = [];
  let userRow: any = null;
  let dbAvailable = false;

  try {
    orders = await query(
      'SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC',
      [(session.user as any).id]
    ) as any[];
    const userResults = await query(
      'SELECT total_points_earned FROM users WHERE id = ?',
      [(session.user as any).id]
    ) as any[];
    userRow = userResults[0] || null;
    dbAvailable = true;
  } catch (error) {
    console.error("DB query failed:", error);
  }

  const userName = session.user?.name || session.user?.email?.split("@")[0] || "Aether User";
  const userInitial = userName[0]?.toUpperCase() || "U";
  const earned = userRow ? parseFloat(userRow.total_points_earned || '0') : 0;
  const redeemed = userRow ? parseFloat(userRow.total_points_redeemed || '0') : 0;
  const availablePoints = Math.max(0, earned - redeemed);
  const dollarValue = (availablePoints * POINTS_TO_DOLLAR_VALUE).toFixed(2);

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden relative">
      <Navbar />

      {/* Background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[#c87941]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-[#5227FF]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-[#7cff67]/3 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 pt-36 pb-24 px-6 max-w-7xl mx-auto">

        {/* Page Header */}
        <div className="mb-12">
          <p className="text-[#c87941] text-sm uppercase tracking-widest font-semibold mb-2">Dashboard</p>
          <h1 className="text-5xl font-bold tracking-tight">My Profile</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── LEFT COLUMN: User Info + Rewards + Quick Actions ── */}
          <div className="col-span-1 space-y-6">

            {/* Avatar + Name Card */}
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-md">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#c87941] to-[#8B5A2B] flex items-center justify-center text-4xl font-bold text-white shadow-[0_0_30px_rgba(200,121,65,0.3)] mb-4">
                  {userInitial}
                </div>
                <h2 className="text-2xl font-semibold">{userName}</h2>
                {session.user?.email && (
                  <p className="text-white/50 text-sm mt-1">{session.user.email}</p>
                )}
              </div>

              <div className="space-y-5 border-t border-white/10 pt-6">
                <div>
                  <p className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-1">Account ID</p>
                  <p className="font-mono text-xs text-white/60 bg-white/5 rounded-lg px-3 py-2 break-all">
                    {(session.user as any).id || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-1">Status</p>
                  <p className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-[#7cff67] shadow-[0_0_8px_#7cff67] inline-block" />
                    <span className="text-[#7cff67] font-medium">Active</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-1">Total Orders</p>
                  <p className="text-2xl font-light text-white">{orders.length}</p>
                </div>
              </div>
            </div>

            {/* ── AETHER Rewards Card ── */}
            <div className="relative bg-gradient-to-br from-[#c87941]/15 to-[#5227FF]/10 border border-[#c87941]/30 rounded-3xl p-6 backdrop-blur-md overflow-hidden">
              {/* Decorative glow blob */}
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-[#c87941]/20 rounded-full blur-2xl pointer-events-none" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-xl">⭐</span>
                  <h3 className="text-sm text-white/70 uppercase tracking-widest font-semibold">AETHER Rewards</h3>
                </div>

                {/* Points balance */}
                <div className="mb-5">
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Available Points</p>
                  <p className="text-5xl font-bold text-[#c87941] leading-none">
                    {availablePoints.toFixed(1)}
                  </p>
                  <p className="text-xs text-white/40 mt-1">AETHER pts</p>
                </div>

                {/* Dollar value */}
                <div className="bg-white/5 rounded-2xl p-4 mb-4">
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Redeemable Value</p>
                  <p className="text-2xl font-semibold text-[#7cff67]">${dollarValue}</p>
                  <p className="text-xs text-white/40 mt-0.5">≈ off your next order</p>
                </div>

                {/* Rate info */}
                <div className="border-t border-white/10 pt-4 space-y-2 text-xs text-white/50">
                  <div className="flex justify-between">
                    <span>Total earned</span>
                    <span className="text-white/60 font-medium">{earned.toFixed(1)} pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total redeemed</span>
                    <span className="text-red-400/70 font-medium">−{redeemed.toFixed(1)} pts</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-2 mt-1">
                    <span className="text-white/70">Available</span>
                    <span className="text-[#c87941] font-semibold">{availablePoints.toFixed(1)} pts</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span>Points per order</span>
                    <span className="text-[#c87941] font-medium">1.5 pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Value per point</span>
                    <span className="text-[#c87941] font-medium">$0.50 discount</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Usage</span>
                    <span className="text-white/60">1 pt → $0.50 off (per order)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-md">
              <h3 className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <a
                  href="/order"
                  className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-[#c87941]/10 border border-[#c87941]/20 hover:bg-[#c87941]/20 transition-all duration-200 group"
                >
                  <span className="text-sm text-[#c87941] font-medium">Place New Order</span>
                  <span className="text-[#c87941] group-hover:translate-x-1 transition-transform">→</span>
                </a>
                <a
                  href="/specs"
                  className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200 group"
                >
                  <span className="text-sm text-white/60 hover:text-white transition-colors">View Specs</span>
                  <span className="text-white/40 group-hover:translate-x-1 transition-transform">→</span>
                </a>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Order History ── */}
          <div className="col-span-1 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Order History</h2>
              {orders.length > 0 && (
                <span className="text-xs text-white/40 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                  {orders.length} order{orders.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {!dbAvailable ? (
              <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-10 text-center backdrop-blur-md">
                <div className="w-16 h-16 rounded-2xl bg-[#c87941]/10 border border-[#c87941]/20 flex items-center justify-center text-2xl mx-auto mb-5">
                  🗄️
                </div>
                <h3 className="text-lg font-semibold mb-2">Database not connected</h3>
                <p className="text-white/50 text-sm max-w-sm mx-auto mb-6 leading-relaxed">
                  Make sure your MySQL database is running and connected via Docker.
                </p>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-16 text-center backdrop-blur-md">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mx-auto mb-5">
                  🎧
                </div>
                <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                <p className="text-white/40 text-sm mb-8">Your future orders and rewards will appear here.</p>
                <a
                  href="/order"
                  className="inline-block bg-[#c87941] hover:bg-[#b06734] text-white px-8 py-3 rounded-full text-sm font-medium transition-all duration-300 shadow-[0_0_20px_rgba(200,121,65,0.3)]"
                >
                  Order Aether Edition 1
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const statusColor: Record<string, string> = {
                    PENDING: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
                    AWAITING_PAYMENT: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
                    PAID: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
                    PROCESSING: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
                    SHIPPED: 'text-[#c87941] bg-[#c87941]/10 border-[#c87941]/20',
                    OUT_FOR_DELIVERY: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
                    DELIVERED: 'text-[#7cff67] bg-[#7cff67]/10 border-[#7cff67]/20',
                    CANCELLED: 'text-red-400 bg-red-400/10 border-red-400/20',
                  };

                  const orderPoints = parseFloat(order.points_earned || '0');
                  const hasPoints = orderPoints > 0;

                  return (
                    <div
                      key={order.id}
                      className="bg-white/[0.03] border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all duration-200"
                    >
                      {/* Top row: product info + price + status */}
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[#c87941]/10 border border-[#c87941]/20 flex items-center justify-center text-lg flex-shrink-0">
                            🎧
                          </div>
                          <div>
                            <p className="font-medium">Aether Edition 1 — {order.itemColor}</p>
                            <p className="text-xs text-white/40 mt-0.5 font-mono">#{order.id.slice(0, 8)}</p>
                            <p className="text-xs text-white/40 mt-0.5">
                              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                year: "numeric", month: "long", day: "numeric"
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 md:flex-col md:items-end flex-shrink-0">
                          <p className="text-2xl font-light">${order.total}</p>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${statusColor[order.status] || 'text-white/60 bg-white/10 border-white/10'}`}>
                            {order.status?.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Rewards row */}
                      <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">⭐</span>
                          <span className="text-xs text-white/50">Rewards earned</span>
                        </div>
                        {hasPoints ? (
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-[#c87941]">
                              +{orderPoints.toFixed(1)} pts
                            </span>
                            <span className="text-xs text-white/30">≈</span>
                            <span className="text-xs font-medium text-[#7cff67]">
                              ${(orderPoints * POINTS_TO_DOLLAR_VALUE).toFixed(2)} value
                            </span>
                            {order.points_tx_hash && (
                              <span
                                title={order.points_tx_hash}
                                className="text-xs font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg text-white/40"
                              >
                                tx: {order.points_tx_hash.slice(0, 6)}…
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-white/30 italic">
                            {order.status === 'AWAITING_PAYMENT' || order.status === 'PENDING'
                              ? 'Pending payment'
                              : 'No points on this order'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
