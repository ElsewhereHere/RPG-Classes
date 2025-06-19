import { world } from "@minecraft/server";

const TARGET_DUMMY_IDS = new Set([
  "paragonia_classes:target_dummy",
  "paragonia_classes:target_dummy_undead"
]);

const DISPLAY_ENTITY_ID = "paragonia_classes:target_dummy_display";

// Track the last known health of each dummy (should ideally always be 100 after initialization/reset)
const lastHealthMap = new Map();

world.afterEvents.entityHealthChanged.subscribe((event) => {
  const entity = event.entity;
  if (!TARGET_DUMMY_IDS.has(entity.typeId)) return;

  const healthComponent = entity.getComponent("health");
  if (!healthComponent) {
    // This should ideally not happen for an entity that can take damage
    console.warn(`Target dummy ${entity.id} missing health component.`);
    return;
  }

  // Determine health before this specific hit, assuming it was 100 if tracked correctly.
  const healthBeforeThisHit = lastHealthMap.get(entity.id) ?? 100;
  const healthAfterThisHit = event.newValue; // Health value after the current damage event occurs

  // Calculate damage dealt in this event
  const damageDealt = Math.round(healthBeforeThisHit - healthAfterThisHit);

  if (damageDealt > 0) {
    // Only display damage if actual damage was dealt
    const pos = entity.location;
    const randomOffset = () => Math.random() * 0.6 - 0.3; // Centered offset

    const spawnPos = {
      x: pos.x + randomOffset(),
      y: pos.y + 1, // Your tweaked Y position
      z: pos.z + randomOffset(),
    };

    try {
      // Spawn the display entity for damage number
      const display = world
        .getDimension(entity.dimension.id)
        .spawnEntity(DISPLAY_ENTITY_ID, spawnPos);
      display.nameTag = `§c-${damageDealt}`;

      // Apply a slight upward impulse (your tweaked value)
      display.applyImpulse({ x: 0, y: 0.02, z: 0 });
    } catch (e) {
      console.warn(
        `Failed to spawn display entity or apply impulse for ${DISPLAY_ENTITY_ID}:`,
        e
      );
    }
  }

  // Always reset the target dummy's health to 100 after a health change event.
  healthComponent.setCurrentValue(100);

  // Update the map to reflect that the dummy is now at 100 health for the next event.
  lastHealthMap.set(entity.id, 100);
});

// Initialize health for existing dummies on world load and ensure they are at 100.
world.afterEvents.worldInitialize.subscribe(() => {
  const allEntities = world.getDimension("overworld").getEntities();
  for (const dummy of allEntities) {
    if (!TARGET_DUMMY_IDS.has(dummy.typeId)) continue;

    const healthComponent = dummy.getComponent("health");
    if (healthComponent) {
      healthComponent.setCurrentValue(100); // Ensure health is set to 100
      lastHealthMap.set(dummy.id, 100); // Record that it's at 100
    }
  }
});

