-- Add stable client-facing keys and versioned presentation metadata while preserving relational IDs.
ALTER TABLE SpiritualPathways ADD COLUMN StableKey TEXT NOT NULL DEFAULT '';
ALTER TABLE SpiritualPathways ADD COLUMN IsActive INTEGER NOT NULL DEFAULT 1 CHECK (IsActive IN (0, 1));
ALTER TABLE SpiritualPathways ADD COLUMN SortOrder INTEGER NOT NULL DEFAULT 0;
UPDATE SpiritualPathways
SET StableKey = CASE PathwayKey
    WHEN 0 THEN 'mindfulness'
    WHEN 1 THEN 'energy'
    WHEN 2 THEN 'faith'
    ELSE 'pathway-' || PathwayKey
END;
CREATE UNIQUE INDEX IF NOT EXISTS UX_SpiritualPathways_StableKey
    ON SpiritualPathways(StableKey);
UPDATE SpiritualPathways SET SortOrder = PathwayKey;

ALTER TABLE ChakraDefinitions ADD COLUMN IsActive INTEGER NOT NULL DEFAULT 1 CHECK (IsActive IN (0, 1));
ALTER TABLE ChakraDefinitions ADD COLUMN SortOrder INTEGER NOT NULL DEFAULT 0;
UPDATE ChakraDefinitions SET SortOrder = CASE ChakraKey
    WHEN 'root' THEN 1 WHEN 'sacral' THEN 2 WHEN 'solar-plexus' THEN 3
    WHEN 'heart' THEN 4 WHEN 'throat' THEN 5 WHEN 'third-eye' THEN 6
    WHEN 'crown' THEN 7 ELSE SortOrder END;
ALTER TABLE AuraColorDefinitions ADD COLUMN SortOrder INTEGER NOT NULL DEFAULT 0;
UPDATE AuraColorDefinitions SET SortOrder = CASE AuraColorKey
    WHEN 'red' THEN 1 WHEN 'orange' THEN 2 WHEN 'yellow' THEN 3
    WHEN 'green' THEN 4 WHEN 'blue' THEN 5 WHEN 'indigo' THEN 6
    WHEN 'violet' THEN 7 WHEN 'gray' THEN 8 WHEN 'pink' THEN 9 ELSE SortOrder END;

ALTER TABLE MoodDefinitions ADD COLUMN Icon TEXT NOT NULL DEFAULT '•';
ALTER TABLE MoodDefinitions ADD COLUMN SortOrder INTEGER NOT NULL DEFAULT 0;
ALTER TABLE MoodDefinitions ADD COLUMN Description TEXT NOT NULL DEFAULT '';
UPDATE MoodDefinitions SET Icon = CASE MoodKey
    WHEN 'Empowered' THEN '😄' WHEN 'Centered' THEN '😊'
    WHEN 'Harmonious' THEN '🕊️' WHEN 'Flowing' THEN '🚀'
    WHEN 'Weary' THEN '😴' WHEN 'Tense' THEN '😣'
    WHEN 'Frustrated' THEN '😤' WHEN 'Blocked' THEN '😤'
    WHEN 'Restless' THEN '😰' WHEN 'Disconnected' THEN '😔'
    WHEN 'Heavy' THEN '😢' WHEN 'Charged' THEN '😠'
    WHEN 'Scattered' THEN '🤯' WHEN 'Abundant' THEN '🙏'
    WHEN 'Visionary' THEN '🌈' WHEN 'Neutral' THEN '😐'
    ELSE Icon END;
UPDATE MoodDefinitions SET SortOrder = CASE MoodKey
    WHEN 'Empowered' THEN 1 WHEN 'Centered' THEN 2
    WHEN 'Harmonious' THEN 3 WHEN 'Flowing' THEN 4
    WHEN 'Weary' THEN 5 WHEN 'Tense' THEN 6
    WHEN 'Frustrated' THEN 7 WHEN 'Blocked' THEN 7
    WHEN 'Restless' THEN 8 WHEN 'Disconnected' THEN 9
    WHEN 'Heavy' THEN 10 WHEN 'Charged' THEN 11
    WHEN 'Scattered' THEN 12 WHEN 'Abundant' THEN 13
    WHEN 'Visionary' THEN 14 WHEN 'Neutral' THEN 15
    ELSE SortOrder END;
