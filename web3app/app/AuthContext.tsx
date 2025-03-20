import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useWalletConnectModal } from "@walletconnect/modal-react-native";

interface WalletInfo {
  connected: boolean;
  address: string | null;
  status: string;
}

interface AuthContextType {
  walletInfo: WalletInfo;
  connectWallet: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { open, isConnected, address, provider } = useWalletConnectModal();
  const [walletInfo, setWalletInfo] = useState<WalletInfo>({
    connected: false,
    address: null,
    status: "Not connected",
  });

  // Automatically update wallet state when connection changes
  useEffect(() => {
    if (isConnected && address) {
      setWalletInfo({
        connected: true,
        address,
        status: "Connected",
      });
    } else {
      setWalletInfo({
        connected: false,
        address: null,
        status: "Not connected",
      });
    }
  }, [isConnected, address]);

  const connectWallet = async () => {
    try {
      await open(); // Open WalletConnect modal
    } catch (error) {
      console.error("Wallet connection error:", error);
    }
  };

  const logout = () => {
    provider?.disconnect();
    setWalletInfo({
      connected: false,
      address: null,
      status: "Disconnected",
    });
  };

  return (
    <AuthContext.Provider value={{ walletInfo, connectWallet, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
