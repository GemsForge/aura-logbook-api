// utils/profile.ts

import type { UserProfile } from "@/features/auth/models";

export function getProfileCompletion(user: UserProfile): number {
  const fields = [
    user.displayName,
    user.birthday,
    user.zodiacSign,
    user.avatar, // covers both image URLs or initials
    user.auraColor,
    user.auraIntensity,
  ];
  const filled = fields.filter(
    (f) => f !== undefined && f !== null && f !== ""
  ).length;
  return Math.round((filled / fields.length) * 100);
}
