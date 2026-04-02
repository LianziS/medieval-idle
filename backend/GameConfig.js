/**
 * GameConfig.js - 游戏配置数据
 * 所有游戏数值配置集中管理，前后端共用
 */

const CONFIG = {
    resources: ['gold', 'wood', 'stone', 'herb'],
    
    // 建筑配置
    buildings: [
        { 
            id: 'tent', 
            name: '简陋帐篷', 
            icon: '⛺', 
            baseCost: { pine: 1 },
            production: {}, 
            unlockReq: null,
            maxLevel: 5,
            levelNames: ['简陋帐篷', '炉火营地', '榫卯工房', '织造小筑', '秘药阁楼', '丰饶山庄']
        },
        { id: 'lumber', name: '伐木场', icon: '🪓', baseCost: { wood: 50, stone: 20 }, production: { wood: 1 }, unlockReq: null },
        { id: 'mine', name: '矿洞', icon: '⛏️', baseCost: { wood: 100, stone: 50 }, production: { stone: 1 }, unlockReq: { tentLevel: 0 } },
        { id: 'smithy', name: '锻造屋', icon: '🔨', baseCost: { wood: 200, stone: 150 }, production: {}, unlockReq: { tentLevel: 1 } },
        { id: 'workshop', name: '木工坊', icon: '🪵', baseCost: { wood: 300, stone: 100 }, production: {}, unlockReq: { tentLevel: 2 } },
        { id: 'tailor', name: '裁缝铺', icon: '🧵', baseCost: { wood: 250, stone: 100, gold: 500 }, production: {}, unlockReq: { tentLevel: 3 } },
        { id: 'alchemy', name: '炼金小屋', icon: '⚗️', baseCost: { wood: 300, stone: 200, herb: 100 }, production: {}, unlockReq: { tentLevel: 4 } },
        { id: 'brewery', name: '酿酒坊', icon: '🍺', baseCost: { wood: 200, stone: 100, gold: 300 }, production: {}, unlockReq: { tentLevel: 3 } },
        { id: 'farm', name: '草药园', icon: '🌿', baseCost: { wood: 150, stone: 50 }, production: { herb: 1 }, unlockReq: { tentLevel: 0 } }
    ],
    
    // 树木配置
    trees: [
        { id: 'pine', name: '青杉', icon: '🌲', reqLevel: 1, duration: 6000, drop: '青杉木', dropIcon: '🪵', dropId: 'pine', exp: 5 },
        { id: 'iron_birch', name: '铁桦', icon: '🌳', reqLevel: 10, duration: 8000, drop: '铁桦木', dropIcon: '🪵', dropId: 'iron_birch', exp: 7.5 },
        { id: 'wind_tree', name: '风啸树', icon: '🌴', reqLevel: 20, duration: 10000, drop: '风啸木', dropIcon: '🪵', dropId: 'wind_tree', exp: 12.5 },
        { id: 'flame_tree', name: '焰心树', icon: '🔥', reqLevel: 35, duration: 12000, drop: '焰心木', dropIcon: '🪵', dropId: 'flame_tree', exp: 20 },
        { id: 'frost_maple', name: '霜叶枫', icon: '❄️', reqLevel: 50, duration: 14000, drop: '霜叶枫木', dropIcon: '🪵', dropId: 'frost_maple', exp: 30 },
        { id: 'thunder_tree', name: '雷鸣树', icon: '⚡', reqLevel: 65, duration: 16000, drop: '雷鸣木', dropIcon: '🪵', dropId: 'thunder_tree', exp: 40 },
        { id: 'ancient_oak', name: '古橡', icon: '🌳', reqLevel: 80, duration: 18000, drop: '古橡木', dropIcon: '🪵', dropId: 'ancient_oak', exp: 55 },
        { id: 'world_tree', name: '世界树', icon: '🌍', reqLevel: 95, duration: 30000, drop: '世界树枝', dropIcon: '🌿', dropId: 'world_tree', exp: 73 }
    ],
    
    // 矿石配置
    ores: [
        { id: 'cyan_ore', name: '青闪矿', icon: '💎', reqLevel: 1, duration: 6000, drop: '青闪石', dropIcon: '💎', dropId: 'cyan_ore', exp: 5 },
        { id: 'red_iron', name: '赤铁矿', icon: '🔴', reqLevel: 10, duration: 8000, drop: '赤铁石', dropIcon: '🪨', dropId: 'red_iron', exp: 7.5 },
        { id: 'feather_ore', name: '羽石矿', icon: '🪶', reqLevel: 20, duration: 10000, drop: '羽石', dropIcon: '🪨', dropId: 'feather_ore', exp: 12.5 },
        { id: 'hell_ore', name: '白鸠矿', icon: '⚪', reqLevel: 35, duration: 12000, drop: '白鸠石', dropIcon: '🪨', dropId: 'hell_ore', exp: 20 },
        { id: 'white_ore', name: '狱炎矿', icon: '🔥', reqLevel: 50, duration: 14000, drop: '狱炎石', dropIcon: '🪨', dropId: 'white_ore', exp: 30 },
        { id: 'thunder_ore', name: '雷鸣矿', icon: '⚡', reqLevel: 65, duration: 16000, drop: '雷鸣石', dropIcon: '🪨', dropId: 'thunder_ore', exp: 40 },
        { id: 'brilliant', name: '曜光结晶', icon: '✨', reqLevel: 80, duration: 18000, drop: '璀璨原石', dropIcon: '💎', dropId: 'brilliant', exp: 55 },
        { id: 'star_ore', name: '月华结晶', icon: '⭐', reqLevel: 95, duration: 30000, drop: '星辉原石', dropIcon: '💎', dropId: 'star_ore', exp: 73 }
    ],
    
    // 采集地点配置
    gatheringLocations: [
        {
            id: 'char_border', name: '夏尔边境', icon: '🌲', reqLevel: 1, duration: 6000, exp: 5,
            items: [
                { id: 'sweet_berry', name: '甜浆果', icon: '🫐', exp: 2, probability: 0.3 },
                { id: 'wild_mint', name: '野薄荷', icon: '🌿', exp: 2, probability: 0.3 },
                { id: 'honey', name: '蜂蜜', icon: '🍯', exp: 3, probability: 0.2 },
                { id: 'blood_rose', name: '血蔷薇', icon: '🌹', exp: 3, probability: 0.15 },
                { id: 'jute', name: '黄麻', icon: '🌾', exp: 2, probability: 0.25 }
            ]
        },
        {
            id: 'wolf_forest', name: '狼林边缘', icon: '🐺', reqLevel: 10, duration: 8000, exp: 7.5,
            items: [
                { id: 'wheat', name: '小麦', icon: '🌾', exp: 3, probability: 0.3 },
                { id: 'pine_needle', name: '松针', icon: '🌲', exp: 3, probability: 0.25 },
                { id: 'star_dew_herb', name: '星露草', icon: '🌿', exp: 4, probability: 0.2 },
                { id: 'flax', name: '亚麻', icon: '🧶', exp: 3, probability: 0.25 },
                { id: 'feather', name: '羽毛', icon: '🪶', exp: 4, probability: 0.15 }
            ]
        },
        {
            id: 'riverland', name: '河间地带', icon: '🌊', reqLevel: 20, duration: 10000, exp: 12.5,
            items: [
                { id: 'hops', name: '啤酒花', icon: '🌿', exp: 5, probability: 0.3 },
                { id: 'vanilla', name: '香草', icon: '🌱', exp: 5, probability: 0.25 },
                { id: 'blossom_honey', name: '百花蜜', icon: '🍯', exp: 6, probability: 0.2 },
                { id: 'red_serpent_fruit', name: '赤炼蛇果', icon: '🍎', exp: 6, probability: 0.15 },
                { id: 'jade_feather', name: '翡翠羽', icon: '🦜', exp: 7, probability: 0.1 }
            ]
        },
        {
            id: 'arin_valley', name: '艾林谷地', icon: '🍃', reqLevel: 35, duration: 12000, exp: 20,
            items: [
                { id: 'apple', name: '苹果', icon: '🍎', exp: 8, probability: 0.3 },
                { id: 'sage', name: '鼠尾草', icon: '🌿', exp: 8, probability: 0.25 },
                { id: 'moonlight_mushroom', name: '月光菇', icon: '🍄', exp: 10, probability: 0.2 },
                { id: 'wool', name: '羊毛', icon: '🧶', exp: 9, probability: 0.25 },
                { id: 'falcon_tail_feather', name: '猎隼的尾羽', icon: '🦅', exp: 12, probability: 0.1 }
            ]
        },
        {
            id: 'lorhan_plain', name: '洛汗平原', icon: '🌾', reqLevel: 50, duration: 15000, exp: 30,
            items: [
                { id: 'grape', name: '葡萄', icon: '🍇', exp: 12, probability: 0.3 },
                { id: 'chili', name: '辣椒', icon: '🌶️', exp: 12, probability: 0.25 },
                { id: 'moonlight_honey', name: '月光蜜', icon: '🍯', exp: 15, probability: 0.2 },
                { id: 'silk', name: '蚕丝', icon: '🧵', exp: 14, probability: 0.2 },
                { id: 'soul_herb', name: '灵魂草', icon: '🌿', exp: 18, probability: 0.1 }
            ]
        },
        {
            id: 'dorn_border', name: '多恩边疆', icon: '🏰', reqLevel: 65, duration: 18000, exp: 40,
            items: [
                { id: 'rye', name: '黑麦', icon: '🌾', exp: 16, probability: 0.3 },
                { id: 'mist_flower', name: '雾菱花', icon: '💠', exp: 18, probability: 0.25 },
                { id: 'wild_heart', name: '原野之心', icon: '💚', exp: 22, probability: 0.15 },
                { id: 'wind_velvet', name: '风语绒', icon: '🧶', exp: 20, probability: 0.2 },
                { id: 'rainbow_feather', name: '虹羽', icon: '🌈', exp: 25, probability: 0.1 }
            ]
        },
        {
            id: 'sigh_canyon', name: '叹息峡谷', icon: '🏔️', reqLevel: 80, duration: 22000, exp: 55,
            items: [
                { id: 'mist_fruit', name: '雾果', icon: '🍑', exp: 22, probability: 0.3 },
                { id: 'rock_rose_honey', name: '岩玫瑰蜜', icon: '🍯', exp: 28, probability: 0.25 },
                { id: 'bewitch_berry', name: '迷心浆果', icon: '🫐', exp: 30, probability: 0.2 },
                { id: 'harpy_feather', name: '鹰身人的羽毛', icon: '🦅', exp: 35, probability: 0.15 }
            ]
        },
        {
            id: 'dragon_ridge', name: '龙脊山脉', icon: '🐉', reqLevel: 95, duration: 30000, exp: 73,
            items: [
                { id: 'dragon_blood_fruit', name: '龙血果', icon: '🐉', exp: 30, probability: 0.3 },
                { id: 'four_leaf_clover', name: '四叶草', icon: '🍀', exp: 35, probability: 0.25 },
                { id: 'life_fiber', name: '生命纤维', icon: '🧵', exp: 40, probability: 0.2 },
                { id: 'star_blossom', name: '星辰花', icon: '⭐', exp: 45, probability: 0.15 }
            ]
        }
    ],
    
    // 木板配置
    woodPlanks: [
        { id: 'pine_plank', name: '青杉木板', icon: '🪵', reqLevel: 1, duration: 6000, exp: 5, materials: { pine: 2 } },
        { id: 'iron_birch_plank', name: '铁桦木板', icon: '🪵', reqLevel: 10, duration: 8000, exp: 7.5, materials: { iron_birch: 2 } },
        { id: 'wind_tree_plank', name: '风啸木板', icon: '🪵', reqLevel: 20, duration: 10000, exp: 12.5, materials: { wind_tree: 2 } },
        { id: 'flame_tree_plank', name: '焰心木板', icon: '🪵', reqLevel: 35, duration: 12000, exp: 20, materials: { flame_tree: 2 } },
        { id: 'frost_maple_plank', name: '霜叶木板', icon: '🪵', reqLevel: 50, duration: 14000, exp: 30, materials: { frost_maple: 2 } },
        { id: 'thunder_tree_plank', name: '雷鸣木板', icon: '🪵', reqLevel: 65, duration: 16000, exp: 40, materials: { thunder_tree: 2 } },
        { id: 'ancient_oak_plank', name: '古橡木板', icon: '🪵', reqLevel: 80, duration: 18000, exp: 55, materials: { ancient_oak: 2 } },
        { id: 'world_tree_plank', name: '世界木板', icon: '🪵', reqLevel: 95, duration: 30000, exp: 73, materials: { world_tree: 2 } }
    ],
    
    // 矿锭配置
    ingots: [
        { id: 'cyan_ingot', name: '青闪铁锭', icon: '🔩', reqLevel: 1, duration: 6000, exp: 5, materials: { cyan_ore: 2 } },
        { id: 'red_copper_ingot', name: '赤铜锭', icon: '🥉', reqLevel: 10, duration: 8000, exp: 7.5, materials: { red_iron: 2 } },
        { id: 'feather_ingot', name: '轻羽锭', icon: '🪶', reqLevel: 20, duration: 10000, exp: 12.5, materials: { feather_ore: 2 } },
        { id: 'white_silver_ingot', name: '白银锭', icon: '🪙', reqLevel: 35, duration: 12000, exp: 20, materials: { hell_ore: 2 } },
        { id: 'hell_steel_ingot', name: '狱炎钢', icon: '🔥', reqLevel: 50, duration: 14000, exp: 30, materials: { white_ore: 2 } },
        { id: 'thunder_steel_ingot', name: '雷鸣钢', icon: '⚡', reqLevel: 65, duration: 16000, exp: 40, materials: { thunder_ore: 2 } },
        { id: 'brilliant_crystal', name: '璀璨水晶', icon: '💎', reqLevel: 80, duration: 18000, exp: 55, materials: { brilliant: 2 } },
        { id: 'star_crystal', name: '星辉水晶', icon: '✨', reqLevel: 95, duration: 30000, exp: 73, materials: { star_ore: 2 } }
    ],
    
    // 布料配置
    fabrics: [
        { id: 'jute_cloth', name: '黄麻布料', icon: '🧵', reqLevel: 1, duration: 6000, exp: 5, materials: { jute: 2 } },
        { id: 'linen_cloth', name: '亚麻布料', icon: '🧶', reqLevel: 15, duration: 8000, exp: 10, materials: { flax: 2 } },
        { id: 'wool_cloth', name: '羊毛布料', icon: '🧶', reqLevel: 35, duration: 12000, exp: 20, materials: { wool: 2 } },
        { id: 'silk_cloth', name: '丝绸布料', icon: '🎀', reqLevel: 55, duration: 15000, exp: 32.5, materials: { silk: 2 } },
        { id: 'wind_silk', name: '风语绸', icon: '💨', reqLevel: 75, duration: 18000, exp: 50, materials: { wind_velvet: 2 } },
        { id: 'dream_cloth', name: '梦幻布料', icon: '✨', reqLevel: 95, duration: 25000, exp: 72.5, materials: { life_fiber: 2 } }
    ],
    
    // 药水配置
    potions: [
        { id: 'hp_potion_1', name: '素级生命药水', icon: '🧪', reqLevel: 1, duration: 6000, exp: 4, materials: { sweet_berry: 1, blood_rose: 1, honey: 4 } },
        { id: 'mp_potion_1', name: '素级魔法药水', icon: '💧', reqLevel: 1, duration: 6000, exp: 4, materials: { sweet_berry: 1, star_dew_herb: 1, honey: 4 } },
        { id: 'hp_potion_2', name: '良级生命药水', icon: '🧪', reqLevel: 10, duration: 6750, exp: 8, materials: { wheat: 1, blood_rose: 1, honey: 4 } },
        { id: 'mp_potion_2', name: '良级魔法药水', icon: '💧', reqLevel: 10, duration: 6750, exp: 8, materials: { wheat: 1, star_dew_herb: 1, honey: 4 } },
        { id: 'hp_potion_3', name: '中级生命药水', icon: '🧪', reqLevel: 20, duration: 7500, exp: 12, materials: { hops: 1, red_serpent_fruit: 1, blossom_honey: 4 } },
        { id: 'mp_potion_3', name: '中级魔法药水', icon: '💧', reqLevel: 20, duration: 7500, exp: 12, materials: { hops: 1, moonlight_mushroom: 1, blossom_honey: 4 } },
        { id: 'hp_potion_4', name: '优级生命药水', icon: '🧪', reqLevel: 35, duration: 8250, exp: 18, materials: { apple: 1, red_serpent_fruit: 1, blossom_honey: 4 } },
        { id: 'mp_potion_4', name: '优级魔法药水', icon: '💧', reqLevel: 35, duration: 8250, exp: 18, materials: { apple: 1, moonlight_mushroom: 1, blossom_honey: 4 } }
    ],
    
    // 酒类配置
    brews: [
        { id: 'woodcutting_wine', name: '伐木甜酒', icon: '🍷', reqLevel: 1, duration: 8000, exp: 6, materials: { sweet_berry: 1, mint_essence: 1, wood_token: 1 } },
        { id: 'gathering_ale', name: '采集麦酒', icon: '🍺', reqLevel: 4, duration: 8000, exp: 9, materials: { wheat: 1, mint_essence: 1, gathering_token: 1 } },
        { id: 'mining_wine', name: '挖矿甜酒', icon: '🍷', reqLevel: 7, duration: 9000, exp: 12, materials: { sweet_berry: 1, pine_essence: 1, mining_token: 1 } },
        { id: 'forging_ale', name: '锻造麦酒', icon: '🍺', reqLevel: 10, duration: 9000, exp: 15, materials: { wheat: 1, pine_essence: 1, forging_token: 1 } },
        { id: 'crafting_ale', name: '制作麦酒', icon: '🍺', reqLevel: 14, duration: 10000, exp: 18, materials: { wheat: 1, vanilla_essence: 1, crafting_token: 1 } },
        { id: 'tailoring_beer', name: '缝制啤酒', icon: '🍻', reqLevel: 17, duration: 10000, exp: 21, materials: { hops: 1, vanilla_essence: 1, tailoring_token: 1 } },
        { id: 'alchemy_beer', name: '炼金啤酒', icon: '🍻', reqLevel: 20, duration: 10000, exp: 24, materials: { hops: 1, sage_essence: 1, alchemy_token: 1 } },
        { id: 'brewing_wine', name: '酿造果酒', icon: '🍷', reqLevel: 20, duration: 10000, exp: 24, materials: { apple: 1, sage_essence: 1, brewing_token: 1 } }
    ],
    
    // 精华配置
    essences: [
        { id: 'mint_essence', name: '薄荷精华', icon: '🌿', reqLevel: 1, duration: 5000, exp: 3, materials: { wild_mint: 3 } },
        { id: 'pine_essence', name: '松针精华', icon: '🌲', reqLevel: 5, duration: 6000, exp: 5, materials: { pine_needle: 3 } },
        { id: 'vanilla_essence', name: '香草精华', icon: '🌱', reqLevel: 10, duration: 7000, exp: 8, materials: { vanilla: 3 } },
        { id: 'sage_essence', name: '鼠尾草精华', icon: '🌿', reqLevel: 15, duration: 8000, exp: 12, materials: { sage: 3 } }
    ],
    
    // 装备槽位配置
    equipmentSlots: [
        { id: 'axe', name: '斧头', icon: '🪓', skill: 'woodcutting' },
        { id: 'pickaxe', name: '镐子', icon: '⛏️', skill: 'mining' },
        { id: 'chisel', name: '凿子', icon: '🔨', skill: 'crafting' },
        { id: 'needle', name: '针', icon: '🪡', skill: 'tailoring' },
        { id: 'scythe', name: '镰刀', icon: '🗡️', skill: 'gathering' },
        { id: 'hammer', name: '锤子', icon: '🔨', skill: 'forging' },
        { id: 'tongs', name: '小桶', icon: '🪣', skill: 'brewing' },
        { id: 'rod', name: '搅拌棒', icon: '🥄', skill: 'alchemy' }
    ],
    
    // 工具配置（简化版）
    tools: {
        axes: [
            { id: 'cyan_axe', name: '青闪斧', icon: '🪓', speedBonus: 0.15, reqEquipLevel: 1, index: 0 },
            { id: 'red_axe', name: '赤铁斧', icon: '🪓', speedBonus: 0.225, reqEquipLevel: 10, index: 1 },
            { id: 'feather_axe', name: '羽斧', icon: '🪓', speedBonus: 0.30, reqEquipLevel: 20, index: 2 },
            { id: 'white_axe', name: '白银斧', icon: '🪓', speedBonus: 0.45, reqEquipLevel: 35, index: 3 }
        ],
        pickaxes: [
            { id: 'cyan_pickaxe', name: '青闪镐', icon: '⛏️', speedBonus: 0.15, reqEquipLevel: 1, index: 0 },
            { id: 'red_pickaxe', name: '赤铁镐', icon: '⛏️', speedBonus: 0.225, reqEquipLevel: 10, index: 1 },
            { id: 'feather_pickaxe', name: '羽镐', icon: '⛏️', speedBonus: 0.30, reqEquipLevel: 20, index: 2 }
        ],
        chisels: [
            { id: 'cyan_chisel', name: '青闪凿子', icon: '🔨', speedBonus: 0.15, reqEquipLevel: 1, index: 0 }
        ],
        needles: [
            { id: 'cyan_needle', name: '青闪针', icon: '🪡', speedBonus: 0.15, reqEquipLevel: 1, index: 0 }
        ],
        scythes: [
            { id: 'cyan_scythe', name: '青闪镰刀', icon: '🗡️', speedBonus: 0.15, reqEquipLevel: 1, index: 0 }
        ],
        hammers: [
            { id: 'cyan_hammer', name: '青铁锤', icon: '🔨', speedBonus: 0.15, reqEquipLevel: 1, index: 0 }
        ],
        tongs: [
            { id: 'cyan_tongs', name: '青闪小桶', icon: '🪣', speedBonus: 0.15, reqEquipLevel: 1, index: 0 }
        ],
        rods: [
            { id: 'cyan_rod', name: '青闪搅拌棒', icon: '🥄', speedBonus: 0.15, reqEquipLevel: 1, index: 0 }
        ]
    },
    
    // 工具锻造材料配置
    toolCraftingMaterials: {
        axes: [
            { ore: 10, plank: 6, prevTool: null },
            { ore: 16, plank: 10, prevTool: 'cyan_axe' },
            { ore: 22, plank: 14, prevTool: 'red_axe' },
            { ore: 34, plank: 22, prevTool: 'feather_axe' }
        ],
        pickaxes: [
            { ore: 10, plank: 6, prevTool: null },
            { ore: 16, plank: 10, prevTool: 'cyan_pickaxe' },
            { ore: 22, plank: 14, prevTool: 'red_pickaxe' }
        ],
        chisels: [
            { ore: 10, plank: 6, prevTool: null }
        ],
        needles: [
            { ore: 10, plank: 6, prevTool: null }
        ],
        scythes: [
            { ore: 10, plank: 6, prevTool: null }
        ],
        hammers: [
            { ingot: 10, prevTool: null }
        ],
        tongs: [
            { ore: 10, plank: 6, prevTool: null }
        ],
        rods: [
            { ore: 10, plank: 6, prevTool: null }
        ]
    },
    
    // 矿锭到工具类型的映射（锻造工具需要矿锭）
    ingotToToolType: {
        'cyan_ingot': { toolTypes: ['axes', 'pickaxes', 'chisels', 'needles', 'scythes', 'tongs', 'rods'], name: '青闪' },
        'red_copper_ingot': { toolTypes: ['axes', 'pickaxes', 'chisels', 'needles', 'scythes', 'tongs', 'rods'], name: '赤铁' }
    },
    
    // 木板类型映射
    plankTypes: ['pine_plank', 'iron_birch_plank', 'wind_tree_plank', 'flame_tree_plank'],
    
    // 资源出售价格
    resourcePrices: {
        wood: 2,
        stone: 3,
        herb: 5
    },
    
    // 商人配置
    merchants: [
        { 
            id: 'architect', 
            name: '建筑师', 
            title: '建筑大师',
            avatar: '🏗️', 
            favorability: 0,
            goods: [
                { id: 'architect_scroll', name: '建筑大师卷轴', icon: '📜', price: 1000, currency: 'gold' }
            ],
            quests: [
                { id: 'architect_quest_1', name: '木材收集', desc: '提交 20 木材', reward: { gold: 200, favorability: 0.5 }, requirement: { type: 'WOOD', id: 'pine', count: 20 } }
            ]
        },
        { 
            id: 'carpenter', 
            name: '木匠', 
            title: '木工大师',
            avatar: '🪚', 
            favorability: 0,
            goods: [
                { id: 'carpenter_scroll', name: '木工大师卷轴', icon: '📜', price: 1000, currency: 'gold' }
            ],
            quests: [
                { id: 'carpenter_quest_1', name: '木板订单', desc: '提交 10 木板', reward: { gold: 150, favorability: 0.5 }, requirement: { type: 'PLANK', id: 'pine_plank', count: 10 } }
            ]
        },
        { 
            id: 'armorsmith', 
            name: '铸甲师', 
            title: '锻造大师',
            avatar: '⚒️', 
            favorability: 0,
            goods: [
                { id: 'armorsmith_scroll', name: '锻造大师卷轴', icon: '📜', price: 1000, currency: 'gold' }
            ],
            quests: [
                { id: 'armorsmith_quest_1', name: '矿锭订单', desc: '提交 10 矿锭', reward: { gold: 150, favorability: 0.5 }, requirement: { type: 'INGOT', id: 'cyan_ingot', count: 10 } }
            ]
        },
        { 
            id: 'tailor', 
            name: '缝缀师', 
            title: '裁缝大师',
            avatar: '🧵', 
            favorability: 0,
            goods: [
                { id: 'tailor_scroll', name: '裁缝大师卷轴', icon: '📜', price: 1000, currency: 'gold' }
            ],
            quests: [
                { id: 'tailor_quest_1', name: '布料订单', desc: '提交 10 布料', reward: { gold: 120, favorability: 0.5 }, requirement: { type: 'FABRIC', id: 'jute_cloth', count: 10 } }
            ]
        },
        { 
            id: 'alchemist', 
            name: '药剂师', 
            title: '炼金大师',
            avatar: '⚗️', 
            favorability: 0,
            goods: [
                { id: 'alchemist_scroll', name: '药剂大师卷轴', icon: '📜', price: 1000, currency: 'gold' }
            ],
            quests: [
                { id: 'alchemist_quest_1', name: '甜浆果收集', desc: '提交 10 甜浆果', reward: { gold: 100, favorability: 0.5 }, requirement: { type: 'GATHERING', id: 'sweet_berry', count: 10 } }
            ]
        },
        { 
            id: 'tavern', 
            name: '酒馆', 
            title: '美酒佳酿',
            avatar: '🍺', 
            favorability: 0,
            goods: [
                { id: 'tavern_scroll', name: '酿酒秘方', icon: '📜', price: 1000, currency: 'gold' }
            ],
            quests: [
                { id: 'tavern_quest_1', name: '酿造材料', desc: '提交 10 蜂蜜', reward: { gold: 180, favorability: 0.5 }, requirement: { type: 'GATHERING', id: 'honey', count: 10 } }
            ]
        }
    ],
    
    // 代币获取概率配置
    tokenDropRates: {
        standard: [0.017, 0.024, 0.037, 0.053, 0.071, 0.092, 0.149, 0.210],
        tool: [0.017, 0.033, 0.061, 0.110, 0.196, 0.343, 0.590, 0.990],
        tailoring: [0.017, 0.032, 0.053, 0.078, 0.126, 0.195],
        brewing: [0.022, 0.023, 0.024, 0.028, 0.029, 0.033, 0.033, 0.033]
    }
};

