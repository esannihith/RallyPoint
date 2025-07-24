import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Button } from 'react-native';
import Constants from 'expo-constants';

export const ApiDebugScreen = () => {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(`[DEBUG] ${message}`);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testGoogleMapsApi = async () => {
    addLog('Testing Google Maps API...');
    const apiKey = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      addLog('❌ Google Maps API Key not found in Constants');
      return;
    }
    
    addLog(`✅ Google Maps API Key found: ${apiKey.substring(0, 10)}...`);
    
    try {
      const testUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=Mumbai&key=${apiKey}&types=establishment|geocode&components=country:in`;
      addLog(`Testing URL: ${testUrl.substring(0, 100)}...`);
      
      const response = await fetch(testUrl);
      addLog(`Response status: ${response.status}`);
      
      const data = await response.json();
      addLog(`Response: ${JSON.stringify(data).substring(0, 200)}...`);
      
      if (data.status === 'OK') {
        addLog('✅ Google Maps API is working');
      } else {
        addLog(`❌ Google Maps API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }
    } catch (error) {
      addLog(`❌ Network error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const testBackendApi = async () => {
    addLog('Testing Backend API...');
    const apiUrl = Constants.expoConfig?.extra?.API_URL;
    
    if (!apiUrl) {
      addLog('❌ Backend API URL not found in Constants');
      return;
    }
    
    addLog(`✅ Backend API URL found: ${apiUrl}`);
    
    try {
      const response = await fetch(`${apiUrl}/health`);
      addLog(`Backend health check status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.text();
        addLog(`Backend response: ${data}`);
        addLog('✅ Backend API is reachable');
      } else {
        addLog(`❌ Backend API error: ${response.status}`);
      }
    } catch (error) {
      addLog(`❌ Backend network error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const checkConstants = () => {
    addLog('Checking Constants...');
    addLog(`API_URL: ${Constants.expoConfig?.extra?.API_URL || 'NOT FOUND'}`);
    addLog(`GOOGLE_MAPS_API_KEY: ${Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY || 'NOT FOUND'}`);
    addLog(`MAPBOX_ACCESS_TOKEN: ${Constants.expoConfig?.extra?.MAPBOX_ACCESS_TOKEN || 'NOT FOUND'}`);
  };

  useEffect(() => {
    checkConstants();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>API Debug Screen</Text>
      
      <View style={styles.buttonContainer}>
        <Button title="Test Google Maps API" onPress={testGoogleMapsApi} />
        <Button title="Test Backend API" onPress={testBackendApi} />
        <Button title="Check Constants" onPress={checkConstants} />
        <Button title="Clear Logs" onPress={() => setDebugInfo([])} />
      </View>

      <View style={styles.logContainer}>
        <Text style={styles.logTitle}>Debug Logs:</Text>
        {debugInfo.map((log, index) => (
          <Text key={index} style={styles.logItem}>{log}</Text>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 10,
    marginBottom: 20,
  },
  logContainer: {
    marginTop: 20,
  },
  logTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  logItem: {
    fontSize: 12,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
});
