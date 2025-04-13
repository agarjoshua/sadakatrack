import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true); // Start with loading state
  const [userToken, setUserToken] = useState(null);
  
  // Default credentials for demo purpose
  // In a real app, these would be stored securely or validated against a backend
  const validCredentials = {
    username: 'admin',
    password: 'church123'
  };
  
  // Check if user is already logged in when the app starts
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        console.log('Stored token:', storedToken);
        
        if (storedToken) {
          setUserToken(storedToken);
        }
      } catch (e) {
        console.log('Restore token error:', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);
  
  const login = async (username, password) => {
    setIsLoading(true);
    
    try {
      console.log('Starting authentication check');
      // Simple authentication logic
      if (username === validCredentials.username && password === validCredentials.password) {
        // Generate a simple token (in a real app, this would come from your auth server)
        const token = `user_${Date.now()}`;
        console.log('Starting AsyncStorage operation');
        await AsyncStorage.setItem('userToken', token);
        console.log('AsyncStorage operation completed');
        
        // Important: Update the token state after AsyncStorage operation
        setUserToken(token);
        return true; // Return success status
      } else {
        Alert.alert('Authentication Failed', 'Invalid username or password');
        return false; // Return failure status
      }
    } catch (e) {
      console.log('Login error:', e);
      Alert.alert('Error', 'Failed to login. Please try again.');
      return false; // Return failure status
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = async () => {
    setIsLoading(true);
    try {
      console.log('Starting logout process');
      await AsyncStorage.removeItem('userToken');
      console.log('User token removed');
      setUserToken(null);
    } catch (e) {
      console.log('Logout error:', e);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <AuthContext.Provider value={{ login, logout, isLoading, userToken }}>
      {children}
    </AuthContext.Provider>
  );
};