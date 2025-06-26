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

  // Apply Speed I and Resistance I for 10 seconds
  player.addEffect("resistance", 200, { amplifier: 0, showParticles: false });
  player.addEffect("speed", 200, { amplifier: 0, showParticles: false });

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

  const target = entities.find(e => e.id !== player.id && e.hasComponent("minecraft:health"));
  if (!target) {
    //player.sendMessage("§7[ClawSlash] No entity hit.");
    return;
  }

  //player.sendMessage(`§a[ClawSlash] Hit entity: ${target.typeId}`);

  // Primary hit damage
  target.applyDamage(CLAW_DIRECT_DAMAGE);

  // Splash damage around the target
  const splashCenter = target.location;
  const splashEntities = player.dimension.getEntities({
    location: splashCenter,
    maxDistance: CLAW_SPLASH_RADIUS,
  });

  for (const entity of splashEntities) {
    if (entity.id !== target.id && entity.id !== player.id && entity.hasComponent("minecraft:health")) {
      entity.applyDamage(CLAW_SPLASH_DAMAGE);
    }
  }
}

