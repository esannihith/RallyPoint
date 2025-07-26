import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { PlaceResult } from '@/types';
import { getPlacePhotoUrl } from '@/services/googleMapsService';

interface PlacePhotosProps {
  place: PlaceResult;
}

export function PlacePhotos({ place }: PlacePhotosProps) {
  // Removed debug logging
  
  if (!place.photos || place.photos.length === 0) {
    return null;
  }

  return (
    <View style={styles.photosContainer}>
      <Text style={styles.sectionTitle}>Photos</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.photosScrollContent}
      >
        {place.photos.slice(0, 5).map((photo, index) => {
          const photoUrl = getPlacePhotoUrl(photo.photo_reference, 400);
          // Debug logging removed
          
          return (
            <TouchableOpacity key={index} activeOpacity={0.8}>
              <Image
                source={{ uri: photoUrl }}
                style={[
                  styles.photo,
                  index === 0 && styles.firstPhoto
                ]}
                onError={(error) => {
                  console.error('Image load error:', error.nativeEvent.error);
                }}
                onLoad={() => {
                  // console.log('Image loaded successfully:', photoUrl);
                }}
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  photosContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  photosScrollContent: {
    paddingRight: 20,
  },
  photo: {
    width: 120,
    height: 90,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
  },
  firstPhoto: {
    width: 140,
    height: 105,
  },
});