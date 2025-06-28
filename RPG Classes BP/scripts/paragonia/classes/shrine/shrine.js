import { world, system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

//     CUSTOM COMPONENT
//============================

const ClassShrineInteractComponent = {
  onPlayerInteract(event) {
    const player = event.player;
    const block = event.block;
    if (!player || !block) return;

    const currentClassTag = getPlayerClassTag(player);
    if (currentClassTag) {
      showClassHubForm(player, block, currentClassTag);
    } else {
      showClassSelectForm(player, block);
    }
  },
};

world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {
  blockComponentRegistry.registerCustomComponent(
    "paragonia:class_shrine_interact",
    ClassShrineInteractComponent
  );

  const stored = world.getDynamicProperty("paragonia:active_shrines");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      for (const key of parsed) {
        activeShrines.add(key);
      }
    } catch {}
  }
});


//    SHRINE INTERACTION
//============================

// Track active shrine locations: Set<"x,y,z">
const activeShrines = new Set();

const classTags = [
  "paragonia_classes:class_barbarian", "§cBarbarian§r",
  "paragonia_classes:class_paladin", "§ePaladin§r",
  "paragonia_classes:class_druid", "§aDruid§r",
  "paragonia_classes:class_ranger", "§qRanger§r",
  "paragonia_classes:class_martialist", "§sMartialist§r",
  "paragonia_classes:class_wizard", "§9Wizard§r",
  "paragonia_classes:class_sorcerer", "§5Sorcerer§r",
  "paragonia_classes:class_bard", "§dBard§r",
  "paragonia_classes:class_fighter", "§nFighter§r",
  "paragonia_classes:class_rogue", "§8Rogue§r",
];

const subclassTags = [
  "paragonia_classes:subclass_barbarian", "§cBarbarian§r",
  "paragonia_classes:subclass_paladin", "§ePaladin§r",
  "paragonia_classes:subclass_druid", "§aDruid§r",
  "paragonia_classes:subclass_ranger", "§qRanger§r",
  "paragonia_classes:subclass_martialist", "§sMartialist§r",
  "paragonia_classes:subclass_wizard", "§9Wizard§r",
  "paragonia_classes:subclass_sorcerer", "§5Sorcerer§r",
  "paragonia_classes:subclass_bard", "§dBard§r",
  "paragonia_classes:subclass_fighter", "§nFighter§r",
  "paragonia_classes:subclass_rogue", "§8Rogue§r",
];

const classParticleMap = {
  "paragonia_classes:class_barbarian": "paragonia_classes:shrine_fire_barbarian",
  "paragonia_classes:class_paladin": "paragonia_classes:shrine_fire_paladin",
  "paragonia_classes:class_druid": "paragonia_classes:shrine_fire_druid",
  "paragonia_classes:class_ranger": "paragonia_classes:shrine_fire_ranger",
  "paragonia_classes:class_martialist": "paragonia_classes:shrine_fire_martialist",
  "paragonia_classes:class_wizard": "paragonia_classes:shrine_fire_wizard",
  "paragonia_classes:class_sorcerer": "paragonia_classes:shrine_fire_sorcerer",
  "paragonia_classes:class_bard": "paragonia_classes:shrine_fire_bard",
  "paragonia_classes:class_fighter": "paragonia_classes:shrine_fire_fighter",
  "paragonia_classes:class_rogue": "paragonia_classes:shrine_fire_rogue",
};

function clearClassTags(player) {
  for (let i = 0; i < classTags.length; i += 2) {
    player.removeTag(classTags[i]);
  }
}

function getPlayerClassTag(player) {
  const tags = player.getTags();
  for (let i = 0; i < classTags.length; i += 2) {
    if (tags.includes(classTags[i])) return classTags[i];
  }
  return null;
}

function getPlayerSubclassTag(player) {
  const tags = player.getTags();
  for (let i = 0; i < subclassTags.length; i += 2) {
    if (tags.includes(subclassTags[i])) return subclassTags[i];
  }
  return null;
}

function getClassNameFromTag(tagArray, tag) {
  for (let i = 0; i < tagArray.length; i += 2) {
    if (tagArray[i] === tag) return tagArray[i + 1];
  }
  return "Unknown";
}

