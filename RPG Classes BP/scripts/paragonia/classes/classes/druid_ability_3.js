import * as mc from "@minecraft/server";

export function SoothingSpores(player) {
  const direction = player.getViewDirection();
  const origin = player.location;
  const dimension = player.dimension;

  // Normalize horizontal direction
  const look = { x: direction.x, y: 0, z: direction.z };
  const len = Math.sqrt(look.x ** 2 + look.z ** 2);
  look.x /= len;
  look.z /= len;

  // Perpendicular direction for side columns
  const right = { x: -look.z, y: 0, z: look.x };

  // Heal the caster once
  const casterHealth = player.getComponent("minecraft:health");
  if (casterHealth) {
    const current = casterHealth.currentValue;
    const max = casterHealth.defaultValue;
    casterHealth.setCurrentValue(Math.min(current + 5, max));
  }

  for (let row = 1; row <= 5; row++) {
    for (let col = -1; col <= 1; col++) {
      const x = origin.x + look.x * row + right.x * col;
      const z = origin.z + look.z * row + right.z * col;
      const y = Math.floor(origin.y);

      const pos = { x, y, z };

      // Spawn healing particle
      dimension.spawnParticle("paragonia_classes:druid_particle", pos);
      player.playAnimation("animation.paragonia_classes.player.soothing_spores");

      // Heal nearby entities (excluding caster)
      const entities = dimension.getEntities({
        location: pos,
        maxDistance: 1.5,
      });

      for (const entity of entities) {
        if (entity.id === player.id) continue; // Skip caster
        if (entity.hasComponent("minecraft:health")) {
          const comp = entity.getComponent("minecraft:health");
          const current = comp.currentValue;
          const max = comp.defaultValue;
          comp.setCurrentValue(Math.min(current + 5, max));
        }
      }
    }
  }
}
