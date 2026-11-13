// rpg-project — motore grafico con l'estetica di Valfiorita (docs/estetica.md).
// Punto d'ingresso unico: importa da qui.
export { E, initContext } from './core/context.js';
export { rnd, R, pick, hn, vnoise, setSeed } from './core/rng.js';
export { V, PI, D2R, B, uvB, CY, CO, SP, TO, uvS, mergeGeometries } from './core/geometry.js';
export { bake } from './core/bake.js';

export { pix, G } from './textures/pix.js';
export { TEX, createTextures } from './textures/library.js';

export * as palette from './materials/palette.js';
export { mute } from './materials/palette.js';
export { wear } from './materials/wear.js';
export { tm, P, vertexColorMaterial, ivyMaterial } from './materials/factory.js';

export { hangSign, iconTex, boardGeo, HOUSE_ICONS, ICONS } from './props/sign.js';
export { paperLantern, wallLantern } from './props/lantern.js';
export { bench } from './props/bench.js';
export { flower, flowerBed, flowerField, flowerGeometry, FLOWER_TYPES, FLOWER_COLS } from './props/flowers.js';
export { barrel, crate, sack, basket } from './props/containers.js';

export { house, timberHouse, roundHouse, tallHouse, houseDetails, win, door, gable, chimney } from './buildings/house.js';

export { tree, fir, randomTreeKind, SPECIES, TREE_KINDS, leafMat, leafTex } from './vegetation/trees.js';
export { grassField } from './vegetation/grass.js';
export { undergrowth } from './vegetation/undergrowth.js';

export { createTerrain } from './world/terrain.js';
export { path } from './world/path.js';
export { stoneBridge, bridgeDeck } from './world/bridge.js';
export { distantCliffs } from './world/cliffs.js';

export { Sim, waterSurface, waterRibbon, puddle, puddleMaterial } from './water/water.js';

export { PS, particleTextures, psScale, setParticleScale } from './fx/particles.js';
export { softSys, smokeAndFog } from './fx/soft.js';
export { createRain } from './fx/rain.js';
export { createSky } from './fx/sky.js';
export { updateSwing } from './fx/swing.js';

export { setupAtmosphere } from './render/lighting.js';
export { createPost } from './render/post.js';
export { createNightLights } from './render/nightLights.js';

export { firstPerson } from './controls/firstPerson.js';
export { thirdPerson } from './controls/thirdPerson.js';

export { joint, piece, charMat, charTex, makeClip, animator } from './characters/puppet.js';
export { villager, elf, villagerClips } from './characters/villager.js';
export { loft, taper } from './characters/loft.js';
export { cat, catClips } from './characters/cat.js';
export { dragon, dragonClips } from './characters/dragon.js';
