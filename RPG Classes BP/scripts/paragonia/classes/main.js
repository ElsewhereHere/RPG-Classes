import * as mc from "@minecraft/server";
import "paragonia/classes/shrine/shrine.js";
import "paragonia/classes/target_dummy/target_dummy.js";

//Outfits
import "./classes/barbarian_outfit.js";
import "./classes/paladin_outfit.js";
import "./classes/druid_outfit.js";

//Abilities
import { BattleCry } from "./classes/barbarian_ability_1.js";
import { RecklessLeap } from "./classes/barbarian_ability_2.js";
import { Frenzy } from "./classes/barbarian_ability_3.js";
import { RadiantShield } from "./classes/paladin_ability_1.js";
import { RestoringLight } from "./classes/paladin_ability_2.js";
import { SacredFlame } from "./classes/paladin_ability_3.js";
import { Entangle } from "./classes/druid_ability_1.js";
import { Barkskin } from "./classes/druid_ability_2.js";
import { SoothingSpores } from "./classes/druid_ability_3.js";

//Ultimates
import { Rage } from "./classes/barbarian_ability_ult.js";
import { DivineAscension } from "./classes/paladin_ability_ult.js";
import { WildShape, ClawSlash } from "./classes/druid_ability_ult.js";

//Utilities
import "./classes/barbarian_utility_2.js";
import { VentSteam } from "./classes/barbarian_utility_1.js";
import { CleanseSelf, CleanseEntity } from "./classes/paladin_utility_1.js";
import { Sanctify } from "./classes/paladin_utility_2.js";
import { Druidcraft } from "./classes/druid_utility_1.js";


//Items
import "./items/radiant_orb.js";
import { Wand } from "./items/wand.js";
import "./items/healing_salve.js";
import "./items/firefly_lantern.js";


//    ABILITY
//-----------------


//Ability Definitions
const abilityHandlers = {
  "paragonia_classes:ability_barbarian_1": {
    class_name: "§cBarbarian",
    handler: BattleCry,
    tags: [
      "paragonia_classes:class_barbarian",
      "paragonia_classes:subclass_barbarian",
    ],
  },
  "paragonia_classes:ability_barbarian_2": {
    class_name: "§cBarbarian",
    handler: RecklessLeap,
    tags: [
      "paragonia_classes:class_barbarian",
      "paragonia_classes:subclass_barbarian",
    ],
  },
  "paragonia_classes:ability_barbarian_3": {
    class_name: "§cBarbarian",
    handler: Frenzy,
    tags: [
      "paragonia_classes:class_barbarian",
      "paragonia_classes:subclass_barbarian",
    ],
  },
  "paragonia_classes:ability_paladin_2": {
    class_name: "§ePaladin",
    handler: RestoringLight,
    tags: [
      "paragonia_classes:class_paladin",
      "paragonia_classes:subclass_paladin",
    ],
  },
  "paragonia_classes:ability_paladin_1": {
    class_name: "§ePaladin",
    handler: RadiantShield,
    tags: [
      "paragonia_classes:class_paladin",
      "paragonia_classes:subclass_paladin",
    ],
  },
  "paragonia_classes:ability_paladin_3": {
    class_name: "§ePaladin",
    handler: SacredFlame,
    tags: [
      "paragonia_classes:class_paladin",
      "paragonia_classes:subclass_paladin",
    ],
  },
  "paragonia_classes:ability_druid_1": {
    class_name: "§aDruid",
    handler: Entangle,
    tags: [
      "paragonia_classes:class_druid",
      "paragonia_classes:subclass_druid",
    ],
  },
  "paragonia_classes:ability_druid_2": {
    class_name: "§aDruid",
    handler: Barkskin,
    tags: [
      "paragonia_classes:class_druid",
      "paragonia_classes:subclass_druid",
    ],
  },
  "paragonia_classes:ability_druid_3": {
    class_name: "§aDruid",
    handler: SoothingSpores,
    tags: [
      "paragonia_classes:class_druid",
      "paragonia_classes:subclass_druid",
    ],
  },
  "paragonia_classes:ability_druid_ult_alt": {
    class_name: "§aDruid",
    handler: ClawSlash,
    tags: [
      "paragonia_classes:class_druid",
      "paragonia_classes:subclass_druid",
    ],
  },
};

