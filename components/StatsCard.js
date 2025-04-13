// components/StatsCard.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StatsCard = ({ data }) => {
  // Calculate total amount
  const totalAmount = data.reduce((sum, t) => sum + t.amount, 0);
  
  // Find latest transaction date
  const latestDate = data.length > 0 
    ? new Date(Math.max(...data.map(t => new Date(t.date).getTime()))) 
    : new Date();
  
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.value}>{data.length}</Text>
          <Text style={styles.label}>Transactions</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.value}>KSh {totalAmount.toLocaleString()}</Text>
          <Text style={styles.label}>Total Amount</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  card: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  label: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 5,
  },
});

export default StatsCard;