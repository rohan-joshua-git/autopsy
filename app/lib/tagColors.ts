import { TAXONOMY, TAXONOMY_DIMENSIONS } from '@/lib/taxonomy';

type TagStyle = { bg: string; color: string; border: string };

export const DEFAULT_TAG: TagStyle = { bg: '#1a1a16', color: '#5F5E5A', border: '#2e2e28' };

const HUE_STEP = 360 / TAXONOMY.length;

const TAG_HUES: Record<string, number> = Object.fromEntries(
  TAXONOMY.map((tag, i) => [tag, Math.round(i * HUE_STEP)])
);

export const TAG_COLORS: Record<string, TagStyle> = Object.fromEntries(
  TAXONOMY.map(tag => {
    const hue = TAG_HUES[tag];
    return [
      tag,
      {
        color: `hsl(${hue}, 58%, 52%)`,
        bg: `hsl(${hue}, 45%, 10%)`,
        border: `hsl(${hue}, 40%, 16%)`,
      },
    ];
  })
);

export const getTagStyle = (tag: string) => TAG_COLORS[tag] || DEFAULT_TAG;
export const getTagHue = (tag: string): number => TAG_HUES[tag] ?? 0;

export type TagDimension = 'Technical' | 'Process' | 'Behavioral' | 'Other';

export const getTagDimension = (tag: string): TagDimension =>
  (TAXONOMY_DIMENSIONS as Record<string, 'Technical' | 'Process' | 'Behavioral'>)[tag] || 'Other';

// Cases sharing a tag get the same hue at varied lightness, so they read as
// a family instead of one flat color for every case.
export function getCaseShade(tag: string | undefined, index: number, count: number): { bg: string; border: string } {
  if (!tag) return { bg: '#1c1c18', border: '#3a3a30' };
  const hue = getTagHue(tag);
  const minLightness = 18;
  const maxLightness = 44;
  const lightness = count > 1
    ? Math.round(minLightness + (index / (count - 1)) * (maxLightness - minLightness))
    : Math.round((minLightness + maxLightness) / 2);
  return {
    bg: `hsl(${hue}, 35%, ${lightness}%)`,
    border: `hsl(${hue}, 40%, ${Math.min(lightness + 14, 60)}%)`,
  };
}
