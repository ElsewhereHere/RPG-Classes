import { world } from "@minecraft/server";

const COMPONENT_ID = "paragonia_classes:radiant_orb_particle";
const PARTICLE_ID = "paragonia_classes:paladin_radiant_orb_glow";

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
  blockComponentRegistry.registerCustomComponent(COMPONENT_ID, {
    onTick: ({ block }) => {
      try {
        const { x, y, z } = block.location;
        const pos = { x: x + 0.5, y: y + 0.5, z: z + 0.5 };
        block.dimension.spawnParticle(PARTICLE_ID, pos);
      } catch (e) {
        console.warn(`[${COMPONENT_ID}] Failed to spawn particle:`, e);
      }
    }
  });
});
