// components/TransactionCard.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

const TransactionCard = ({ transaction }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.transactionId}>ID: {transaction.transactionId}</Text>
        <Text style={styles.amount}>KSh {transaction.amount.toLocaleString()}</Text>
      </View>
      
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Ionicons name="person" size={16} color="#7f8c8d" />
          <Text style={styles.detailText}>{transaction.sender}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="call" size={16} color="#7f8c8d" />
          <Text style={styles.detailText}>{transaction.phoneNumber}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color="#7f8c8d" />
          <Text style={styles.detailText}>
            {format(new Date(transaction.date), 'dd MMM yyyy')} at {format(new Date(transaction.date), 'hh:mm a')}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  transactionId: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  details: {
    marginTop: 5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#34495e',
    marginLeft: 8,
  },
});

export default TransactionCard;