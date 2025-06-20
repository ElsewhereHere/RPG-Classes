import * as mc from "@minecraft/server";

const FLAME_SPEED = 2;
const MAX_DISTANCE = 30;
const STEP_INTERVAL = 1;
const HIT_RADIUS = 1.85;

const activeFlames = new Map();

export function SacredFlame(player) {
  player.playAnimation("animation.paragonia_classes.player.sacred_flame");
  const dir = player.getViewDirection();
  const loc = player.location;
  const start = {
    x: loc.x + dir.x * 1.5,
    y: loc.y + 1.5,
    z: loc.z + dir.z * 1.5,
  };

  activeFlames.set(player.id, {
    pos: start,
    dir,
    distance: 0,
    dimension: player.dimension,
    playerId: player.id,
    stepCount: 0
  });
}

mc.system.runInterval(() => {
  for (const [id, flame] of activeFlames.entries()) {
    if (!flame || !flame.dimension) {
      activeFlames.delete(id);
      continue;
    }

    const nextPos = {
      x: flame.pos.x + flame.dir.x * FLAME_SPEED,
      y: flame.pos.y + flame.dir.y * FLAME_SPEED,
      z: flame.pos.z + flame.dir.z * FLAME_SPEED,
    };

    const blockHit = flame.dimension.getBlock(nextPos);
    if (blockHit && !blockHit.isAir) {
      flame.dimension.spawnParticle("paragonia_classes:paladin_sacred_flame", nextPos);
      activeFlames.delete(id);
      continue;
    }

    const entities = flame.dimension.getEntities({
      location: nextPos,
      maxDistance: HIT_RADIUS,
    });

    const hit = entities.find(e => e.id !== id && e.id !== undefined && e.typeId !== "minecraft:item");

    if (hit) {
      try {
        const player = mc.world.getPlayers().find(p => p.id === flame.playerId);
        //player?.sendMessage(`§e[Debug] Hit entity: §f${hit.typeId}`);

        hit.applyDamage(6);
        hit.addEffect("blindness", 60, { amplifier: 0, showParticles: true });

        const effects = hit.getEffects();
        if (effects.find(e => e.typeId === "invisibility")) {
          hit.removeEffect("invisibility");
        }

        //flame.dimension.spawnParticle("paragonia_classes:paladin_radiant_orb_glow", nextPos);
        flame.dimension.playSound("paragonia_classes.paladin_ability_3_impact", nextPos);

      } catch (err) {
        //console.warn("Sacred Flame hit error:", err);
      }

      activeFlames.delete(id);
      continue;
    }

    flame.dimension.spawnParticle("paragonia_classes:paladin_sacred_flame", nextPos);
    if (flame.stepCount % 2 === 0) {
      flame.dimension.playSound("paragonia_classes.paladin_ability_3", nextPos);
    }

    flame.pos = nextPos;
    flame.stepCount++;
    flame.distance += FLAME_SPEED;

    if (flame.distance >= MAX_DISTANCE) {
      activeFlames.delete(id);
    }
  }
}, STEP_INTERVAL);
