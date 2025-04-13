import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  TextInput,
  Modal,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { parseMessage } from '../utils/messageParser';
import XLSX from 'xlsx';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import DateRangePicker from '../components/DateRangePicker';
import TransactionCard from '../components/TransactionCard';
import StatsCard from '../components/StatsCard';
import EmptyState from '../components/EmptyState';
import SmsAndroid from 'react-native-get-sms-android';

const HomeScreen = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('week'); // 'week', 'month', 'custom', 'specific'
  const [dateRange, setDateRange] = useState({ 
    start: format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd'),
    end: format(endOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd') 
  });
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [exportPath, setExportPath] = useState('');
  const [exportSuccess, setExportSuccess] = useState(false);
  const { logout } = useContext(AuthContext);

  // Memoized filtered transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Apply date filter based on filterType
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59, 999);

    filtered = filtered.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(transaction => 
        (transaction.sender && transaction.sender.toLowerCase().includes(query)) ||
        (transaction.transactionId && transaction.transactionId.toLowerCase().includes(query)) ||
        (transaction.phoneNumber && transaction.phoneNumber.includes(query)) ||
        (transaction.account && transaction.account.toLowerCase().includes(query)) ||
        (transaction.amount && transaction.amount.toString().includes(query))
      );
    }

    return filtered;
  }, [transactions, dateRange, searchQuery]);

  useEffect(() => {
    const requestPermission = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_SMS,
            {
              title: 'SMS Permission',
              message: 'This app needs to read your SMS messages to track M-Pesa transactions.',
              buttonPositive: 'OK',
            }
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            fetchMessagesWithSmsLib();
          } else {
            Alert.alert('Permission Denied', 'SMS permission is required to track M-Pesa transactions.');
            fetchSampleData(); // Fall back to sample data
          }
        } catch (error) {
          console.error('Permission request error:', error);
          Alert.alert('Error', 'Failed to request SMS permission: ' + error.message);
          fetchSampleData();
        }
      } else {
        Alert.alert('Platform Notice', 'SMS reading only available on Android. Using sample data.');
        fetchSampleData();
      }
    };
    
    requestPermission();
  }, []);

  const fetchSampleData = () => {
    console.log("Fetching sample data...");
    setLoading(true);
    
    setTimeout(() => {  // Add timeout to simulate network request and prevent UI freezing
      try {
        // Mock data for demonstration - using current year for better relevance
        const currentYear = new Date().getFullYear();
        const mockMessages = [
          {
            body: `TDB2BU7T7S Confirmed. on 11/4/${currentYear.toString().slice(-2)} at 2:37 PM Ksh received from WYCLIFFE TAI 254721918757. Account Number Building New Utility balance is Ksh00.`,
            date: new Date(`${currentYear}-04-11T14:37:00`)
          },
          {
            body: `XYZ1AB2CD3 Confirmed. on 10/4/${currentYear.toString().slice(-2)} at 9:15 AM Ksh2,500 received from JANE SMITH 254733000000. Account Number Church New Utility balance is Ksh4,500.`,
            date: new Date(`${currentYear}-04-10T09:15:00`)
          },
          {
            body: `MPKWA2C confirmed. Ksh5,000 received from JOHN DOE 254722000000 on 9/4/${currentYear.toString().slice(-2)} at 10:30 AM. Account Number Building New utility balance is Ksh12,345. Transaction cost, Ksh0.00.`,
            date: new Date(`${currentYear}-04-09T10:30:00`)
          },
          {
            body: `MPKWA2C confirmed. Ksh1,000 received from JAMES BROWN 254711000000 on 8/4/${currentYear.toString().slice(-2)} at 4:45 PM. Account Number Tithe New utility balance is Ksh4,845. Transaction cost, Ksh0.00.`,
            date: new Date(`${currentYear}-04-08T16:45:00`)
          },
          {
            body: `MPKWA2C confirmed. Ksh3,200 received from SARAH JOHNSON 254755000000 on 7/4/${currentYear.toString().slice(-2)} at 2:20 PM. Account Number Church Dev New utility balance is Ksh3,845. Transaction cost, Ksh0.00.`,
            date: new Date(`${currentYear}-04-07T14:20:00`)
          }
        ];
        
        console.log("Parsing messages...");
        // Parse the messages in batches to prevent UI freezing
        const batchSize = 2;
        let parsedTransactions = [];
        
        for (let i = 0; i < mockMessages.length; i += batchSize) {
          const batch = mockMessages.slice(i, i + batchSize);
          const batchResults = batch
            .map(msg => parseMessage(msg.body, msg.date))
            .filter(transaction => transaction !== null);
          
          parsedTransactions = [...parsedTransactions, ...batchResults];
        }
        
        console.log(`Parsed ${parsedTransactions.length} transactions`);
        setTransactions(parsedTransactions);
      } catch (error) {
        console.error('Error in fetchSampleData:', error);
        Alert.alert('Error', 'Failed to process sample data');
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  const fetchMessagesWithSmsLib = () => {
    console.log("Fetching SMS messages using react-native-get-sms-android...");
    setLoading(true);
    
    // Set up filters for M-Pesa messages
    // We'll use multiple filters to catch different variations of M-Pesa messages
    const fetchMpesaMessages = () => {
      // Array of possible M-Pesa sender addresses
      const mpesaSenders = ['MPESA', 'M-PESA', 'SAFARICOM', 'MPKWA'];
      let allMpesaMessages = [];
      
      // Counter to track how many queries are complete
      let completedQueries = 0;
      
      // For each possible sender, query the messages
      mpesaSenders.forEach(sender => {
        const filter = {
          box: 'inbox', // 'inbox' (default), 'sent', 'draft', 'outbox', 'failed', 'queued'
          address: sender, // sender's phone number/name
          indexFrom: 0, // start from index 0
          maxCount: 100000000, // count of SMS to return per sender
        };
        
        SmsAndroid.list(
          JSON.stringify(filter),
          (fail) => {
            console.log(`Failed to fetch messages from ${sender}: ${fail}`);
            completedQueries++;
            checkAllQueriesComplete();
          },
          (count, smsList) => {
            console.log(`Retrieved ${count} messages from ${sender}`);
            try {
              const messages = JSON.parse(smsList);
              allMpesaMessages = [...allMpesaMessages, ...messages];
            } catch (error) {
              console.error('Error parsing SMS list:', error);
            }
            completedQueries++;
            checkAllQueriesComplete();
          }
        );
      });
      
      // Also fetch messages containing M-Pesa keywords in case the sender is different
      const keywordFilter = {
        box: 'inbox',
        indexFrom: 0,
        maxCount: 10000000000,
        bodyRegex: '(MPESA|M-PESA|Mpesa|MPKWA|Confirmed|received from)', // Expanded regex for M-Pesa related messages
      };
      
      SmsAndroid.list(
        JSON.stringify(keywordFilter),
        (fail) => {
          console.log(`Failed to fetch messages with keywords: ${fail}`);
          completedQueries++;
          checkAllQueriesComplete();
        },
        (count, smsList) => {
          console.log(`Retrieved ${count} messages with M-Pesa keywords`);
          try {
            const messages = JSON.parse(smsList);
            // Add to our collection, avoiding duplicates
            messages.forEach(msg => {
              const isDuplicate = allMpesaMessages.some(existing => 
                existing.date === msg.date && existing.body === msg.body
              );
              if (!isDuplicate) {
                allMpesaMessages.push(msg);
              }
            });
          } catch (error) {
            console.error('Error parsing keyword SMS list:', error);
          }
          completedQueries++;
          checkAllQueriesComplete();
        }
      );
      
      // Check if all queries are complete and process the messages
      const checkAllQueriesComplete = () => {
        if (completedQueries >= mpesaSenders.length + 1) { // +1 for the keyword search
          console.log(`Processing ${allMpesaMessages.length} total M-Pesa messages`);
          processMessages(allMpesaMessages);
        }
      };
    };
    
    // Process the fetched messages
    const processMessages = (messages) => {
      try {
        // Sort messages by date (newest first)
        messages.sort((a, b) => parseInt(b.date) - parseInt(a.date));
        
        console.log("Processing messages in batches...");
        const batchSize = 10;
        let parsedTransactions = [];
        
        for (let i = 0; i < messages.length; i += batchSize) {
          const batch = messages.slice(i, i + batchSize);
          const batchResults = batch
            .map(sms => {
              // Convert timestamp to Date object
              const messageDate = new Date(parseInt(sms.date));
              return parseMessage(sms.body, messageDate);
            })
            .filter(transaction => transaction !== null);
          
          parsedTransactions = [...parsedTransactions, ...batchResults];
        }
        
        // Fix for duplicate transaction IDs
        const uniqueTransactions = removeDuplicateTransactions(parsedTransactions);
        console.log(`Successfully parsed ${uniqueTransactions.length} unique transactions`);
        
        setTransactions(uniqueTransactions);
      } catch (error) {
        console.error('Error processing messages:', error);
        Alert.alert('Error', 'Failed to process M-Pesa messages: ' + error.message);
        // Fall back to sample data if processing real messages fails
        fetchSampleData();
      } finally {
        setLoading(false);
      }
    };
    
    // Start fetching messages
    fetchMpesaMessages();
  };
  
  // Helper function to remove duplicate transactions (especially for Fuliza issues)
  const removeDuplicateTransactions = (transactions) => {
    // Create a map to track transactions by ID
    const transactionMap = new Map();
    
    // For each transaction, only keep the first one with a given ID
    transactions.forEach(transaction => {
      if (!transactionMap.has(transaction.transactionId)) {
        transactionMap.set(transaction.transactionId, transaction);
      }
    });
    
    // Convert the map back to an array
    return Array.from(transactionMap.values());
  };

  const exportToExcel = async () => {
    console.log("Starting export to Excel...");
    try {
      setExportLoading(true);
      setExportSuccess(false);
      setExportPath('');
      
      if (filteredTransactions.length === 0) {
        Alert.alert('No Data', 'There are no transactions to export for the selected date range.');
        setExportLoading(false);
        return;
      }
      
      // Format data for Excel with all the extracted fields
      console.log("Formatting data for Excel...");
      const formattedData = filteredTransactions.map(t => ({
        'Transaction ID': t.transactionId || 'N/A',
        'Amount (KSh)': t.amount || 0,
        'Sender': t.sender || 'Unknown',
        'Phone Number': t.phoneNumber || 'N/A',
        'Account': t.account || 'N/A',
        'Type': t.transactionType || 'N/A',
        'Balance': t.balance || 'N/A',
        'Date': format(new Date(t.date), 'dd/MM/yyyy'),
        'Time': format(new Date(t.date), 'hh:mm a'),
      }));
      
      // Create worksheet
      console.log("Creating worksheet...");
      const ws = XLSX.utils.json_to_sheet(formattedData);
      
      // Auto-size columns
      const objectMaxLength = [];
      formattedData.forEach(data => {
        Object.entries(data).forEach(([key, value], idx) => {
          const valueLength = value ? String(value).length : 0;
          objectMaxLength[idx] = objectMaxLength[idx] >= valueLength 
            ? objectMaxLength[idx] 
            : Math.max(valueLength, String(key).length);
        });
      });
      
      // Apply column widths
      ws['!cols'] = objectMaxLength.map(length => ({ wch: length + 2 }));
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
      
      // Generate Excel file
      console.log("Generating Excel file...");
      const fileName = `KENYA_RE_SDA_Transactions_${format(new Date(dateRange.start), 'yyyyMMdd')}_to_${format(new Date(dateRange.end), 'yyyyMMdd')}`;
      const fileUri = FileSystem.documentDirectory + `${fileName}.xlsx`;
      
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      await FileSystem.writeAsStringAsync(fileUri, wbout, { encoding: FileSystem.EncodingType.Base64 });
      
      // Store path for later use and set success flag
      setExportPath(fileUri);
      setExportSuccess(true);
      
      // Share the file
      console.log("Sharing file...");
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
        Alert.alert('Success', 'Transaction data exported successfully!');
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', 'Failed to export transactions to Excel.');
    } finally {
      setExportLoading(false);
    }
  };

  const saveExcelLocally = async () => {
    if (!exportPath) {
      Alert.alert('Error', 'No export file available. Please export to Excel first.');
      return;
    }
    
    try {
      if (Platform.OS === 'android') {
        // Request storage permission for Android
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'This app needs to save files to your device.',
            buttonPositive: 'OK',
          }
        );
        
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Storage permission is required to save files.');
          return;
        }
      }
      
      // Get file name from path
      const fileName = exportPath.split('/').pop();
      
      // Define the download directory
      const downloadDir = Platform.OS === 'android' 
        ? FileSystem.documentDirectory + 'downloads/' 
        : FileSystem.documentDirectory;
      
      // Ensure download directory exists
      await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true }).catch(() => {});
      
      // Define new path
      const newPath = downloadDir + fileName;
      
      // Copy file to download directory
      await FileSystem.copyAsync({
        from: exportPath,
        to: newPath
      });
      
      Alert.alert('Success', `File saved to ${newPath}`);
      
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Save Failed', 'Failed to save file locally.');
    }
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
    const now = new Date();
    switch(type) {
      case 'week':
        setDateRange({
          start: format(startOfWeek(now, { weekStartsOn: 0 }), 'yyyy-MM-dd'),
          end: format(endOfWeek(now, { weekStartsOn: 0 }), 'yyyy-MM-dd')
        });
        break;
      case 'month':
        setDateRange({
          start: format(startOfMonth(now), 'yyyy-MM-dd'),
          end: format(endOfMonth(now), 'yyyy-MM-dd')
        });
        break;
      case 'custom':
      case 'specific':
        // Will be handled by DateRangePicker
        break;
      default:
        break;
    }
  };

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setDetailsModalVisible(true);
  };

  const renderItem = useCallback(({ item }) => (
    <TouchableOpacity onPress={() => handleViewDetails(item)}>
      <TransactionCard transaction={item} />
    </TouchableOpacity>
  ), []);

  const ListEmptyComponent = useCallback(() => (
    <EmptyState message="No transactions found for the selected period" />
  ), []);

  const formatDateRange = useMemo(() => {
    const start = format(new Date(dateRange.start), 'MMM d, yyyy');
    const end = format(new Date(dateRange.end), 'MMM d, yyyy');
    return `${start} - ${end}`;
  }, [dateRange]);

  // Details Modal Component
  const TransactionDetailsModal = () => {
    if (!selectedTransaction) return null;
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Transaction Details</Text>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#2c3e50" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Transaction ID:</Text>
                <Text style={styles.detailValue}>{selectedTransaction.transactionId}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date & Time:</Text>
                <Text style={styles.detailValue}>
                  {format(new Date(selectedTransaction.date), 'dd/MM/yyyy hh:mm a')}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount:</Text>
                <Text style={[styles.detailValue, styles.amountText]}>
                  KSh {selectedTransaction.amount?.toLocaleString() || '0'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Sender:</Text>
                <Text style={styles.detailValue}>{selectedTransaction.sender}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone Number:</Text>
                <Text style={styles.detailValue}>{selectedTransaction.phoneNumber}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Account:</Text>
                <Text style={styles.detailValue}>{selectedTransaction.account || 'N/A'}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Transaction Type:</Text>
                <Text style={styles.detailValue}>
                  {selectedTransaction.transactionType?.charAt(0).toUpperCase() + 
                   selectedTransaction.transactionType?.slice(1) || 'Unknown'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Balance:</Text>
                <Text style={styles.detailValue}>
                  {selectedTransaction.balance !== null ? `KSh ${selectedTransaction.balance.toLocaleString()}` : 'N/A'}
                </Text>
              </View>
              
              <View style={styles.messageBox}>
                <Text style={styles.messageLabel}>Original Message:</Text>
                <Text style={styles.messageText}>{selectedTransaction.rawMessage}</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Kenya-Re SDA Church</Text>
          <Text style={styles.headerSubtitle}>SadakaTracker</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={24} color="#e74c3c" />
        </TouchableOpacity>
      </View>

      <View style={styles.subHeader}>
        <Text style={styles.subHeaderTitle}>M-Pesa Transactions</Text>
        <Text style={styles.dateRangeText}>{formatDateRange}</Text>
      </View>

      <StatsCard data={filteredTransactions} />

      <View style={styles.filterContainer}>
        <View style={styles.filterButtons}>
          <TouchableOpacity 
            style={[styles.filterButton, filterType === 'week' && styles.filterButtonActive]}
            onPress={() => handleFilterChange('week')}
          >
            <Text style={[styles.filterButtonText, filterType === 'week' && styles.filterButtonTextActive]}>Week</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, filterType === 'month' && styles.filterButtonActive]}
            onPress={() => handleFilterChange('month')}
          >
            <Text style={[styles.filterButtonText, filterType === 'month' && styles.filterButtonTextActive]}>Month</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, filterType === 'custom' && styles.filterButtonActive]}
            onPress={() => handleFilterChange('custom')}
          >
            <Text style={[styles.filterButtonText, filterType === 'custom' && styles.filterButtonTextActive]}>Custom</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, filterType === 'specific' && styles.filterButtonActive]}
            onPress={() => handleFilterChange('specific')}
          >
            <Text style={[styles.filterButtonText, filterType === 'specific' && styles.filterButtonTextActive]}>Specific</Text>
          </TouchableOpacity>
        </View>
      </View>

      {(filterType === 'custom' || filterType === 'specific') && (
        <DateRangePicker 
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          singleDate={filterType === 'specific'}
        />
      )}

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#7f8c8d" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by ID, name, account..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#95a5a6"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#7f8c8d" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.transactionId}-${index}`} // Add index to make keys unique
          contentContainerStyle={styles.transactionsList}
          ListEmptyComponent={ListEmptyComponent}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews={true}
        />
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[
            styles.actionButton, 
            styles.exportButton, 
            (exportLoading || filteredTransactions.length === 0) && styles.buttonDisabled
          ]} 
          onPress={exportToExcel}
          disabled={exportLoading || filteredTransactions.length === 0}
        >
          {exportLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="download-outline" size={20} color="white" />
              <Text style={styles.buttonText}>Export to Excel</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.actionButton, 
            styles.saveButton, 
            (!exportSuccess) && styles.buttonDisabled
          ]} 
          onPress={saveExcelLocally}
          disabled={!exportSuccess}
        >
          <Ionicons name="save-outline" size={20} color="white" />
          <Text style={styles.buttonText}>Save Locally</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.refreshButton]} 
          onPress={() => {
            Platform.OS === 'android' ? fetchMessagesWithSmsLib() : fetchSampleData();
          }}
        >
          <Ionicons name="refresh-outline" size={20} color="white" />
          <Text style={styles.buttonText}>Refresh Data</Text>
        </TouchableOpacity>
      </View>
      
      {/* Transaction Details Modal */}
      <TransactionDetailsModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#2c3e50',
  },
  headerContainer: {
    flexDirection: 'column',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#bdc3c7',
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
  },
  subHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#34495e',
  },
  subHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  dateRangeText: {
    fontSize: 12,
    color: '#bdc3c7',
    marginTop: 4,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#ecf0f1',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#3498db',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    marginHorizontal: 20,
    marginVertical: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  transactionsList: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 85, // Extra padding to account for button container
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#7f8c8d',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  exportButton: {
    backgroundColor: '#3498db',
  },
  saveButton: {
    backgroundColor: '#27ae60',
  },
  refreshButton: {
    backgroundColor: '#9b59b6',
  },
  buttonDisabled: {
    backgroundColor: '#95a5a6',
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalBody: {
    padding: 20,
    maxHeight: '70%',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  detailLabel: {
    width: '40%',
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  amountText: {
    fontSize: 16,
    color: '#27ae60',
    fontWeight: 'bold',
  },
  messageBox: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  messageLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
    marginBottom: 5,
  },
  messageText: {
    fontSize: 13,
    color: '#34495e',
    lineHeight: 20,
  }
});

export default HomeScreen;