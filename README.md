# M-Pesa Transactions Parser

## Overview

This React Native application automates the management of M-Pesa paybill transactions for any organization. The app extracts M-Pesa transaction data from SMS messages, organizes it into structured data (Transaction ID, Amount, Time, etc.), and provides export functionality to Excel format with weekly to monthly and custom cutoff periods. This app was made to automate a painpoint in my local church where transactions were manually transferred to excel from the official church paybill. its still a WIP. have fun with it, I sure did!

## Features

- **M-Pesa SMS Parsing**: Automatically extracts transaction data from paybill messages
- **Data Organization**: Structures data by Transaction ID, Amount, Date/Time, and Sender
- **Weekly Reports**: Configurable weekly cutoff (Sunday to Saturday) for accounting purposes
- **Excel Export**: One-click export of transaction data to Excel format
- **Authentication**: Simple authentication system to protect sensitive financial data
- **Beautiful UI**: Clean, intuitive interface designed for ease of use

## Technical Stack

- React Native
- Expo
- React Navigation
- Expo SMS Reader
- XLSX Library for Excel export
- AsyncStorage for local data storage
- React Native Paper for UI components

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/your-username/xyz-sda-mpesa-parser.git
   ```

2. Navigate to the project directory:
   ```
   cd xyz-sda-mpesa-parser
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Start the development server:
   ```
   npx expo start
   ```

## Usage

1. **Login**: Use the provided credentials to access the app
2. **Parse Messages**: The app automatically reads and parses M-Pesa messages
3. **View Transactions**: Browse through parsed transactions in a clean list format
4. **Export Data**: Generate Excel reports with weekly cutoff periods
5. **Settings**: Configure app preferences and export parameters

## Permissions

The app requires the following permissions:
- SMS reading permission
- Storage permission (for saving Excel files)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