function sendClassMessage(player, message) {
  player.runCommandAsync(`tellraw @s {"rawtext":[{"text":"§7[RPG Classes]§r ${message}"}]}`);
}

function locationKey(location) {
  return `${location.x},${location.y},${location.z}`;
}

function showClassSelectForm(player, block) {
  const form = new ActionFormData()
    .title("Class Shrine")
    .body("\nSelect Class\n\n§7Choose a class to begin your journey!\n\n")
    .button("Barbarian", "textures/paragonia/classes/ui/icon_barbarian.png")
    .button("Paladin", "textures/paragonia/classes/ui/icon_paladin.png")
    .button("Druid", "textures/paragonia/classes/ui/icon_druid.png")
    .button("Ranger", "textures/paragonia/classes/ui/icon_ranger.png")
    .button("Martialist", "textures/paragonia/classes/ui/icon_martialist.png")
    .button("Wizard", "textures/paragonia/classes/ui/icon_wizard.png")
    .button("Sorcerer", "textures/paragonia/classes/ui/icon_sorcerer.png")
    .button("Bard", "textures/paragonia/classes/ui/icon_bard.png")
    .button("Fighter", "textures/paragonia/classes/ui/icon_fighter.png")
    .button("Rogue", "textures/paragonia/classes/ui/icon_rogue.png");

  form.show(player).then((response) => {
    if (response.canceled) return;

    clearClassTags(player);

    const tag = classTags[response.selection * 2];
    const name = classTags[response.selection * 2 + 1];

    player.addTag(tag);
    sendClassMessage(player, `You have chosen the path of the ${name}!`);

    const key = locationKey(block.location);
    activeShrines.add(key);
    world.setDynamicProperty("paragonia:active_shrines", JSON.stringify([...activeShrines]));
  });
}

function showSubclassSelectForm(player) {
  const form = new ActionFormData()
    .title("Class Shrine")
    .body("\nSelect Subclass\n\n§7Choose a subclass to further define your path.\n\n")
    .button("Barbarian", "textures/paragonia/classes/ui/icon_barbarian.png")
    .button("Paladin", "textures/paragonia/classes/ui/icon_paladin.png")
    .button("Druid", "textures/paragonia/classes/ui/icon_druid.png")
    .button("Ranger", "textures/paragonia/classes/ui/icon_ranger.png")
    .button("Martialist", "textures/paragonia/classes/ui/icon_martialist.png")
    .button("Wizard", "textures/paragonia/classes/ui/icon_wizard.png")
    .button("Sorcerer", "textures/paragonia/classes/ui/icon_sorcerer.png")
    .button("Bard", "textures/paragonia/classes/ui/icon_bard.png")
    .button("Fighter", "textures/paragonia/classes/ui/icon_fighter.png")
    .button("Rogue", "textures/paragonia/classes/ui/icon_rogue.png");

  form.show(player).then((response) => {
    if (response.canceled) return;

    const subclassIndex = response.selection * 2;
    const selectedSubclassTag = subclassTags[subclassIndex];
    const selectedSubclassName = subclassTags[subclassIndex + 1];
    const matchingClassTag = classTags[subclassIndex];

    if (player.getTags().includes(matchingClassTag)) {
      sendClassMessage(player, `You have already chosen ${selectedSubclassName} as your class and cannot choose it as a subclass.`);
      showSubclassSelectForm(player);
      return;
    }

    for (let i = 0; i < subclassTags.length; i += 2) {
      player.removeTag(subclassTags[i]);
    }

    player.addTag(selectedSubclassTag);
    sendClassMessage(player, `You have chosen the subclass: ${selectedSubclassName}`);
  });
}

//            HUB FORM

