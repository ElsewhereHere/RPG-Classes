import * as mc from "@minecraft/server";

export function WildShape(player) {
  const inventory = player.getComponent("minecraft:inventory")?.container;
  if (!inventory) return;

  const mainHand = player.getComponent("minecraft:equippable")?.getEquipment(mc.EquipmentSlot.Mainhand);
  if (!mainHand || mainHand.typeId !== "paragonia_classes:ability_druid_ult") return;

  const slotCount = inventory.size;
  let usedSlot = -1;

  // Find the slot where the ultimate item was used
  for (let i = 0; i < slotCount; i++) {
    const item = inventory.getItem(i);
    if (item && item.typeId === "paragonia_classes:ability_druid_ult") {
      usedSlot = i;
      break;
    }
  }

  if (usedSlot === -1) return;

  // Add transformation tag
  player.addTag("paragonia_classes:is_wild_shape");
  player.playAnimation("animation.paragonia_classes.player.wild_shape");
  player.dimension.playSound("paragonia_classes.druid_ability_ult", player.location);

  // Add Rider
// 1) After playing the animation & sound, schedule the rider add:
mc.system.runTimeout(() => {
  const center = player.location;

  player.dimension.spawnParticle("paragonia_classes:druid_wild_shape", player.location);

  // Spawn custom rider entity on the player
  const riderEntity = player.dimension.spawnEntity("paragonia_classes:wild_shape",center);
  if (!riderEntity) {
    console.error("Failed to spawn custom rider entity.");
    return;
  }

  // Attach it as a rider
  const rideable = player.getComponent("rideable");
  if (!rideable || typeof rideable.addRider !== "function") {
    console.error("Player does not have a rideable component or addRider is not a function.");
    return;
  }
  const result = rideable.addRider(riderEntity);
  if (!result) {
    console.warn("Failed to add the custom entity as a rider.");
  }
}, 25);


  // Apply Speed II and Health Boost II for 10 seconds
  player.addEffect("health_boost", 200, { amplifier: 2, showParticles: false });
  player.addEffect("instant_health", 1, { amplifier: 2, showParticles: false });
  player.addEffect("speed", 200, { amplifier: 1, showParticles: false });

  // Replace the item in the used slot with the alternate version and lock it
  const bearItem = new mc.ItemStack("paragonia_classes:ability_druid_ult_alt", 1);
  bearItem.lockMode = mc.ItemLockMode.slot;
  inventory.setItem(usedSlot, bearItem);

  // Revert after 10 seconds
  mc.system.runTimeout(() => {
    const revertItem = new mc.ItemStack("paragonia_classes:ability_druid_ult", 1);
    inventory.setItem(usedSlot, revertItem);
    player.removeTag("paragonia_classes:is_wild_shape");
  }, 200);
}



const CLAW_ITEM_ID = "paragonia_classes:ability_druid_ult_alt";
const CLAW_RAYCAST_RANGE = 3;
const CLAW_DIRECT_DAMAGE = 8;
const CLAW_SPLASH_RADIUS = 2.5;
const CLAW_SPLASH_DAMAGE = 4;

export function ClawSlash(player) {
  const item = player.getComponent("minecraft:equippable")?.getEquipment(mc.EquipmentSlot.Mainhand);
  if (!item || item.typeId !== CLAW_ITEM_ID) return;

  const dir = player.getViewDirection();
  const origin = player.location;

  const forwardPos = {
    x: origin.x + dir.x * CLAW_RAYCAST_RANGE,
    y: origin.y + 1.5,
    z: origin.z + dir.z * CLAW_RAYCAST_RANGE,
  };

  const entities = player.dimension.getEntities({
    location: forwardPos,
    maxDistance: 2.5,
  });

  player.dimension.playSound("paragonia_classes.druid_ability_ult_alt_growl", player.location);

  const target = entities.find(e => e.id !== player.id && e.hasComponent("minecraft:health"));
  if (!target) {
    //player.sendMessage("§7[ClawSlash] No entity hit.");
    return;
  }

  //player.sendMessage(`§a[ClawSlash] Hit entity: ${target.typeId}`);

  // Primary hit damage
  target.applyDamage(CLAW_DIRECT_DAMAGE);
  
  const loc = player.location;
  const dx = target.location.x - loc.x;
    const dz = target.location.z - loc.z;
    const dist = Math.sqrt(dx * dx + dz * dz) || 1;
  try {
        target.applyKnockback(dx / dist, dz / dist, 2, 0.25);
      } catch (e) {
        //player.sendMessage(`§7[RPG Classes] §rCannot knock back ${ent.typeId}`);
      }

  // Splash damage around the target
  const splashCenter = target.location;
  const splashEntities = player.dimension.getEntities({
    location: splashCenter,
    maxDistance: CLAW_SPLASH_RADIUS,
  });

  player.dimension.spawnParticle("paragonia_classes:druid_claw_slash", splashCenter);
  player.dimension.playSound("paragonia_classes.druid_ability_ult_alt", splashCenter);

  for (const entity of splashEntities) {
    if (entity.id !== target.id && entity.id !== player.id && entity.hasComponent("minecraft:health")) {
      entity.applyDamage(CLAW_SPLASH_DAMAGE);
      try {
        entity.applyKnockback(dx / dist, dz / dist, 2, 0.25);
      } catch (e) {
        //player.sendMessage(`§7[RPG Classes] §rCannot knock back ${ent.typeId}`);
      }
    }
  }
}

// On respawn/join, fix any lingering ult-alt items and clear the wild-shape tag
mc.world.afterEvents.playerSpawn.subscribe(({ player, isFirstSpawn }) => {
  const inventory = player.getComponent("minecraft:inventory")?.container;
  if (!inventory) return;

  // Scan every slot in their hotbar/inventory
  for (let i = 0; i < inventory.size; i++) {
    const item = inventory.getItem(i);
    if (item?.typeId === "paragonia_classes:ability_druid_ult_alt") {
      // Replace alt back to the real ultimate item
      const orig = new mc.ItemStack("paragonia_classes:ability_druid_ult", 1);
      inventory.setItem(i, orig);
    }
  }

  // Remove the lingering wild-shape tag if present
  if (player.hasTag("paragonia_classes:is_wild_shape")) {
    player.removeTag("paragonia_classes:is_wild_shape");
  }
});
