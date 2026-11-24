// Ink mass measures area. The opening body has a diameter of 58.8 world units.
export const START_MASS=216;
export const inkBudgetScale=START_MASS/156;
export const rivalMass=value=>Math.round(value*1.45*inkBudgetScale);
