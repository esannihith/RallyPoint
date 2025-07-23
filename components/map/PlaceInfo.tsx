import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { MapPin, Clock, Navigation2, Phone, Globe, ExternalLink } from 'lucide-react-native';
import { PlaceResult } from '@/types';

interface PlaceInfoProps {
  place: PlaceResult;
}

export function PlaceInfo({ place }: PlaceInfoProps) {
  const getBusinessStatus = (status?: string) => {
    switch (status) {
      case 'OPERATIONAL':
        return { text: 'Open', color: '#10B981' };
      case 'CLOSED_TEMPORARILY':
        return { text: 'Temporarily closed', color: '#F59E0B' };
      case 'CLOSED_PERMANENTLY':
        return { text: 'Permanently closed', color: '#EF4444' };
      default:
        return null;
    }
  };

  const businessStatus = getBusinessStatus(place.business_status);
  const isOpen = place.opening_hours?.open_now;

  // Get today's hours
  const getTodaysHours = () => {
    if (!place.opening_hours?.weekday_text) return null;
    const today = new Date().getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[today];
    
    return place.opening_hours.weekday_text.find(hours => 
      hours.toLowerCase().startsWith(todayName.toLowerCase())
    );
  };

  const todaysHours = getTodaysHours();

  return (
    <View style={styles.infoContainer}>
      {/* Address */}
      <View style={styles.infoRow}>
        <View style={styles.iconContainer}>
          <MapPin size={18} color="#6B7280" />
        </View>
        <Text style={styles.infoText}>
          {place.formatted_address || place.vicinity || 'Address not available'}
        </Text>
      </View>

      {/* Business Status & Hours */}
      {(businessStatus || isOpen !== undefined || todaysHours) && (
        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <Clock size={18} color={isOpen ? '#10B981' : businessStatus?.color || '#6B7280'} />
          </View>
          <View style={styles.statusContainer}>
            {businessStatus ? (
              <Text style={[styles.statusText, { color: businessStatus.color }]}>
                {businessStatus.text}
              </Text>
            ) : isOpen !== undefined ? (
              <Text style={[styles.statusText, { color: isOpen ? '#10B981' : '#EF4444' }]}>
                {isOpen ? 'Open now' : 'Closed'}
              </Text>
            ) : (
              <Text style={styles.infoLabel}>Hours</Text>
            )}
            
            {todaysHours && (
              <Text style={styles.hoursText}>
                {todaysHours.replace(/^[A-Za-z]+:\s*/, '')}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Distance - Mock data for now */}
      <View style={styles.infoRow}>
        <View style={styles.iconContainer}>
          <Navigation2 size={18} color="#6B7280" />
        </View>
        <View>
          <Text style={styles.infoLabel}>Distance not available</Text>
          <Text style={styles.infoSubtext}>Enable location for directions</Text>
        </View>
      </View>

      {/* Contact Information */}
      {place.international_phone_number && (
        <TouchableOpacity 
          style={styles.contactRow}
          onPress={() => Linking.openURL(`tel:${place.international_phone_number}`)}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Phone size={18} color="#6B7280" />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.infoLabel}>Call</Text>
            <Text style={styles.contactValue}>{place.international_phone_number}</Text>
          </View>
          <ExternalLink size={16} color="#8B5CF6" />
        </TouchableOpacity>
      )}

      {place.website && (
        <TouchableOpacity 
          style={styles.contactRow}
          onPress={() => Linking.openURL(place.website!)}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Globe size={18} color="#6B7280" />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.infoLabel}>Website</Text>
            <Text style={styles.contactValue} numberOfLines={1}>
              Visit website
            </Text>
          </View>
          <ExternalLink size={16} color="#8B5CF6" />
        </TouchableOpacity>
      )}

      {/* Opening Hours Section - Full schedule */}
      {place.opening_hours?.weekday_text && place.opening_hours.weekday_text.length > 0 && (
        <View style={styles.hoursSection}>
          <Text style={styles.sectionTitle}>Opening Hours</Text>
          {place.opening_hours.weekday_text.map((hours, index) => {
            const [day, time] = hours.split(': ');
            const isToday = new Date().getDay() === (index === 6 ? 0 : index + 1); // Adjust for Sunday being 0
            
            return (
              <View key={index} style={[styles.hoursRow, isToday && styles.todayRow]}>
                <Text style={[styles.dayText, isToday && styles.todayText]}>{day}</Text>
                <Text style={[styles.timeText, isToday && styles.todayText]}>
                  {time || 'Closed'}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  infoContainer: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  infoSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  hoursText: {
    fontSize: 14,
    color: '#6B7280',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  contactInfo: {
    flex: 1,
  },
  contactValue: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  hoursSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  todayRow: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    borderRadius: 6,
    marginHorizontal: -8,
  },
  dayText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  timeText: {
    fontSize: 14,
    color: '#374151',
  },
  todayText: {
    color: '#1976D2',
    fontWeight: '600',
  },
});