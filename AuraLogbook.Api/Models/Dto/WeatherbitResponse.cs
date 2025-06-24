using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace AuraLogbookApi.Dtos
{
    public class WeatherbitResponse
    {
        /// <summary>
        /// Count of returned observations.
        /// </summary>
        [JsonPropertyName("count")]
        public int Count { get; set; }

        /// <summary>
        /// Array of weather data points (usually length 1 for the current endpoint).
        /// </summary>
        [JsonPropertyName("data")]
        public required List<WeatherbitData> Data { get; set; }
    }

    public class WeatherbitData
    {
        [JsonPropertyName("lat")]
        public double Lat { get; set; }

        [JsonPropertyName("lon")]
        public double Lon { get; set; }

        [JsonPropertyName("sunrise")]
        public required string Sunrise { get; set; }

        [JsonPropertyName("sunset")]
        public required string Sunset { get; set; }

        [JsonPropertyName("timezone")]
        public required string Timezone { get; set; }

        [JsonPropertyName("station")]
        public required string Station { get; set; }

        [JsonPropertyName("sources")]
        public required List<string> Sources { get; set; }

        [JsonPropertyName("ob_time")]
        public required string ObservationTime { get; set; }

        [JsonPropertyName("datetime")]
        public required string DateTimeDeprecated { get; set; }

        [JsonPropertyName("ts")]
        public long Timestamp { get; set; }

        [JsonPropertyName("city_name")]
        public required string CityName { get; set; }

        [JsonPropertyName("country_code")]
        public required string CountryCode { get; set; }

        [JsonPropertyName("state_code")]
        public required string StateCode { get; set; }

        [JsonPropertyName("pres")]
        public double Pressure { get; set; }

        [JsonPropertyName("slp")]
        public double SeaLevelPressure { get; set; }

        [JsonPropertyName("wind_spd")]
        public double WindSpeed { get; set; }

        [JsonPropertyName("gust")]
        public double? WindGust { get; set; }

        [JsonPropertyName("wind_dir")]
        public int WindDirection { get; set; }

        [JsonPropertyName("wind_cdir")]
        public required string WindDirectionAbbrev { get; set; }

        [JsonPropertyName("wind_cdir_full")]
        public required string WindDirectionFull { get; set; }

        [JsonPropertyName("temp")]
        public double Temperature { get; set; }

        [JsonPropertyName("app_temp")]
        public double FeelsLike { get; set; }

        [JsonPropertyName("rh")]
        public int Humidity { get; set; }

        [JsonPropertyName("dewpt")]
        public double DewPoint { get; set; }

        [JsonPropertyName("clouds")]
        public int CloudCoverage { get; set; }

        [JsonPropertyName("pod")]
        public required string PartOfDay { get; set; }

        [JsonPropertyName("weather")]
        public required WeatherbitWeather Weather { get; set; }

        [JsonPropertyName("vis")]
        public double Visibility { get; set; }

        [JsonPropertyName("precip")]
        public double? Precipitation { get; set; }

        [JsonPropertyName("snow")]
        public double? Snowfall { get; set; }

        [JsonPropertyName("uv")]
        public double? UVIndex { get; set; }

        [JsonPropertyName("aqi")]
        public int? AirQualityIndex { get; set; }

        [JsonPropertyName("dhi")]
        public double DiffuseIrradiance { get; set; }

        [JsonPropertyName("dni")]
        public double DirectNormalIrradiance { get; set; }

        [JsonPropertyName("ghi")]
        public double GlobalHorizontalIrradiance { get; set; }

        [JsonPropertyName("solar_rad")]
        public double SolarRadiation { get; set; }

        [JsonPropertyName("elev_angle")]
        public double SolarElevationAngle { get; set; }

        [JsonPropertyName("h_angle")]
        public double SolarHourAngle { get; set; }
    }

    public class WeatherbitWeather
    {
        /// <summary>
        /// Weather icon code (e.g., "c02d").
        /// </summary>
        [JsonPropertyName("icon")]
        public required string Icon { get; set; }

        /// <summary>
        /// Weather code.
        /// </summary>
        [JsonPropertyName("code")]
        public int Code { get; set; }

        /// <summary>
        /// Text description (e.g., "Partly cloudy").
        /// </summary>
        [JsonPropertyName("description")]
        public required string Description { get; set; }
    }
}
