import React, { useContext, useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, Switch, TouchableOpacity } from "react-native";
import { Card } from "react-native-paper";
import { MaterialCommunityIcons } from "react-native-vector-icons";
import { useAuth } from "../AuthContext";

export default function ProfileScreen() {
  const { walletInfo, logout } = useAuth();
  useEffect(() => {
    if (walletInfo.connected && walletInfo.address) {
      fetchUserProfile(walletInfo.address);
    }
  }, [walletInfo]);
  // Editable user information state
  const [userInfo, setUserInfo] = useState({
    Name: "Jane Doe",
    Email: "example@email.com",
    Height: "5'4''",
    Weight: "130 lbs",
    Age: "30",
    Gender: "Female",
    BMI: "22.3"
  });

  const fetchUserProfile = async (walletId: string) => {
    try {
      const response = await fetch("http://75.131.29.55:5100/get-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ wallet_id: walletId }),
      });
  
      const data = await response.json();
  
      if (response.ok && data) {
        setUserInfo({
          Name: data.name || "",
          Email: data.email || "",
          Height: data.height?.toString() || "",
          Weight: data.weight?.toString() || "",
          Age: data.age?.toString() || "",
          Gender: data.gender || "",
          BMI: data.bmi?.toString() || "",
        });
      } else {
        console.warn("Profile not found or error:", data);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };
  
  // Handle input changes
  const handleChange = (key: string, value: string) => {
    setUserInfo({ ...userInfo, [key]: value });
  };

  const saveProfile = async () => {
    try {
      const response = await fetch("http://75.131.29.55:5100/add-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet_id: walletInfo.address,
          name: userInfo.Name,
          email: userInfo.Email,
          height: parseFloat(userInfo.Height),
          weight: parseFloat(userInfo.Weight),
          age: parseInt(userInfo.Age),
          gender: userInfo.Gender,
          bmi: parseFloat(userInfo.BMI),
        }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        // Do nothing
      } else {
        alert(`Failed to save profile: ${data.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("An error occurred while saving your profile.");
    }
  };
  

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Profile</Text>

      {/* Wallet Information */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="wallet" size={30} color="#007bff" />
            <Text style={styles.cardTitle}>Wallet Information</Text>
          </View>
          <Text style={styles.label}>
            Status:  
            <Text style={walletInfo.connected ? styles.connected : styles.disconnected}>
              {walletInfo.connected ? " Connected ✅" : " Not Connected ❌"}
            </Text>
          </Text>
          <Text style={styles.label}>Address: {walletInfo.connected ? walletInfo.address : "N/A"}</Text>
        </Card.Content>
      </Card>

      {/* Personal Information (Editable) */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="account" size={30} color="#007bff" />
            <Text style={styles.cardTitle}>Personal Information</Text>
          </View>
          {Object.keys(userInfo).map((key) => (
            <View key={key} style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{key.replace(/([A-Z])/g, " $1")}</Text>
              <TextInput
                style={styles.input}
                value={userInfo[key as keyof typeof userInfo]}
                onChangeText={(text) => handleChange(key, text)}
                placeholder={`Enter ${key}`}
              />
            </View>
          ))}
<TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
<Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </Card.Content>
      </Card>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 70,
    backgroundColor: "#f0f0f0",
  },
  
  header: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    marginBottom: 20,
    elevation: 2,
    backgroundColor: "#ffffff",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 10,
  },
  label: {
    fontSize: 16,
    marginVertical: 4,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#555",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  saveButton: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  settingLabel: {
    fontSize: 16,
  },
  connected: {
    color: "green",
    fontWeight: "bold",
  },
  disconnected: {
    color: "red",
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "#e74c3c",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
