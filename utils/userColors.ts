// User color palette for different users in rooms
export const USER_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6366F1', // Indigo
];

/**
 * Get a consistent color for a user based on their position in the room
 * @param userIndex - The index of the user in the room (0-based)
 * @returns Hex color string
 */
export const getUserColor = (userIndex: number): string => {
  return USER_COLORS[userIndex % USER_COLORS.length];
};

/**
 * Get user color by user ID within a list of user IDs
 * @param userId - The user ID to get color for
 * @param userIds - Array of all user IDs in the room
 * @returns Hex color string
 */
export const getUserColorById = (userId: string, userIds: string[]): string => {
  const userIndex = userIds.indexOf(userId);
  return getUserColor(userIndex);
};

/**
 * Generate color assignments for all users in a room
 * @param userIds - Array of user IDs
 * @returns Object mapping user ID to color
 */
export const generateUserColorMap = (userIds: string[]): Record<string, string> => {
  const colorMap: Record<string, string> = {};
  
  userIds.forEach((userId, index) => {
    colorMap[userId] = getUserColor(index);
  });
  
  return colorMap;
};