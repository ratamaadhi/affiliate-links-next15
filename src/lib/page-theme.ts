import { z } from 'zod';

// Zod schema for theme settings validation
export const themeSettingsSchema = z.object({
  layout: z.enum(['masonry', 'list', 'grid']).default('masonry'),
  // Future extensibility:
  // backgroundColor: z.string().optional(),
  // cardStyle: z.enum(['default', 'minimal', 'detailed']).optional(),
  // showDescription: z.boolean().default(true),
  // showBadges: z.boolean().default(true),
});

export type ThemeSettings = z.infer<typeof themeSettingsSchema>;

// Default theme settings
export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  layout: 'masonry',
};

// Helper to parse themeSettings from JSON
export function parseThemeSettings(jsonValue: unknown): ThemeSettings {
  try {
    if (!jsonValue) return DEFAULT_THEME_SETTINGS;

    const parsed =
      typeof jsonValue === 'string' ? JSON.parse(jsonValue) : jsonValue;

    return themeSettingsSchema.parse(parsed);
  } catch {
    return DEFAULT_THEME_SETTINGS;
  }
}

// Helper to stringify themeSettings for database
export function stringifyThemeSettings(settings: ThemeSettings): string {
  return JSON.stringify(settings);
}
