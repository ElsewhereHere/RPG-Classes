import * as mc from "@minecraft/server";

const RADIANT_SHIELD_ITEM_ID = "paragonia_classes:ability_paladin_1";
const MAX_USE_TICKS = 5 * 20; // 5 seconds in ticks
const KNOCKBACK_RADIUS = 2.5;
const PULSE_INTERVAL_TICKS = 1.1 * 20; // 1.5 seconds in ticks
const NO_KNOCKBACK = new Set([
  "minecraft:item",
  "minecraft:arrow",
  "minecraft:armor_stand",
  "minecraft:item_frame",
  "minecraft:xp_orb",
  "paragonia_classes:radiant_shield",
  "paragonia_classes:target_dummy",
  "paragonia_classes:target_dummy_undead",
  "paragonia_classes:target_dummy_display",
  "paragonia_classes:entangle_roots",
  "paragonia_classes:projectile_rock",
]);

// Track active shield users and their timers
const activeShields = new Map();

/**
 * Main entrypoint for the Radiant Shield instant-cast ability
 */
export function RadiantShield(player, item) {
  if (item.typeId !== RADIANT_SHIELD_ITEM_ID) return;
  if (activeShields.has(player)) return; // Prevent re-cast while active
  grantRadiantShield(player);
}

/**
 * Grants the Radiant Shield effects and starts knockback, pulse, and auto-revoke
 */
function grantRadiantShield(player) {
  const dimension = player.dimension;
  const center = player.location;

  // Spawn custom rider entity on the player
  const riderEntity = dimension.spawnEntity(
    "paragonia_classes:radiant_shield",
    center
  );
  if (!riderEntity) {
    console.error("Failed to spawn custom rider entity.");
    return;
  }

  // Try to get the rideable component from the player
  const rideable = player.getComponent("rideable");
  if (!rideable || typeof rideable.addRider !== "function") {
    console.error(
      "Player does not have a rideable component or addRider is not a function."
    );
    return;
  }

  const result = rideable.addRider(riderEntity);
  if (!result) {
    console.warn("Failed to add the custom entity as a rider.");
  }

  // Apply Resistance II effect (no particles)
  player.addEffect("minecraft:resistance", MAX_USE_TICKS, {
    amplifier: 1,
    showParticles: false,
  });

  // Immediate pulse sound at cast
  dimension.playSound("paragonia_classes.paladin_ability_1_pulse", center);
  player.playAnimation("animation.paragonia_classes.player.radiant_shield");

  // Pulse sound every 1.5 seconds
  const pulseInterval = mc.system.runInterval(() => {
    const loc = player.location;
    dimension.playSound("paragonia_classes.paladin_ability_1_pulse", loc);
  }, PULSE_INTERVAL_TICKS);

  // Knockback loop every tick within radius
  const knockbackInterval = mc.system.runInterval(() => {
    const loc = player.location;
    const nearby = dimension.getEntities({
      location: loc,
      maxDistance: KNOCKBACK_RADIUS,
    });
    for (const ent of nearby) {
      // Skip self and excluded entities
      if (ent.id === player.id || NO_KNOCKBACK.has(ent.typeId)) continue;

      const dx = ent.location.x - loc.x;
      const dz = ent.location.z - loc.z;
      const dist = Math.sqrt(dx * dx + dz * dz) || 1;
      // applyKnockback(x, z, verticalStrength, horizontalStrength)
      try {
        ent.applyKnockback(dx / dist, dz / dist, 0.5, 0.5);
      } catch (e) {
        //player.sendMessage(`§7[RPG Classes] §rCannot knock back ${ent.typeId}`);
      }
      // Play knockback sound at the player's location
      dimension.playSound("paragonia_classes.paladin_ability_1", loc);
      riderEntity.playAnimation(
        "animation.paragonia_classes.ability.radiant_shield_pulse"
      );
    }
  }, 1);

  // Auto-revoke after duration
  const timeoutId = mc.system.runTimeout(() => {
    revokeRadiantShield(player);
  }, MAX_USE_TICKS);

  activeShields.set(player, { knockbackInterval, pulseInterval, timeoutId });
}

/**
 * Cleans up Radiant Shield state and removes effects
 */
function revokeRadiantShield(player) {
  const timers = activeShields.get(player);
  if (!timers) return;
  mc.system.clearRun(timers.knockbackInterval);
  mc.system.clearRun(timers.pulseInterval);
  mc.system.clearRun(timers.timeoutId);
  activeShields.delete(player);

  player.removeEffect("minecraft:resistance");
}
