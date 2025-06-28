import * as mc from "@minecraft/server";

const DP_PREFIX         = "fireflyLight:";
const LANTERN_ITEM_ID   = "paragonia_classes:firefly_lantern";
const LIGHT_BLOCK_ID    = "minecraft:light_block_12";

// In-memory map: playerId → { pos: {x, y, z}, dimId: string }
const placedLights = new Map();

/**
 * Wipe out any stray light blocks stored in dynamic properties,
 * then clear those properties so they won’t persist.
 */
function cleanupStrayLights() {
  for (const key of mc.world.getDynamicPropertyIds()) {       // getDynamicPropertyIds :contentReference[oaicite:4]{index=4}
    if (!key.startsWith(DP_PREFIX)) continue;
    const raw = mc.world.getDynamicProperty(key);
    if (typeof raw === "string") {
      try {
        const { pos, dimId } = JSON.parse(raw);
        const dim = mc.world.getDimension(dimId);
        const blk = dim.getBlock(pos);
        if (blk?.typeId === LIGHT_BLOCK_ID) {
          dim.setBlockType(pos, "minecraft:air");
        }
      } catch {
        // ignore malformed entries
      }
    }
    mc.world.setDynamicProperty(key, undefined);
  }
}

// 1) On world load (when a player spawns), remove any leftover light blocks
mc.world.afterEvents.playerSpawn.subscribe(() => {
  cleanupStrayLights();
});

// 2) Every tick: update lights only for Druids holding the lantern
mc.system.runInterval(() => {
  for (const player of mc.world.getPlayers()) {
    const eq = player.getComponent("minecraft:equippable");
    if (!eq) continue;

    // Only Druids (class or subclass) can place lights :contentReference[oaicite:5]{index=5}
    const isDruid =
      player.hasTag("paragonia_classes:class_druid") ||
      player.hasTag("paragonia_classes:subclass_druid");
    const playerId = player.id;
    const last     = placedLights.get(playerId);

    if (!isDruid) {
      // Clean up any stray light if they’ve lost druid status
      if (last) {
        const od = mc.world.getDimension(last.dimId);
        const ob = od.getBlock(last.pos);
        if (ob?.typeId === LIGHT_BLOCK_ID) {
          od.setBlockType(last.pos, "minecraft:air");
        }
        placedLights.delete(playerId);
        mc.world.setDynamicProperty(DP_PREFIX + playerId, undefined);
      }
      continue;
    }

    // Check lantern in either hand
    const main    = eq.getEquipment(mc.EquipmentSlot.Mainhand);
    const off     = eq.getEquipment(mc.EquipmentSlot.Offhand);
    const holding =
      (main?.typeId === LANTERN_ITEM_ID) ||
      (off?.typeId  === LANTERN_ITEM_ID);

    if (holding) {
      // Compute head position (one block above feet)
      const loc   = player.location;
      const pos   = {
        x: Math.floor(loc.x),
        y: Math.floor(loc.y) + 1,
        z: Math.floor(loc.z),
      };
      const dimId = player.dimension.id;

      const moved =
        !last ||
        last.dimId !== dimId ||
        last.pos.x !== pos.x ||
        last.pos.y !== pos.y ||
        last.pos.z !== pos.z;

      if (moved) {
        // Remove old light
        if (last) {
          const od = mc.world.getDimension(last.dimId);
          const ob = od.getBlock(last.pos);
          if (ob?.typeId === LIGHT_BLOCK_ID) {
            od.setBlockType(last.pos, "minecraft:air");
          }
        }
        // Place new light if that head-space is air
        const dim = mc.world.getDimension(dimId);
        const blk = dim.getBlock(pos);
        if (blk?.isAir) {
          dim.setBlockType(pos, LIGHT_BLOCK_ID);
          placedLights.set(playerId, { pos, dimId });
          mc.world.setDynamicProperty(
            DP_PREFIX + playerId,
            JSON.stringify({ pos, dimId })
          );
        }
      }
    } else if (last) {
      // Lantern dropped: tear down existing light
      const od = mc.world.getDimension(last.dimId);
      const ob = od.getBlock(last.pos);
      if (ob?.typeId === LIGHT_BLOCK_ID) {
        od.setBlockType(last.pos, "minecraft:air");
      }
      placedLights.delete(playerId);
      mc.world.setDynamicProperty(DP_PREFIX + playerId, undefined);
    }
  }
}, 1);
