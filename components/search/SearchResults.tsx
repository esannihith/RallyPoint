import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MapPin } from 'lucide-react-native';
import { AutocompletePrediction } from '@/types';
import { getPlaceIconColor } from '@/services/googleMapsService';
import { LoadingSpinner, EmptyState } from '@/components/ui';

interface SearchResultsProps {
  results: AutocompletePrediction[];
  isLoading: boolean;
  onPlaceSelect: (prediction: AutocompletePrediction) => void;
  searchQuery: string;
}

export default function SearchResults({ 
  results, 
  isLoading, 
  onPlaceSelect, 
  searchQuery 
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <LoadingSpinner 
        text="Searching places..." 
        style={styles.loadingContainer}
      />
    );
  }

  if (searchQuery.trim().length > 2 && results.length === 0) {
    return (
      <EmptyState
        icon={MapPin}
        title="No places found"
        description="Try searching with different keywords or check your spelling"
        style={styles.emptyContainer}
      />
    );
  }

  if (results.length === 0) {
    return null;
  }

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => (
      <Text
        key={index}
        style={part.toLowerCase() === query.toLowerCase() ? styles.highlightedText : null}
      >
        {part}
      </Text>
    ));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Search Results</Text>
      {results.map((prediction) => (
        <TouchableOpacity
          key={prediction.place_id}
          style={styles.resultItem}
          onPress={() => onPlaceSelect(prediction)}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <MapPin size={20} color={getPlaceIconColor(prediction.types)} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.mainText}>
              {highlightText(prediction.structured_formatting.main_text, searchQuery)}
            </Text>
            <Text style={styles.secondaryText}>
              {prediction.structured_formatting.secondary_text}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 16,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  mainText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 2,
    lineHeight: 22,
  },
  secondaryText: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
  },
  highlightedText: {
    fontWeight: '700',
    color: '#1976D2',
  },
  loadingContainer: {
    paddingVertical: 48,
  },
  emptyContainer: {
    paddingVertical: 48,
  },
});