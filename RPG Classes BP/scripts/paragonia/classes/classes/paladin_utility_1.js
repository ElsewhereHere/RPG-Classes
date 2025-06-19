const NEGATIVE_EFFECTS = [
  "bad_omen",
  "blindness",
  "darkness",
  "fatal_poison",
  "hunger",
  "infested",
  "mining_fatique",
  "nausea",
  "oozing",
  "poison",
  "slowness",
  "weakness",
  "weaving",
  "wither"
];

function cleanse(entity) {
  try {
    const effects = entity.getEffects();
    if (!effects || effects.length === 0) return;

    const removable = effects.filter((e) =>
      NEGATIVE_EFFECTS.includes(e.typeId)
    );
    if (removable.length === 0) return;

    const chosen = removable[Math.floor(Math.random() * removable.length)];
    const chosenId = chosen.typeId;
    entity.removeEffect(chosenId);
  } catch (err) {
    console.warn("Cleanse error:", err);
  }
}

export function CleanseEntity(player, item, target) {
  cleanse(target);
  player.dimension.playSound("paragonia_classes.paladin_utility_1", target.location);
  player.dimension.spawnParticle("paragonia_classes:paladin_cleanse", target.location);
  player.dimension.spawnParticle("paragonia_classes:paladin_cleanse", player.location);
}

export function CleanseSelf(player, item) {
  cleanse(player);
  player.dimension.playSound("paragonia_classes.paladin_utility_1", player.location);
  player.dimension.spawnParticle("paragonia_classes:paladin_cleanse",player.location);
}
