import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, FlatList, StyleSheet, Alert, Modal, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';

type BatteryReminder = {
  id: string;
  percentage: number;
  completed: boolean;
  active: boolean; // New property to track if the reminder is active
};

const Checkbox = ({ checked, onPress }: { checked: boolean; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} style={styles.checkbox}>
      {checked ? <MaterialIcons name="radio-button-checked" size={24} color="gold" /> : <MaterialIcons name="radio-button-unchecked" size={24} color="gold" />}
    </TouchableOpacity>
  );

const BatteryReminders: React.FC = () => {
  const [reminders, setReminders] = useState<BatteryReminder[]>([]);
  const [percentage, setPercentage] = useState<number>(0);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchReminders = async () => {
      const storedReminders = await AsyncStorage.getItem('batteryReminders');
      if (storedReminders) {
        setReminders(JSON.parse(storedReminders));
      }
    };
    fetchReminders();
  }, []);

  const addReminder = async () => {
    if (!percentage) {
      Alert.alert('Error', 'Please enter a battery percentage.');
      return;
    }
    const newReminder: BatteryReminder = {
      id: Date.now().toString(),
      percentage,
      completed: false,
      active: true, // Set new reminders as active by default
    };
    const updatedReminders = [...reminders, newReminder];
    setReminders(updatedReminders);
    await AsyncStorage.setItem('batteryReminders', JSON.stringify(updatedReminders));
    setPercentage(0);
    setModalVisible(false); // Close the modal after adding a reminder
  };


  const toggleReminderActivation = async (id: string) => {
    const updatedReminders = reminders.map((reminder) =>
      reminder.id === id ? { ...reminder, active: !reminder.active } : reminder
    );
    setReminders(updatedReminders);
    await AsyncStorage.setItem('batteryReminders', JSON.stringify(updatedReminders));
  };
  
  const toggleReminderCompletion = async (id: string) => {
    const updatedReminders = reminders.map((reminder) =>
      reminder.id === id ? { ...reminder, completed: !reminder.completed } : reminder
    );
    setReminders(updatedReminders);
    await AsyncStorage.setItem('batteryReminders', JSON.stringify(updatedReminders));
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
        Battery-Based Reminders
      </ThemedText>

      <FlatList
        data={reminders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ThemedView style={styles.reminderItem}>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.reminderText}>{item.percentage}%</ThemedText>
            </View>
            <Checkbox checked={item.active} onPress={() => toggleReminderActivation(item.id)} />

          </ThemedView>
        )}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <TextInput
              style={styles.input}
              placeholder="Battery Percentage"
              value={percentage.toString()}
              onChangeText={(text) => setPercentage(Number(text))}
              keyboardType="numeric"
            />
            <View style={styles.modalButtonsContainer}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} />
              <Button title="Confirm" onPress={addReminder} />
            </View>
          </View>
        </View>
      </Modal>
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
    marginTop: 40,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingBottom: 10,
  },
  reminderItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#28282B',
    flexDirection: 'row',
    justifyContent: 'space-between',
    
  },
  reminderText: {
    fontWeight: 'bold',
    fontSize: 20,
    flex: 1,
    color: '#C0C0C0',
  },
  checkbox: {
    marginRight: 16,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // semi-transparent background
  },
  modalContainer: {
    width: 300,
    padding: 20,
    backgroundColor: '#28282B',
    borderRadius: 20,
    alignItems: 'center',
  },
  input: {
    height: 40,
    borderColor: 'black',
    borderWidth: 1,
    paddingHorizontal: 8,
    borderRadius: 11,
    marginBottom: 16,
    width: '100%',
    backgroundColor: '#C0C0C0',
    fontSize: 18,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
});

export default BatteryReminders;
