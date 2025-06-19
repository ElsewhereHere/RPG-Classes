import * as mc from "@minecraft/server";

const RESTORING_LIGHT_ITEM_ID = "paragonia_classes:ability_paladin_2";
const HEAL_RADIUS = 6;
const HEAL_AMOUNT = 10;
const RESTORE_TAG = "paragonia_classes:has_restoring_light";
const TAG_DURATION_TICKS = 6 * 20; // 6 seconds in ticks
const BONUS_DAMAGE = 2;

// Heal a player by a specified amount, clamped to max health
function healPlayer(player, amount) {
  const healthComp = player.getComponent("minecraft:health");
  if (!healthComp) return;
  const current = healthComp.currentValue;
  const max = healthComp.defaultValue;
  healthComp.setCurrentValue(Math.min(current + amount, max));
}

// Restoring Light Ability: Heals players in radius and tags them
export function RestoringLight(player, item) {
  if (!player || !item || item.typeId !== RESTORING_LIGHT_ITEM_ID) return;

  const dimension = player.dimension;
  const playerLoc = player.location;

  // Spawn healing light particles
  dimension.spawnParticle("paragonia_classes:paladin_restoring_light", playerLoc);
  dimension.spawnParticle("paragonia_classes:paladin_restoring_light_aura", playerLoc);
  dimension.playSound("paragonia_classes.paladin_ability_2", playerLoc);
  mc.system.runTimeout(() => {
    dimension.spawnParticle("paragonia_classes:paladin_restoring_light_aura",playerLoc);
    dimension.playSound("paragonia_classes.paladin_ability_2", playerLoc);
  }, 30);
  mc.system.runTimeout(() => {
    dimension.spawnParticle("paragonia_classes:paladin_restoring_light_aura",playerLoc);
    dimension.playSound("paragonia_classes.paladin_ability_2", playerLoc);
  }, 60);


  // Play shimmer sound at 3 random positions within 5-block radius, 2 ticks apart
  for (let i = 0; i < 3; i++) {
    mc.system.runTimeout(() => {
      const offsetX = Math.random() * 10 - 5;
      const offsetY = Math.random() * 10 - 5;
      const offsetZ = Math.random() * 10 - 5;
      const soundPos = {
        x: playerLoc.x + offsetX,
        y: playerLoc.y + offsetY,
        z: playerLoc.z + offsetZ,
      };
      dimension.playSound("paragonia_classes.paladin_ability_2_shimmer", soundPos);
    }, i * 6);
  }

  // Play core sound and animation
  //dimension.playSound("paragonia_classes.paladin_ability_2", playerLoc);
  player.playAnimation("animation.paragonia_classes.player.restoring_light", {
    controller: "ability",
    blendOutTime: 0,
  });

  // Heal self and nearby players, then tag
  function healInArea(center, dimension, amount, applyTag = false) {
  const targets = dimension.getEntities({
    location: center,
    maxDistance: HEAL_RADIUS,
  });
  targets.forEach((entity) => {
    if (entity instanceof mc.Player) {
      healPlayer(entity, amount);
      if (applyTag) {
        entity.addTag(RESTORE_TAG);
        mc.system.runTimeout(() => {
          if (entity.hasTag(RESTORE_TAG)) entity.removeTag(RESTORE_TAG);
        }, TAG_DURATION_TICKS);
      }
    }
  });
}

// First pulse: heal and tag
healInArea(playerLoc, dimension, 3, true);

// Second pulse: heal only
mc.system.runTimeout(() => {
  healInArea(playerLoc, dimension, 3);
}, 30);

// Third pulse: heal only
mc.system.runTimeout(() => {
  healInArea(playerLoc, dimension, 3);
}, 60);

}

// Debug and apply bonus damage to all undead in radius on entity hurt
mc.world.afterEvents.entityHurt.subscribe((event) => {
  const source = event.damageSource?.damagingEntity;
  const cause = event.damageSource?.cause;
  const target = event.hurtEntity;
  // Only proceed if player melee attack and valid target
  if (
    !source ||
    !(source instanceof mc.Player) ||
    cause !== mc.EntityDamageCause.entityAttack ||
    !target
  )
    return;

  // Source and target info
  const sourceInfo = source.nameTag;
  const targetInfo = target.nameTag || target.typeId;

  // Retrieve families of original target
  const familyComp = target.getComponent("minecraft:type_family");
  let families = [];
  if (familyComp) {
    try {
      families = familyComp.getTypeFamilies();
    } catch {
      families = [];
    }
  }

  // Target location
  const loc = target.location;

  // Debug message for original target
  //source.sendMessage(
  //  `[RestoringLight Debug] source: ${sourceInfo}, original: ${targetInfo}, families: [${families.join(", ")}], location: (${loc.x.toFixed(2)}, ${loc.y.toFixed(2)}, ${loc.z.toFixed(2)})`
  //);

  // Only apply bonus if player has restore tag and original target is undead
  if (source.hasTag(RESTORE_TAG) && families.includes("undead")) {
    const radius = 2;
    const dimension = target.dimension;
    const nearbyEntities = dimension.getEntities({
      location: loc,
      maxDistance: radius,
    });
    let count = 0;
    nearbyEntities.forEach((ent) => {
      // For each entity, check its undead family
      const famComp = ent.getComponent("minecraft:type_family");
      let entFamilies = [];
      if (famComp) {
        try {
          entFamilies = famComp.getTypeFamilies();
        } catch {
          entFamilies = [];
        }
      }
      if (entFamilies.includes("undead")) {
        ent.applyDamage(BONUS_DAMAGE, {
          cause: mc.EntityDamageCause.magic,
          damagingEntity: source,
        });
        count++;
        dimension.spawnParticle("paragonia_classes:paladin_restoring_light_burst", target.location);
      }
    });
    // Report how many undead were affected
    //source.sendMessage(
    //  `[RestoringLight Debug] Applied ${BONUS_DAMAGE} bonus damage to ${count} undead entity(ies) within ${radius} blocks.`
    //);
  }
});
