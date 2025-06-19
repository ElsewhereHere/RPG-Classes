import * as mc from "@minecraft/server";

const ULTIMATE_TAG = "paragonia_classes:is_raging";
const RAGE_DURATION_TICKS = 7 * 20; // 7 seconds
const rageTimeouts = new Map(); // Map<player.id, timeoutId>

export function Rage(player) {
  player.addTag(ULTIMATE_TAG);

  player.dimension.playSound("paragonia_classes.barbarian_ability_ult", player.location);
  player.playAnimation("animation.paragonia_classes.player.rage");

  mc.system.runTimeout(() => {
    player.dimension.spawnParticle("paragonia_classes:barbarian_rage", player.location);
    player.dimension.spawnParticle("paragonia_classes:barbarian_rage_horizontal", player.location);
  }, 20);
  mc.system.runTimeout(() => {
    player.dimension.spawnParticle("paragonia_classes:barbarian_rage", player.location);
    player.dimension.spawnParticle("paragonia_classes:barbarian_rage_horizontal", player.location);
  }, 23);

  applyRageEffects(player, RAGE_DURATION_TICKS);
  scheduleRageTimeout(player, RAGE_DURATION_TICKS);
  startRagePulseSound(player);
}

function applyRageEffects(player, durationTicks) {
  player.addEffect("minecraft:strength", durationTicks, { amplifier: 1, showParticles: false });
  player.addEffect("minecraft:speed", durationTicks, { amplifier: 1, showParticles: false });
  player.addEffect("minecraft:haste", durationTicks, { amplifier: 1, showParticles: false });
}

function scheduleRageTimeout(player, durationTicks) {
  const existing = rageTimeouts.get(player.id);
  if (existing !== undefined) {
    mc.system.clearRun(existing);
  }

  const timeoutId = mc.system.runTimeout(() => {
    if (player.hasTag(ULTIMATE_TAG)) {
      player.removeTag(ULTIMATE_TAG);
    }
    rageTimeouts.delete(player.id);
  }, durationTicks);

  rageTimeouts.set(player.id, timeoutId);
}

function startRagePulseSound(player) {
  const pulseIntervalTicks = 20;
  const checkAndPlay = () => {
    if (player.hasTag(ULTIMATE_TAG)) {
      player.playSound("paragonia_classes.barbarian_ability_ult_pulse");
      mc.system.runTimeout(checkAndPlay, pulseIntervalTicks);
    }
  };
  mc.system.runTimeout(checkAndPlay, pulseIntervalTicks);
}

mc.world.afterEvents.itemCompleteUse.subscribe(event => {
  const player = event.source;
  const item = event.itemStack;

  if (!player || !item) return;
  if (item.typeId !== "paragonia_classes:wrathberry_soup") return;
  if (!player.hasTag(ULTIMATE_TAG)) return;

  const extension = 5 * 20;
  const currentTimeout = rageTimeouts.get(player.id);
  const remaining = player.getEffect("minecraft:strength")?.duration ?? 0;

  const extended = remaining + extension;
  applyRageEffects(player, extended);
  scheduleRageTimeout(player, extended);
  
});