INSERT INTO MoodDefinitions (MoodKey, DisplayName, IsActive, Icon, SortOrder, Description) VALUES
('Empowered','Empowered',1,'😄',1,'Joyful: personal power and confidence.'),
('Centered','Centered',1,'😊',2,'Content: inner balance and compassion.'),
('Harmonious','Harmonious',1,'🕊️',3,'Peaceful: clear expression and calm.'),
('Flowing','Flowing',1,'🚀',4,'Motivated: creative flow and inspiration.'),
('Weary','Weary',1,'😴',5,'Tired: a need for rest and stability.'),
('Tense','Tense',1,'😣',6,'Stressed: survival tension.'),
('Blocked','Blocked',1,'😤',7,'Frustrated: feeling stuck.'),
('Restless','Restless',1,'😰',8,'Anxious: an overactive mind.'),
('Disconnected','Disconnected',1,'😔',9,'Lonely: feeling closed off.'),
('Heavy','Heavy',1,'😢',10,'Sad: emotional heaviness.'),
('Charged','Charged',1,'😠',11,'Angry: fiery drive.'),
('Scattered','Scattered',1,'🤯',12,'Overwhelmed: scattered attention.'),
('Abundant','Abundant',1,'🙏',13,'Grateful: a sense of plenty.'),
('Visionary','Visionary',1,'🌈',14,'Hopeful: big-picture optimism.'),
('Neutral','Neutral',1,'😐',15,'Meh: reset and neutrality.'),
('Frustrated','Frustrated',1,'😤',16,'Frustrated: feeling stuck.')
ON CONFLICT(MoodKey) DO UPDATE SET DisplayName=excluded.DisplayName, IsActive=1, Icon=excluded.Icon, SortOrder=excluded.SortOrder, Description=excluded.Description;

ALTER TABLE ZodiacSigns ADD COLUMN Symbol TEXT NOT NULL DEFAULT '';
UPDATE ZodiacSigns SET Symbol = CASE SignKey
    WHEN 'aries' THEN '♈' WHEN 'taurus' THEN '♉' WHEN 'gemini' THEN '♊'
    WHEN 'cancer' THEN '♋' WHEN 'leo' THEN '♌' WHEN 'virgo' THEN '♍'
    WHEN 'libra' THEN '♎' WHEN 'scorpio' THEN '♏' WHEN 'sagittarius' THEN '♐'
    WHEN 'capricorn' THEN '♑' WHEN 'aquarius' THEN '♒' WHEN 'pisces' THEN '♓'
    ELSE Symbol END;

UPDATE AuraColorDefinitions SET Description = CASE AuraColorKey
    WHEN 'red' THEN 'Rooted, grounded energy for safety and survival.'
    WHEN 'orange' THEN 'Creative flow and emotional warmth.'
    WHEN 'yellow' THEN 'Personal power, confidence, and optimism.'
    WHEN 'green' THEN 'Compassion, growth, and harmony.'
    WHEN 'blue' THEN 'Expression, truth, and clear communication.'
    WHEN 'indigo' THEN 'Intuition, insight, and inner wisdom.'
    WHEN 'violet' THEN 'Spirituality, higher purpose, and connection.'
    WHEN 'gray' THEN 'Neutrality and grounding between states.'
    WHEN 'pink' THEN 'Warmth and heart-centered joy.'
    ELSE Description END;

UPDATE ChakraDefinitions SET Description = CASE ChakraKey
    WHEN 'root' THEN 'Stability, security, and connection to the earth.'
    WHEN 'sacral' THEN 'Creativity, passion, and pleasure.'
    WHEN 'solar-plexus' THEN 'Willpower, self-esteem, and transformation.'
    WHEN 'heart' THEN 'Love, forgiveness, and emotional balance.'
    WHEN 'throat' THEN 'Communication, authenticity, and self-expression.'
    WHEN 'third-eye' THEN 'Intuition, imagination, and inner knowing.'
    WHEN 'crown' THEN 'Awareness, meaning, and spiritual connection.'
    ELSE Description END;