function showClassHubForm(player, block, currentClassTag) {
  // Get both class and subclass information
  const currentSubclassTag = getPlayerSubclassTag(player);
  
  const currentClassName = getClassNameFromTag(classTags, currentClassTag);
  const currentSubclassName = currentSubclassTag ? getClassNameFromTag(subclassTags, currentSubclassTag) : null;

  const iconPathClass = `textures/paragonia/classes/ui/icon_${currentClassName.replace(/§[a-z0-9]/gi, "").toLowerCase()}.png`;

  const iconPathSubclass = currentSubclassName && currentSubclassName !== "Unknown"
    ? `textures/paragonia/classes/ui/icon_${currentSubclassName.replace(/§[a-z0-9]/gi, "").toLowerCase()}.png`
    : "textures/paragonia/classes/ui/no_subclass.png";

  const subclassLine = currentSubclassName && currentSubclassName !== "Unknown"
    ? `§7Subclass: §r${currentSubclassName}\n`
    : "";

  const form = new ActionFormData()
    .title("Class Shrine")
    .body(`\n${player.name}\n\n§7Class: §r${currentClassName}\n${subclassLine}\n`)
    .button("Class Information", iconPathClass)
    .button("Subclass Information", iconPathSubclass)
    //.divider()
    .button("Change Class")
    .button("Change Subclass");

  form.show(player).then((response) => {
    if (response.canceled) return;

    if (response.selection === 0) {
      const classInfoMap = {
        "paragonia_classes:class_barbarian": showClassInformationBarbarian,
        "paragonia_classes:class_paladin": showClassInformationPaladin,
        "paragonia_classes:class_druid": showClassInformationDruid,
      };

      const handler = classInfoMap[currentClassTag];
      if (handler) {
        handler(player, block, currentClassTag);
      } else {
        sendClassMessage(player, "No class information available.");
      }

    } else if (response.selection === 1) {
      // Check if player has a subclass
      if (!currentSubclassTag) {
        sendClassMessage(player, "You do not have a subclass selected. Choose 'Change Subclass' to select one.");
        return;
      }

      const subclassInfoMap = {
        "paragonia_classes:subclass_barbarian": showClassInformationBarbarian,
        "paragonia_classes:subclass_paladin": showClassInformationPaladin,
        // Add more subclass handlers as needed
      };

      const handler = subclassInfoMap[currentSubclassTag];
      if (handler) {
        handler(player, block, currentSubclassTag);
      } else {
        sendClassMessage(player, "No subclass information available for your current subclass.");
      }

    } else if (response.selection === 2) {
      showClassSelectForm(player, block);
    } else if (response.selection === 3) {
      showSubclassSelectForm(player);
    }
  });
}


//          BARBARIAN

function showClassInformationBarbarian(player, block, currentClassTag) {
  const form = new ActionFormData()
    .title("Class Shrine")
    .body(`\n§cBarbarian§r\n
The Barbarian is a ferocious melee warrior who unleashes raw rage in battle, gaining strength, speed, and resilience.
§8-------------------------------\n
§7Weapon Proficiencies: §rAxes, Battle Axe\n
§7Barbarian Outfit: §rGain Strength III when you fall below 5 Health\n\n`)
    .button("Battle Cry", "textures/paragonia/classes/items/ability_barbarian_1.png")
    .button("Reckless Leap", "textures/paragonia/classes/items/ability_barbarian_2.png")
    .button("Frenzy", "textures/paragonia/classes/items/ability_barbarian_3.png")
    .button("Rage", "textures/paragonia/classes/items/ability_barbarian_ult.png")
    .button("Vent Steam", "textures/paragonia/classes/items/utility_barbarian_1.png")
    .button("Brute Force", "textures/paragonia/classes/items/utility_barbarian_2.png")
    .button("Wrathberry Soup", "textures/paragonia/classes/items/wrathberry_soup.png")
    .button("Rock", "textures/paragonia/classes/items/rock.png")
    .button("<== Back");

  form.show(player).then((response) => {
    if (response.canceled) return;

    switch (response.selection) {
      case 0:
        showClassInformationBarbarianBattleCry(player, block, currentClassTag);
        break;
      case 1:
        showClassInformationBarbarianRecklessLeap(player, block, currentClassTag);
        break;
      case 2:
        showClassInformationBarbarianFrenzy(player, block, currentClassTag);
        break;
      case 3:
        showClassInformationBarbarianRage(player, block, currentClassTag);
        break;
      case 4:
        showClassInformationBarbarianVentSteam(player, block, currentClassTag);
        break;
      case 5:
        showClassInformationBarbarianBruteForce(player, block, currentClassTag);
        break;
      case 6:
        showClassInformationBarbarianWrathberrySoup(player, block, currentClassTag);
        break;
      case 7:
        showClassInformationBarbarianRock(player, block, currentClassTag);
        break;
      case 8:
        const updatedClassTag = getPlayerClassTag(player);
        const updatedSubclassTag = getPlayerSubclassTag(player);
        showClassHubForm(player, block, updatedClassTag, updatedSubclassTag);
        break;

    }
  });
}

