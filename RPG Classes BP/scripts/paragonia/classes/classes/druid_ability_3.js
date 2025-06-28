import * as mc from "@minecraft/server";

export function SoothingSpores(player) {
  const { system } = mc;
  const direction = player.getViewDirection();
  const origin    = player.location;
  const dimension = player.dimension;

  const horiz = { x: direction.x, z: direction.z };
  const hLen  = Math.hypot(horiz.x, horiz.z);
  horiz.x   /= hLen;
  horiz.z   /= hLen;
  const right = { x: -horiz.z, y: 0, z: horiz.x };

  // spawn the visual spore entity
  const spawnDistance = 2;
  const spawnPos = {
    x: origin.x + horiz.x * spawnDistance,
    y: Math.floor(origin.y),
    z: origin.z + horiz.z * spawnDistance
  };
  const yaw   = Math.atan2(-horiz.x, horiz.z) * (180 / Math.PI);
  const pitch = -Math.asin(direction.y)    * (180 / Math.PI);
  dimension.runCommand(
    `summon paragonia_classes:soothing_spores ` +
    `${spawnPos.x} ${spawnPos.y} ${spawnPos.z} ` +
    `${yaw} ${pitch}`
  );

  // immediate heal & buff on caster
  const healthComp = player.getComponent("minecraft:health");
  if (healthComp) {
    const curr = healthComp.currentValue;
    const max  = healthComp.defaultValue;
    healthComp.setCurrentValue(Math.min(curr + 5, max));
  }
  player.addEffect("minecraft:regeneration", 60, { amplifier: 1, showParticles: false });
  player.playAnimation("animation.paragonia_classes.player.soothing_spores");

  // delayed area particles/heal/buff
  for (let row = 1; row <= 5; row++) {
    const delay = (row - 1) * 2;
    for (let col = -1; col <= 1; col++) {
      const x = origin.x + horiz.x * row + right.x * col;
      const z = origin.z + horiz.z * row + right.z * col;
      const y = Math.floor(origin.y);
      const pos = { x, y, z };

      system.runTimeout(() => {
        dimension.spawnParticle("paragonia_classes:druid_soothing_spores", pos);

        const nearby = dimension.getEntities({ location: pos, maxDistance: 1.5 });
        for (const ent of nearby) {
          if (ent.id === player.id) continue;
          if (ent.hasComponent("minecraft:health")) {
            const hc  = ent.getComponent("minecraft:health");
            const cur = hc.currentValue;
            hc.setCurrentValue(Math.min(cur + 5, hc.defaultValue));
          }
          ent.addEffect("minecraft:regeneration", 60, { amplifier: 1, showParticles: false });
        }
      }, delay);
    }
  }
}