// 物品类型映射
const ITEM_TYPES = {
    WOOD: { inventoryKey: 'woodcuttingInventory', name: '木材' },
    ORE: { inventoryKey: 'miningInventory', name: '矿石' },
    GATHERING: { inventoryKey: 'gatheringInventory', name: '采集物' },
    PLANK: { inventoryKey: 'planksInventory', name: '木板' },
    INGOT: { inventoryKey: 'ingotsInventory', name: '矿锭' },
    FABRIC: { inventoryKey: 'fabricsInventory', name: '布料' },
    POTION: { inventoryKey: 'potionsInventory', name: '药水' },
    ESSENCE: { inventoryKey: 'essencesInventory', name: '精华' },
    BREW: { inventoryKey: 'brewsInventory', name: '酒类' },
    TOKEN: { inventoryKey: 'tokensInventory', name: '代币' }
};

// 行动类型配置
const ACTION_TYPES = {
    WOODCUTTING: {
        id: 'woodcutting',
        name: '伐木',
        configKey: 'trees',
        skillKey: 'woodcuttingLevel',
        expKey: 'woodcuttingExp',
        inventoryKey: 'woodcuttingInventory',
        dropType: 'WOOD',
        needsMaterials: false
    },
    MINING: {
        id: 'mining',
        name: '挖矿',
        configKey: 'ores',
        skillKey: 'miningLevel',
        expKey: 'miningExp',
        inventoryKey: 'miningInventory',
        dropType: 'ORE',
        needsMaterials: false
    },
    GATHERING: {
        id: 'gathering',
        name: '采集',
        configKey: 'gatheringLocations',
        skillKey: 'gatheringLevel',
        expKey: 'gatheringExp',
        inventoryKey: 'gatheringInventory',
        dropType: 'GATHERING',
        needsMaterials: false
    },
    CRAFTING: {
        id: 'crafting',
        name: '制作',
        configKey: 'woodPlanks',
        skillKey: 'craftingLevel',
        expKey: 'craftingExp',
        inventoryKey: 'planksInventory',
        resultType: 'PLANK',
        materialType: 'WOOD',
        needsMaterials: true
    },
    FORGING: {
        id: 'forging',
        name: '锻造',
        configKey: 'ingots',
        skillKey: 'forgingLevel',
        expKey: 'forgingExp',
        inventoryKey: 'ingotsInventory',
        resultType: 'INGOT',
        materialType: 'ORE',
        needsMaterials: true
    },
    TAILORING: {
        id: 'tailoring',
        name: '缝制',
        configKey: 'fabrics',
        skillKey: 'tailoringLevel',
        expKey: 'tailoringExp',
        inventoryKey: 'fabricsInventory',
        resultType: 'FABRIC',
        materialType: 'GATHERING',
        needsMaterials: true
    },
    BREWING: {
        id: 'brewing',
        name: '酿造',
        configKey: 'brews',
        skillKey: 'brewingLevel',
        expKey: 'brewingExp',
        inventoryKey: 'brewsInventory',
        resultType: 'BREW',
        materialType: 'GATHERING',
        needsMaterials: true,
        needsToken: true
    },
    ALCHEMY: {
        id: 'alchemy',
        name: '炼金',
        configKey: 'potions',
        skillKey: 'alchemyLevel',
        expKey: 'alchemyExp',
        inventoryKey: 'potionsInventory',
        resultType: 'POTION',
        materialType: 'GATHERING',
        needsMaterials: true
    },
    ESSENCE: {
        id: 'essence',
        name: '提炼',
        configKey: 'essences',
        skillKey: 'gatheringLevel',
        expKey: 'gatheringExp',
        inventoryKey: 'essencesInventory',
        resultType: 'ESSENCE',
        materialType: 'GATHERING',
        needsMaterials: true
    }
};

module.exports = { CONFIG, ITEM_TYPES, ACTION_TYPES };