//Battle Cry
function showClassInformationBarbarianBattleCry(player, block, currentClassTag) {
  const form = new ActionFormData()
    .title("Class Shrine")
    .body(`\n§cBattle Cry\n
§rYour voice intimidates your foes, applying Weakness I to all nearby enemies for 3 seconds.\n
§7Type: §rAbility
§7Target: §rAOE
§7Cooldown: §r7s`)
    .button("<== Back");

  form.show(player).then((response) => { if (response.canceled) return; if (response.selection === 0) { showClassInformationBarbarian(player, block, currentClassTag); }
  });
}

//Reckless Leap
function showClassInformationBarbarianRecklessLeap(player, block, currentClassTag) {
  const form = new ActionFormData()
    .title("Class Shrine")
    .body(`\n§cReckless Leap\n
§rLeap into the air, slamming the ground as you land, dealing AOE damage and knocking enemies back.\n
§7Type: §rAbility
§7Target: §rAOE
§7Cooldown: §r10s`)
    .button("<== Back");

  form.show(player).then((response) => { if (response.canceled) return; if (response.selection === 0) { showClassInformationBarbarian(player, block, currentClassTag); }
  });
}

//Frenzy
function showClassInformationBarbarianFrenzy(player, block, currentClassTag) {
  const form = new ActionFormData()
    .title("Class Shrine")
    .body(`\n§cFrenzy\n
§rYour inner rage fuels you, causing Axe & Battle Axe attacks to heal you for a portion of the damage dealt over the next 5 seconds.\n
§7Type: §rAbility
§7Target: §rSelf
§7Cooldown: §r20s`)
    .button("<== Back");

  form.show(player).then((response) => { if (response.canceled) return; if (response.selection === 0) { showClassInformationBarbarian(player, block, currentClassTag); }
  });
}

//Rage
function showClassInformationBarbarianRage(player, block, currentClassTag) {
  const form = new ActionFormData()
    .title("Class Shrine")
    .body(`\n§cRage\n
§rEnter a state of Rage, gaining Strength II, Speed II, and Haste II for 7 seconds as you unleash your full fury on the battlefield.\n
§7Type: §rUltimate
§7Target: §rSelf`)
    .button("<== Back");

  form.show(player).then((response) => { if (response.canceled) return; if (response.selection === 0) { showClassInformationBarbarian(player, block, currentClassTag); }
  });
}

//Vent Steam
function showClassInformationBarbarianVentSteam(player, block, currentClassTag) {
  const form = new ActionFormData()
    .title("Class Shrine")
    .body(`\n§cVent Steam\n
§rRelease your Rage, restoring 1 Health for each remaining second of the effect. Also extinguishes all nearby flames, including any burning on yourself.\n
§7Type: §rUtility
§7Cooldown: §r60s`)
    .button("<== Back");

  form.show(player).then((response) => { if (response.canceled) return; if (response.selection === 0) { showClassInformationBarbarian(player, block, currentClassTag); }
  });
}

//Brute Force
function showClassInformationBarbarianBruteForce(player, block, currentClassTag) {
  const form = new ActionFormData()
    .title("Class Shrine")
    .body(`\n§cBrute Force\n
§rUnleash overwhelming strength to instantly smash a 3x3 area of blocks or send an enemy flying with a powerful knockback.\n
§7Type: §rUtility
§7Cooldown: §r60s`)
    .button("<== Back");

  form.show(player).then((response) => { if (response.canceled) return; if (response.selection === 0) { showClassInformationBarbarian(player, block, currentClassTag); }
  });
}