//Handle Ability Item Usage
mc.world.afterEvents.itemUse.subscribe((event) => {
  const player = event.source;
  const item = event.itemStack;
  if (!item) return;

  const itemId = item.typeId;
  const abilityData = abilityHandlers[itemId];
  if (!abilityData) return;

  const hasAccess = abilityData.tags.some((tag) => player.hasTag(tag));
  if (!hasAccess) {
    player.sendMessage(
      `§7[RPG Classes] §rYou must be a ${abilityData.class_name} §rto use this Ability.`
    );
    return;
  }

  if (player.getItemCooldown(itemId) > 0) {
    player.playSound("paragonia_classes.ability_on_cooldown");
    return;
  }

  const cooldownComp = item.getComponent("minecraft:cooldown");
  if (cooldownComp) {
    cooldownComp.startCooldown(player);
  }

  abilityData.handler(player, item);
});


/*
//Charge Ability Definitions
const chargeAbilityHandlers = {
  "paragonia_classes:ability_paladin_1": {
    class_name: "§ePaladin",
    start: RadiantShieldStart,
    stop:  RadiantShieldStop,
    tags: [
      "paragonia_classes:class_paladin",
      "paragonia_classes:subclass_paladin",
    ],
    maxTicks: 5 * 20
  },
  // …you can add other “hold” abilities here later…
};

//Handle Charge Ability Start
mc.world.afterEvents.itemStartUse.subscribe(event => {
  const p = event.source, item = event.itemStack;
  const data = chargeAbilityHandlers[item.typeId];
  if (!data) return;
  if (!data.tags.some(t => p.hasTag(t))) {
    p.sendMessage(`§7[RPG Classes] §rYou must be a ${data.class_name} §rto use this.`);
    return;
  }
  data.start(p, item);
});

//Handle Charge Ability Stop
mc.world.afterEvents.itemStopUse.subscribe(event => {
  const p = event.source, item = event.itemStack;
  const data = chargeAbilityHandlers[item.typeId];
  if (!data) return;
  data.stop(p, item);
});

//Handle Charge Ability Cooldown Sound
mc.world.afterEvents.itemUse.subscribe((event) => {
  const player = event.source;
  const item = event.itemStack;
  if (!item) return;

  const itemId = item.typeId;
  const chargeAbilityData = chargeAbilityHandlers[itemId];
  if (!chargeAbilityData) return;

  if (player.getItemCooldown(itemId) > 0) {
    player.playSound("paragonia_classes.ability_on_cooldown");
    return;
  }

  const cooldownComp = item.getComponent("minecraft:cooldown");
  if (cooldownComp) {
    cooldownComp.startCooldown(player);
  }
});
*/


//    ULTIMATE
//-----------------


//Ultimate Definitions
const ultimateHandlers = {
  "paragonia_classes:ability_barbarian_ult": {
    class: "barbarian",
    class_name: "§cBarbarian",
    handler: Rage,
    tags: [
      "paragonia_classes:class_barbarian",
      "paragonia_classes:subclass_barbarian",
    ],
    cooldownTag: "paragonia_classes:ability_barbarian_ult",
  },
  "paragonia_classes:ability_paladin_ult": {
    class: "paladin",
    class_name: "§ePaladin",
    handler: DivineAscension,
    tags: [
      "paragonia_classes:class_paladin",
      "paragonia_classes:subclass_paladin",
    ],
    cooldownTag: "paragonia_classes:ability_paladin_ult",
  },
  "paragonia_classes:ability_druid_ult": {
    class: "druid",
    class_name: "§aDruid",
    handler: WildShape,
    tags: [
      "paragonia_classes:class_druid",
      "paragonia_classes:subclass_druid",
    ],
    cooldownTag: "paragonia_classes:ability_druid_ult",
  },
};

