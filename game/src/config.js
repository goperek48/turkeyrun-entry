// Turkey Run — tuning constants. One place for every number the game balances on,
// so difficulty, pacing and the win condition can be read (and retuned) at a glance.
export const CFG = {
  W: 960,
  H: 540,
  GROUND_Y: 452, // top of the dirt track the turkey runs on
  GRAVITY: 0.55,
  JUMP_V: -13.2, // first jump
  JUMP_V2: -11.4, // double jump (slightly weaker, still clears a fence)
  MAX_FALL: 17,
  BASE_SPEED: 5.2, // px/frame at the start of a run
  TOP_SPEED: 11.5, // px/frame once the turkey is deep into the escape
  SPEED_RAMP: 0.0042, // speed gained per metre of distance
  BURST: 2.4, // extra px/frame while holding Right / D
  BRAKE: 2.0, // px/frame lost while holding Left / A
  SLIDE_TIME: 26, // frames a slide lasts
  SLIDE_COOLDOWN: 14,
  ESCAPE_M: 1500, // metres to the safety of the woods — reach it and you escape
  LIVES: 3,
  INVINCIBLE: 90, // frames of mercy after a stumble
  FARMER_START_GAP: 150, // px behind the turkey when the run starts
  FARMER_CATCH_GAP: 8, // px — closer than this and the farmer grabs the turkey
  FARMER_GAIN_HIT: 46, // px the farmer gains each time the turkey stumbles
  FARMER_GAIN_SLOW: 0.06, // px/frame the farmer creeps closer at a normal run pace
  FARMER_LOSE_FAST: 0.9, // px/frame the farmer loses while the turkey sprints
  SPAWN_MIN: 340, // px between obstacle groups, at full speed
  SPAWN_MAX: 640,
  CORN_SCORE: 25,
  PIE_SCORE: 100,
  FEATHER_SCORE: 50,
  DIST_SCORE: 1, // points per metre run
  DAY_LENGTH_M: 500, // metres per sky phase (dawn -> noon -> dusk)
};

export const COLOURS = {
  skyDawn: ['#ffd9a0', '#ffb27a', '#ff8f6b'],
  skyNoon: ['#aee3ff', '#7ec8f2', '#5fb2e8'],
  skyDusk: ['#ff9e7a', '#e86a8a', '#7a4a8a'],
  hillFar: '#8fbf6a',
  hillNear: '#6da34e',
  dirt: '#b98a4e',
  dirtDark: '#9c6f38',
  grass: '#7fb84a',
  fence: '#8a5a2b',
  barn: '#a63d2f',
  barnRoof: '#7c2b20',
  oven: '#3d3d46',
  ovenGlow: '#ff7a2a',
  knife: '#d7dee8',
  knifeEdge: '#9aa7b8',
  hay: '#e8c25a',
  corn: '#ffd94a',
  feather: '#fff3c4',
  turkeyBody: '#8a5a2b',
  turkeyWing: '#6b4423',
  turkeyHead: '#e8e0d0',
  turkeyWattle: '#d43d2a',
  turkeyBeak: '#f2a541',
  farmerShirt: '#3d6fb4',
  farmerPants: '#4a3626',
  farmerHat: '#e8d27a',
  farmerSkin: '#e8b98a',
};
