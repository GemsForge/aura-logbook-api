-- Store the contemporary seven-center reference as editable pathway data instead of UI copy.
ALTER TABLE ChakraDefinitions ADD COLUMN SanskritName TEXT NOT NULL DEFAULT '';
ALTER TABLE ChakraDefinitions ADD COLUMN BodyLocation TEXT NOT NULL DEFAULT '';
ALTER TABLE ChakraDefinitions ADD COLUMN ColorAssociation TEXT NOT NULL DEFAULT '';
ALTER TABLE ChakraDefinitions ADD COLUMN ElementAssociation TEXT NOT NULL DEFAULT '';
ALTER TABLE ChakraDefinitions ADD COLUMN InterpretiveTheme TEXT NOT NULL DEFAULT '';
ALTER TABLE ChakraDefinitions ADD COLUMN ChallengeAssociation TEXT NOT NULL DEFAULT '';
ALTER TABLE ChakraDefinitions ADD COLUMN ReflectionPrompt TEXT NOT NULL DEFAULT '';
ALTER TABLE ChakraDefinitions ADD COLUMN SymbolAssetKey TEXT NOT NULL DEFAULT '';

UPDATE ChakraDefinitions SET
    SanskritName = 'Mūlādhāra',
    BodyLocation = 'Base of the spine',
    ColorAssociation = 'Red',
    ElementAssociation = 'Earth',
    InterpretiveTheme = 'Survival, safety, and grounding',
    ChallengeAssociation = 'Fear',
    ReflectionPrompt = 'If you have felt scattered, would exploring a grounding theme connect with your experience?',
    SymbolAssetKey = 'chakra-root'
WHERE ChakraKey = 'root';

UPDATE ChakraDefinitions SET
    SanskritName = 'Svādhiṣṭhāna',
    BodyLocation = 'Lower abdomen',
    ColorAssociation = 'Orange',
    ElementAssociation = 'Water',
    InterpretiveTheme = 'Pleasure, creativity, and emotional flow',
    ChallengeAssociation = 'Guilt',
    ReflectionPrompt = 'What has made room for enjoyment or creativity lately, if anything?',
    SymbolAssetKey = 'chakra-sacral'
WHERE ChakraKey = 'sacral';

UPDATE ChakraDefinitions SET
    SanskritName = 'Maṇipūra',
    BodyLocation = 'Upper abdomen',
    ColorAssociation = 'Yellow',
    ElementAssociation = 'Fire',
    InterpretiveTheme = 'Willpower, choice, and personal agency',
    ChallengeAssociation = 'Shame',
    ReflectionPrompt = 'Where have you felt able to make a choice for yourself?',
    SymbolAssetKey = 'chakra-solar-plexus'
WHERE ChakraKey = 'solar-plexus';

UPDATE ChakraDefinitions SET
    SanskritName = 'Anāhata',
    BodyLocation = 'Center of the chest',
    ColorAssociation = 'Green',
    ElementAssociation = 'Air',
    InterpretiveTheme = 'Love, care, and connection',
    ChallengeAssociation = 'Grief',
    ReflectionPrompt = 'What has felt caring, connected, or tender to you?',
    SymbolAssetKey = 'chakra-heart'
WHERE ChakraKey = 'heart';

UPDATE ChakraDefinitions SET
    SanskritName = 'Viśuddha',
    BodyLocation = 'Throat',
    ColorAssociation = 'Blue',
    ElementAssociation = 'Space',
    InterpretiveTheme = 'Truth, communication, and expression',
    ChallengeAssociation = 'Lies',
    ReflectionPrompt = 'Is there something you would like to express in your own words?',
    SymbolAssetKey = 'chakra-throat'
WHERE ChakraKey = 'throat';

UPDATE ChakraDefinitions SET
    SanskritName = 'Ājñā',
    BodyLocation = 'Between the eyebrows',
    ColorAssociation = 'Indigo',
    ElementAssociation = '',
    InterpretiveTheme = 'Insight, perception, and perspective',
    ChallengeAssociation = 'Illusion',
    ReflectionPrompt = 'What perspective are you curious to explore?',
    SymbolAssetKey = 'chakra-third-eye'
WHERE ChakraKey = 'third-eye';

UPDATE ChakraDefinitions SET
    SanskritName = 'Sahasrāra',
    BodyLocation = 'Top of the head',
    ColorAssociation = 'Violet',
    ElementAssociation = '',
    InterpretiveTheme = 'Meaning and spiritual connection',
    ChallengeAssociation = 'Attachment',
    ReflectionPrompt = 'What gives this moment a sense of meaning, if anything?',
    SymbolAssetKey = 'chakra-crown'
WHERE ChakraKey = 'crown';

-- Link the existing reviewed symbols through the same editable graphic manifest used by the UI.
INSERT INTO GraphicAssets (AssetKey, AssetPath, DisplayName, AlternativeText, AssetType) VALUES
    ('chakra-root', '/theme-assets/pathways/astrology-energy/chakra-symbols/chakra-root.svg', 'Root chakra symbol', 'Red root chakra lotus symbol', 'pathway-reference'),
    ('chakra-sacral', '/theme-assets/pathways/astrology-energy/chakra-symbols/chakra-sacral.svg', 'Sacral chakra symbol', 'Orange sacral chakra lotus symbol', 'pathway-reference'),
    ('chakra-solar-plexus', '/theme-assets/pathways/astrology-energy/chakra-symbols/chakra-solar-plexus.svg', 'Solar plexus chakra symbol', 'Yellow solar plexus chakra lotus symbol', 'pathway-reference'),
    ('chakra-heart', '/theme-assets/pathways/astrology-energy/chakra-symbols/chakra-heart.svg', 'Heart chakra symbol', 'Green heart chakra lotus symbol', 'pathway-reference'),
    ('chakra-throat', '/theme-assets/pathways/astrology-energy/chakra-symbols/chakra-throat.svg', 'Throat chakra symbol', 'Blue throat chakra lotus symbol', 'pathway-reference'),
    ('chakra-third-eye', '/theme-assets/pathways/astrology-energy/chakra-symbols/chakra-third-eye.svg', 'Third eye chakra symbol', 'Indigo third eye chakra lotus symbol', 'pathway-reference'),
    ('chakra-crown', '/theme-assets/pathways/astrology-energy/chakra-symbols/chakra-crown.svg', 'Crown chakra symbol', 'Violet crown chakra lotus symbol', 'pathway-reference')
ON CONFLICT(AssetKey) DO UPDATE SET
    AssetPath = excluded.AssetPath,
    DisplayName = excluded.DisplayName,
    AlternativeText = excluded.AlternativeText,
    AssetType = excluded.AssetType,
    IsActive = 1;
