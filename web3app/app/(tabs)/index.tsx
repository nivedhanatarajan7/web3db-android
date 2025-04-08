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
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import CardContainer from "../../components/CardContainer";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import axios from "axios";
import { useAuth } from "../AuthContext";
import DataScreen from "../datatypes/[id]"; 
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get("window");

export default function HomeAssistant() {
  const router = useRouter();
  const { walletInfo, logout } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCard, setSelectedCard] = useState<{
    category: string;

    mainText: string;
    subText: string;
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [categories, setCategories] = useState<{
    [key: string]: {
      category: string;
      name: string;
      measurement: string;
      isActive: boolean;
    }[];
  }>({});
  const [newDataType, setNewDataType] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [customCategory, setCustomCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [measurement, setMeasurement] = useState("");
  const [loading, setLoading] = useState(false);
  const [newContainerName, setNewContainerName] = useState("");
  const [addContainerModalVisible, setAddContainerModalVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const fetchDataTypes = async () => {
    try {
      setLoading(true);
      console.log("Fetching data for wallet:", walletInfo.address);

      const response = await axios.post(
        "http://129.74.152.201:5100/get-registered-devices",
        { wallet_id: walletInfo.address }
      );

      console.log("Full API Response:", response.data);

      const responseData = response.data.devices || [];

      if (!Array.isArray(responseData) || responseData.length === 0) {
        console.warn("No devices found, using default categories.");
        setCategories({
          Health: [
            { category: "Health", name: "Heart Rate", measurement: "bpm", isActive: true },
            { category: "Health", name: "Blood Pressure", measurement: "mmHg", isActive: true },
          ],
          Home: [{ category: "Home", name: "Temperature", measurement: "°C", isActive: true }],
        });
        return;
      }

      // Merge categories correctly
      const groupedData = responseData.reduce((acc, item) => {
        if (!item.category || !item.name) return acc;
      
        if (!acc[item.category]) acc[item.category] = [];
      
        const exists = acc[item.category].some(existing => existing.name === item.name);
        if (!exists) {
          acc[item.category] = [
            ...acc[item.category],
            {
              category: item.category,
              name: item.name,
              measurement: item.measurement_unit || "N/A",
              isActive: true,
            },
          ];
        }
      
        return acc;
      }, {});
      

      console.log("Grouped Data:", groupedData);
      setCategories(groupedData);
    } catch (error) {
      console.error("Error fetching data types:", error);
      setCategories({
        Health: [
          { category: "Health", name: "Heart Rate", measurement: "bpm", isActive: true },
          { category: "Health", name: "Blood Pressure", measurement: "mmHg", isActive: true },
        ],
        Home: [{ category: "Home", name: "Temperature", measurement: "°C", isActive: true }],
      });
    } finally {
      setLoading(false);
    }
  };
  useFocusEffect(
    React.useCallback(() => {
      const fetch = async () => {
        await fetchDataTypes();
      };
  
      fetch();
    }, [])
  );
  const handleCardPress = (category: string, mainText: string, subText: string) => {    
    setSelectedCard({ category, mainText, subText });
  const encdoedCategory = encodeURIComponent(category?.trim());
  const encodedMainText = encodeURIComponent(mainText?.trim());
  const encodedSubText = encodeURIComponent(subText?.trim());
  router.push(`/datatypes/${encdoedCategory}?name=${encodedMainText}&measurementUnit=${encodedSubText}`);
};

  const handleCloseModal = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 10, // Instant duration
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
      setCategories((prevCategories) => ({
        ...prevCategories,
        [newContainerName]: [
          {
            category: newContainerName,
            name: "Create New Card",
            measurement: "Insert Data",
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
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Welcome to Web3DB App!</Text>
          <View style={styles.buttonContainer}>
            {/* <TouchableOpacity
              style={[
                styles.addButton,
                !isEditing && styles.hidden,
                isHovered && styles.addButtonHovered,
              ]}
              onPress={() => setAddContainerModalVisible(true)}
              disabled={!isEditing}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <Text style={styles.addButtonText}>Add New Container</Text>
            </TouchableOpacity> */}
            {/* <TouchableOpacity style={styles.editButton} onPress={handleEditPress}>
              <MaterialCommunityIcons
                name={isEditing ? "check" : "pencil"}
                size={24}
                color="#fff"
              />
            </TouchableOpacity> */}
          </View>
        </View>
        <View style={styles.outerContainer}>
          {Object.entries(categories).map(([categoryName, items]) => (
            <CardContainer
              key={categoryName}
              title={categoryName}
              items={items} // Pass items array to CardContainer
              onCardPress={
                handleCardPress
              }
              isEditing={isEditing}
            />
          ))}
        </View>

        {selectedCard && (
          <Modal
            transparent={true}
            visible={modalVisible}
            onRequestClose={handleCloseModal}
          >
            <Animated.View
              style={[styles.modalContainer, { opacity: fadeAnim }]}
            >
              <View style={styles.modalContent}>
                <TouchableOpacity
                  onPress={handleCloseModal}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>X</Text>
                </TouchableOpacity>
                <DataScreen
                  category={selectedCard.category}

                  dataType={selectedCard.mainText}
                  measurement={selectedCard.subText}
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
                <Button
                  title="Cancel"
                  onPress={() => setAddContainerModalVisible(false)}
                  color="gray"
                />
                <Button
                  title="Add"
                  onPress={handleAddContainer}
                  color="#2196F3"
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, paddingBottom: 20, paddingTop: 40},
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 20 },
  headerContainer: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginBottom: 20 },
  header: { fontSize: 20, fontWeight: "bold", flex: 1 },
  editButton: { backgroundColor: "#4da6ff", padding: 10, borderRadius: 100 },
  outerContainer: { flexWrap: "wrap", width: "100%", marginBottom: 20 },
  modalContainer: {
    flex: 1, // Ensures it takes full screen height
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Adds a transparent background
  },
  modalContent: {
    width: "90%", // Adjust for mobile-friendly width
    maxHeight: "90%", // Ensure it doesn't overflow
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: { alignSelf: "flex-end" },
  closeButtonText: { fontSize: 18, fontWeight: "bold" },
  input: { width: "100%", padding: 10, borderWidth: 1, borderColor: "#ccc", borderRadius: 5, marginBottom: 10 },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
});
