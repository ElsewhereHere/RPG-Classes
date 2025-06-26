import * as mc from "@minecraft/server";

const MAX_DISTANCE = 10;
const STEP_INTERVAL = 0.8;
const DETECTION_RADIUS = 1.25;

const sanctifyConversions = {
  "minecraft:rotten_flesh": { result: "minecraft:cooked_chicken", max: 5 },
  "minecraft:magma_cream": { result: "minecraft:slime_ball", max: 5 },
  "minecraft:apple": { result: "minecraft:golden_apple", max: 1 },
};

const activeSanctifies = new Map();

export function Sanctify(player) {
  const dir = player.getViewDirection();
  const start = {
    x: player.location.x + dir.x,
    y: player.location.y + 1.5,
    z: player.location.z + dir.z,
  };

  activeSanctifies.set(player.id, {
    pos: start,
    dir,
    distance: 0,
    dimension: player.dimension,
    playerId: player.id,
  });

  //player.sendMessage("§7[DEBUG] Sanctify scan initiated...");
}

mc.system.runInterval(() => {
  for (const [id, scan] of activeSanctifies.entries()) {
    if (!scan || !scan.dimension) {
      activeSanctifies.delete(id);
      continue;
    }

    scan.distance += STEP_INTERVAL;
    if (scan.distance >= MAX_DISTANCE) {
      activeSanctifies.delete(id);
      continue;
    }

    const nextPos = {
      x: scan.pos.x + scan.dir.x * scan.distance,
      y: scan.pos.y + scan.dir.y * scan.distance,
      z: scan.pos.z + scan.dir.z * scan.distance,
    };

    const block = scan.dimension.getBlock(nextPos);
    if (block && !block.isAir) {
      activeSanctifies.delete(id);
      return;
    }

    const nearbyItems = scan.dimension.getEntities({
      location: nextPos,
      maxDistance: DETECTION_RADIUS,
    });

    const itemEntity = nearbyItems.find((e) => {
      if (e.typeId !== "minecraft:item") return false;
      const comp = e.getComponent("minecraft:item");
      return comp && sanctifyConversions[comp.itemStack.typeId];
    });

    if (!itemEntity) return;

    const itemComp = itemEntity.getComponent("minecraft:item");
    const itemStack = itemComp.itemStack;
    const conversion = sanctifyConversions[itemStack.typeId];
    const convertCount = Math.min(itemStack.amount, conversion.max);
    const leftover = itemStack.amount - convertCount;

    const player = mc.world.getPlayers().find((p) => p.id === scan.playerId);

    //if (player) {
    //  player.sendMessage(`§e[Sanctify] Converted ${convertCount} ${itemStack.typeId} to ${conversion.result}`);
    //}

    const pos = itemEntity.location;
    itemEntity.kill();

    player.dimension.playSound("paragonia_classes.paladin_utility_2", pos);
    player.dimension.spawnParticle("paragonia_classes:paladin_sanctify", pos);

    // Spawn converted items
    scan.dimension.spawnItem(
      new mc.ItemStack(conversion.result, convertCount),
      pos
    );

    // Respawn leftover source items, if any
    if (leftover > 0) {
      scan.dimension.spawnItem(
        new mc.ItemStack(itemStack.typeId, leftover),
        pos
      );
    }

    activeSanctifies.delete(id);
  }
});
