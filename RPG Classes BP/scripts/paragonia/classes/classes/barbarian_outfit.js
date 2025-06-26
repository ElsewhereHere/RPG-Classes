import * as mc from "@minecraft/server";

const stateByPlayer = new Map();

// BARBARIAN OUTFIT
mc.world.afterEvents.worldInitialize.subscribe(() => {
  startBarbarianOutfitCheck();
});

function isWearingFullBarbarianSet(player) {
  const equip = player.getComponent("minecraft:equippable");
  if (!equip) return false;

  return (
    equip.getEquipment(mc.EquipmentSlot.Head)?.typeId === "paragonia_classes:barbarian_helmet" &&
    equip.getEquipment(mc.EquipmentSlot.Chest)?.typeId === "paragonia_classes:barbarian_vest" &&
    equip.getEquipment(mc.EquipmentSlot.Legs)?.typeId === "paragonia_classes:barbarian_shorts" &&
    equip.getEquipment(mc.EquipmentSlot.Feet)?.typeId === "paragonia_classes:barbarian_shoes"
  );
}

function startBarbarianOutfitCheck() {
  mc.system.runInterval(() => {
    for (const player of mc.world.getPlayers()) {
      if (!isWearingFullBarbarianSet(player)) {
        stateByPlayer.delete(player.id);
        continue;
      }

      if (
        !player.hasTag("paragonia_classes:class_barbarian") &&
        !player.hasTag("paragonia_classes:subclass_barbarian")
      ) {
        stateByPlayer.delete(player.id);
        continue;
      }

      const healthComp = player.getComponent("minecraft:health");
      if (!healthComp) continue;

      const health = healthComp.currentValue;
      const state = stateByPlayer.get(player.id) ?? {
        flareUpPlayed: false,
        loopTickCounter: 0,
        flareDownTimeout: undefined,
      };

      if (health <= 5) {
        if (player.hasTag("paragonia_classes:barbarian_outfit_strength")) {
          const currentStrength = player.getEffect("minecraft:strength");
          const isRaging = player.hasTag("paragonia_classes:is_raging");

          if (currentStrength && currentStrength.amplifier === 2 && !isRaging) {
            // Downgrade Rage Strength III to Outfit Strength II
            player.addEffect("minecraft:strength", 40, {
              amplifier: 1,
              showParticles: false,
            });
          } else {
            // Refresh Outfit Strength II
            player.addEffect("minecraft:strength", 40, {
              amplifier: 2,
              showParticles: false,
            });
          }

          if (state.loopTickCounter > 0) {
            state.loopTickCounter--;
          } else {
            player.playSound("paragonia_classes.barbarian_outfit_loop");
            state.loopTickCounter = 20;
          }
        } else {
          // First-time activation
          player.addEffect("minecraft:strength", 40, {
            amplifier: 1,
            showParticles: false,
          });
          player.addTag("paragonia_classes:barbarian_outfit_strength");

          player.playSound("paragonia_classes.barbarian_outfit_flare_up");
          state.flareUpPlayed = true;
          state.loopTickCounter = 20;
        }
      } else {
        if (player.hasTag("paragonia_classes:barbarian_outfit_strength")) {
          player.removeEffect("minecraft:strength");
          player.removeTag("paragonia_classes:barbarian_outfit_strength");

          if (state.flareUpPlayed) {
            if (state.flareDownTimeout !== undefined) {
              mc.system.clearRun(state.flareDownTimeout);
            }

            state.flareDownTimeout = mc.system.runTimeout(() => {
              player.playSound("paragonia_classes.barbarian_outfit_flare_down");
            }, 20);
          }
        }

        state.flareUpPlayed = false;
        state.loopTickCounter = 0;
      }

      stateByPlayer.set(player.id, state);
    }
  }, 1); // Every tick
}
