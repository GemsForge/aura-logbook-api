-- #331: weather location is off for every existing account until the user turns it on.
-- Only a typed place is stored; device coordinates are never persisted.
ALTER TABLE Users ADD COLUMN WeatherLocationMode TEXT NOT NULL DEFAULT 'Off';
ALTER TABLE Users ADD COLUMN WeatherCity TEXT;
ALTER TABLE Users ADD COLUMN WeatherRegion TEXT;
ALTER TABLE Users ADD COLUMN WeatherCountry TEXT;
ALTER TABLE Users ADD COLUMN TemperatureUnit TEXT NOT NULL DEFAULT 'F';