//Ultimate Generation Item Definitions
const ultimateChargeMap = {
  // Barbarian
  "minecraft:wooden_axe": { class_id: "barbarian", amount: 5 },
  "minecraft:stone_axe": { class_id: "barbarian", amount: 5 },
  "minecraft:iron_axe": { class_id: "barbarian", amount: 5 },
  "minecraft:golden_axe": { class_id: "barbarian", amount: 5 },
  "minecraft:diamond_axe": { class_id: "barbarian", amount: 5 },
  "minecraft:netherite_axe": { class_id: "barbarian", amount: 5 },
  "paragonia_classes:battle_axe": { class_id: "barbarian", amount: 10 },
  // Paladin
  "paragonia_classes:flail": { class_id: "paladin", amount: 5 },
  "minecraft:mace": { class_id: "paladin", amount: 10 },
  // Druid
  "paragonia_classes:wand": { class_id: "druid", amount: 5 },
  "paragonia_classes:staff": { class_id: "druid", amount: 10 }
};


const playerUltimate = new Map(); // Map<player.id, { [class_id]: charge }>

//Handle Generating Ultimate
mc.world.afterEvents.entityHurt.subscribe((event) => {
  const attacker = event.damageSource?.damagingEntity;
  if (!attacker || !(attacker instanceof mc.Player)) return;

  const heldItem = attacker
    .getComponent("minecraft:equippable")
    ?.getEquipment(mc.EquipmentSlot.Mainhand);
  if (!heldItem) return;

  const chargeData = ultimateChargeMap[heldItem.typeId];
  if (!chargeData) return;

  const { class_id, amount } = chargeData;

  const handlerKey = `paragonia_classes:ability_${class_id}_ult`;
  const handler = ultimateHandlers[handlerKey];
  if (!handler) return;

  const hasAccess = handler.tags.some((tag) => attacker.hasTag(tag));
  if (!hasAccess) return;

  const current    = playerUltimate.get(attacker.id) || {};
  const prevCharge = current[class_id] || 0;
  const newCharge  = Math.min(prevCharge + amount, 100);
  current[class_id] = newCharge;
  playerUltimate.set(attacker.id, current);

  // If we've just topped out at 100 (and weren’t already there), play the “ready” sound
  if (newCharge === 100 && prevCharge < 100) {
    attacker.playSound("paragonia_classes.ability_ultimate_ready",attacker.location);
  }

  //attacker.sendMessage(
  //  `§7[RPG Classes] ${handler.class_name} Ultimate: ${newCharge}/100`
  //);
});

//Handle Ultimate Item Usage
mc.world.afterEvents.itemUse.subscribe((event) => {
  const player = event.source;
  const item = event.itemStack;
  if (!item) return;

  const data = ultimateHandlers[item.typeId];
  if (!data) return;

  const hasAccess = data.tags.some((tag) => player.hasTag(tag));
  if (!hasAccess) {
    player.sendMessage(
      `§7[RPG Classes] §rYou must be a ${data.class_name} §rto use this Ultimate.`
    );
    return;
  }

  const charge = playerUltimate.get(player.id)?.[data.class] || 0;
  if (charge < 100) {
    player.playSound("paragonia_classes.ability_on_cooldown");
    return;
  }

  const ult = playerUltimate.get(player.id) || {};
  ult[data.class] = 0;
  playerUltimate.set(player.id, ult);

  data.handler(player, item);
});

