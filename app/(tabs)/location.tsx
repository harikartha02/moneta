import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, FlatList, StyleSheet, Alert, Modal, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';

type Reminder = {
  id: string;
  title: string;
  location: {
    name: string;
    latitude: number;
    longitude: number;
  };
  completed: boolean;
};

const Checkbox = ({ checked, onPress }: { checked: boolean; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={styles.checkbox}>
    {checked ? <MaterialIcons name="radio-button-checked" size={24} color="gold" /> : <MaterialIcons name="radio-button-unchecked" size={24} color="gold" />}
  </TouchableOpacity>
);

const LocationReminders: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState<{ name: string; latitude: number; longitude: number } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    const fetchReminders = async () => {
      const storedReminders = await AsyncStorage.getItem('reminders');
      if (storedReminders) {
        setReminders(JSON.parse(storedReminders));
      }
    };
    fetchReminders();
  }, []);

  useEffect(() => {
    const getCurrentLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Allow location access to set reminders.');
        return;
      }
      const currentLocation = await Location.getCurrentPositionAsync({});
      setCurrentLocation(currentLocation);
    };
    getCurrentLocation();
  }, []);

  const addReminder = async () => {
    if (!title || !location) {
      Alert.alert('Error', 'Please enter a title and select a location.');
      return;
    }
    const newReminder: Reminder = {
      id: Date.now().toString(),
      title,
      location,
      completed: false,
    };
    const updatedReminders = [...reminders, newReminder];
    setReminders(updatedReminders);
    await AsyncStorage.setItem('reminders', JSON.stringify(updatedReminders));
    setTitle('');
    setLocation(null);
    setModalVisible(false); // Close the modal after adding a reminder
  };

  const toggleReminderCompletion = async (id: string) => {
    // Mark the reminder as completed
    const updatedReminders = reminders.map((reminder) =>
      reminder.id === id ? { ...reminder, completed: !reminder.completed } : reminder
    );
    setReminders(updatedReminders);
  
    // Wait for 5 seconds before removing the reminder
    setTimeout(async () => {
      const finalReminders = updatedReminders.filter(reminder => reminder.id !== id);
      setReminders(finalReminders);
      await AsyncStorage.setItem('reminders', JSON.stringify(finalReminders));
    }, 5000);
  };
  
  

  const handleSelectLocation = async (coordinate: { latitude: number; longitude: number }) => {
    const geocode = await Location.reverseGeocodeAsync(coordinate);
    const locationName = geocode[0]?.name || 'Unknown Location';
    const selectedLocation = {
      name: locationName,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    };
    setLocation(selectedLocation);
  };
  

  const handleEditPress = () => {
    // Placeholder function for edit action
    console.log('Edit button pressed');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleEditPress}>
        <MaterialIcons name="edit" size={30} color="gold" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <MaterialIcons name="add" size={30} color="gold" />
        </TouchableOpacity>

      </View>

      <ThemedText style={styles.header} type="title">
          Location-Based Reminders
        </ThemedText>

      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
            <ThemedText style={styles.headerModal}>
            Choose location
            </ThemedText>
 
          {currentLocation && (
            <MapView
              style={styles.map}
              region={{
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
              onPress={(e) => handleSelectLocation(e.nativeEvent.coordinate)}
            >
              {location && <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }} />}
            </MapView>
          )}

            <TextInput
            style={styles.input}
            placeholder="Reminder Title"
            value={title}
            onChangeText={setTitle}
          />
          <View style={styles.modalButtonsContainer}>
            <Button title="Cancel" onPress={() => {
              setTitle('');
              setLocation(null);
              setModalVisible(false);
            }} />
            <Button title="Confirm" onPress={addReminder} />
          </View>
        </View>
      </Modal>
      <FlatList
        data={reminders}
        keyExtractor={(item) => item.id} // Assuming 'id' is a unique identifier for each reminder
        renderItem={({ item }) => (
          <ThemedView style={styles.reminderItem}>
            <ThemedView style={styles.reminderText}>
                <ThemedText style={styles.reminderTitle}>{item.title}</ThemedText>
                <ThemedText style={{color: '#C0C0C0'}}>
                {item.location.name}
                </ThemedText>
            </ThemedView>
            <Checkbox
              checked={item.completed}
              onPress={() => toggleReminderCompletion(item.id)}
            />
          </ThemedView>
        )}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,

  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop:40,

  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingBottom: 10
  },

headerModal: {
    marginTop: 40,
    fontSize: 24,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingBottom: 5
},

  input: {
    marginTop: 10,
    height: 40,
    borderColor: 'black',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
    borderRadius : 10,
    fontSize: 18,
    backgroundColor: '#C0C0C0',
  },

  modalContainer: {
    flex: 1,
    padding: 25,
    justifyContent: 'center',
    backgroundColor: '#28282B',
  },
  map: {
    flex: 1,
    marginBottom: 5,
    marginTop: 10,
    borderRadius: 20,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },

  reminderText: {
    flexDirection: 'column',
    maxWidth: 250,
  },
  reminderItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#28282B',
    flexDirection: 'row',
    justifyContent: 'space-between',
    
  },
  reminderTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    flex: 1,
    color: '#C0C0C0',
  },
  checkbox: {
    marginRight: 16,

  },
});

export default LocationReminders;
