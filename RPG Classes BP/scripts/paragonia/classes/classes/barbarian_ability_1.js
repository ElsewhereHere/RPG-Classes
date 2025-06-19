import * as mc from "@minecraft/server";

export function BattleCry(player, item) {
  // Validate the item
  if (!item || item.typeId !== "paragonia_classes:ability_barbarian_1") return;

  const playerLoc = player.location;
  const dimension = player.dimension;

   player.dimension.playSound("paragonia_classes.barbarian_ability_1", player.location);
   player.playAnimation("animation.paragonia_classes.player.battle_cry");
   dimension.spawnParticle("paragonia_classes:barbarian_battle_cry", player.location);
   
  // Apply Weakness effect to nearby entities
  const nearbyEntities = dimension.getEntities({
    location: playerLoc,
    maxDistance: 5.5,
  });

  for (const entity of nearbyEntities) {
    if (entity.id === player.id) continue;
    entity.addEffect("minecraft:weakness", 60, {
      amplifier: 0,
      showParticles: true,
    });
  }

  // Start cooldown via item's cooldown component
  const itemCooldownComp = item.getComponent("minecraft:cooldown");
  if (itemCooldownComp) {
    itemCooldownComp.startCooldown(player);
  }
}

