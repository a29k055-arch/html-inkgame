import {LIVING_VARIANTS} from '../src-v5/game/living-rigs.js';

// Each thumbnail is rendered from this exact V5 rig's swimming pose.
const urls = new Map(Object.values(LIVING_VARIANTS).flat().map(rigId => [
  rigId, new URL('./art/forms/' + rigId + '.webp', import.meta.url).href
]));

export const getRigIcon = rigId => urls.get(rigId);
