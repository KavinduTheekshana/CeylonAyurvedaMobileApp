// app/utils/therapistUtils.ts

/**
 * Get the display name for a therapist
 * Returns nickname if available and not empty, otherwise returns full name
 * 
 * @param therapist - Therapist object with name and optional nickname
 * @returns Display name to show to users
 */
export const getTherapistDisplayName = (therapist: {
  name: string;
  nickname?: string | null;
}): string => {
  // Check if nickname exists and is not empty/null
  if (therapist.nickname && therapist.nickname.trim().length > 0) {
    return therapist.nickname;
  }
  
  // Fallback to full name
  return therapist.name;
};

/**
 * Check if therapist has a nickname
 * 
 * @param therapist - Therapist object
 * @returns true if nickname exists and is not empty
 */
export const hasNickname = (therapist: {
  nickname?: string | null;
}): boolean => {
  return !!(therapist.nickname && therapist.nickname.trim().length > 0);
};