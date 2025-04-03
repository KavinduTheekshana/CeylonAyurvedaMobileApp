import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import {API_BASE_URL} from "@/config/api";

// Define API endpoint
const API_URL = `${API_BASE_URL}/api/treatments`;

// Define the TypeScript interface for the Treatment object
interface Treatment {
  id: number;
  name: string;
  image: string | null;
  description: string;
}

const TreatmentsScreen = () => {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    fetch(API_URL)
      .then((response) => response.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          const updatedData = data.data.map((item: Treatment) => ({
            ...item,
            image: item.image
              ? `${API_BASE_URL}/storage/${item.image}`
              : null,
          }));
          setTreatments(updatedData);
        }
      })
      .catch((error) => console.error("Error fetching treatments:", error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <ActivityIndicator size="large" color="#9A563A" style={styles.loader} />
    );
  }

  return (
    <View style={styles.container}>
      <Text className="w-full text-3xl pb-3 text-black font-bold">
        Treatments
      </Text>
      <FlatList
        data={treatments}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2} // ✅ Show 2 treatments per row
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
            <TouchableOpacity
                onPress={() =>
                    router.push({
                      pathname: "/(screens)/[id]",
                      params: { id: item.id.toString(), treatmentId: item.id.toString(),treatmentName:item.name }, // Include both id and treatmentId
                    })
                }
                style={styles.itemContainer}
            >
            {item.image && (
              <Image source={{ uri: item.image }} style={styles.image} />
            )}
            <Text style={styles.title}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    marginBottom: 50,
    backgroundColor: "#f5f5f5",
  },
  itemContainer: {
    flex: 1,
    margin: 10,
    alignItems: "center", // Center text under image
    backgroundColor: '#fff',
    padding: 5,
    borderRadius: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },

  image: {
    width: "100%", // Full width
    height: 130, // Adjust height
    borderRadius: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 5,
    textAlign: "center",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default TreatmentsScreen;
