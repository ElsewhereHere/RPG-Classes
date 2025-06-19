import * as mc from "@minecraft/server";

// DRUID OUTFIT
mc.world.afterEvents.worldInitialize.subscribe(() => {
  startDruidRegenerationCheck();
});

function isWearingFullDruidSet(player) {
  const equip = player.getComponent("minecraft:equippable");
  if (!equip) return false;

  return (
    equip.getEquipment(mc.EquipmentSlot.Head)?.typeId ===
      "paragonia_classes:druid_hood" &&
    equip.getEquipment(mc.EquipmentSlot.Chest)?.typeId ===
      "paragonia_classes:druid_shirt" &&
    equip.getEquipment(mc.EquipmentSlot.Legs)?.typeId ===
      "paragonia_classes:druid_skirt" &&
    equip.getEquipment(mc.EquipmentSlot.Feet)?.typeId ===
      "paragonia_classes:druid_shoes"
  );
}

function startDruidRegenerationCheck() {
  mc.system.runInterval(() => {
    for (const player of mc.world.getPlayers()) {
      if (!isWearingFullDruidSet(player)) continue;

      const blockBelow = player.dimension.getBlock({
        x: player.location.x,
        y: player.location.y - 1,
        z: player.location.z,
      });

      if (!blockBelow || blockBelow.typeId !== "minecraft:grass_block")
        continue;

      if (!player.getEffect("minecraft:regeneration")) {
        player.addEffect("minecraft:regeneration", 40, { 
          amplifier: 1, 
          showParticles: false
        });
      }
    }
  }, 10);
}