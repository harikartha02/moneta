import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert, TouchableOpacity, Switch, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import moment from 'moment';

type Alarm = {
  id: string;
  title: string;
  time: Date | null; // Ensure time can be null
  repeatDays: string[];
  active: boolean;
};

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const AlarmPage: React.FC = () => {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentAlarm, setCurrentAlarm] = useState<Partial<Alarm>>({});
  const [showTimePicker, setShowTimePicker] = useState(true);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const fetchAlarms = async () => {
      const storedAlarms = await AsyncStorage.getItem('alarms');
      if (storedAlarms) {
        setAlarms(JSON.parse(storedAlarms));
      }
    };
    fetchAlarms();
  }, []);

  const saveAlarms = async (updatedAlarms: Alarm[]) => {
    setAlarms(updatedAlarms);
    await AsyncStorage.setItem('alarms', JSON.stringify(updatedAlarms));
  };

  const addOrUpdateAlarm = async () => {
    if (!currentAlarm.title || !currentAlarm.time) {
      Alert.alert('Error', 'Please enter a title and set a time.');
      return;
    }

    let updatedAlarms;
    if (currentAlarm.id) {
      // Update existing alarm
      updatedAlarms = alarms.map((alarm) =>
        alarm.id === currentAlarm.id ? { ...alarm, ...currentAlarm } : alarm
      );
    } else {
      // Add new alarm
      const newAlarm: Alarm = {
        id: Date.now().toString(),
        title: currentAlarm.title as string,
        time: currentAlarm.time as Date,
        repeatDays: currentAlarm.repeatDays || [],
        active: true,
      };
      updatedAlarms = [...alarms, newAlarm];
    }

    await saveAlarms(updatedAlarms);
    setModalVisible(false);
    setCurrentAlarm({});
  };

  const toggleAlarm = async (id: string) => {
    const updatedAlarms = alarms.map((alarm) =>
      alarm.id === id ? { ...alarm, active: !alarm.active } : alarm
    );
    await saveAlarms(updatedAlarms);
  };

  const handleEditPress = (alarm: Alarm) => {
    setCurrentAlarm(alarm);
    setModalVisible(true);
  };

  const handleDeletePress = async (id: string) => {
    const updatedAlarms = alarms.filter((alarm) => alarm.id !== id);
    await saveAlarms(updatedAlarms);
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  const handleAlarmPress = (alarm: Alarm) => {
    if (editMode) {
      Alert.alert(
        'Edit Alarm',
        'Choose an action',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Edit', onPress: () => handleEditPress(alarm) },
          { text: 'Delete', onPress: () => handleDeletePress(alarm.id) },
        ],
        { cancelable: true }
      );
    }
  };

  const handleRepeatDayPress = (day: string) => {
    if (currentAlarm.repeatDays?.includes(day)) {
      setCurrentAlarm({
        ...currentAlarm,
        repeatDays: currentAlarm.repeatDays.filter((d) => d !== day),
      });
    } else {
      setCurrentAlarm({
        ...currentAlarm,
        repeatDays: [...(currentAlarm.repeatDays || []), day],
      });
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={toggleEditMode}>
          <MaterialIcons name="edit" size={30} color={editMode ? 'red' : 'gold'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <MaterialIcons name="add" size={30} color="gold" />
        </TouchableOpacity>
      </View>

      <ThemedText style={styles.header} type="title">
        Alarms
      </ThemedText>

      <FlatList
        data={alarms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleAlarmPress(item)}>
            <ThemedView style={styles.reminderItem}>
              <TouchableOpacity onPress={() => handleDeletePress(item.id)} style={editMode ? styles.deleteButton : { display: 'none' }}>
                <MaterialIcons name="remove" size={24} color="red" />
              </TouchableOpacity>
              <View style={styles.reminderTextContainer}>
                <ThemedText style={styles.reminderTime}>
                  {item.time ? moment(item.time).format('hh:mm A') : ''}
                </ThemedText>
                <ThemedText style={styles.reminderText}>{item.title}</ThemedText>
                <ThemedText>{item.repeatDays.join(', ')}</ThemedText>
              </View>
              {editMode ? (
                <TouchableOpacity onPress={() => handleEditPress(item)}>
                  <MaterialIcons name="arrow-forward" size={24} color="blue" />
                </TouchableOpacity>
              ) : (
                <Switch value={item.active} onValueChange={() => toggleAlarm(item.id)} />
              )}
            </ThemedView>
          </TouchableOpacity>
        )}
      />

      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <DateTimePicker
              value={currentAlarm.time || new Date()}
              mode="time"
              display="default"
              onChange={(event, selectedDate) => {
                setCurrentAlarm({ ...currentAlarm, time: selectedDate || currentAlarm.time });
              }}
              style={{ alignSelf: 'center' }}
            />
            <TextInput
              style={styles.input}
              placeholder="Alarm Title"
              value={currentAlarm.title}
              onChangeText={(text) => setCurrentAlarm({ ...currentAlarm, title: text })}
            />
            <View style={styles.repeatDaysContainer}>
              {daysOfWeek.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayButton,
                    currentAlarm.repeatDays?.includes(day) && styles.selectedDayButton,
                  ]}
                  onPress={() => handleRepeatDayPress(day)}
                >
                  <Text style={styles.dayButtonText}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalButtonsContainer}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} />
              <Button title="Save" onPress={addOrUpdateAlarm} />
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
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Semi-transparent background
  },
  modalView: {
    width: '90%', // Width of the modal
    backgroundColor: '#28282B',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: 'black',
    borderWidth: 1,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginTop: 15,
    marginBottom: 16,
    color: 'black',
    backgroundColor: '#C0C0C0',
    fontSize: 18,
  },
  repeatDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    margin: 10,
  },
  dayButton: {
    padding: 8,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'gray',
    backgroundColor: '#1E1E1E',
    margin: 2,
  },
  selectedDayButton: {
    backgroundColor: '#36454F',
    borderColor: '#C0C0C0',
    color: 'black',
  },
  dayButtonText: {
    color: 'white',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  reminderItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#28282B',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reminderTextContainer: {
    flex: 1,
  },
  reminderText: {
    fontSize: 16,
    color: '#C0C0C0',
  },
  reminderTime: {
    color: '#C0C0C0',
    fontSize: 27,
    fontWeight: 'bold',
    paddingBottom: 8,
    paddingTop: 5,
  },
  deleteButton: {
    marginRight: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    paddingHorizontal: 8,
  },
});

export default AlarmPage;
