import * as mc from "@minecraft/server";

const WAND_SPEED = 2;
const MAX_DISTANCE = 25;
//const HIT_RADIUS = 1.5;
const STEP_INTERVAL = 1;

// Active beams in flight
const activeWandShots = new Map();

// Timestamp (ms) of last cast per player for 1 s cooldown
const lastWandCast = new Map();

// Combo state per player: { lastCombo: ms, count: 1–3 }
const wandCastState = new Map();

export function Wand(player) {
  const now = Date.now();

  // 1. Clone the wand and get its durability component
  const invComp = player.getComponent("minecraft:inventory");
  const container = invComp.container;
  const slot = player.selectedSlotIndex;
  const oldStack = container.getItem(slot);
  if (oldStack) {
    const newStack = oldStack.clone();
    const durComp = newStack.getComponent("minecraft:durability");
    if (durComp) {
      // 2. Roll against the item's damage_chance range from JSON
      const range = durComp.getDamageChanceRange(); // :contentReference[oaicite:0]{index=0}
      const roll = Math.random() * (range.max - range.min) + range.min; // range.min/.max from NumberRange :contentReference[oaicite:1]{index=1}
      if (Math.random() * 100 < roll) {
        durComp.damage = durComp.damage + 1;
      }

      // 3. If it’s maxed out, break the wand
      if (durComp.damage >= durComp.maxDurability) {
        // Play the break sound
        player.dimension.playSound("random.break", player.location);
        // Remove the broken item from the slot
        container.setItem(slot, undefined);
      } else {
        // Otherwise write back the updated, still-usable wand
        container.setItem(slot, newStack);
      }
    }
  }

  // 1 s cooldown check
  const last = lastWandCast.get(player.id) || 0;
  if (now - last < 500) return;
  lastWandCast.set(player.id, now);

  // Combo logic: reset if >1 s since last combo, else cycle 1→2→3
  const state = wandCastState.get(player.id) || { lastCombo: 0, count: 0 };
  if (now - state.lastCombo > 1000) {
    state.count = 1;
  } else {
    state.count = (state.count % 3) + 1;
  }
  state.lastCombo = now;
  wandCastState.set(player.id, state);

  // Play the combo animation
  const animName = `animation.paragonia_classes.player.wand_cast_${state.count}`;
  player.playAnimation(animName, { blendOutTime: 0.1 });

  // Cast sound
  player.dimension.playSound("paragonia_classes.wand_cast", player.location);

  // Initialize beam start position just ahead of the caster
  const dir = player.getViewDirection();
  const loc = player.location;
  const start = {
    x: loc.x + dir.x * 1.5,
    y: loc.y + 1.5,
    z: loc.z + dir.z * 1.5,
  };

  activeWandShots.set(player.id, {
    pos: start,
    dir,
    distance: 0,
    dimension: player.dimension,
    playerId: player.id,
  });
}

mc.system.runInterval(() => {
  for (const [id, shot] of activeWandShots.entries()) {
    if (!shot.dimension) {
      activeWandShots.delete(id);
      continue;
    }

    // Step the beam forward
    const nextPos = {
      x: shot.pos.x + shot.dir.x * WAND_SPEED,
      y: shot.pos.y + shot.dir.y * WAND_SPEED,
      z: shot.pos.z + shot.dir.z * WAND_SPEED,
    };

    // Stop if we hit a block
    const block = shot.dimension.getBlock(nextPos);
    if (block && !block.isAir) {
      activeWandShots.delete(id);
      continue;
    }

    // Trail VFX
    shot.dimension.spawnParticle("paragonia_classes:wand", nextPos);

    // Entity collision
    // Entity collision via raycast
const hits = shot.dimension.getEntitiesFromRay(
  shot.pos,
  shot.dir,
  {
    maxDistance: WAND_SPEED,
    excludeTypes: [
      "minecraft:item",
      "paragonia_classes:target_dummy_display"
    ]
  }
);
if (hits.length > 0) {
  const target = hits[0].entity;
  shot.dimension.spawnParticle("paragonia_classes:wand_impact", target.location);
  shot.dimension.playSound("paragonia_classes:wand_hit", target.location);

  const caster = mc.world.getPlayers().find(p => p.id === shot.playerId);
  const damageAmount = caster && caster.hasTag("paragonia_classes:has_barkskin")
    ? 5
    : 3;

  if (caster) {
    target.applyDamage(damageAmount, {
      cause:            mc.EntityDamageCause.magic,
      damagingEntity:   caster
    });
  } else {
    target.applyDamage(damageAmount);
  }

  activeWandShots.delete(id);
  continue;
}

    // Advance or expire by range
    shot.pos = nextPos;
    shot.distance += WAND_SPEED;
    if (shot.distance >= MAX_DISTANCE) {
      activeWandShots.delete(id);
    }
  }
}, STEP_INTERVAL);
