"use client";

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { metaMask } from 'wagmi/connectors';
import { hardhat } from 'wagmi/chains';

export default function WalletConnection() {
  const { address, isConnected } = useAccount();
  const { connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [manualInstruction, setManualInstruction] = useState(false);

  const saveWalletAddress = async (walletAddress: string) => {
    try {
      await fetch('/api/user/wallet', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress })
      });
    } catch (err) {
      console.error('Failed to save wallet address:', err);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setErrorMsg('');
    setManualInstruction(false);
    
    try {
      const result = await connectAsync({
        connector: metaMask()
      });
      
      let currentChainId = result.chainId;
      let accountAddress = result.accounts[0];

      if (currentChainId !== hardhat.id) {
        try {
          if (switchChainAsync) {
             const switchResult = await switchChainAsync({ chainId: hardhat.id });
             currentChainId = switchResult.id;
          } else {
             throw new Error("switchChainAsync is not available");
          }
        } catch (switchError: any) {
          // If code 4902, the chain hasn't been added yet, but wagmi's switchChainAsync with hardhat chain 
          // usually attempts to add it if missing under the hood. If it still fails:
          console.error('Failed to switch chain:', switchError);
          if (switchError?.code === 4902 || switchError?.message?.includes('4902')) {
            try {
              // Fallback to manual window.ethereum.request
              await (window as any).ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x7a69', // 31337 in hex
                  chainName: 'Hardhat Local',
                  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                  rpcUrls: ['http://127.0.0.1:8545']
                }]
              });
              currentChainId = hardhat.id;
            } catch (addError) {
              console.error('Failed to add chain:', addError);
              setManualInstruction(true);
              setIsConnecting(false);
              return; // Stop here, do not save to DB
            }
          } else {
            setManualInstruction(true);
            setIsConnecting(false);
            return;
          }
        }
      }

      if (currentChainId === hardhat.id && accountAddress) {
        await saveWalletAddress(accountAddress);
      }
      
    } catch (error: any) {
      console.error('Connection error:', error);
      setErrorMsg(error.message || 'Failed to connect');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectAsync();
    } catch (error) {
      console.error('Disconnection error:', error);
    }
  };

  // If already connected but wrong network, auto-prompt switch on mount/change
  // If connected and on correct network, ensure backend is synced.
  useEffect(() => {
    if (isConnected && address && chainId !== hardhat.id) {
       setManualInstruction(true);
    } else if (isConnected && address && chainId === hardhat.id) {
       setManualInstruction(false);
       saveWalletAddress(address);
    } else {
       setManualInstruction(false);
    }
  }, [isConnected, address, chainId]);

  if (!isConnected && !address) {
    return (
      <div className="space-y-2">
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="px-4 py-2 bg-[#c87941] text-white rounded-xl hover:bg-[#b06734] transition-colors disabled:opacity-50 text-sm font-medium shadow-[0_0_15px_rgba(200,121,65,0.2)]"
        >
          {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
        </button>
        {errorMsg && <p className="text-red-400 text-xs">{errorMsg}</p>}
        {manualInstruction && (
          <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-xs mt-2 text-red-200">
            <p className="font-semibold mb-1">Please switch to Hardhat network manually in MetaMask:</p>
            <ul className="list-disc pl-4 space-y-1 text-white/70">
              <li>Network Name: Hardhat Local</li>
              <li>RPC URL: http://127.0.0.1:8545</li>
              <li>Chain ID: 31337</li>
              <li>Currency Symbol: ETH</li>
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between bg-white/5 border border-white/10 p-2 rounded-xl">
        <div className="flex items-center space-x-2 px-2">
          <div className="w-6 h-6 bg-[#c87941] rounded-full flex items-center justify-center text-white text-xs font-bold">
            M
          </div>
          <span className="text-sm font-medium text-white/90">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
        </div>
        <button
          onClick={handleDisconnect}
          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-xs font-medium"
        >
          Disconnect
        </button>
      </div>
      {manualInstruction && (
          <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-xs mt-2 text-red-200">
            <p className="font-semibold mb-1">Wrong Network. Please switch to Hardhat local:</p>
            <button onClick={handleConnect} className="mt-1 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded text-red-100">Switch Network</button>
          </div>
      )}
    </div>
  );
}