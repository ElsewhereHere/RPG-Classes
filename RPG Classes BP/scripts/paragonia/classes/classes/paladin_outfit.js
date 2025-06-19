import * as mc from "@minecraft/server";

const DAMAGE_TAKEN = 10; // Damage threshold to trigger Absorption effect
const EFFECT_TIME = 5;   // Duration in seconds for the Absorption effect

const paladinStateByPlayer = new Map();

// PALADIN OUTFIT
mc.world.afterEvents.worldInitialize.subscribe(() => {
  startPaladinOutfitCheck();
});

function isWearingFullPaladinSet(player) {
  const equip = player.getComponent("minecraft:equippable");
  if (!equip) return false;

  return (
    equip.getEquipment(mc.EquipmentSlot.Head)?.typeId === "paragonia_classes:paladin_helm" &&
    equip.getEquipment(mc.EquipmentSlot.Chest)?.typeId === "paragonia_classes:paladin_cuirass" &&
    equip.getEquipment(mc.EquipmentSlot.Legs)?.typeId === "paragonia_classes:paladin_faulds" &&
    equip.getEquipment(mc.EquipmentSlot.Feet)?.typeId === "paragonia_classes:paladin_sabatons"
  );
}

function hasPaladinTag(player) {
  return (
    player.hasTag("paragonia_classes:class_paladin") ||
    player.hasTag("paragonia_classes:subclass_paladin")
  );
}

function startPaladinOutfitCheck() {
  mc.system.runInterval(() => {
    for (const player of mc.world.getPlayers()) {
      if (!isWearingFullPaladinSet(player) || !hasPaladinTag(player)) {
        paladinStateByPlayer.delete(player.id);
        continue;
      }

      const state = paladinStateByPlayer.get(player.id) ?? {
        lastHealth: null,
        damageCounter: 0
      };

      const healthComp = player.getComponent("minecraft:health");
      if (!healthComp) continue;

      const currentHealth = healthComp.currentValue;

      if (state.lastHealth !== null && currentHealth < state.lastHealth) {
        const damageTaken = state.lastHealth - currentHealth;
        state.damageCounter += damageTaken;

        if (state.damageCounter >= DAMAGE_TAKEN) {
          const currentAbsorption = player.getEffect("minecraft:absorption");

          if (currentAbsorption) {
            // Extend and upgrade to Absorption II
            player.addEffect("minecraft:absorption", EFFECT_TIME * 20, {
              amplifier: 1,
              showParticles: false
            });
          } else {
            // Apply Absorption I
            player.addEffect("minecraft:absorption", EFFECT_TIME * 20, {
              amplifier: 0,
              showParticles: false
            });
          }

          state.damageCounter = 0;
        }
      }

      state.lastHealth = currentHealth;
      paladinStateByPlayer.set(player.id, state);
    }
  }, 1);
}