//Wrathberry Soup
function showClassInformationBarbarianWrathberrySoup(player, block, currentClassTag) {
  const form = new ActionFormData()
    .title("Class Shrine")
    .body(`\n§cWrathberry Soup\n
§rConsume this fiery soup to extend your active Rage by 5 seconds - only effective while Rage is already active.\n
§7Type: §rItem`)
    .button("<== Back");

  form.show(player).then((response) => { if (response.canceled) return; if (response.selection === 0) { showClassInformationBarbarian(player, block, currentClassTag); }
  });
}

//Rock
function showClassInformationBarbarianRock(player, block, currentClassTag) {
  const form = new ActionFormData()
    .title("Class Shrine")
    .body(`\n§cRock\n
§rA throwable blunt object - simple, heavy, and capable of shattering glass on impact.\n
§7Type: §rItem`)
    .button("<== Back");

  form.show(player).then((response) => { if (response.canceled) return; if (response.selection === 0) { showClassInformationBarbarian(player, block, currentClassTag); }
  });
}



//          PALADIN

function showClassInformationPaladin(player, block, currentClassTag) {
  const form = new ActionFormData()
    .title("Class Shrine")
    .body(`\n§ePaladin§r\n
The Paladin is a support class who combines melee combat with radiant magic, shielding allies, smiting foes and healing allies.
§8-------------------------------\n
§7Weapon Proficiencies: §rFlail, Mace\n
§7Paladin Outfit: §rGrants Absorption after taking 10 Damage\n\n`)
    .button("Radiant Shield", "textures/paragonia/classes/items/ability_paladin_1.png")
    .button("Restoring Light", "textures/paragonia/classes/items/ability_paladin_2.png")
    .button("Sacred Flame", "textures/paragonia/classes/items/ability_paladin_3.png")
    .button("Divine Ascension", "textures/paragonia/classes/items/ability_paladin_ult.png")
    .button("Cleanse", "textures/paragonia/classes/items/utility_paladin_1.png")
    .button("Sanctify", "textures/paragonia/classes/items/utility_paladin_2.png")
    .button("Radiant Orb", "textures/paragonia/classes/items/radiant_orb.png")
    .button("Undead Target Dummy", "textures/paragonia/classes/items/spawn_target_dummy_undead.png")
    .button("<== Back");

  form.show(player).then((response) => {
    if (response.canceled) return;

    switch (response.selection) {
      case 0:
        showClassInformationPaladinRadiantShield(player, block, currentClassTag);
        break;
      case 1:
        showClassInformationPaladinRestoringLight(player, block, currentClassTag);
        break;
      case 2:
        showClassInformationPaladinSacredFlame(player, block, currentClassTag);
        break;
      case 3:
        showClassInformationPaladinDivineAscension(player, block, currentClassTag);
        break;
      case 4:
        showClassInformationPaladinCleanse(player, block, currentClassTag);
        break;
      case 5:
        showClassInformationPaladinSanctify(player, block, currentClassTag);
        break;
      case 6:
        showClassInformationPaladinRadiantOrb(player, block, currentClassTag);
        break;
      case 7:
        showClassInformationPaladinUndeadTargetDummy(player, block, currentClassTag);
        break;
      case 8:
        const updatedClassTag = getPlayerClassTag(player);
        const updatedSubclassTag = getPlayerSubclassTag(player);
        showClassHubForm(player, block, updatedClassTag, updatedSubclassTag);
        break;
    }
  });
}

//Radiant Shield
function showClassInformationPaladinRadiantShield(player, block, currentClassTag) {
  const form = new ActionFormData()
    .title("Class Shrine")
    .body(`\n§eRadiant Shield\n
§rChannel radiant power to gain Resistance II and repel surrounding foes for the next 5 seconds.\n
§7Type: §rAbility
§7Target: §rSelf
§7Cooldown: §r10s`)
    .button("<== Back");

  form.show(player).then((response) => { if (response.canceled) return; if (response.selection === 0) { showClassInformationPaladin(player, block, currentClassTag); }
  });
}

