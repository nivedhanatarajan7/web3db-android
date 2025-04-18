import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  TextInput,
  Button,
  Dimensions,
} from "react-native";
import CardContainer from "../../components/CardContainer";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import axios from "axios";
import { useAuth } from "../AuthContext";
import DataScreen from "../datatypes/[id]";
import { useFocusEffect } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");

export default function HomeAssistant() {
  const router = useRouter();
  const { walletInfo } = useAuth();
  type DataType = {
    category: string;
    type: string;
    measurement: string;
    walletid: string;
    devicename: string;
  };
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCard, setSelectedCard] = useState<{
    category: string;
    mainText: string;
    subText: string;
    walletid: string;
    devicename: string;

  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [dataTypes, setDataTypes] = useState<DataType[]>([]);

  const [categories, setCategories] = useState<{
    [key: string]: {
      category: string;
      name: string;
      measurement: string;
      devicename: string;

      isActive: boolean;
    }[];
  }>({});
  const [newContainerName, setNewContainerName] = useState("");
  const [addContainerModalVisible, setAddContainerModalVisible] = useState(false);

  const [viewMode, setViewMode] = useState<"my" | "shared">("my");

  const fetchDataTypes = async () => {
    try {

      if (viewMode === "shared") {
        setDataTypes([
          {
            category: "Exercise",
            type: "Footsteps",
            measurement: "Steps",
            walletid: "0xce2b1bce9a54261ef0d9ddcb1818b4f882f37153",
            devicename: "Watch"
          },
        ]);
        return;
      }
      
      const response = await axios.post(
        "https://ugamyflaskapp2.duckdns.org/get-registered-devices",
        { wallet_id: walletInfo.address }
      );
  
      const responseData = response.data.devices || [];

      const groupedData = responseData.reduce((acc, item) => {
        if (!item.category || !item.name) return acc;
        if (!acc[item.category]) acc[item.category] = [];
        const parts = item.device_id.split("/");
        const deviceName = parts[1];
        const exists = acc[item.category].some(existing => existing.name === item.name);
        if (!exists) {
          acc[item.category].push({
            category: item.category,
            name: item.name,
            measurement: item.measurement_unit || "N/A",
            devicename: deviceName,
            isActive: true,
          });
        }
        return acc;
      }, {} as typeof categories);

      setCategories(groupedData);
    } catch (error) {
      console.error("Error fetching data types:", error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchDataTypes();
    }, [viewMode])
  );

  useFocusEffect(
    React.useCallback(() => {
      fetchDataTypes();
    }, [])
  );

  const handleCardPress = (
    category: string,
    mainText: string,
    subText: string,
    walletid: string,
    devicename: string
  ) => {
    const isShared = viewMode === "shared";
    
    const encodedCategory = encodeURIComponent(category?.trim());
    const encodedMainText = encodeURIComponent(mainText?.trim());
    const encodedSubText = encodeURIComponent(subText?.trim());
    const encodedWalletId = encodeURIComponent(walletid?.trim());
    const encodedDeviceName = encodeURIComponent(devicename?.trim());
  
    router.push(
      `/datatypes/${encodedCategory}?name=${encodedMainText}&measurementUnit=${encodedSubText}&walletid=${encodedWalletId}&devicename=${encodedDeviceName}&isShared=${isShared}`
    );
  };
  

  const handleCloseModal = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 10,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setSelectedCard(null);
    });
  };

  const handleEditPress = () => {
    setIsEditing(!isEditing);
    setCategories(prevCategories => {
      const newCategories = { ...prevCategories };
      Object.keys(newCategories).forEach(category => {
        if (!isEditing) {
          newCategories[category].push({
            category,
            name: "Create New Card",
            measurement: "Insert Data",
            devicename: "N/A",
            isActive: false,
          });
        } else {
          newCategories[category] = newCategories[category].filter(
            item => item.name !== "Create New Card"
          );
        }
      });
      return newCategories;
    });
  };

  const handleAddContainer = () => {
    if (newContainerName) {
      setCategories(prev => ({
        ...prev,
        [newContainerName]: [
          {
            category: newContainerName,
            name: "Create New Card",
            measurement: "Insert Data",
            devicename: "N/A",

            isActive: false,
          },
        ],
      }));
      setNewContainerName("");
      setAddContainerModalVisible(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={viewMode}
            onValueChange={value => setViewMode(value)}
            style={styles.picker}
            mode="dropdown"
          >
            <Picker.Item label="My Devices" value="my" />
            <Picker.Item label="Shared Devices" value="shared" />
          </Picker>
        </View>

        <View style={styles.outerContainer}>
        {viewMode === "my" ? (
  Object.entries(categories).map(([categoryName, items]) => (
    <CardContainer
      key={categoryName}
      title={categoryName}
      items={items.map(item => ({
        ...item,
        walletid: walletInfo.address, // Ensure walletid is passed
      }))}
      onCardPress={handleCardPress}
      isEditing={isEditing}
      isShared={false}
    />
  ))
) : (
  <CardContainer
    title="Health"
    items={dataTypes.map(dt => ({
      category: dt.category,
      name: dt.type,
      measurement: dt.measurement,
      devicename: dt.devicename,

      walletid: dt.walletid,
      isActive: true,
    }))}
    onCardPress={handleCardPress}
    isEditing={false}
    isShared={true}
  />
)}

</View>



        {selectedCard && (
          <Modal transparent={true} visible={modalVisible} onRequestClose={handleCloseModal}>
            <Animated.View style={[styles.modalContainer, { opacity: fadeAnim }]}>
              <View style={styles.modalContent}>
                <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>X</Text>
                </TouchableOpacity>
                <DataScreen
                  category={selectedCard.category}
                  dataType={selectedCard.mainText}
                  measurement={selectedCard.subText}
                  walletid={selectedCard.walletid}
                  device={selectedCard.devicename}
                />
              </View>
            </Animated.View>
          </Modal>
        )}

        <Modal
          transparent={true}
          visible={addContainerModalVisible}
          onRequestClose={() => setAddContainerModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Container</Text>
              <TextInput
                placeholder="Container Name"
                style={styles.input}
                value={newContainerName}
                onChangeText={setNewContainerName}
              />
              <View style={styles.buttonRow}>
                <Button title="Cancel" onPress={() => setAddContainerModalVisible(false)} color="gray" />
                <Button title="Add" onPress={handleAddContainer} color="#2196F3" />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, paddingBottom: 20, paddingTop: 20 },
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 20 },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  pickerLabel: {
    fontWeight: "bold",
    fontSize: 16,
    marginRight: 10,
  },
  picker: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 8,
  },
  outerContainer: { flexWrap: "wrap", width: "100%", marginBottom: 20 },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    maxHeight: "90%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: { alignSelf: "flex-end" },
  closeButtonText: { fontSize: 18, fontWeight: "bold" },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  input: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
});
