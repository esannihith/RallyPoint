import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated, Dimensions } from 'react-native';
import { useRoomStore } from '@/stores/roomStore';
import { Ionicons } from '@expo/vector-icons';


interface ChatBubbleProps {
  onPress: () => void;
  isChatOpen: boolean;
}

// Get screen dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const BUBBLE_SIZE = 56;

export const ChatBubble: React.FC<ChatBubbleProps> = ({ onPress, isChatOpen }) => {
  const activeRoom = useRoomStore((s) => s.activeRoom);
  const unreadCount = useRoomStore((s) => s.unreadCount);

  // Animated values for the bubble's position and scale
  const pan = useRef(new Animated.ValueXY({ x: screenWidth - (BUBBLE_SIZE + 16), y: screenHeight - (BUBBLE_SIZE + 50) })).current;
  const scale = useRef(new Animated.Value(1)).current;
  
  // Use state for re-rendering styles and effects
  const [isDragging, setIsDragging] = useState(false);
  // Use a ref for synchronous access to dragging status inside PanResponder
  const isDraggingRef = useRef(false);


  // Animate the scale based on the dragging state for visual feedback
  useEffect(() => {
    Animated.spring(scale, {
      toValue: isDragging ? 1.1 : 1,
      friction: 5,
      useNativeDriver: false, // ValueXY is not compatible with native driver
    }).start();
  }, [isDragging, scale]);

  // PanResponder to handle both tap and drag gestures
  const panResponder = useRef(
    PanResponder.create({
      // Ask to become responder for all touch starts
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Reset dragging status at the beginning of a new gesture
        isDraggingRef.current = false;
        setIsDragging(false);
        // When gesture starts, save the current position as an offset
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
        // Reset the animated value to {x: 0, y: 0} for calculating the delta
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (e, gesture) => {
        // If the finger moves more than a few pixels, we consider it a drag
        if (Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5) {
          if (!isDraggingRef.current) {
            isDraggingRef.current = true;
            // Set state to trigger useEffect for scaling animation
            setIsDragging(true);
          }
        }
        // Update the position based on finger movement
        return Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        })(e, gesture);
      },
      onPanResponderRelease: (e, gesture) => {
        // Combine the offset with the final value
        pan.flattenOffset();
        
        // **FIX**: Check the ref for the most current dragging status.
        // This is synchronous and not subject to closure/state update delays.
        if (!isDraggingRef.current) {
          onPress();
        }

        // Reset the dragging state for styling/animation
        setIsDragging(false);

        // Ensure the bubble stays within the screen boundaries with a spring animation
        let newX = pan.x._value;
        let newY = pan.y._value;

        if (newX < 0) newX = 0;
        if (newX > screenWidth - BUBBLE_SIZE) newX = screenWidth - BUBBLE_SIZE;
        if (newY < 0) newY = 0;
        if (newY > screenHeight - BUBBLE_SIZE) newY = screenHeight - BUBBLE_SIZE;

        Animated.spring(pan, {
          toValue: { x: newX, y: newY },
          friction: 7,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  if (!activeRoom) return null;

  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: scale }, // Apply scale transform here
          ],
        },
        isChatOpen && styles.bubbleActive,
        isDragging && styles.dragging, // This style now only controls opacity
      ]}
      {...panResponder.panHandlers}
    >
      <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
      {unreadCount > 0 && !isChatOpen && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount}</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    backgroundColor: '#8B5CF6',
    borderRadius: BUBBLE_SIZE / 2,
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    zIndex: 1000,
  },
  bubbleActive: {
    backgroundColor: '#7C3AED',
  },
  dragging: {
    opacity: 0.8, // The transform property has been removed to prevent conflicts
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
