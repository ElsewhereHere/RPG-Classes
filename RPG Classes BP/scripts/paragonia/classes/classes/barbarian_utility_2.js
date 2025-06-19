import * as mc from "@minecraft/server";

const barbarianUtility2Component = {
  onUseOn(event) {
    const { source: player, itemStack: item, block, blockFace } = event;
    if (!player || !item || !block || blockFace === undefined) return;

    const cooldownCategory = "paragonia_classes:utility_barbarian_2";
    const requiredTags = [
      "paragonia_classes:class_barbarian",
      "paragonia_classes:subclass_barbarian",
    ];

    const hasAccess = requiredTags.some((tag) => player.hasTag(tag));
    if (!hasAccess) {
      player.sendMessage(
        "§7[RPG Classes] §rYou must be a §cBarbarian §rto use this Utility."
      );
      return;
    }

    if (player.getItemCooldown(cooldownCategory) > 0) {
      try {
        player.playSound("paragonia_classes.ability_on_cooldown");
      } catch {}
      return;
    }

    const cooldownComp = item.getComponent("minecraft:cooldown");
    if (cooldownComp) {
      cooldownComp.startCooldown(player);
    }

    BruteForceBlock(player, item, block, blockFace);
  },
};

// Register the component during world initialization
mc.world.beforeEvents.worldInitialize.subscribe(({ itemComponentRegistry }) => {
  itemComponentRegistry.registerCustomComponent(
    "paragonia_classes:barbarian_utility_2",
    barbarianUtility2Component
  );
});

// BruteForce block-breaking logic based on blockFace
export function BruteForceBlock(player, item, block, blockFace) {
  if (!block || !block.location) return;

  const face = blockFace.toString().toLowerCase();
  const origin = block.location;
  const dim = player.dimension;

  // Blocks to protect from destruction
  const blacklist = new Set([
    "minecraft:bedrock",
    "minecraft:barrier",
    "minecraft:command_block",
    "minecraft:structure_block",
    "minecraft:end_portal",
    "minecraft:end_gateway",
    // Add more block IDs here as needed
  ]);

  let offsets = [];

  switch (face) {
    case "up":
    case "down":
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          offsets.push({ x: dx, y: 0, z: dz });
        }
      }
      break;
    case "north":
    case "south":
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          offsets.push({ x: dx, y: dy, z: 0 });
        }
      }
      break;
    case "east":
    case "west":
      for (let dz = -1; dz <= 1; dz++) {
        for (let dy = -1; dy <= 1; dy++) {
          offsets.push({ x: 0, y: dy, z: dz });
        }
      }
      break;
    default:
      return;
  }

  for (const offset of offsets) {
    const tx = origin.x + offset.x;
    const ty = origin.y + offset.y;
    const tz = origin.z + offset.z;

    const targetBlock = dim.getBlock({ x: tx, y: ty, z: tz });
    if (!targetBlock || targetBlock.typeId === "minecraft:air") continue;
    if (blacklist.has(targetBlock.typeId)) continue;

    const typeId = targetBlock.typeId;
    targetBlock.setPermutation(mc.BlockPermutation.resolve("minecraft:air"));

    try {
      const itemStack = new mc.ItemStack(typeId, 1);
      dim.spawnItem(itemStack, { x: tx + 0.5, y: ty + 0.5, z: tz + 0.5 });
    } catch {}
  }

  dim.playSound("paragonia_classes.barbarian_utility_2", player.location);
  player.playAnimation("animation.paragonia_classes.player.brute_force", {
    controller: "ability",
    blendOutTime: 0,
  });
}

export function BruteForceEntity(player, item, entity) {
  if (!player || !entity || !entity.applyKnockback) return;

  const playerLoc = player.getHeadLocation?.() ?? player.location;
  const entityLoc = entity.location;

  const dx = entityLoc.x - playerLoc.x;
  const dz = entityLoc.z - playerLoc.z;
  const distance = Math.sqrt(dx * dx + dz * dz) || 1;

  const horizontal = {
    x: dx / distance,
    z: dz / distance,
  };

  const knockbackStrength = 2;
  const verticalStrength = 0.2;

  try {
    player.dimension.playSound("paragonia_classes.barbarian_utility_2", player.location);
    player.playAnimation("animation.paragonia_classes.player.brute_force", {
    controller: "ability",
    blendOutTime: 0,
  });
    entity.applyKnockback(
      horizontal.x,
      horizontal.z,
      knockbackStrength,
      verticalStrength
    );
  } catch (e) {
    //player.sendMessage(`§7[RPG Classes] §rCannot knock back ${entity.typeId}`);
  }
}


// Utility Definitions 
const utilityHandlers = {
  "paragonia_classes:utility_barbarian_2": {
    class_name: "§cBarbarian",
    tags: [
      "paragonia_classes:class_barbarian",
      "paragonia_classes:subclass_barbarian"
    ],
    cooldownCategory: "paragonia_classes:utility_barbarian_2",
    contexts: {
      useOn: BruteForceBlock,
      entityInteract: BruteForceEntity
    }
  },
};


// Handle Utility Item Use (Entity Interact)
mc.world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
  const player = event.player;
  const entity = event.target;

  if (!player || !entity) return;

  const item = player.getComponent("minecraft:equippable")?.getEquipment(mc.EquipmentSlot.Mainhand);
  if (!item) return;

  const itemId = item.typeId;
  const utilityData = utilityHandlers[itemId];
  if (!utilityData) return;

  const handler = utilityData.contexts?.entityInteract;
  if (!handler) return;

  const hasAccess = utilityData.tags.some(tag => player.hasTag(tag));
  if (!hasAccess) return;

  // Cancel the default interaction if we're handling this
  event.cancel = true;

  const dimension = player.dimension;
  const entityId = entity.id;
  const entityType = entity.typeId;
  const entityLoc = entity.location;

  if (player.getItemCooldown(utilityData.cooldownCategory) > 0) {
    mc.system.run(() => {
      try {
        player.playSound("paragonia_classes.ability_on_cooldown");
      } catch {}
    });
    return;
  }

  mc.system.run(() => {
    const refreshedItem = player.getComponent("minecraft:equippable")?.getEquipment(mc.EquipmentSlot.Mainhand);
    const cooldownComp = refreshedItem?.getComponent("minecraft:cooldown");
    if (cooldownComp) {
      cooldownComp.startCooldown(player);
    }

    const nearby = dimension.getEntities({
      location: entityLoc,
      type: entityType,
      maxDistance: 2,
    });

    const refreshedEntity = nearby.find(e => e.id === entityId);
    if (!refreshedEntity) return;

    try {
      handler(player, refreshedItem, refreshedEntity);
    } catch {}
  });
});