//Ultimate Cooldown Management
mc.system.runInterval(() => {
  for (const player of mc.world.getPlayers()) {
    let ultData = playerUltimate.get(player.id);
    if (!ultData) {
      ultData = {};
      playerUltimate.set(player.id, ultData);
    }

    const inventory = player.getComponent("minecraft:inventory")?.container;
    if (!inventory) continue;

    for (const [itemId, ultDef] of Object.entries(ultimateHandlers)) {
      const { class: classKey, tags, cooldownTag } = ultDef;

      const hasAccess = tags.some((tag) => player.hasTag(tag));
      if (!hasAccess) continue;

      const charge = ultData[classKey] || 0;
      if (charge >= 100) continue;

      for (let i = 0; i < inventory.size; i++) {
        const item = inventory.getItem(i);
        if (!item || item.typeId !== itemId) continue;

        const cooldownComp = item.getComponent("minecraft:cooldown");
        if (cooldownComp) {
          cooldownComp.startCooldown(player);
        }
      }
    }
  }
}, 1);

// Display Ultimate progress in Action Bar
mc.system.runInterval(() => {
  for (const player of mc.world.getPlayers()) {
    const ultData = playerUltimate.get(player.id);
    if (!ultData) continue;

    // Gather class ultimates to display
    const entries = Object.entries(ultData)
      .map(([classKey, value]) => {
        const handlerKey = `paragonia_classes:ability_${classKey}_ult`;
        const className = ultimateHandlers[handlerKey]?.class_name ?? classKey;
        return `${className}: §f${value}/100`;
      });

    if (entries.length > 0) {
      player.onScreenDisplay.setActionBar(entries.join("   "));
    }
  }
}, 10); // Update every second


//    UTILITY
//-----------------


// Utility Definitions 
const utilityHandlers = {
  "paragonia_classes:utility_barbarian_1": {
    class_name: "§cBarbarian",
    tags: [
      "paragonia_classes:class_barbarian",
      "paragonia_classes:subclass_barbarian"
    ],
    cooldownCategory: "paragonia_classes:utility_barbarian_1",
    contexts: {
      use: VentSteam
    }
  },
  /*"paragonia_classes:utility_barbarian_2": {
    class_name: "§cBarbarian",
    tags: [
      "paragonia_classes:class_barbarian",
      "paragonia_classes:subclass_barbarian"
    ],
    cooldownCategory: "paragonia_classes:utility_barbarian_2",
    contexts: {
      useOn: BruteForceBlock,
      entityInteract: BruteForceEntity
    }
  },*/
  "paragonia_classes:utility_paladin_1": {
    class_name: "§ePaladin",
    tags: [
      "paragonia_classes:class_paladin",
      "paragonia_classes:subclass_paladin"
    ],
    cooldownCategory: "paragonia_classes:utility_paladin_1",
    contexts: {
      use: CleanseSelf,
      entityInteract: CleanseEntity
    }
  },
  "paragonia_classes:utility_paladin_2": {
    class_name: "§ePaladin",
    tags: [
      "paragonia_classes:class_paladin",
      "paragonia_classes:subclass_paladin"
    ],
    cooldownCategory: "paragonia_classes:utility_paladin_2",
    contexts: {
      use: Sanctify
    }
  },
  "paragonia_classes:utility_druid_1": {
    class_name: "§aDruid",
    tags: [
      "paragonia_classes:class_druid",
      "paragonia_classes:subclass_druid"
    ],
    cooldownCategory: "paragonia_classes:utility_druid_1",
    contexts: {
      use: Druidcraft
    }
},
};

// Handle Utility Item Use (Use)
mc.world.afterEvents.itemUse.subscribe((event) => {
  const player = event.source;
  const item = event.itemStack;
  if (!item) return;

  const itemId = item.typeId;
  const utilityData = utilityHandlers[itemId];
  if (!utilityData) return;

  const handler = utilityData.contexts?.use;
  if (!handler) return;

  const hasAccess = utilityData.tags.some(tag => player.hasTag(tag));
  if (!hasAccess) {
    player.sendMessage(
      `§7[RPG Classes] §rYou must be a ${utilityData.class_name} §rto use this Utility.`
    );
    return;
  }

  if (player.getItemCooldown(utilityData.cooldownCategory) > 0) {
    try {
      player.playSound("paragonia_classes.ability_on_cooldown");
    } catch {}
    return;
  }

  const cooldownComp = item.getComponent("minecraft:cooldown");
  if (cooldownComp) {
    cooldownComp.startCooldown(player);
  }

  handler(player, item);
});


