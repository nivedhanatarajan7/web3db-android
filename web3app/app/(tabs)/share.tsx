import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, ScrollView } from "react-native";
import { Card } from "react-native-paper";
import { useAuth } from "../AuthContext";
import DateTimePicker from '@react-native-community/datetimepicker';

const ShareDeviceScreen = () => {
  const [deviceId, setDeviceId] = useState("");
  const [walletId, setWalletId] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [devices, setDevices] = useState([]);
  const router = useRouter();
  const { walletInfo, logout } = useAuth();

  // Fetch the devices for the logged-in user
  const getDevice = async () => {
    try {
      const response = await axios.post(
        "http://129.74.152.201:5100/get-registered-devices",
        {
          wallet_id: walletInfo.address,
        }
      );
      console.log(response.data);  // Debug log for the response data
      setDevices(response.data.devices); // Store the devices
    } catch (error) {
      console.error("Error fetching devices:", error);
      setDevices([]); // If there's an error, ensure the devices array is empty
    }
  };

  useEffect(() => {
    if (walletInfo?.address) {
      getDevice(); // Fetch devices when the component mounts or wallet address changes
    }
  }, [walletInfo.address]);

  // Handle sharing device access
  const shareDevice = async () => {
    const startTime = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      0,
      0,
      0
    ).toISOString().split(".")[0] + "Z";

    const endTime = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      23,
      59,
      0
    ).toISOString().split(".")[0] + "Z";

    const newEntry = {
      wallet_id: walletId,
      owner_id: walletInfo.address,
      device_id: deviceId,
      start_time: startTime,
      end_time: endTime,
    };

    try {
      const response = await fetch("http://129.74.152.201:5100/share-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntry),
      });

      const responseData = await response.json();
      console.log("Shared successfully:", responseData);
    } catch (error) {
      console.log("Error sharing device:", error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Share Data</Text>
      <Card style={styles.card}>
        <Text style={styles.header}>Share Data with Users</Text>
        <Text style={styles.formlabel}>User's Wallet ID</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Wallet ID"
          value={walletId}
          onChangeText={setWalletId}
        />

        <Text style={styles.formlabel}>Select Device</Text>
        {devices.length === 0 ? (
          <Text style={styles.noDevices}>No devices found for your wallet.</Text>
        ) : (
          devices.map((device) => {
            console.log("Device: ", device); // Debugging each device object
            return (
              <View key={device.device_id} style={styles.deviceCard}>
                <Text
                  style={[
                    styles.deviceText,
                    deviceId === device.device_id && {
                      fontWeight: "bold",
                      color: "#007AFF",
                    },
                  ]}
                  onPress={() => setDeviceId(device.device_id)}
                >
                  {device.name} ({device.category})
                </Text>
              </View>
            );
          })
        )}

        <View style={styles.datepicker}>
          <Text style={styles.formlabel}>Select Date</Text>
          <Button
            title={selectedDate.toDateString()}
            onPress={() => setShowDatePicker(true)}
            color="#007AFF"
          />

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="calendar"
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) setSelectedDate(date);
              }}
            />
          )}
        </View>

        <Button title="Share Data" onPress={shareDevice} color="#007AFF" />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "black",
    textAlign: "center",
    marginBottom: 20,
  },
  datepicker: {
    marginBottom: 20,
  },
  formlabel: {
    fontSize: 15,
    fontWeight: "bold",
    color: "gray",
    marginBottom: 10,
  },
  card: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    color: "black",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  noDevices: {
    textAlign: "center",
    color: "gray",
  },
  deviceCard: {
    backgroundColor: "#e0e0e0e0",
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
  },
  deviceText: {
    fontSize: 16,
    color: "#000000",
  },
});

export default ShareDeviceScreen;
