import * as mc from "@minecraft/server";

const FRENZY_ITEM_ID = "paragonia_classes:ability_barbarian_3";
const FRENZY_DURATION_TICKS = 100;
const HEALING_MULTIPLIER = 0.25;

const FRENZY_WEAPON_IDS = [
  "minecraft:wooden_axe",
  "minecraft:stone_axe",
  "minecraft:iron_axe",
  "minecraft:golden_axe",
  "minecraft:diamond_axe",
  "minecraft:netherite_axe",
  "paragonia_classes:battle_axe"
];

const frenzyPlayers = new Map();

function healPlayer(player, amount) {
  const healthComp = player.getComponent("minecraft:health");
  if (!healthComp) return;

  const currentHealth = healthComp.currentValue;
  const maxHealth = healthComp.defaultValue;
  const newHealth = Math.min(currentHealth + amount, maxHealth);

  healthComp.setCurrentValue(newHealth);
}

export function Frenzy(player, item) {
  if (!item || item.typeId !== FRENZY_ITEM_ID) return;

  player.addTag("paragonia_classes:is_frenzy");

  player.dimension.playSound("paragonia_classes.barbarian_ability_3_flare_up", player.location);
  player.dimension.spawnParticle("paragonia_classes:barbarian_frenzy", player.location);
  player.playAnimation("animation.paragonia_classes.player.frenzy", {
    controller: "ability",
    blendOutTime: 0,
  });

  startFrenzyCrackleSound(player);

  const currentTick = mc.system.currentTick;
  frenzyPlayers.set(player.id, currentTick + FRENZY_DURATION_TICKS);

  mc.system.runTimeout(() => {
    if (player.hasTag("paragonia_classes:is_frenzy")) {
      player.removeTag("paragonia_classes:is_frenzy");
    }
    frenzyPlayers.delete(player.id);
  }, FRENZY_DURATION_TICKS);
}


// Passive listener to apply healing during Frenzy
mc.world.afterEvents.entityHurt.subscribe(event => {
  const attacker = event.damageSource.damagingEntity;
  if (!attacker || attacker.typeId !== "minecraft:player") return;

  if (!frenzyPlayers.has(attacker.id)) return;

  const expireTick = frenzyPlayers.get(attacker.id);
  if (mc.system.currentTick > expireTick) {
    frenzyPlayers.delete(attacker.id);
    return;
  }

  const heldItem = attacker.getComponent("minecraft:equippable")?.getEquipment(mc.EquipmentSlot.Mainhand);
  if (!heldItem || !FRENZY_WEAPON_IDS.includes(heldItem.typeId)) return;

  const healAmount = HEALING_MULTIPLIER * event.damage;
  healPlayer(attacker, healAmount);
});

function startFrenzyCrackleSound(player) {
  const interval = 10; // 1 second in ticks

  const loop = () => {
    if (player.hasTag("paragonia_classes:is_frenzy")) {
      player.dimension.playSound("paragonia_classes.barbarian_ability_3_crackle", player.location);
      player.dimension.spawnParticle("paragonia_classes:barbarian_frenzy", player.location);
      mc.system.runTimeout(loop, interval);
    }
  };

  mc.system.runTimeout(loop, interval); // delay first crackle by 1 second
}
