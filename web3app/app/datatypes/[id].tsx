import React, { useState, useEffect, useRef } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
  AppState,
} from "react-native";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppStateStatus } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSecureStore } from "@/hooks/useSecureStore";
const { saveItem } = useSecureStore();

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
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Overview",
    });
  }, [navigation]);

  const { walletInfo } = useAuth();
  const id = params.name as string;
  const category_use = params.id as string;

  const measurementUnit = params.measurementUnit as string;
  const title = id?.replace(/-/g, " ") || "Unknown";

  const [values, setValues] = useState<number[]>([]);
  const [timestamps, setTimestamps] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);
  const [timeframe, setTimeframe] = useState<string>("5 hours");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [lastOpened, setLastOpened] = useState<Date | null>(null);
  const hasFetchedRef = useRef(false);

  const useAppLastClosedTracker = () => {
    const appState = useRef<AppStateStatus>(AppState.currentState);

    useEffect(() => {
      const handleAppStateChange = async (nextAppState: AppStateStatus) => {
        if (
          appState.current === "inactive" ||
          appState.current === "background"
        ) {
          if (nextAppState === "active") {
            const currentTime = new Date().toISOString();
            await saveItem("lastOpened", currentTime);
          }
        }
        appState.current = nextAppState;
      };

      const subscription = AppState.addEventListener(
        "change",
        handleAppStateChange
      );
      return () => subscription.remove();
    }, []);
  };


  useEffect(() => {
    if (values.length > 0) {
      setCurrent(values.at(0) ?? 0);
    }
  }, [values]);

  useAppLastClosedTracker();

  useEffect(() => {
    const fetchLastOpened = async () => {
      const { getItem } = useSecureStore();
      const saved = await getItem("lastOpened");
      if (saved) {
        setLastOpened(new Date(saved));
      }
    };
    fetchLastOpened();
  }, []);

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
    if (lastOpened  || !hasFetchedRef.current) {
      fetchData();
      hasFetchedRef.current = true;
    }
  }, [timeframe, selectedDate, lastOpened]);

  const fetchData = async () => {
    try {
      if (title == "Footsteps") {
        const readSampleData = async () => {
          const isInitialized = await initialize();

          if (isInitialized && !hasFetchedRef.current) {
            console.log(hasFetchedRef);
            const hasActivityPermission = await requestActivityPermission();
            if (!hasActivityPermission) {
              console.log("Activity recognition permission not granted.");
              return;
            }

            const grantedPermissions = await requestPermission([
              { accessType: "read", recordType: "Steps" },
            ]);

            if (grantedPermissions.length > 0) {
              const result = await readRecords("Steps", {
                timeRangeFilter: {
                  operator: "between",
                  startTime:
                    new Date(lastOpened.getTime() - 24 * 60 * 60 * 1000)
                      .toISOString()
                      .split(".")[0] + "Z",
                  endTime:
                    new Date(selectedDate.getTime())
                      .toISOString()
                      .split(".")[0] + "Z",
                },
              });

              result.records.forEach(async (record) => {
                const requestBody = {
                  device_id: `${walletInfo.address}/${category_use}/${id}`,
                  start_time:
                    new Date(new Date(record.startTime).getTime())
                      .toISOString()
                      .split(".")[0] + "Z",
                  end_time:
                    new Date(new Date(record.endTime).getTime())
                      .toISOString()
                      .split(".")[0] + "Z",
                  payload: {
                    dataType: record.count,
                    timestamp:
                      new Date(new Date(record.endTime).getTime())
                        .toISOString()
                        .split(".")[0] + "Z",
                  },
                };

                const response = await axios.post(
                  "http://129.74.152.201:5100/add-medical",
                  requestBody
                );
              });
            } else {
              console.log("No permissions granted.");
            }
          }
        };

        readSampleData();
      }

      var time = 0;

      if (timeframe == "24 hours") {
        time = 24 * 60 * 60 * 1000;
      }

      if (timeframe == "5 hours") {
        time = 5 * 60 * 60 * 1000;
      }

      if (timeframe == "1 hour") {
        time = 60 * 60 * 1000;
      }

      const requestBody2 = {
        start_time:
          new Date(selectedDate.getTime() - time).toISOString().split(".")[0] +
          "Z",
        device_id: `${walletInfo.address}/${category_use}/${id}`,
        end_time:
          new Date(selectedDate.getTime()).toISOString().split(".")[0] + "Z",
      };
      console.log(requestBody2);
      const response = await axios.post(
        "http://129.74.152.201:5100/get-medical",
        requestBody2
      );

      console.log(response.data);
      if (!response.data || response.data.message === "No data available") {
        console.warn("No data received for:", timeframe);
        setCurrent(0);
      }

      const rawData = response.data.data;

      if (rawData && rawData.length > 0) {
        const newValues = rawData.map((record: any) => {
          if (record != null) {
            return parseFloat(record.dataType);
          }
        });
        const newTimestamps = rawData.map((record: any) => {
          if (record != null) return new Date(record.timestamp).getTime();
        });

        const sortedData = newValues
          .map((value, index) => ({
            value,
            timestamp: newTimestamps[index],
          }))
          .sort((a, b) => a.timestamp - b.timestamp); // Sort by timestamp

        const sortedValues = sortedData.map((data) => data.value);
        const sortedTimestamps = sortedData.map((data) => data.timestamp);

        setCurrent(sortedValues.at(0) ?? 0);
        setValues(sortedValues);
        setTimestamps(sortedTimestamps);
      } else {
        console.warn("No data found!");
      }
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

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
            const newDate = new Date(selectedDate.getTime() - 86400000); // Go back one day
            setSelectedDate(newDate);
            setValues([]); // Clear the existing values
            setTimestamps([]); // Clear the existing timestamps
          }}
        />

        <Button mode="contained" buttonColor="#2196F3">
          {selectedDate.toDateString()}
        </Button>

        <IconButton
          icon="chevron-right"
          size={24}
          onPress={() => {
            const newDate = new Date(selectedDate.getTime() + 86400000); // Go forward one day
            setSelectedDate(newDate);
            setValues([]); // Clear the existing values
            setTimestamps([]); // Clear the existing timestamps
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
              setTimeframe(item); // State change will trigger useEffect
              setValues([]);
              setTimestamps([]);
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
            key: timestamps[index]?.toString() || index.toString(),
            label:
              index % 5 === 0 && timestamps[index]
                ? new Date(timestamps[index]).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "",
          }))}
          width={width * 0.7}
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
        {/* <Card style={styles.valueCard}>
          <Text variant="titleMedium" style={styles.valueTitle}>
            Current {title}
          </Text>
          <Text variant="displaySmall" style={styles.valueText}>
            {current} {measurementUnit}
          </Text>
        </Card> */}

        <Card style={styles.valueCard}>
          <Text variant="titleMedium" style={styles.valueTitle}>
            Total {title}
          </Text>
          <Text variant="displaySmall" style={styles.valueText}>
            {values.reduce((a, b) => a + b, 0)} {measurementUnit}
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
    justifyContent: "center",
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
