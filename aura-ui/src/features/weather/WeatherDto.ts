export interface WeatherDto {
  temperature: number;
  /** "F" or "C"; older API responses omit it and mean Fahrenheit. */
  unit?: "F" | "C";
  description: string;
  iconCode: string;
}
