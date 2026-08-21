import { CarCategory, CarModelId } from '../../types';

/**
 * Racers that are people/creatures/robots rather than road vehicles.
 * Keep this policy centralized so Garage UI and procedural fallback agree.
 */
export const CHARACTER_RACER_IDS: readonly CarModelId[] = [
  'spider_racer_3d',
  'robot19_racer_3d',
  'robot4_racer_3d',
  'prime1_racer_3d',
  'ironman_mark3_racer_3d',
  'zora_nao_racer_3d',
  'mark6_racer_3d',
  'hulk_racer_3d',
  'captain_racer_3d',
  'knut_racer_3d',
  'us_soldier_racer_3d',
  'human_racer_3d',
  'drag_driver_racer_3d',
] as const;

const CHARACTER_SET = new Set<CarModelId>(CHARACTER_RACER_IDS);

/** Special racers that must never inherit automotive aero parts. */
const NON_AUTOMOTIVE_SET = new Set<CarModelId>([
  ...CHARACTER_RACER_IDS,
  'capybara_parade_3d',
  'tank_racer_3d',
  'helicopter_racer_3d',
  'police_motorcycle_3d',
  'roadster_883_3d',
  'vespa_studio_3d',
  'xedap_city_3d',
]);

export function isCharacterRacerModel(modelId: CarModelId): boolean {
  return CHARACTER_SET.has(modelId);
}

export function isNonAutomotiveRacerModel(modelId: CarModelId, category?: CarCategory): boolean {
  return category === 'motorcycle' || NON_AUTOMOTIVE_SET.has(modelId);
}

export function supportsAutomotiveSpoilerForModel(modelId: CarModelId, category?: CarCategory): boolean {
  return !isNonAutomotiveRacerModel(modelId, category);
}
