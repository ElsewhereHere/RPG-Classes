import * as mc from "@minecraft/server";

// DRUID ABILITY 1: ENTANGLE
// Ability Projectile
const entangleCooldowns = new Map(); // Map<player.id, tick number>
const activeProjectiles = new Map(); // Map<projectile, {direction, speed, startPos, ticksAlive}>

mc.world.afterEvents.itemUse.subscribe((event) => {
  const player = event.source;
  const item = event.itemStack;

  // Only proceed if the item is the druid ability
  if (!item || item.typeId !== "paragonia_classes:ability_druid_1") return;

  // Check if player has the Druid class tag
  if (!player.hasTag("paragonia_classes:class_druid")) {
    player.sendMessage("§7[RPG Classes] §rYou must be a §aDruid §rto use this ability.");
    return;
  }

  const currentTick = mc.system.currentTick;
  const lastUsed = entangleCooldowns.get(player.id) || 0;

  // If still on cooldown, do nothing (play cooldown sound)
  if (currentTick - lastUsed < 100) { // 5 seconds * 20 ticks
    player.playSound("paragonia_classes.ability_on_cooldown");
    return;
  }

  // Set new cooldown
  entangleCooldowns.set(player.id, currentTick);

  // Spawn projectile logic
  const view = player.getViewDirection();
  const head = player.getHeadLocation();

  const spawnPos = {
    x: head.x + view.x * 0.5,
    y: head.y + -0.25,
    z: head.z + view.z * 0.5,
  };

  const projectile = player.dimension.spawnEntity("paragonia_classes:projectile_entangle", spawnPos);
  if (projectile) {
    const speed = 1; // Blocks per tick

    // Move projectile immediately on spawn for instant movement
    const firstMovePos = {
      x: spawnPos.x + view.x * speed,
      y: spawnPos.y + view.y * speed,
      z: spawnPos.z + view.z * speed,
    };
    projectile.teleport(firstMovePos);

    // Store projectile data for continued movement
    activeProjectiles.set(projectile, {
      direction: view,
      speed: speed,
      startPos: spawnPos,
      maxDistance: 50, // Maximum travel distance
      ticksAlive: 1 // Start at 1 since we already moved once
    });
  }
});

// Handle projectile movement manually for straight-line travel
mc.system.runInterval(() => {
  const projectilesToRemove = [];

  for (const [projectile, data] of activeProjectiles.entries()) {
    try {
      if (!projectile || !projectile.isValid()) {
        projectilesToRemove.push(projectile);
        continue;
      }

      // Increment ticks alive
      data.ticksAlive++;

      // Remove projectile if it has lived too long (5 seconds = 100 ticks)
      if (data.ticksAlive >= 100) {
        projectile.remove();
        projectilesToRemove.push(projectile);
        continue;
      }

      const currentPos = projectile.location;

      // Calculate distance traveled
      const dx = currentPos.x - data.startPos.x;
      const dy = currentPos.y - data.startPos.y;
      const dz = currentPos.z - data.startPos.z;
      const distanceTraveled = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Remove projectile if it has traveled too far
      if (distanceTraveled >= data.maxDistance) {
        projectile.remove();
        projectilesToRemove.push(projectile);
        continue;
      }

      // Calculate next position
      const nextPos = {
        x: currentPos.x + data.direction.x * data.speed,
        y: currentPos.y + data.direction.y * data.speed,
        z: currentPos.z + data.direction.z * data.speed,
      };

      // Move projectile to next position
      projectile.teleport(nextPos);

    } catch (error) {
      // Clean up invalid projectile
      projectilesToRemove.push(projectile);
    }
  }

  // Clean up removed projectiles
  for (const projectile of projectilesToRemove) {
    activeProjectiles.delete(projectile);
  }
}, 1);

// Handle entanglement logic
mc.system.runInterval(() => {
  const overworld = mc.world.getDimension("overworld");

  const entities = overworld.getEntities();
  const roots = overworld.getEntities({
    type: "paragonia_classes:entangle_roots",
  });

  for (const entity of entities) {
    if (!entity.isValid()) continue;
    if (entity.typeId === "minecraft:item") continue;

    let nearestRoot = null;
    let minDistSq = 1.2 * 1.2;

    for (const root of roots) {
      if (!root.isValid()) continue;

      const dx = root.location.x - entity.location.x;
      const dy = root.location.y - entity.location.y;
      const dz = root.location.z - entity.location.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq <= minDistSq) {
        minDistSq = distSq;
        nearestRoot = root;
      }
    }

    if (nearestRoot) {
      if (!entity.hasTag("paragonia_classes:entangled")) {
        entity.addTag("paragonia_classes:entangled");
      }

      const rootPos = nearestRoot.location;
      const rot = entity.getRotation();
      entity.teleport(rootPos, { rotation: rot });
    } else {
      if (entity.hasTag("paragonia_classes:entangled")) {
        entity.removeTag("paragonia_classes:entangled");
      }
    }
  }
}, 1);
