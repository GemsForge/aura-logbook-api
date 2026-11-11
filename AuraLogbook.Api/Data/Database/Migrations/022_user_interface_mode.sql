-- Brightness is independent of theme family. Preserve the former Ivory appearance as Aurora light.
ALTER TABLE Users ADD COLUMN InterfaceMode TEXT NOT NULL DEFAULT 'dark';
UPDATE Users SET InterfaceTheme = 'Aurora', InterfaceMode = 'light' WHERE InterfaceTheme = 'Ivory';
