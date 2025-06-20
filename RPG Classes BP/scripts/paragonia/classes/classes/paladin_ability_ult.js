import * as mc from "@minecraft/server";

const ULTIMATE_TAG = "paragonia_classes:is_ascending";
const ASCEND_DURATION_TICKS = 5 * 20; // 3 seconds
const SLOW_FALL_DELAY_TICKS = 20;     // 2 seconds after crash

export function DivineAscension(player) {
  player.addTag(ULTIMATE_TAG);

  // Start levitation and visuals
  player.dimension.playSound("paragonia_classes.paladin_ability_ult", player.location);
  player.playAnimation("animation.paragonia_classes.player.divine_ascension_1");
  player.addEffect("levitation", ASCEND_DURATION_TICKS, {
    amplifier: 2,
    showParticles: false,
  });

  mc.system.runTimeout(() => {
    if (!player.hasTag(ULTIMATE_TAG)) return;
    player.removeTag(ULTIMATE_TAG);

    // Crash visuals and impact effects
    player.playAnimation("animation.paragonia_classes.player.divine_ascension_2");
    player.dimension.spawnParticle("paragonia_classes:paladin_ascension_crash", player.location);
    player.dimension.playSound("paragonia_classes.paladin_ability_ult_crash", player.location);

    // Delayed application of Slow Falling
    mc.system.runTimeout(() => {
      player.playAnimation("animation.paragonia_classes.player.divine_ascension_3");
      player.addEffect("slow_falling", 20, { amplifier: 1, showParticles: false });
    }, SLOW_FALL_DELAY_TICKS);

  }, ASCEND_DURATION_TICKS);
}
