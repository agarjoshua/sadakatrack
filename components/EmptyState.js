// components/EmptyState.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const EmptyState = ({ message = "No transactions found" }) => {
  return (
    <View style={styles.container}>
      <Ionicons name="document-text-outline" size={60} color="#bdc3c7" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    color: '#95a5a6',
  },
});

export default EmptyState;