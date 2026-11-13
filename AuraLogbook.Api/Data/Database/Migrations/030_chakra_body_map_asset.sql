-- Register the seated human silhouette used to position the chakra reference markers.
INSERT INTO GraphicAssets (AssetKey, AssetPath, DisplayName, AlternativeText, AssetType) VALUES
    ('chakra-body-map', '/theme-assets/pathways/astrology-energy/chakra-illustrations/chakra-body-map.svg', 'Chakra body map', 'Seated human silhouette with seven colored centers aligned along the spine', 'pathway-reference')
ON CONFLICT(AssetKey) DO UPDATE SET
    AssetPath = excluded.AssetPath,
    DisplayName = excluded.DisplayName,
    AlternativeText = excluded.AlternativeText,
    AssetType = excluded.AssetType,
    IsActive = 1;
