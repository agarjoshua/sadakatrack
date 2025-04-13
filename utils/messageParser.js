import { format } from 'date-fns';

/**
 * Enhanced parser for M-Pesa messages to extract transaction details
 * @param {string} messageBody - The SMS body
 * @param {Date} messageDate - The date of the SMS
 * @returns {Object|null} Parsed transaction object or null if not a valid M-Pesa message
 */
export const parseMessage = (messageBody, messageDate) => {
  if (!messageBody) return null;
  
  console.log("Parsing message:", messageBody);
  
  // Check if it's an M-Pesa transaction message with broader criteria
  const mpesaKeywords = [
    'MPKWA2C', 'M-PESA', 'MPESA', 'received from', 'paid to', 
    'sent to', 'paybill', 'buy goods', 'transaction', 'confirmed'
  ];
  
  const isMpesa = mpesaKeywords.some(keyword => 
    messageBody.toLowerCase().includes(keyword.toLowerCase())
  );
  
  if (!isMpesa) {
    console.log("Not an M-Pesa message");
    return null;
  }
  
  try {
    // Extract transaction ID - specifically looking for alphanumeric codes at the beginning
    // or after specific keywords
    let transactionId = null;
    const idPatterns = [
      /^([A-Z0-9]{10})\s+Confirmed/i,                       // Pattern for IDs at the start like "TDB2BU7T7S Confirmed"
      /^([A-Z0-9]{8,12})\s+/,                               // Any ID at the start of the message
      /(?:transaction|confirmation|reference)\s+(?:code|id)?\s*[:#]?\s*([A-Z0-9]{8,12})/i,  // Various transaction code formats
      /(?:receipt|confirmation)\s+(?:no|number|code)?\s*[:#]?\s*([A-Z0-9]{8,12})/i,        // Receipt number formats
      /([A-Z0-9]{10})/,                                     // Standard 10-char ID
      /([A-Z][A-Z0-9]{7,11})/                               // Alphanumeric ID starting with letter
    ];
    
    for (const pattern of idPatterns) {
      const match = messageBody.match(pattern);
      if (match && match[1] && match[1].length >= 8) {
        transactionId = match[1];
        console.log("Transaction ID extracted:", transactionId);
        break;
      }
    }
    
    // Extract date and time if available, otherwise use messageDate
    let transactionDate = messageDate || new Date();
    const datePatterns = [
      /on\s+(\d{1,2}\/\d{1,2}\/\d{2,4})\s+at\s+(\d{1,2}:\d{2}\s*[AP]M)/i,  // on 11/4/25 at 2:37 PM
      /date:\s*(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(\d{1,2}:\d{2}\s*[AP]M)/i      // date: 11/4/2025 2:37PM
    ];
    
    for (const pattern of datePatterns) {
      const match = messageBody.match(pattern);
      if (match && match[1] && match[2]) {
        try {
          const dateStr = match[1];
          const timeStr = match[2];
          const dateTimeParts = dateStr.split('/');
          const day = parseInt(dateTimeParts[0]);
          const month = parseInt(dateTimeParts[1]) - 1; // JS months are 0-based
          
          // Handle 2-digit years by assuming 20xx for simplicity
          let year = parseInt(dateTimeParts[2]);
          if (year < 100) {
            year = 2000 + year;
          }
          
          const timeParts = timeStr.match(/(\d{1,2}):(\d{2})\s*([AP]M)/i);
          if (timeParts) {
            let hours = parseInt(timeParts[1]);
            const minutes = parseInt(timeParts[2]);
            const ampm = timeParts[3].toUpperCase();
            
            if (ampm === 'PM' && hours < 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;
            
            transactionDate = new Date(year, month, day, hours, minutes);
            console.log("Transaction date extracted:", transactionDate);
          }
        } catch (e) {
          console.error("Failed to parse date from message:", e);
        }
      }
    }
    
    // Extract amount - looking for patterns like "Ksh5,000" or "KSh 5,000" or "5,000 sent to"
    let amount = 0;
    const amountPatterns = [
      /(?:Ksh|KSh|KES)\s*([0-9,]+\.?[0-9]*)/i,               // Ksh5,000 or KSh 5,000
      /Ksh\s+received/i,                                      // Special case for "Ksh received" (no amount specified)
      /received\s+(?:Ksh|KSh|KES)?\s*([0-9,]+\.?[0-9]*)/i,   // received Ksh5,000
      /Ksh([0-9,]+\.?[0-9]*)/i,                              // Ksh5000 (no space)
      /([0-9,]+\.?[0-9]*)\s+(?:sent|paid|received)/i,        // 5,000 sent/paid/received
      /of\s+(?:Ksh|KSh|KES)?\s*([0-9,]+\.?[0-9]*)/i,         // of Ksh5,000
    ];
    
    for (const pattern of amountPatterns) {
      const match = messageBody.match(pattern);
      if (match) {
        // Special case for "Ksh received" with no amount specified
        if (pattern.toString().includes('Ksh\\s+received')) {
          // When amount is not specified, set a default or determine from context
          // For now, we'll set it to 0 and flag it
          amount = 0;
          console.log("Amount not specified in message, set to:", amount);
        } else if (match[1]) {
          amount = parseFloat(match[1].replace(/,/g, ''));
          console.log("Amount extracted:", amount);
        }
        break;
      }
    }
    
    // Extract sender name with improved patterns for your format
    let sender = 'Unknown';
    const senderPatterns = [
      // Improved pattern for "received from NAME PHONENUMBER" format
      /received\s+from\s+([A-Z][A-Z\s]+)\s+(?:0|254|\+254)/i,  // received from JOHN DOE 254...
      /from\s+([A-Z][A-Z\s]+)\s+(?:0|254|\+254)/i,            // from JOHN DOE 254...
      
      // More general patterns
      /from\s+([A-Z][A-Z\s]+)/i,                             // from JOHN DOE
      /received\s+from\s+([A-Z][A-Z\s]+)/i,                  // received from JOHN DOE
    ];
    
    for (const pattern of senderPatterns) {
      const match = messageBody.match(pattern);
      if (match && match[1]) {
        sender = match[1].trim();
        console.log("Sender extracted:", sender);
        break;
      }
    }
    
    // Extract phone number with more flexible pattern
    let phoneNumber = 'Unknown';
    const phonePatterns = [
      // Pattern for phone number after sender name
      new RegExp(`${sender.replace(/\s+/g, '\\s+')}\\s+(254[0-9]{9})`),  // WYCLIFFE TAI 254721918757
      /from\s+[A-Z][A-Z\s]+\s+(254[0-9]{9})/i,               // from NAME 254...
      /(254[0-9]{9})/,                                        // Any 254... number
      /(\+254[0-9]{9})/,                                      // +254...
      /\b(0[0-9]{9})\b/,                                      // 07...
    ];
    
    for (const pattern of phonePatterns) {
      const match = messageBody.match(pattern);
      if (match && match[1]) {
        // Format the phone number consistently
        let extractedNumber = match[1];
        
        // Convert to international format if it's a local number
        if (extractedNumber.startsWith('0')) {
          extractedNumber = '254' + extractedNumber.substring(1);
        } else if (extractedNumber.startsWith('+254')) {
          extractedNumber = extractedNumber.substring(1);
        }
        
        phoneNumber = extractedNumber;
        console.log("Phone number extracted:", phoneNumber);
        break;
      }
    }
    
    // Extract account/business info
    let account = null;
    const accountPatterns = [
      /Account\s+Number\s+([A-Za-z0-9\s-_]+?)(?:\s+New|\.|$)/i,  // Account Number Building
      /account\s+(?:number|no|#)?\s*[:#]?\s*([A-Za-z0-9-_]+)/i,  // account number/no ABC123
      /to\s+(?:account|acc)\s+([A-Za-z0-9-_]+)/i,               // to account ABC123
      /account\s+([A-Za-z0-9-_]+)/i                             // account ABC123
    ];
    
    for (const pattern of accountPatterns) {
      const match = messageBody.match(pattern);
      if (match && match[1]) {
        account = match[1].trim();
        console.log("Account extracted:", account);
        break;
      }
    }
    
    // Extract balance if available
    let balance = null;
    const balancePatterns = [
      /balance\s+is\s+(?:Ksh|KSh|KES)?\s*([0-9,]+\.?[0-9]*)/i,  // balance is Ksh5,000
      /new\s+(?:utility\s+)?balance\s*(?::|is)?\s*(?:Ksh|KSh|KES)?\s*([0-9,]+\.?[0-9]*)/i,  // new utility balance is Ksh00
      /Available\s+balance\s*(?::|is)?\s*(?:Ksh|KSh|KES)?\s*([0-9,]+\.?[0-9]*)/i  // Available balance: Ksh5,000
    ];
    
    for (const pattern of balancePatterns) {
      const match = messageBody.match(pattern);
      if (match && match[1]) {
        balance = parseFloat(match[1].replace(/,/g, ''));
        console.log("Balance extracted:", balance);
        break;
      }
    }
    
    // If no transaction ID found, generate one based on date and content
    if (!transactionId) {
      const dateStr = format(transactionDate || new Date(), 'yyyyMMddHHmm');
      const contentHash = messageBody.length.toString(16).padStart(4, '0');
      transactionId = `GEN${dateStr}${contentHash}`.substring(0, 10);
      console.log("Generated transaction ID:", transactionId);
    }
    
    // Determine transaction type
    let transactionType = 'unknown';
    if (messageBody.toLowerCase().includes('received')) {
      transactionType = 'received';
    } else if (messageBody.toLowerCase().includes('sent to')) {
      transactionType = 'sent';
    } else if (messageBody.toLowerCase().includes('paid to')) {
      transactionType = 'paid';
    } else if (messageBody.toLowerCase().includes('withdraw')) {
      transactionType = 'withdraw';
    } else if (messageBody.toLowerCase().includes('buy goods')) {
      transactionType = 'goods';
    }
    
    return {
      amount,
      sender,
      phoneNumber,
      transactionId,
      transactionType,
      account: account || null,
      balance: balance || null,
      date: transactionDate,
      rawMessage: messageBody
    };
    
  } catch (error) {
    console.error("Error parsing M-Pesa message:", error);
    return null;
  }
};