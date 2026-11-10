-- Existing accounts use Aurora until they choose a separate interface appearance.
ALTER TABLE Users
ADD COLUMN InterfaceTheme TEXT NOT NULL DEFAULT 'Aurora';
