-- Keep optional mood-to-chakra reflection links editable and many-to-many.
CREATE TABLE IF NOT EXISTS ChakraMoodAssociations (
    ChakraKey TEXT NOT NULL,
    MoodKey TEXT NOT NULL,
    PRIMARY KEY (ChakraKey, MoodKey),
    FOREIGN KEY (ChakraKey) REFERENCES ChakraDefinitions(ChakraKey) ON DELETE CASCADE,
    FOREIGN KEY (MoodKey) REFERENCES MoodDefinitions(MoodKey) ON DELETE CASCADE
);

-- This contemporary reflection mapping is an invitation only; it does not describe a cause.
INSERT OR IGNORE INTO ChakraMoodAssociations (ChakraKey, MoodKey) VALUES
    ('root', 'Scattered'),
    ('root', 'Tense');
