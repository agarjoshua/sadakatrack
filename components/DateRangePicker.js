import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfWeek, endOfWeek, isValid, parse, parseISO } from 'date-fns';

const DateRangePicker = ({ dateRange, onDateRangeChange, singleDate = false }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [tempRange, setTempRange] = useState(dateRange);
  const [startDateInput, setStartDateInput] = useState(format(new Date(dateRange.start), 'yyyy-MM-dd'));
  const [endDateInput, setEndDateInput] = useState(format(new Date(dateRange.end), 'yyyy-MM-dd'));
  
  useEffect(() => {
    // Update input fields when dateRange prop changes
    setStartDateInput(format(new Date(dateRange.start), 'yyyy-MM-dd'));
    setEndDateInput(format(new Date(dateRange.end), 'yyyy-MM-dd'));
  }, [dateRange]);
  
  useEffect(() => {
    // If in singleDate mode, ensure start and end are the same
    if (singleDate && tempRange.start !== tempRange.end) {
      setTempRange({...tempRange, end: tempRange.start});
      setEndDateInput(startDateInput);
    }
  }, [singleDate, tempRange.start]);

  const presetRanges = [
    { 
      label: 'Last Week', 
      getValue: () => {
        const today = new Date();
        const startDate = startOfWeek(new Date(today.setDate(today.getDate() - 7)), { weekStartsOn: 0 });
        const endDate = endOfWeek(new Date(today.setDate(today.getDate() - 1)), { weekStartsOn: 0 });
        return {
          start: format(startDate, 'yyyy-MM-dd'),
          end: format(endDate, 'yyyy-MM-dd')
        };
      }
    },
    {
      label: 'This Week', 
      getValue: () => {
        const today = new Date();
        const startDate = startOfWeek(today, { weekStartsOn: 0 });
        return {
          start: format(startDate, 'yyyy-MM-dd'),
          end: format(today, 'yyyy-MM-dd')
        };
      }
    },
    {
      label: 'Last 30 Days', 
      getValue: () => {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        return {
          start: format(startDate, 'yyyy-MM-dd'),
          end: format(today, 'yyyy-MM-dd')
        };
      }
    }
  ];

  const applyDateRange = () => {
    // Validate dates before applying
    try {
      const startDate = parseISO(startDateInput);
      const endDate = parseISO(endDateInput);
      
      if (!isValid(startDate) || !isValid(endDate)) {
        alert("Please enter valid dates in YYYY-MM-DD format");
        return;
      }
      
      if (endDate < startDate && !singleDate) {
        alert("End date cannot be earlier than start date");
        return;
      }
      
      const newRange = {
        start: startDateInput,
        end: singleDate ? startDateInput : endDateInput
      };
      
      onDateRangeChange(newRange);
      setTempRange(newRange);
      setModalVisible(false);
    } catch (error) {
      alert("Please enter valid dates in YYYY-MM-DD format");
    }
  };

  const selectPresetRange = (preset) => {
    const newRange = preset.getValue();
    setTempRange(newRange);
    setStartDateInput(newRange.start);
    setEndDateInput(newRange.end);
  };

  const handleStartDateChange = (text) => {
    setStartDateInput(text);
    
    // If it's a valid date, update tempRange as well
    try {
      const parsedDate = parseISO(text);
      if (isValid(parsedDate)) {
        if (singleDate) {
          setEndDateInput(text);
          setTempRange({
            start: text,
            end: text
          });
        } else {
          setTempRange({
            ...tempRange,
            start: text
          });
        }
      }
    } catch (error) {
      // Just update the input field, will validate on apply
    }
  };

  const handleEndDateChange = (text) => {
    setEndDateInput(text);
    
    // If it's a valid date, update tempRange as well
    try {
      const parsedDate = parseISO(text);
      if (isValid(parsedDate)) {
        setTempRange({
          ...tempRange,
          end: text
        });
      }
    } catch (error) {
      // Just update the input field, will validate on apply
    }
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.dateRangeButton} 
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="calendar-outline" size={18} color="#3498db" />
        <Text style={styles.dateRangeText}>
          {singleDate ? 
            format(new Date(dateRange.start), 'dd MMM yyyy') :
            `${format(new Date(dateRange.start), 'dd MMM')} - ${format(new Date(dateRange.end), 'dd MMM yyyy')}`
          }
        </Text>
        <Ionicons name="chevron-down" size={16} color="#3498db" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {singleDate ? 'Select Date' : 'Select Date Range'}
            </Text>
            
            {!singleDate && (
              <View style={styles.presetsContainer}>
                {presetRanges.map((preset, index) => (
                  <TouchableOpacity 
                    key={index}
                    style={styles.presetButton}
                    onPress={() => selectPresetRange(preset)}
                  >
                    <Text style={styles.presetButtonText}>{preset.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            <View style={styles.datePickerContainer}>
              <Text style={styles.dateLabel}>{singleDate ? 'Date:' : 'Start Date:'}</Text>
              <TextInput
                style={styles.datePicker}
                value={startDateInput}
                onChangeText={handleStartDateChange}
                placeholder="YYYY-MM-DD"
              />
              <Text style={styles.dateHint}>Format: YYYY-MM-DD</Text>
            </View>
            
            {!singleDate && (
              <View style={styles.datePickerContainer}>
                <Text style={styles.dateLabel}>End Date:</Text>
                <TextInput
                  style={styles.datePicker}
                  value={endDateInput}
                  onChangeText={handleEndDateChange}
                  placeholder="YYYY-MM-DD"
                />
                <Text style={styles.dateHint}>Format: YYYY-MM-DD</Text>
              </View>
            )}
            
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  // Reset to original values
                  setStartDateInput(format(new Date(dateRange.start), 'yyyy-MM-dd'));
                  setEndDateInput(format(new Date(dateRange.end), 'yyyy-MM-dd'));
                  setTempRange(dateRange);
                  setModalVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.applyButton]} 
                onPress={applyDateRange}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  dateRangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dateRangeText: {
    fontSize: 14,
    color: '#3498db',
    marginHorizontal: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2c3e50',
    textAlign: 'center',
  },
  presetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  presetButton: {
    backgroundColor: '#f0f7ff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#cce5ff',
  },
  presetButtonText: {
    color: '#3498db',
    fontSize: 14,
  },
  datePickerContainer: {
    marginBottom: 15,
  },
  dateLabel: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 5,
  },
  datePicker: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateHint: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 4,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ecf0f1',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#7f8c8d',
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor: '#3498db',
  },
  applyButtonText: {
    color: 'white',
    fontWeight: '500',
  },
});

export default DateRangePicker;