//Restoring Light
function showClassInformationPaladinRestoringLight(player, block, currentClassTag) {
  const form = new ActionFormData()
    .title("Class Shrine")
    .body(`\n§eRestoring Light\n
§rEmit a wave of light that heals nearby allies every second for 3 seconds and empowers them, causing their attacks to deal bonus AOE damage to Undead enemies for 6 seconds.\n
§7Type: §rAbility
§7Target: §rAOE
§7Cooldown: §r12s`)
    .button("<== Back");

  form.show(player).then((response) => { if (response.canceled) return; if (response.selection === 0) { showClassInformationPaladin(player, block, currentClassTag); }
  });
}

//Sacred Flame
function showClassInformationPaladinSacredFlame(player, block, currentClassTag) {
  const form = new ActionFormData()
    .title("Class Shrine")
    .body(`\n§eSacred Flame\n
§rHurl a searing mote of radiant fire that applies Blindness for 3 seconds and reveals the target if they are Invisible.\n
§7Type: §rAbility
§7Target: §rOther
§7Cooldown: §r8s`)
    .button("<== Back");

  form.show(player).then((response) => { if (response.canceled) return; if (response.selection === 0) { showClassInformationPaladin(player, block, currentClassTag); }
  });
}

//Divine Ascension
function showClassInformationPaladinDivineAscension(player, block, currentClassTag) {
  const form = new ActionFormData()
    .title("Class Shrine")
    .body(`\n§eDivine Ascension\n
§rRise into the air on a pillar of radiant light, then crash down with divine force.\n
§7Type: §rUltimate
§7Target: §rSelf`)
    .button("<== Back");

  form.show(player).then((response) => { if (response.canceled) return; if (response.selection === 0) { showClassInformationPaladin(player, block, currentClassTag); }
  });
}

//Cleanse
function showClassInformationPaladinCleanse(player, block, currentClassTag) {
  const form = new ActionFormData()
    .title("Class Shrine")
    .body(`\n§eCleanse\n
§rRemove one negative effect from yourself and a targeted ally.\n
§7Type: §rUtility
§7Cooldown: §r60s`)
    .button("<== Back");

  form.show(player).then((response) => { if (response.canceled) return; if (response.selection === 0) { showClassInformationPaladin(player, block, currentClassTag); }
  });
}

//Sanctify
function showClassInformationPaladinSanctify(player, block, currentClassTag) {
  const form = new ActionFormData()
    .title("Class Shrine")
    .body(`\n§eCleanse\n
§rTransmute cursed or negative items on the ground into their beneficial forms.\n
Rotten Flesh --> Raw Chicken
Bone --> Bone Meal (x5)
Apple --> Golden Apple
Gunpowder --> Sugar
Redstone Dust --> Glowstone Dust
Iron Ingot --> Gold Ingot
Iron Nugget --> Gold Nugget
Magma Cream --> Slime Ball
Eye of Ender --> Ender Pearl
Coal --> Charcoal (x2)
Poisonouse Potato --> Potato
Wither Rose --> Rose Bush
Crimson Fungus --> Red Mushroom
Warped Fungus --> Brown Mushroom
Pale Oak Sapling --> Oak Sapling\n
§7Type: §rUtility
§7Cooldown: §r60s`)
    .button("<== Back");

  form.show(player).then((response) => { if (response.canceled) return; if (response.selection === 0) { showClassInformationPaladin(player, block, currentClassTag); }
  });
}

//Radiant Orb
function showClassInformationPaladinRadiantOrb(player, block, currentClassTag) {
  const form = new ActionFormData()
    .title("Class Shrine")
    .body(`\n§eRadiant Orb\n
§rConjure a luminous orb that radiates bright light, illuminating the area around it.\n
§7Type: §rItem`)
    .button("<== Back");

  form.show(player).then((response) => { if (response.canceled) return; if (response.selection === 0) { showClassInformationPaladin(player, block, currentClassTag); }
  });
}

//Undead Target Dummy
function showClassInformationPaladinUndeadTargetDummy(player, block, currentClassTag) {
  const form = new ActionFormData()
    .title("Class Shrine")
    .body(`\n§eUndead Target Dummy\n
§rA durable practice dummy - perfect for testing abilities effective against Undead.\n
§7Type: §rItem`)
    .button("<== Back");

  form.show(player).then((response) => { if (response.canceled) return; if (response.selection === 0) { showClassInformationPaladin(player, block, currentClassTag); }
  });
}


