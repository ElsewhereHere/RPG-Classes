import * as mc from "@minecraft/server";

const DRUIDCRAFT_ITEM_ID = "paragonia_classes:utility_druid_1";
const DRUIDCRAFT_RADIUS = 2; // 3x3 area

const CROP_GROWTH_MAP = {
  "minecraft:wheat": 7,
  "minecraft:carrots": 7,
  "minecraft:potatoes": 7,
  "minecraft:beetroot": 7,
  "minecraft:pumpkin_stem": 7,
  "minecraft:melon_stem": 7,
  "minecraft:pitcher_crop": 4,
  "minecraft:torchflower_crop": 2,
  "minecraft:sweet_berry_bush": 3
};

export function Druidcraft(player) {
  const item = player
    .getComponent("minecraft:equippable")
    ?.getEquipment(mc.EquipmentSlot.Mainhand);
  if (!item || item.typeId !== DRUIDCRAFT_ITEM_ID) return;

  const origin = player.location;
  const dimension = player.dimension;

  for (let dx = -DRUIDCRAFT_RADIUS; dx <= DRUIDCRAFT_RADIUS; dx++) {
    for (let dz = -DRUIDCRAFT_RADIUS; dz <= DRUIDCRAFT_RADIUS; dz++) {
      for (let dy = -1; dy <= 1; dy++) {
        const pos = {
          x: Math.floor(origin.x) + dx,
          y: Math.floor(origin.y) + dy,
          z: Math.floor(origin.z) + dz,
        };

        const block = dimension.getBlock(pos);
        if (!block) continue;

        if (block.typeId in CROP_GROWTH_MAP) {
          //player.sendMessage(`§a[Druidcraft] Found crop: ${block.typeId} at (${pos.x}, ${pos.y}, ${pos.z})`);

          const maxGrowth = CROP_GROWTH_MAP[block.typeId];
          const newPerm = block.permutation.withState("growth", maxGrowth);
          block.setPermutation(newPerm);
        }
      }
    }
  }
}

mc.world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
  const { player, itemStack, block } = event;

  if (!itemStack || itemStack.typeId !== "minecraft:stick") return;
  if (!block) return;

  const states = block.permutation.getAllStates();
  player.sendMessage(`§6[DEBUG] Block: ${block.typeId}`);
  for (const [key, value] of Object.entries(states)) {
    player.sendMessage(`§7 - ${key}: ${value}`);
  }
});
