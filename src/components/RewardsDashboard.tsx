import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function RewardsDashboard() {
  const { data: session, status } = useSession();
  const [balance, setBalance] = useState<number>(0);
  const [totalEarned, setTotalEarned] = useState<number>(0);
  const [totalRedeemed, setTotalRedeemed] = useState<number>(0);
  const [recentRedemptions, setRecentRedemptions] = useState<Array<any>>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      loadUserData();
    }
  }, [session, status]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Fetch balance from blockchain
      const balanceResp = await fetch('/api/rewards/get-balance');
      const balanceData = await balanceResp.json();
      setBalance(balanceData.balance);

      // Fetch user stats from database
      const userResp = await fetch(`/api/users/${session.user.id}`);
      if (userResp.ok) {
        const userData = await userResp.json();
        setTotalEarned(userData.total_points_earned || 0);
        setTotalRedeemed(userData.total_points_redeemed || 0);
      }

      // Fetch recent redemptions
      const redemptionsResp = await fetch(`/api/redemptions?userId=${session.user.id}&limit=5`);
      if (redemptionsResp.ok) {
        const redemptionsData = await redemptionsResp.json();
        setRecentRedemptions(redemptionsData);
      }
    } catch (error) {
      console.error('Failed to load rewards data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (status === 'loading') {
    return <div className="text-center py-8">Loading session...</div>;
  }

  if (status === 'unauthenticated') {
    return <div className="text-center py-8">Please sign in to view your rewards</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">AETHER Points</h2>
        <p className="text-gray-600">Your cryptocurrency rewards balance</p>
      </div>

      <div className="text-center">
        <div className="text-4xl font-bold text-blue-600">{balance.toLocaleString()}</div>
        <p className="text-sm text-gray-500">ATP</p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-center text-sm text-gray-600">
        <div>
          <div className="font-medium">Total Earned</div>
          <div>{totalEarned.toLocaleString()}</div>
        </div>
        <div>
          <div className="font-medium">Total Redeemed</div>
          <div>{totalRedeemed.toLocaleString()}</div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-700">Recent Redemptions</h3>
        {recentRedemptions.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {recentRedemptions.map((redemption: any) => (
              <li key={redemption.id} className="flex justify-between px-3 py-2 bg-gray-50 rounded">
                <span>{redemption.discount_code}</span>
                <span>-{redemption.points_redeemed} ATP</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500">No recent redemptions</p>
        )}
      </div>

      <button
        onClick={() => {
          // Open redemption modal/popup
          alert('Redemption feature coming soon!');
        }}
        className="w-full bg-green-600 text-white py-3 px-4 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
        disabled={balance <= 0}
      >
        Redeem Points for Discount
      </button>
    </div>
  );
}