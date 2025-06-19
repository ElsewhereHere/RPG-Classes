import * as mc from "@minecraft/server";

const LEAP_ITEM_ID = "paragonia_classes:ability_barbarian_2";
const DAMAGE_RADIUS = 4.5;
const DAMAGE_AMOUNT = 6;
const LAND_KNOCKBACK_STRENGTH = 0.5;
const VERTICAL_LAUNCH = 2;
const HORIZONTAL_LAUNCH = 1;

const NO_KNOCKBACK = new Set([
  "minecraft:item",
  "minecraft:arrow",
  "minecraft:armor_stand",
  "minecraft:item_frame",
  "minecraft:xp_orb",
  "minecraft:end_crystal",
  "paragonia_classes:radiant_shield",
  "paragonia_classes:target_dummy",
  "paragonia_classes:target_dummy_undead",
  "paragonia_classes:target_dummy_display",
  "paragonia_classes:entangle_roots",
  "paragonia_classes:projectile_rock",
]);

const activeLeaps = new Map();

export function RecklessLeap(player, item) {
  if (!player || !item || item.typeId !== LEAP_ITEM_ID) return;

  const direction = player.getViewDirection();
  player.applyKnockback(
    direction.x,
    direction.z,
    VERTICAL_LAUNCH,
    HORIZONTAL_LAUNCH
  );

  player.dimension.playSound("paragonia_classes.barbarian_ability_2_jump", player.location);

  player.playAnimation("animation.paragonia_classes.player.reckless_leap_1", {
    controller: "ability",
    blendOutTime: 0,
  });

  const leapTick = mc.system.currentTick;
  activeLeaps.set(player.id, {
    startTick: leapTick,
    lastLoopTick: leapTick + 8,
  });
}

mc.system.runInterval(() => {
  const currentTick = mc.system.currentTick;

  for (const player of mc.world.getPlayers()) {
    const state = activeLeaps.get(player.id);
    if (!state) continue;

    if (player.isOnGround) {
  const entities = player.dimension.getEntities({
    location: player.location,
    maxDistance: DAMAGE_RADIUS,
  });

  player.dimension.playSound("paragonia_classes.barbarian_ability_2_land", player.location);
  player.dimension.spawnParticle("paragonia_classes:barbarian_reckless_leap", player.location);
  player.dimension.spawnParticle("paragonia_classes:barbarian_reckless_leap_dust", player.location);

  for (const entity of entities) {
  if (entity.id === player.id) continue;
  if (NO_KNOCKBACK.has(entity.typeId)) continue; // updated condition

  entity.applyDamage(DAMAGE_AMOUNT, {
    cause: mc.EntityDamageCause.entityAttack,
    damagingEntity: player,
  });

  const dx = entity.location.x - player.location.x;
  const dz = entity.location.z - player.location.z;
  const distance = Math.sqrt(dx * dx + dz * dz);
  if (distance === 0) continue;

  const knockbackX = dx / distance;
  const knockbackZ = dz / distance;

  try {
  entity.applyKnockback(knockbackX, knockbackZ, 0.25, LAND_KNOCKBACK_STRENGTH);
} catch (e) {
  //player.sendMessage(`§7[RPG Classes] §rCannot knock back ${entity.typeId}`);
}

}

  player.playAnimation("animation.paragonia_classes.player.reckless_leap_3",
    {controller: "ability", blendOutTime: 0,}
  );

  activeLeaps.delete(player.id);
} else {
      if (currentTick >= state.lastLoopTick) {
        player.playAnimation(
          "animation.paragonia_classes.player.reckless_leap_2",
          {
            controller: "ability",
            blendOutTime: 0,
          }
        );
        state.lastLoopTick = currentTick + 20;
      }
    }
  }
}, 1);
