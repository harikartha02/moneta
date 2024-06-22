import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, FlatList, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

type Reminder = {
  title: string;
  location: {
    latitude: number;
    longitude: number;
  };
};

const LocationReminders: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    const fetchReminders = async () => {
      const storedReminders = await AsyncStorage.getItem('reminders');
      if (storedReminders) {
        setReminders(JSON.parse(storedReminders));
      }
    };
    fetchReminders();
  }, []);

  const addReminder = async () => {
    if (!title || !location) {
      Alert.alert('Error', 'Please enter a title and set a location.');
      return;
    }
    const newReminder: Reminder = {
      title,
      location: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      },
    };
    const updatedReminders = [...reminders, newReminder];
    setReminders(updatedReminders);
    await AsyncStorage.setItem('reminders', JSON.stringify(updatedReminders));
    setTitle('');
    setLocation(null);
  };

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Allow location access to set reminders.');
      return;
    }
    const currentLocation = await Location.getCurrentPositionAsync({});
    setLocation(currentLocation);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.header} type="title">Location-Based Reminders</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="Reminder Title"
        value={title}
        onChangeText={setTitle}
      />
      <Button title="Set Location" onPress={getLocation} />
      {location && (
        <ThemedText style={styles.locationText}>
          Location set to: {location.coords.latitude}, {location.coords.longitude}
        </ThemedText>
      )}
      <Button title="Add Reminder" onPress={addReminder} />
      <FlatList
        data={reminders}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <ThemedView style={styles.reminderItem}>
            <ThemedText style={styles.reminderTitle}>{item.title}</ThemedText>
            <ThemedText>
              Location: {item.location.latitude}, {item.location.longitude}
            </ThemedText>
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
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  locationText: {
    marginVertical: 8,
  },
  reminderItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  reminderTitle: {
    fontWeight: 'bold',
  },
});

export default LocationReminders;