INSERT OR IGNORE INTO MoodAuraMappings (MoodKey, AuraColorKey) VALUES
('Empowered','yellow'),('Centered','yellow'),('Harmonious','blue'),('Flowing','orange'),
('Weary','gray'),('Tense','red'),('Blocked','red'),('Frustrated','red'),
('Restless','indigo'),('Disconnected','indigo'),('Heavy','blue'),('Charged','red'),
('Scattered','violet'),('Abundant','green'),('Visionary','pink'),('Neutral','gray');

CREATE TABLE IF NOT EXISTS AuraColorShades (
    AuraColorKey TEXT NOT NULL,
    Shade INTEGER NOT NULL CHECK (Shade BETWEEN 50 AND 900),
    HexValue TEXT NOT NULL CHECK (length(HexValue) = 7 AND substr(HexValue, 1, 1) = '#'),
    PRIMARY KEY (AuraColorKey, Shade),
    FOREIGN KEY (AuraColorKey) REFERENCES AuraColorDefinitions(AuraColorKey) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ThemeTokens (
    TokenKey TEXT PRIMARY KEY,
    TokenValue TEXT NOT NULL,
    Category TEXT NOT NULL,
    SortOrder INTEGER NOT NULL DEFAULT 0,
    IsActive INTEGER NOT NULL DEFAULT 1 CHECK (IsActive IN (0, 1))
);

CREATE TABLE IF NOT EXISTS GraphicAssets (
    AssetKey TEXT PRIMARY KEY,
    AssetPath TEXT NOT NULL,
    DisplayName TEXT NOT NULL,
    AlternativeText TEXT NOT NULL DEFAULT '',
    AssetType TEXT NOT NULL DEFAULT 'image',
    IsActive INTEGER NOT NULL DEFAULT 1 CHECK (IsActive IN (0, 1))
);

INSERT INTO AuraColorShades (AuraColorKey, Shade, HexValue) VALUES
('red',50,'#ffebee'),('red',100,'#ffcdd2'),('red',200,'#ef9a9a'),('red',300,'#e57373'),('red',400,'#ef5350'),('red',500,'#f44336'),('red',600,'#e53935'),('red',700,'#d32f2f'),('red',800,'#c62828'),('red',900,'#b71c1c'),
('orange',50,'#fff3e0'),('orange',100,'#ffe0b2'),('orange',200,'#ffcc80'),('orange',300,'#ffb74d'),('orange',400,'#ffa726'),('orange',500,'#ff9800'),('orange',600,'#fb8c00'),('orange',700,'#f57c00'),('orange',800,'#ef6c00'),('orange',900,'#e65100'),
('yellow',50,'#fffde7'),('yellow',100,'#fff9c4'),('yellow',200,'#fff59d'),('yellow',300,'#fff176'),('yellow',400,'#ffee58'),('yellow',500,'#ffeb3b'),('yellow',600,'#fdd835'),('yellow',700,'#fbc02d'),('yellow',800,'#f9a825'),('yellow',900,'#f57f17'),
('green',50,'#e8f5e9'),('green',100,'#c8e6c9'),('green',200,'#a5d6a7'),('green',300,'#81c784'),('green',400,'#66bb6a'),('green',500,'#4caf50'),('green',600,'#43a047'),('green',700,'#388e3c'),('green',800,'#2e7d32'),('green',900,'#1b5e20'),
('blue',50,'#e3f2fd'),('blue',100,'#bbdefb'),('blue',200,'#90caf9'),('blue',300,'#64b5f6'),('blue',400,'#42a5f5'),('blue',500,'#2196f3'),('blue',600,'#1e88e5'),('blue',700,'#1976d2'),('blue',800,'#1565c0'),('blue',900,'#0d47a1'),
('indigo',50,'#e8eaf6'),('indigo',100,'#c5cae9'),('indigo',200,'#9fa8da'),('indigo',300,'#7986cb'),('indigo',400,'#5c6bc0'),('indigo',500,'#3f51b5'),('indigo',600,'#3949ab'),('indigo',700,'#303f9f'),('indigo',800,'#283593'),('indigo',900,'#1a237e'),
('violet',50,'#f3e5f5'),('violet',100,'#e1bee7'),('violet',200,'#ce93d8'),('violet',300,'#ba68c8'),('violet',400,'#ab47bc'),('violet',500,'#9c27b0'),('violet',600,'#8e24aa'),('violet',700,'#7b1fa2'),('violet',800,'#6a1b9a'),('violet',900,'#4a148c'),
('gray',50,'#fafafa'),('gray',100,'#f5f5f5'),('gray',200,'#eeeeee'),('gray',300,'#e0e0e0'),('gray',400,'#bdbdbd'),('gray',500,'#9e9e9e'),('gray',600,'#757575'),('gray',700,'#616161'),('gray',800,'#424242'),('gray',900,'#212121'),
('pink',50,'#fce4ec'),('pink',100,'#f8bbd0'),('pink',200,'#f48fb1'),('pink',300,'#f06292'),('pink',400,'#ec407a'),('pink',500,'#e91e63'),('pink',600,'#d81b60'),('pink',700,'#c2185b'),('pink',800,'#ad1457'),('pink',900,'#880e4f')
ON CONFLICT(AuraColorKey, Shade) DO UPDATE SET HexValue = excluded.HexValue;

INSERT INTO ThemeTokens (TokenKey, TokenValue, Category, SortOrder) VALUES
('color.canvas','#F7F2EA','color',1),('color.surface','#FFFCF7','color',2),('color.surfaceSoft','#EDE5D9','color',3),('color.stone','#DED3C3','color',4),('color.ink','#352D2C','color',5),('color.inkMuted','#665D56','color',6),('color.line','#D9CEC0','color',7),('color.focus','#654A5D','color',8),('color.sage','#87917B','color',9),('color.rose','#C79A98','color',10),('color.terracotta','#C87961','color',11),('color.amber','#D39A4A','color',12),('color.blueGray','#91A3AC','color',13),('color.orchid','#815F7E','color',14),('color.berry','#7F263F','color',15),('color.turquoise','#2D7180','color',16),
('font.body','Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif','font',1),('font.display','"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif','font',2),
('radius.control','0.625rem','radius',1),('radius.card','1rem','radius',2),('radius.shell','1.5rem','radius',3),
('shadow.soft','0 1px 2px rgba(53, 45, 44, 0.06), 0 12px 36px rgba(95, 76, 61, 0.08)','shadow',1),('shadow.raised','0 18px 48px rgba(78, 62, 51, 0.14)','shadow',2)
ON CONFLICT(TokenKey) DO UPDATE SET TokenValue = excluded.TokenValue, Category = excluded.Category, SortOrder = excluded.SortOrder, IsActive = 1;

INSERT INTO GraphicAssets (AssetKey, AssetPath, DisplayName, AlternativeText, AssetType) VALUES
('avatar-1','/avatars/hand-drawn-profile-avatar-1.jpg','Profile illustration 1','Hand-drawn profile illustration','avatar'),
('avatar-2','/avatars/hand-drawn-profile-avatar-2.jpg','Profile illustration 2','Hand-drawn profile illustration','avatar'),
('avatar-3','/avatars/hand-drawn-profile-avatar-3.jpg','Profile illustration 3','Hand-drawn profile illustration','avatar'),
('avatar-4','/avatars/hand-drawn-profile-avatar-4.jpg','Profile illustration 4','Hand-drawn profile illustration','avatar'),
('avatar-5','/avatars/hand-drawn-profile-avatar-5.jpg','Profile illustration 5','Hand-drawn profile illustration','avatar'),
('avatar-6','/avatars/hand-drawn-profile-avatar-6.jpg','Profile illustration 6','Hand-drawn profile illustration','avatar')
ON CONFLICT(AssetKey) DO UPDATE SET AssetPath = excluded.AssetPath, DisplayName = excluded.DisplayName, AlternativeText = excluded.AlternativeText, AssetType = excluded.AssetType, IsActive = 1;