// Handle Utility Item Use (Entity Interact)
mc.world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
  const player = event.player;
  const entity = event.target;

  if (!player || !entity) return;

  const item = player.getComponent("minecraft:equippable")?.getEquipment(mc.EquipmentSlot.Mainhand);
  if (!item) return;

  const itemId = item.typeId;
  const utilityData = utilityHandlers[itemId];
  if (!utilityData) return;

  const handler = utilityData.contexts?.entityInteract;
  if (!handler) return;

  const hasAccess = utilityData.tags.some(tag => player.hasTag(tag));
  if (!hasAccess) return;

  // Cancel the default interaction if we're handling this
  event.cancel = true;

  const dimension = player.dimension;
  const entityId = entity.id;
  const entityType = entity.typeId;
  const entityLoc = entity.location;

  if (player.getItemCooldown(utilityData.cooldownCategory) > 0) {
    mc.system.run(() => {
      try {
        player.playSound("paragonia_classes.ability_on_cooldown");
      } catch {}
    });
    return;
  }

  mc.system.run(() => {
    const refreshedItem = player.getComponent("minecraft:equippable")?.getEquipment(mc.EquipmentSlot.Mainhand);
    const cooldownComp = refreshedItem?.getComponent("minecraft:cooldown");
    //if (cooldownComp) {
    //  cooldownComp.startCooldown(player);
    //}

    const nearby = dimension.getEntities({
      location: entityLoc,
      type: entityType,
      maxDistance: 2,
    });

    const refreshedEntity = nearby.find(e => e.id === entityId);
    if (!refreshedEntity) return;

    try {
      handler(player, refreshedItem, refreshedEntity);
    } catch {}
  });
});


//      ITEMS
//-----------------

//Item Definitions
const itemHandlers = {
  "paragonia_classes:wrathberry_soup": {
    class_name: "§cBarbarian",
    tags: [
      "paragonia_classes:class_barbarian",
      "paragonia_classes:subclass_barbarian",
    ],
  },
  "paragonia_classes:rock": {
    class_name: "§cBarbarian",
    tags: [
      "paragonia_classes:class_barbarian",
      "paragonia_classes:subclass_barbarian",
    ],
  },
  "paragonia_classes:target_dummy_undead_spawn_egg": {
    class_name: "§ePaladin",
    tags: [
      "paragonia_classes:class_paladin",
      "paragonia_classes:subclass_paladin",
    ],
  },
  "paragonia_classes:radiant_orb": {
    class_name: "§ePaladin",
    tags: [
      "paragonia_classes:class_paladin",
      "paragonia_classes:subclass_paladin",
    ],
  }
};


// Handle Item Usage

const deniedMessageCooldown = new Map(); // Map<player.id, tick>

function handleItemUseDenial(player, item) {
  const itemData = itemHandlers[item.typeId];
  if (!itemData) return false;

  const hasAccess = itemData.tags.some(tag => player.hasTag(tag));
  if (hasAccess) return false;

  const lastTick = deniedMessageCooldown.get(player.id);
  const currentTick = mc.system.currentTick;
  if (lastTick !== currentTick) {
    deniedMessageCooldown.set(player.id, currentTick);
    player.sendMessage(`§7[RPG Classes] §rYou must be a ${itemData.class_name} §rto use this item.`);
  }

  return true; // usage should be cancelled
}

mc.world.beforeEvents.itemUse.subscribe(event => {
  const player = event.source;
  const item = event.itemStack;
  if (!item) return;

  if (handleItemUseDenial(player, item)) {
    event.cancel = true;
  }
});

mc.world.beforeEvents.itemUseOn.subscribe(event => {
  const player = event.source;
  const item = event.itemStack;
  if (!item) return;

  if (handleItemUseDenial(player, item)) {
    event.cancel = true;
  }
});


