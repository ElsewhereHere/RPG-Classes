import * as mc from "@minecraft/server";

const ENTANGLE_SPEED = 1;
const MAX_DISTANCE = 25;
//const HIT_RADIUS = 1.5;
const STEP_INTERVAL = 1;

const activeEntangles = new Map();

export function Entangle(player) {
  player.playAnimation("animation.paragonia_classes.player.entangle");
  const dir = player.getViewDirection();
  const loc = player.location;

  const start = {
    x: loc.x + dir.x * 1.5,
    y: loc.y + 1.5,
    z: loc.z + dir.z * 1.5,
  };

  activeEntangles.set(player.id, {
    pos: start,
    dir,
    distance: 0,
    dimension: player.dimension,
    playerId: player.id,
    stepCount: 0,
  });

  //player.sendMessage("§7[DEBUG] Entangle ability started");
}

mc.system.runInterval(() => {
  for (const [id, entangle] of activeEntangles.entries()) {
    if (!entangle || !entangle.dimension) {
      activeEntangles.delete(id);
      continue;
    }

    const nextPos = {
      x: entangle.pos.x + entangle.dir.x * ENTANGLE_SPEED,
      y: entangle.pos.y + entangle.dir.y * ENTANGLE_SPEED,
      z: entangle.pos.z + entangle.dir.z * ENTANGLE_SPEED,
    };

    const block = entangle.dimension.getBlock(nextPos);
    if (block && !block.isAir) {
      activeEntangles.delete(id);
      return;
    }

    // Raycast against entity hitboxes for this segment
    const hits = entangle.dimension.getEntitiesFromRay(
      entangle.pos,
      entangle.dir,
      {
        maxDistance: ENTANGLE_SPEED,
        excludeTypes: ["minecraft:item"],
      }
    );

    const hitResult = hits.find((h) => h.entity.id !== id);
    if (hitResult) {
      const target = hitResult.entity;
      try {
        const player = mc.world
          .getPlayers()
          .find((p) => p.id === entangle.playerId);
        const targetPos = target.location;
        const spawnPos = {
          x: Math.floor(targetPos.x) + 0.5,
          y: Math.floor(targetPos.y),
          z: Math.floor(targetPos.z) + 0.5,
        };

        //player?.sendMessage(`§7[DEBUG] Attempting to spawn entangle_roots at ${spawnPos.x.toFixed(1)}, ${spawnPos.y.toFixed(1)}, ${spawnPos.z.toFixed(1)}`);

        const ent = entangle.dimension.spawnEntity(
          "paragonia_classes:entangle_roots",
          spawnPos
        );
        if (!ent) {
          //player?.sendMessage("§c[DEBUG] Failed to spawn entangle_roots");
        }

        target.addEffect("slowness", 40, {
          amplifier: 10,
          showParticles: false,
        });

        entangle.dimension.playSound(
          "paragonia_classes.druid_ability_1_impact",
          targetPos
        );
      } catch (err) {
        const player = mc.world
          .getPlayers()
          .find((p) => p.id === entangle.playerId);
        //player?.sendMessage(`§c[DEBUG] Entangle error: ${err}`);
      }

      activeEntangles.delete(id);
      return;
    }

    entangle.dimension.spawnParticle(
      "paragonia_classes:druid_entangle",
      nextPos
    );
    if (entangle.stepCount % 3 === 0) {
      entangle.dimension.playSound(
        "paragonia_classes.druid_ability_1_cast",
        nextPos
      );
    }

    entangle.pos = nextPos;
    entangle.stepCount++;
    entangle.distance += ENTANGLE_SPEED;

    if (entangle.distance >= MAX_DISTANCE) {
      activeEntangles.delete(id);
    }
  }
}, STEP_INTERVAL);
