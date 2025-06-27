import * as mc from "@minecraft/server";

const DRUID_FLOWER_BLOCKS = [
  "minecraft:dandelion",
  "minecraft:poppy",
  "minecraft:blue_orchid",
  "minecraft:allium",
  "minecraft:azure_bluet",
  "minecraft:red_tulip",
  "minecraft:orange_tulip",
  "minecraft:white_tulip",
  "minecraft:pink_tulip",
  "minecraft:oxeye_daisy",
  "minecraft:cornflower",
  "minecraft:lily_of_the_valley",
  "minecraft:sunflower",
  "minecraft:lilac",
  "minecraft:rose_bush",
  "minecraft:peony",
  "minecraft:pitcher_plant",
  "minecraft:cactus_flower",
  "minecraft:wildflowers",
  "minecraft:torchflower"
];

mc.world.afterEvents.worldInitialize.subscribe(() => {
  startDruidOutfitCheck();
});

function isWearingFullDruidSet(player) {
  const equip = player.getComponent("minecraft:equippable");
  if (!equip) return false;

  return (
    equip.getEquipment(mc.EquipmentSlot.Head)?.typeId === "paragonia_classes:druid_hood" &&
    equip.getEquipment(mc.EquipmentSlot.Chest)?.typeId === "paragonia_classes:druid_shirt" &&
    equip.getEquipment(mc.EquipmentSlot.Legs)?.typeId === "paragonia_classes:druid_skirt" &&
    equip.getEquipment(mc.EquipmentSlot.Feet)?.typeId === "paragonia_classes:druid_shoes"
  );
}

function isNearFlower(player, radius = 4) {
  const origin = player.location;
  const dimension = player.dimension;

  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dz = -radius; dz <= radius; dz++) {
        const block = dimension.getBlock({
          x: origin.x + dx,
          y: origin.y + dy,
          z: origin.z + dz
        });

        if (block && DRUID_FLOWER_BLOCKS.includes(block.typeId)) {
          return true;
        }
      }
    }
  }
  return false;
}

function startDruidOutfitCheck() {
  mc.system.runInterval(() => {
    for (const player of mc.world.getPlayers()) {
      if (!isWearingFullDruidSet(player)) continue;
      if (
        !player.hasTag("paragonia_classes:class_druid") &&
        !player.hasTag("paragonia_classes:subclass_druid")
      ) continue;
      if (!isNearFlower(player)) continue;

      if (!player.getEffect("minecraft:regeneration")) {
        player.addEffect("minecraft:regeneration", 60, {
          amplifier: 0,
          showParticles: false
        });
      }
    }
  }, 20);
}
