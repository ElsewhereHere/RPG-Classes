import * as mc from "@minecraft/server";

export const BARKSKIN_ARMOR = {
  head: "paragonia_classes:barkskin_head",
  chest: "paragonia_classes:barkskin_torso",
  legs: "paragonia_classes:barkskin_legs",
  feet: "paragonia_classes:barkskin_feet",
};

export const DRUID_ARMOR = {
  head: "paragonia_classes:druid_hood",
  chest: "paragonia_classes:druid_shirt",
  legs: "paragonia_classes:druid_skirt",
  feet: "paragonia_classes:druid_shoes",
};

function isWearingFullDruidSet(player) {
  const equip = player.getComponent("minecraft:equippable");
  if (!equip) return false;

  return (
    equip.getEquipment(mc.EquipmentSlot.Head)?.typeId === DRUID_ARMOR.head &&
    equip.getEquipment(mc.EquipmentSlot.Chest)?.typeId === DRUID_ARMOR.chest &&
    equip.getEquipment(mc.EquipmentSlot.Legs)?.typeId === DRUID_ARMOR.legs &&
    equip.getEquipment(mc.EquipmentSlot.Feet)?.typeId === DRUID_ARMOR.feet
  );
}

export function Barkskin(player) {
  if (!isWearingFullDruidSet(player)) return;

  const replacements = {
    head: BARKSKIN_ARMOR.head,
    chest: BARKSKIN_ARMOR.chest,
    legs: BARKSKIN_ARMOR.legs,
    feet: BARKSKIN_ARMOR.feet,
  };

  for (const [slot, itemId] of Object.entries(replacements)) {
    player.runCommandAsync(
      `replaceitem entity @s slot.armor.${slot} 0 ${itemId} 1 0 {"minecraft:item_lock":{"mode":"lock_in_slot"}}`
    );
  }

  player.playAnimation("animation.paragonia_classes.player.barkskin");

  mc.system.runTimeout(() => {
    for (const [slot, itemId] of Object.entries(DRUID_ARMOR)) {
      player.runCommandAsync(`replaceitem entity @s slot.armor.${slot} 0 ${itemId} 1`);
    }
  }, 100);
}


mc.world.afterEvents.playerSpawn.subscribe(({ player, isFirstSpawn }) => {
  const equip = player.getComponent("minecraft:equippable");
  if (!equip) return;

  const slots = ["head", "chest", "legs", "feet"];

  for (const slot of slots) {
    const slotEnum =
      mc.EquipmentSlot[slot.charAt(0).toUpperCase() + slot.slice(1)];
    const item = equip.getEquipment(slotEnum);
    if (item?.typeId === BARKSKIN_ARMOR[slot]) {
      player.runCommandAsync(
        `replaceitem entity @s slot.armor.${slot} 0 ${DRUID_ARMOR[slot]} 1`
      );
    }
  }
});
