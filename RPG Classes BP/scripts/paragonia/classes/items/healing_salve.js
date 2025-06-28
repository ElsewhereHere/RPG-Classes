import * as mc from "@minecraft/server";

// Map each salve item to its effect
const SALVE_EFFECTS = {
  "paragonia_classes:healing_salve_red": {
    effectId:   "minecraft:regeneration",
    amplifier:  0
  },
  "paragonia_classes:healing_salve_brown": {
    effectId:   "minecraft:resistance",
    amplifier:  0
  },
  "paragonia_classes:healing_salve_crimson": {
    effectId:   "minecraft:fire_resistance",
    amplifier:  0
  },
  "paragonia_classes:healing_salve_warped": {
    effectId:   "minecraft:haste",
    amplifier:  0
  }
};

mc.world.afterEvents.itemCompleteUse.subscribe(({ source: player, itemStack }) => {
  // Only druids (class or subclass) can benefit
  if (
    !(
      player.hasTag("paragonia_classes:class_druid") ||
      player.hasTag("paragonia_classes:subclass_druid")
    )
  ) return;

  // Generic healing salve: heal 2 health, no effect
  if (itemStack.typeId === "paragonia_classes:healing_salve") {
    const healthComp = player.getComponent("minecraft:health");
    if (healthComp) {
      const cur = healthComp.currentValue;
      const max = healthComp.defaultValue;
      healthComp.setCurrentValue(Math.min(cur + 2, max));
    }
    return;
  }

  // Specialized salves
  const data = SALVE_EFFECTS[itemStack.typeId];
  if (!data) return;

  // Heal 2 health immediately
  const healthComp = player.getComponent("minecraft:health");
  if (healthComp) {
    const cur = healthComp.currentValue;
    const max = healthComp.defaultValue;
    healthComp.setCurrentValue(Math.min(cur + 2, max));
  }

  // Apply the mapped effect for 5 seconds (100 ticks)
  player.addEffect(
    data.effectId,
    100,
    { amplifier: data.amplifier, showParticles: true }
  );
});