//          DRUID

function showClassInformationDruid(player, block, currentClassTag) {
  const form = new ActionFormData()
    .title("Class Shrine")
    .body(`\n§aDruid§r\n
The Druid is a nature-wielding spellcaster who harnesses the power of plants and animals to heal, hinder, and thrive in harmony with the wild.
§8-------------------------------\n
§7Weapon Proficiencies: §rWand, Staff\n
§7Barbarian Outfit: §rGrants Regeneration while near flowers\n\n`)
    .button("Entangle", "textures/paragonia/classes/items/ability_druid_1.png")
    .button("Barkskin", "textures/paragonia/classes/items/ability_druid_2.png")
    .button("Soothing Spores", "textures/paragonia/classes/items/ability_druid_3.png")
    .button("Wild Shape", "textures/paragonia/classes/items/ability_druid_ult.png")
    .button("Druidcraft", "textures/paragonia/classes/items/utility_druid_1.png")
    .button("Speak With Animals", "textures/paragonia/classes/items/utility_druid_2.png")
    .button("Healing Salve", "textures/paragonia/classes/items/healing_salve.png")
    .button("Firefly Lantern", "textures/paragonia/classes/items/firefly_lamp.png")
    .button("<== Back");

  form.show(player).then((response) => {
    if (response.canceled) return;

    switch (response.selection) {
      case 0:
        showClassInformationDruidEntangle(player, block, currentClassTag);
        break;
      case 1:
        showClassInformationDruidBarkskin(player, block, currentClassTag);
        break;
      case 2:
        showClassInformationDruidSoothingSpores(player, block, currentClassTag);
        break;
      case 3:
        showClassInformationDruidWildShape(player, block, currentClassTag);
        break;
      case 4:
        showClassInformationDruidDruidcraft(player, block, currentClassTag);
        break;
      case 5:
        showClassInformationDruidSpeakWithAnimals(player, block, currentClassTag);
        break;
      case 6:
        showClassInformationDruidHealingSalve(player, block, currentClassTag);
        break;
      case 7:
        showClassInformationDruidFireflyLantern(player, block, currentClassTag);
        break;
      case 8:
        const updatedClassTag = getPlayerClassTag(player);
        const updatedSubclassTag = getPlayerSubclassTag(player);
        showClassHubForm(player, block, updatedClassTag, updatedSubclassTag);
        break;

    }
  });
}

//Entangle
function showClassInformationDruidEntangle(player, block, currentClassTag) {
  const form = new ActionFormData()
    .title("Class Shrine")
    .body(`\n§aEntangle\n
§rRoots erupt from the ground, snaring an enemy's feet, rendering them immobile for 3 seconds.\n
§7Type: §rAbility
§7Target: §rOther
§7Cooldown: §r8s`)
    .button("<== Back");

  form.show(player).then((response) => { if (response.canceled) return; if (response.selection === 0) { showClassInformationDruid(player, block, currentClassTag); }
  });
}

//Barkskin
function showClassInformationDruidBarkskin(player, block, currentClassTag) {
  const form = new ActionFormData()
    .title("Class Shrine")
    .body(`\n§aBarkskin\n
§rIf wearing the full Druid Outfit, grow protective bark armor for 5 seconds, reducing incoming damage as nature shields you.\n
§7Type: §rAbility
§7Target: §rSelf
§7Cooldown: §r15s`)
    .button("<== Back");

  form.show(player).then((response) => { if (response.canceled) return; if (response.selection === 0) { showClassInformationDruid(player, block, currentClassTag); }
  });
}

//Soothing Spore
function showClassInformationDruidSoothingSpores(player, block, currentClassTag) {
  const form = new ActionFormData()
    .title("Class Shrine")
    .body(`\n§aSoothing Spores\n
§rMushrooms sprout up in a 3x5 area, releasing gentle spores that heal creatures they touch and grant Regeneration II for 3 seconds.\n
§7Type: §rAbility
§7Target: §rAOE
§7Cooldown: §r12s`)
    .button("<== Back");

  form.show(player).then((response) => { if (response.canceled) return; if (response.selection === 0) { showClassInformationDruid(player, block, currentClassTag); }
  });
}

