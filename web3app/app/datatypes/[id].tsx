import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Dimensions, Alert } from "react-native";
import axios from "axios";
import { Card, Text, Button, IconButton } from "react-native-paper";
import { useLocalSearchParams } from "expo-router";
import { LineChart } from "react-native-gifted-charts";
import { useAuth } from "../AuthContext";
import {
  initialize,
  requestPermission,
  readRecords,
} from "react-native-health-connect";
import { PermissionsAndroid } from "react-native";

const { width } = Dimensions.get("window");

interface DataScreenProps {
  category: string;
  dataType: string;
  measurement: string;
}

const DataScreen: React.FC<DataScreenProps> = ({
  category,
  dataType,
  measurement,
}) => {
  const params = useLocalSearchParams();

  const { walletInfo } = useAuth();
  const id = dataType as string;
  const category_use = category as string;
  const measurementUnit = measurement as string;
  const title = id?.replace(/-/g, " ") || "Unknown"; // Format for display

  const [values, setValues] = useState<number[]>([]);
  const [timestamps, setTimestamps] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);
  const [timeframe, setTimeframe] = useState<string>("5 hours");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  useEffect(() => {
    if (values.length > 0) {
      setCurrent(values.at(0) ?? 0);
    }
  }, [values]);

  const requestActivityPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeframe, selectedDate]);

  const fetchData = async () => {
    try {
      if (dataType == "Footsteps") {
        const readSampleData = async () => {
          const isInitialized = await initialize();
          console.log("isInitialized:", isInitialized);

          if (isInitialized) {
            const hasActivityPermission = await requestActivityPermission();
            if (!hasActivityPermission) {
              console.log("Activity recognition permission not granted.");
              return;
            }

            const grantedPermissions = await requestPermission([
              { accessType: "read", recordType: "Steps" },
            ]);

            console.log(
              "Full grantedPermissions response:",
              JSON.stringify(grantedPermissions, null, 2)
            );

            if (grantedPermissions.length > 0) {
              console.log(selectedDate.toISOString().split(".")[0] + "Z");

              const result = await readRecords("Steps", {
                timeRangeFilter: {
                  operator: "between",
                  startTime:
                    new Date(selectedDate.getTime() - 86400000)
                      .toISOString()
                      .split(".")[0] + "Z",
                  endTime: selectedDate.toISOString().split(".")[0] + "Z",
                },
              });

              console.log("Step count data:", result);

              const totalCount = result.records.reduce(
                (sum, record) => sum + record.count,
                0
              );

              const lastTimestamp = result.records.reduce(
                (max, record) =>
                  new Date(record.endTime) > new Date(max)
                    ? record.endTime
                    : max,
                result.records[0].endTime
              );

              const requestBody = {
                topic: `${walletInfo.address}/Exercise/${id}`,
                payload: {
                  dataType: totalCount,
                  timestamp: lastTimestamp,
                },
              };

              console.log("Sending API request with:", requestBody);

              const response = await axios.post(
                "http://129.74.152.201:5100/add-medical",
                requestBody
              );
            } else {
              console.log("No permissions granted.");
            }
          }
        };

        readSampleData();
      }

      const requestBody2 = {
        time: timeframe,
        topic: `${walletInfo.address}/Exercise/${id}`,
        date: selectedDate.toISOString().split("T")[0],
      };

      console.log("Sending API request with:", requestBody2);

      const response = await axios.post(
        "http://129.74.152.201:5100/get-medical",
        requestBody2
      );

      console.log("API Response:", response.data);

      if (!response.data || response.data.message === "No data available") {
        console.warn("No data received for:", timeframe);
        return; // Do not clear existing values
      }

      const rawData = response.data.data;

      console.log("Raw Data:", rawData);

      let timeLimit = new Date(selectedDate).getTime();

        if (timeframe === "Last 15 mins") {
          timeLimit  -= 15 * 60 * 1000;
        } else if (timeframe === "Last 2 hours") {
          timeLimit -= 2 * 60 * 60 * 1000;
        } else if (timeframe === "Last 24 hours") {
          timeLimit -= 24 * 60 * 60 * 1000;
        }

      if (rawData.length > 0) {
        const newValues = rawData.map((record: any) =>
          parseFloat(record.dataType)
        );
        const newTimestamps = rawData.map((record: any) =>
          new Date(record.timestamp).getTime()
        );

        setValues(newValues);
        setTimestamps(newTimestamps);

        console.log("Fetched values:", newValues);
        console.log("Fetched timestamps:", newTimestamps);
      } else {
        console.warn("No data found!");
      }

      console.log(values);
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  const generateFullTimeRange = () => {
    const now = selectedDate.getTime();
    let startTime = now;

    if (timeframe === "1 hour") startTime -= 3600 * 1000;
    else if (timeframe === "5 hours") startTime -= 5 * 3600 * 1000;
    else if (timeframe === "24 hours") startTime -= 24 * 3600 * 1000;

    const timeRange = [];
    const totalPoints = 27; // Keep labels well-spaced
    const interval = (now - startTime) / totalPoints; // Dynamic spacing

    for (let t = startTime; t <= now; t += interval) {
      timeRange.push(Math.round(t)); // Round timestamps to prevent small drifts
    }

    return timeRange;
  };

  const mergedData = () => {
    const completeTimeRange = generateFullTimeRange();

    if (values.length === 1) {
      // If only one data point exists, place it in the middle of the time range
      const middleIndex = Math.floor(completeTimeRange.length / 2);
      const filledValues = completeTimeRange.map(
        (_, index) => (index === middleIndex ? values[0] : 0) // Only set the value at one index
      );

      return {
        formattedLabels: completeTimeRange.map((time, index) =>
          index % Math.ceil(completeTimeRange.length / 10) === 0
            ? new Date(time).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "UTC",
          })
            : ""
        ),
        mergedValues: filledValues,
      };
    }

    // Normal case when multiple data points exist
    const mergedValues = completeTimeRange.map((time) => {
      const closestIndex = timestamps.findIndex(
        (t) => Math.abs(t - time) <= 30 * 60 * 1000
      );
      return closestIndex !== -1 ? values[closestIndex] : 0;
    });

    const labelInterval = Math.ceil(completeTimeRange.length / 10);
    const formattedLabels = completeTimeRange.map((time, index) =>
      index % labelInterval === 0
        ? new Date(time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : ""
    );

    return { formattedLabels, mergedValues };
  };

  const fillMissingData = (timestamps: number[], values: number[]) => {
    if (timestamps.length === 0) return { timestamps: [], values: [] };

    const filledTimestamps: number[] = [];
    const filledValues: number[] = [];

    const startTime = timestamps[0];
    const endTime = timestamps[timestamps.length - 1];
    const interval = (endTime - startTime) / (timestamps.length - 1) || 60000;

    for (let time = startTime; time <= endTime; time += interval) {
      const index = timestamps.indexOf(time);
      if (index !== -1) {
        filledTimestamps.push(time);
        filledValues.push(values[index]);
      } else {
        filledTimestamps.push(time);
        filledValues.push(0);
      }
    }

    return { timestamps: filledTimestamps, values: filledValues };
  };

  const { formattedLabels, mergedValues } = mergedData();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        {title} Overview
      </Text>

      <View style={styles.date}>
        <IconButton
          icon="chevron-left"
          size={24}
          onPress={() => {
            const newDate = new Date(selectedDate.getTime() - 86400000);
            setSelectedDate(newDate);
            fetchData();
          }}
        />
        <Button mode="contained" buttonColor="#2196F3">
          {selectedDate.toDateString()}
        </Button>
        <IconButton
          icon="chevron-right"
          size={24}
          onPress={() => {
            const newDate = new Date(selectedDate.getTime() + 86400000);
            setSelectedDate(newDate);
            fetchData();
          }}
        />
      </View>

      <View style={styles.buttonRow}>
        {["1 hour", "5 hours", "24 hours"].map((item) => (
          <Button
            key={item}
            mode="contained"
            style={[
              styles.timeButton,
              timeframe === item ? styles.activeButton : styles.inactiveButton,
            ]}
            labelStyle={
              timeframe === item
                ? styles.activeButtonText
                : styles.inactiveButtonText
            }
            onPress={() => {
              setTimeframe(item);
              fetchData();
            }}
          >
            {item}
          </Button>
        ))}
      </View>

      <View style={styles.chartContainer}>
        <LineChart
          data={values.map((value, index) => ({
            value,
            label: timestamps[index]
              ? new Date(timestamps[index]).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "",
          }))}
          width={width * 0.5}
          height={150}
          color="rgba(0, 123, 255, 1)"
          yAxisTextStyle={{ color: "#000000" }}
          xAxisLabelTextStyle={{ color: "#000000", fontSize: 10 }}
          startFillColor="rgba(0, 123, 255, 1)"
          endFillColor="rgba(20,85,81,0.01)"
          noOfSections={3}
          areaChart
          curved
          showXAxisIndices
          xAxisIndicesHeight={5}
        />
      </View>

      <View style={styles.valueCardContainer}>
        <Card style={styles.valueCard}>
          <Text variant="titleMedium" style={styles.valueTitle}>
            Current {title}
          </Text>
          <Text variant="displaySmall" style={styles.valueText}>
            {current} {measurement}
          </Text>
        </Card>

        <Card style={styles.valueCard}>
          <Text variant="titleMedium" style={styles.valueTitle}>
            Total Steps
          </Text>
          <Text variant="displaySmall" style={styles.valueText}>
            {values.reduce((a, b) => a + b, 0)} {measurement}
          </Text>
        </Card>
      </View>
    </ScrollView>
  );
};

export default DataScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f0f0f0",
    padding: 20,
    alignItems: "center",
  },

  title: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 10,
  },

  date: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: 15,
  },

  timeButton: {
    marginHorizontal: 5,
    borderRadius: 8,
  },

  activeButton: {
    backgroundColor: "#007AFF",
  },

  activeButtonText: {
    color: "white",
  },

  inactiveButton: {
    backgroundColor: "#E0E0E0",
  },

  inactiveButtonText: {
    color: "#000000",
  },

  chartContainer: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
  },

  valueCardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },

  valueCard: {
    width: "48%",
    backgroundColor: "#2196F3",
    padding: 15,
    marginVertical: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  valueTitle: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 5,
  },

  valueText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
  },
});
