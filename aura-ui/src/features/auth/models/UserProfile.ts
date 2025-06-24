export interface UserProfile {
  id: number;
  email: string;
  displayName: string;
  token: string;
  birthday: string;
  zodiacSign: string;

  lat?: number;
  lon?: number;
  city?: string;
  state?: string;
  country?: string;
}