//Wild Shape
function showClassInformationDruidWildShape(player, block, currentClassTag) {
  const form = new ActionFormData()
    .title("Class Shrine")
    .body(`\n§aWild Shape\n
§rTransform into a powerful Bear for 10 seconds, gaining Health Boost and Speed II. 
While transformed, this ability becomes §aClaw Slash§r, allowing you to swipe your claws at enemies in front of you, dealing AOE damage.\n
§7Type: §rUltimate
§7Target: §rSelf`)
    .button("<== Back");

  form.show(player).then((response) => { if (response.canceled) return; if (response.selection === 0) { showClassInformationDruid(player, block, currentClassTag); }
  });
}

//Druidcraft
function showClassInformationDruidDruidcraft(player, block, currentClassTag) {
  const form = new ActionFormData()
    .title("Class Shrine")
    .body(`\n§aDruidcraft\n
§rChannel your Druidic nature magic to instantly grow all crops within a 3x3 area to full maturity.\n
§7Type: §rUtility
§7Cooldown: §r60s`)
    .button("<== Back");

  form.show(player).then((response) => { if (response.canceled) return; if (response.selection === 0) { showClassInformationDruid(player, block, currentClassTag); }
  });
}

//Speak With Animals
function showClassInformationDruidSpeakWithAnimals(player, block, currentClassTag) {
  const form = new ActionFormData()
    .title("Class Shrine")
    .body(`\n§aSpeak With Animals\n
§rGive an affectionate pet to an animal, and gain the ability to understand what it's saying.\n
§7Type: §rUtility
§7Cooldown: §r60s`)
    .button("<== Back");

  form.show(player).then((response) => { if (response.canceled) return; if (response.selection === 0) { showClassInformationDruid(player, block, currentClassTag); }
  });
}

//Healing Salve
function showClassInformationDruidHealingSalve(player, block, currentClassTag) {
  const form = new ActionFormData()
    .title("Class Shrine")
    .body(`\n§aHealing Salve\n
§rA soothing herbal remedy - consume to immediately restore 2 health and gain an effect based on the mushroom used to craft it.\n
Red Mushroom = Regeneration
Brown Mushroom = Resistance
Crimson Fungus = Fire Resistance
Warped Fungus = Haste\n
§7Type: §rItem`)
    .button("<== Back");

  form.show(player).then((response) => { if (response.canceled) return; if (response.selection === 0) { showClassInformationDruid(player, block, currentClassTag); }
  });
}

//Firefly Lantern
function showClassInformationDruidFireflyLantern(player, block, currentClassTag) {
  const form = new ActionFormData()
    .title("Class Shrine")
    .body(`\n§aFirefly Lamp\n
§rA swarm of captured fireflies that emits a gentle, dynamic light - can be held in the offhand.\n
§7Type: §rItem`)
    .button("<== Back");

  form.show(player).then((response) => { if (response.canceled) return; if (response.selection === 0) { showClassInformationDruid(player, block, currentClassTag); }
  });
}



//     PARTICLE SPAWNING
//============================

let hasStartedInterval = false;

world.afterEvents.playerSpawn.subscribe(() => {
  if (hasStartedInterval) return;
  hasStartedInterval = true;

  system.runInterval(() => {
    const dimension = world.getDimension("overworld");

    for (const key of activeShrines) {
      const [x, y, z] = key.split(",").map(Number);
      const block = dimension.getBlock({ x, y, z });

      if (!block || block.typeId !== "paragonia_classes:shrine_class") {
        activeShrines.delete(key);
        continue;
      }

      for (const p of world.getPlayers()) {
        if (!p.isValid()) continue;

        try {
          const tags = p.getTags();
          let classTag = null;
          for (let i = 0; i < classTags.length; i += 2) {
            if (tags.includes(classTags[i])) {
              classTag = classTags[i];
              break;
            }
          }

          const particleId = classParticleMap[classTag];
          if (particleId) {
            p.spawnParticle(particleId, {
              x: x + 0.5,
              y: y + 1.2,
              z: z + 0.5,
            });
          }
        } catch {}
      }
    }
  }, 10);
});