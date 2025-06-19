import * as mc from "@minecraft/server";

const RAGE_TAG = "paragonia_classes:is_raging";
const HEAL_PER_SECOND = 1;

export function VentSteam(player, item) {
  const dimension = player.dimension;
  const playerLoc = player.location;

  dimension.playSound("paragonia_classes.barbarian_utility_1", playerLoc);
  player.dimension.spawnParticle("paragonia_classes:barbarian_vent_steam", player.location);
  player.playAnimation("animation.paragonia_classes.player.vent_steam", {
    controller: "ability",
    blendOutTime: 0,
  });

  // Extinguish Player OnFire
  const wasOnFire = player.extinguishFire(true);
  //if (wasOnFire) {
  //  player.sendMessage("You have been extinguished!");
  //}

  // Remove Nearby Fire Blocks
  const radius = 4;
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dz = -radius; dz <= radius; dz++) {
        const x = Math.floor(playerLoc.x) + dx;
        const y = Math.floor(playerLoc.y) + dy;
        const z = Math.floor(playerLoc.z) + dz;
        const pos = { x, y, z };
        try {
          const block = dimension.getBlock(pos);
          if (block && block.typeId === "minecraft:fire") {
            block.setType("minecraft:air");
            dimension.playSound("extinguish.candle", pos);
          }
        } catch (e) {
        }
      }
    }
  }

  // Rage-Based Healing
  if (!player.hasTag(RAGE_TAG)) return;

  const effect = player.getEffect("minecraft:strength");
  if (!effect) return;

  const remainingTicks = effect.duration;
  const remainingSeconds = Math.floor(remainingTicks / 20);
  const healAmount = remainingSeconds * HEAL_PER_SECOND;

  player.removeTag(RAGE_TAG);

  const healthComp = player.getComponent("minecraft:health");
  if (healthComp) {
    healthComp.setCurrentValue(
      Math.min(healthComp.currentValue + healAmount, healthComp.defaultValue)
    );
  }
}
