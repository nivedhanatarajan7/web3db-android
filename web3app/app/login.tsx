import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAuth } from "./AuthContext";
import { WalletConnectModal, useWalletConnectModal } from "@walletconnect/modal-react-native";
import { useRouter } from "expo-router";

const projectId = '0251b595c8c7c2e38f37046849a01a15';

const metadata = {
  name: 'Web3DB App',
  description: 'Web3DB App Connect',
  url: 'https://reown.com/appkit',
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
  redirect: {
    native: 'YOUR_APP_SCHEME://',
    universal: 'YOUR_APP_UNIVERSAL_LINK.com'
  }
};

export default function LoginScreen() {
  const router = useRouter();
  const { walletInfo, connectWallet } = useAuth();
  const { open, isConnected, address } = useWalletConnectModal();

  const handleButtonPress = async () => {
    if (!isConnected) {
      await open();
    }
  };

  // Redirect user to home page when wallet is connected
  useEffect(() => {
    if (walletInfo.connected) {
      console.log("Wallet Connected:", walletInfo.address);
      
      // Delay navigation slightly to ensure app is fully mounted
      setTimeout(() => {
        router.replace("/");
      }, 500);
    }
  }, [walletInfo.connected]);

  // Format wallet address
  const formatAddress = (addr: string | undefined) => {
    return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "No wallet connected";
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Web3DB App</Text>
        <Text>{formatAddress(address)}</Text>

        {!walletInfo.connected ? (
          <TouchableOpacity style={styles.button} onPress={handleButtonPress}>
            <Text style={styles.buttonText}>Connect to MetaMask</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.walletText}>Connected Wallet: {formatAddress(walletInfo.address)}</Text>
        )}
      </View>

      {/* WalletConnectModal */}
      <WalletConnectModal 
        explorerRecommendedWalletIds={['c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96']}
        explorerExcludedWalletIds="ALL"
        projectId={projectId}
        providerMetadata={metadata}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  card: {
    width: "90%",
    maxWidth: 400,
    padding: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  button: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 15,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  walletText: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    color: "#333",
  },
});
