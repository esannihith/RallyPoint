import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useLocationStore } from '@/stores/locationStore';
import { PlaceHeader } from './PlaceHeader';
import { PlaceActions } from './PlaceActions';
import { PlaceInfo } from './PlaceInfo';
import { PlacePhotos } from './PlacePhotos';

export default function PlaceDetailsBottomSheet() {
  const { isBottomSheetOpen, setBottomSheetOpen, setSelectedPlace, getSelectedPlace } = useLocationStore();
  
  // Calculate minimal snap point based on navigation bar height
  // iOS: 88px nav bar, Android: 68px nav bar + action buttons height (~140px total)
  const minimalHeight = Platform.OS === 'ios' ? '20%' : '22%';
  const snapPoints = useMemo(() => [minimalHeight, '50%', '85%'], [minimalHeight]);

  const handleSheetChanges = useCallback((index: number) => {
    // Only update state when sheet is completely closed
    if (index === -1) {
      setBottomSheetOpen(false);
    }
  }, [setBottomSheetOpen]);

  const handleClose = useCallback(() => {
    setSelectedPlace(null);
    setBottomSheetOpen(false);
  }, [setSelectedPlace, setBottomSheetOpen]);

  const currentPlace = useMemo(() => getSelectedPlace(), [getSelectedPlace]);

  if (!currentPlace) {
    return null;
  }

  return (
    <BottomSheet
      index={isBottomSheetOpen ? 0 : -1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose={false} // Disabled - only close via close button
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      style={styles.bottomSheet}
    >
      <BottomSheetScrollView 
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <PlaceHeader place={currentPlace} onClose={handleClose} />
        <PlaceActions place={currentPlace} />
        <PlaceInfo place={currentPlace} />
        <PlacePhotos place={currentPlace} />
        
        {/* Bottom padding for navigation bar */}
        <View style={styles.bottomPadding} />
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bottomSheet: {
    zIndex: 100, // Higher zIndex so it appears above FloatingActionButtons
  },
  bottomSheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  handleIndicator: {
    backgroundColor: '#E0E0E0',
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  bottomPadding: {
    height: Platform.OS === 'ios' ? 100 : 80, // Account for navigation bar
  },
});