import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/");
  }

  let orders: any[] = [];
  const dbAvailable = prisma !== null;

  if (dbAvailable) {
    try {
      orders = await (prisma as any).order.findMany({
        where: { userId: (session.user as any).id },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      console.error("DB query failed:", error);
    }
  }

  const userName = session.user?.name || session.user?.email?.split("@")[0] || "Aether User";
  const userInitial = userName[0]?.toUpperCase() || "U";

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden relative">
      <Navbar />

      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[#c87941]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-[#5227FF]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 pt-36 pb-24 px-6 max-w-7xl mx-auto">

        {/* Page Header */}
        <div className="mb-12">
          <p className="text-[#c87941] text-sm uppercase tracking-widest font-semibold mb-2">Dashboard</p>
          <h1 className="text-5xl font-bold tracking-tight">My Profile</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── User Info Card ── */}
          <div className="col-span-1 space-y-6">
            {/* Avatar + Name */}
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

          {/* ── Order History ── */}
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
              /* No DB configured — friendly notice */
              <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-10 text-center backdrop-blur-md">
                <div className="w-16 h-16 rounded-2xl bg-[#c87941]/10 border border-[#c87941]/20 flex items-center justify-center text-2xl mx-auto mb-5">
                  🗄️
                </div>
                <h3 className="text-lg font-semibold mb-2">Database not connected</h3>
                <p className="text-white/50 text-sm max-w-sm mx-auto mb-6 leading-relaxed">
                  Connect a PostgreSQL database by updating the <code className="text-[#c87941] bg-[#c87941]/10 px-1 rounded">DATABASE_URL</code> in your <code className="text-[#c87941] bg-[#c87941]/10 px-1 rounded">.env</code> file and running <code className="text-[#c87941] bg-[#c87941]/10 px-1 rounded">npx prisma db push</code>.
                </p>
                <div className="text-xs text-white/30 bg-white/5 border border-white/10 rounded-xl p-4 text-left font-mono">
                  DATABASE_URL=&quot;postgresql://user:pass@host:5432/db&quot;
                </div>
              </div>
            ) : orders.length === 0 ? (
              /* No orders yet */
              <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-16 text-center backdrop-blur-md">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mx-auto mb-5">
                  🎧
                </div>
                <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                <p className="text-white/40 text-sm mb-8">Your future orders will appear here.</p>
                <a
                  href="/order"
                  className="inline-block bg-[#c87941] hover:bg-[#b06734] text-white px-8 py-3 rounded-full text-sm font-medium transition-all duration-300 shadow-[0_0_20px_rgba(200,121,65,0.3)]"
                >
                  Order Aether Edition 1
                </a>
              </div>
            ) : (
              /* Order list */
              <div className="space-y-4">
                {orders.map((order) => {
                  const statusColor: Record<string, string> = {
                    PENDING: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
                    PROCESSING: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
                    SHIPPED: 'text-[#c87941] bg-[#c87941]/10 border-[#c87941]/20',
                    DELIVERED: 'text-[#7cff67] bg-[#7cff67]/10 border-[#7cff67]/20',
                  };
                  return (
                    <div
                      key={order.id}
                      className="bg-white/[0.03] border border-white/10 hover:border-white/20 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#c87941]/10 border border-[#c87941]/20 flex items-center justify-center text-lg">
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
                      <div className="flex items-center gap-4 md:flex-col md:items-end">
                        <p className="text-2xl font-light">${order.total}</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${statusColor[order.status] || 'text-white/60 bg-white/10 border-white/10'}`}>
                          {order.status}
                        </span>
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