//    WEAPONS
//-----------------

// Weapon Definitions
const weaponHandlers = {
  "paragonia_classes:wand": {
    class_name: "§aDruid",
    handler: Wand,
    tags: [
      "paragonia_classes:class_druid",
      "paragonia_classes:subclass_druid",
    ],
  },
};

// Handle Weapon Usage
mc.world.afterEvents.itemUse.subscribe((event) => {
  const player = event.source;
  const item   = event.itemStack;
  if (!item) return;

  const data = weaponHandlers[item.typeId];
  if (!data) return;

  // invoke the Wand (or future Staff) handler
  data.handler(player, item);

  // prevent default (e.g. block placement)
  event.cancel = true;
});




/*
mc.world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
  const player = event.player;
  const entity = event.target;

  if (!player || !entity) return;

  player.sendMessage(`You interacted with ${entity.typeId}`);
});
*/


/*
mc.world.afterEvents.itemUse.subscribe((event) => {
    const item = event.itemStack;

    if (item) {
        const itemId = item.typeId;
        event.source.sendMessage(`You used ${itemId}`);
    } else {
        event.source.sendMessage(`You used your hand`);
    }
});
*/



//    CLASS TAG ITEM COOLDOWNS
//--------------------------------

// Class Item Definitions
const CLASS_ITEMS = {
  barbarian: [
    "paragonia_classes:ability_barbarian_1",
    "paragonia_classes:ability_barbarian_2",
    "paragonia_classes:ability_barbarian_3",
    "paragonia_classes:ability_barbarian_ult",
    "paragonia_classes:utility_barbarian_1",
    "paragonia_classes:utility_barbarian_2",
  ],
  paladin: [
    "paragonia_classes:ability_paladin_1",
    "paragonia_classes:ability_paladin_2",
    "paragonia_classes:ability_paladin_3",
    "paragonia_classes:ability_paladin_ult",
    "paragonia_classes:utility_paladin_1",
    "paragonia_classes:utility_paladin_2",
  ],
  druid: [
    "paragonia_classes:ability_druid_1",
    "paragonia_classes:ability_druid_2",
    "paragonia_classes:ability_druid_3",
    "paragonia_classes:ability_druid_ult",
    "paragonia_classes:utility_druid_1",
    "paragonia_classes:utility_druid_2",
  ],
  // add more classes here…
};

/** Build reverse lookup: itemId → its className */
const ITEM_TO_CLASS = new Map();
for (const [cls, items] of Object.entries(CLASS_ITEMS)) {
  for (const id of items) {
    ITEM_TO_CLASS.set(id, cls);
  }
}

//Returns true if this player should be barred from using this item,
//i.e. the item belongs to a class for which they lack both tags.
function shouldForceCooldown(itemId, player) {
  const cls = ITEM_TO_CLASS.get(itemId);
  if (!cls) return false;  // not in our tracked classes
  const hasClass    = player.hasTag(`paragonia_classes:class_${cls}`);
  const hasSubclass = player.hasTag(`paragonia_classes:subclass_${cls}`);
  return !(hasClass || hasSubclass);
}

//Apply cooldown to this item stack for that player.
function forceCooldownOnStack(stack, player) {
  if (!stack) return;
  if (shouldForceCooldown(stack.typeId, player)) {
    const cd = stack.getComponent("minecraft:cooldown");
    cd?.startCooldown(player);
  }
}

// Every tick, enforce cooldowns on any disallowed class items:
mc.system.runInterval(() => {
  for (const player of mc.world.getPlayers()) {
    const invComp = player.getComponent("minecraft:inventory");
    if (!invComp) continue;

    const container = invComp.container;
    const HOTBAR_SIZE = 9;                     // Only scan slots 0–8
    for (let i = 0; i < HOTBAR_SIZE; i++) {
      const stack = container.getItem(i);
      forceCooldownOnStack(stack, player);
    }
  }
}, 1);



