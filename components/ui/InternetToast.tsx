import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function InternetToast() {
  return (
    <View style={styles.toast}>
      <Text style={styles.text}>No internet connection</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#F44336',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    zIndex: 9999,
    marginHorizontal: 16,
    marginTop: 8,
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
