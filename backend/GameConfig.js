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
            baseCost: { pine: 10 },
            production: {}, 
            unlockReq: null,
            maxLevel: 5,
            levelNames: ['简陋帐篷', '炉火营地', '榫卯工房', '织造小筑', '秘药阁楼', '丰饶山庄']
        },
        { id: 'lumber', name: '伐木场', icon: '🪓', baseCost: { pine: 30 }, production: {}, unlockReq: null },
        { id: 'mine', name: '矿洞', icon: '⛏️', baseCost: { pine: 50, cyan_ore: 10 }, production: {}, unlockReq: { tentLevel: 0 } },
        { id: 'smithy', name: '锻造屋', icon: '🔨', baseCost: { pine: 80, cyan_ore: 30 }, production: {}, unlockReq: { tentLevel: 1 } },
        { id: 'workshop', name: '木工坊', icon: '🪵', baseCost: { pine: 100 }, production: {}, unlockReq: { tentLevel: 2 } },
        { id: 'tailor', name: '裁缝铺', icon: '🧵', baseCost: { pine: 80, gold: 500 }, production: {}, unlockReq: { tentLevel: 3 } },
        { id: 'alchemy', name: '炼金小屋', icon: '⚗️', baseCost: { pine: 100, cyan_ore: 50 }, production: {}, unlockReq: { tentLevel: 4 } },
        { id: 'brewery', name: '酿酒坊', icon: '🍺', baseCost: { pine: 60, gold: 300 }, production: {}, unlockReq: { tentLevel: 3 } },
        { id: 'farm', name: '草药园', icon: '🌿', baseCost: { pine: 40 }, production: {}, unlockReq: { tentLevel: 0 } }
    ],
    
    // 树木配置
    trees: [
        { id: 'pine', name: '青杉树', icon: '🌲', reqLevel: 1, duration: 6000, drop: '青杉原木', dropIcon: '🪵', dropId: 'pine', exp: 5 },
        { id: 'iron_birch', name: '铁桦树', icon: '🌳', reqLevel: 10, duration: 8000, drop: '铁桦原木', dropIcon: '🪵', dropId: 'iron_birch', exp: 7.5 },
        { id: 'wind_tree', name: '风啸树', icon: '🌴', reqLevel: 20, duration: 10000, drop: '风啸原木', dropIcon: '🪵', dropId: 'wind_tree', exp: 12.5 },
        { id: 'flame_tree', name: '焰心树', icon: '🔥', reqLevel: 35, duration: 12000, drop: '焰心原木', dropIcon: '🪵', dropId: 'flame_tree', exp: 20 },
        { id: 'frost_maple', name: '霜叶树', icon: '❄️', reqLevel: 50, duration: 14000, drop: '霜叶原木', dropIcon: '🪵', dropId: 'frost_maple', exp: 30 },
        { id: 'thunder_tree', name: '雷鸣树', icon: '⚡', reqLevel: 65, duration: 16000, drop: '雷鸣原木', dropIcon: '🪵', dropId: 'thunder_tree', exp: 40 },
        { id: 'ancient_oak', name: '古橡树', icon: '🌳', reqLevel: 80, duration: 18000, drop: '古橡原木', dropIcon: '🪵', dropId: 'ancient_oak', exp: 55 },
        { id: 'world_tree', name: '世界树', icon: '🌍', reqLevel: 95, duration: 30000, drop: '世界树枝', dropIcon: '🌿', dropId: 'world_tree', exp: 73 }
    ],
    
    // 矿石配置
    ores: [
        { id: 'cyan_ore', name: '青闪矿', icon: '💎', reqLevel: 1, duration: 6000, drop: '青闪石', dropIcon: '💎', dropId: 'cyan_ore', exp: 5 },
        { id: 'red_iron', name: '赤铁矿', icon: '🔴', reqLevel: 10, duration: 8000, drop: '赤铁石', dropIcon: '🪨', dropId: 'red_iron', exp: 7.5 },
        { id: 'feather_ore', name: '羽石矿', icon: '🪶', reqLevel: 20, duration: 10000, drop: '羽石', dropIcon: '🪨', dropId: 'feather_ore', exp: 12.5 },
        { id: 'hell_ore', name: '狱炎矿', icon: '🔥', reqLevel: 35, duration: 12000, drop: '狱炎石', dropIcon: '🪨', dropId: 'hell_ore', exp: 20 },
        { id: 'white_ore', name: '白鸠矿', icon: '⚪', reqLevel: 50, duration: 14000, drop: '白鸠石', dropIcon: '🪨', dropId: 'white_ore', exp: 30 },
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
                { id: 'silk', name: '蚕茧', icon: '🧵', exp: 14, probability: 0.2 },
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
    
    // 净羽配置
    cleanedFeathers: [
        { id: 'cleaned_feather', name: '普通净羽', icon: '🪶', reqLevel: 10, duration: 8000, exp: 7.5, materials: { feather: 2 }, tokenRate: 0.017, value: 32 },
        { id: 'jade_cleaned_feather', name: '翡翠净羽', icon: '🦜', reqLevel: 20, duration: 10000, exp: 12.5, materials: { jade_feather: 2 }, tokenRate: 0.024, value: 64 },
        { id: 'falcon_cleaned_feather', name: '猎隼的净尾羽', icon: '🦅', reqLevel: 35, duration: 12000, exp: 20, materials: { falcon_tail_feather: 2 }, tokenRate: 0.053, value: 96 },
        { id: 'rainbow_cleaned_feather', name: '虹光净羽', icon: '🌈', reqLevel: 65, duration: 16000, exp: 40, materials: { rainbow_feather: 2 }, tokenRate: 0.149, value: 154 },
        { id: 'harpy_cleaned_feather', name: '鹰身人的净羽', icon: '🦅', reqLevel: 80, duration: 18000, exp: 55, materials: { harpy_feather: 2 }, tokenRate: 0.21, value: 240 }
    ],

    // 手稿配置
    manuscripts: [
        { id: 'manuscript', name: '手稿', icon: '📜', reqLevel: 20, duration: 22000, exp: 40, materials: { pine: 10, iron_birch: 10, wind_tree: 10, jute: 20, flax: 20 }, tokenRate: 0.055 }
    ],
    
    // 矿锭配置
    ingots: [
        { id: 'cyan_ingot', name: '青闪铁锭', icon: '🔩', reqLevel: 1, duration: 6000, exp: 5, materials: { cyan_ore: 2 } },
        { id: 'red_copper_ingot', name: '赤铜锭', icon: '🥉', reqLevel: 10, duration: 8000, exp: 7.5, materials: { red_iron: 2 } },
        { id: 'feather_ingot', name: '羽铁锭', icon: '🪶', reqLevel: 20, duration: 10000, exp: 12.5, materials: { feather_ore: 2 } },
        { id: 'white_silver_ingot', name: '白银锭', icon: '🪙', reqLevel: 35, duration: 12000, exp: 20, materials: { white_ore: 2 } },
        { id: 'hell_steel_ingot', name: '狱炎钢锭', icon: '🔥', reqLevel: 50, duration: 14000, exp: 30, materials: { hell_ore: 2 } },
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
        { id: 'wind_silk', name: '风语丝绸', icon: '💨', reqLevel: 75, duration: 18000, exp: 50, materials: { wind_velvet: 2 } },
        { id: 'dream_cloth', name: '梦幻布料', icon: '✨', reqLevel: 95, duration: 25000, exp: 72.5, materials: { life_fiber: 2 } }
    ],
    
    // 丝线配置
    threads: [
        { id: 'jute_thread', name: '黄麻线', icon: '🧵', reqLevel: 1, duration: 6000, exp: 5, materials: { jute: 2 }, tokenRate: 0.017 },
        { id: 'linen_thread', name: '亚麻线', icon: '🧶', reqLevel: 15, duration: 8000, exp: 10, materials: { flax: 2 }, tokenRate: 0.032 },
        { id: 'wool_thread', name: '羊毛线', icon: '🧶', reqLevel: 35, duration: 12000, exp: 20, materials: { wool: 2 }, tokenRate: 0.053 },
        { id: 'silk_thread', name: '蚕丝线', icon: '🎀', reqLevel: 55, duration: 15000, exp: 32.5, materials: { silk: 2 }, tokenRate: 0.078 },
        { id: 'wind_thread', name: '风语丝线', icon: '💨', reqLevel: 75, duration: 18000, exp: 50, materials: { wind_velvet: 2 }, tokenRate: 0.126 },
        { id: 'dream_thread', name: '梦幻丝线', icon: '✨', reqLevel: 95, duration: 25000, exp: 72.5, materials: { life_fiber: 2 }, tokenRate: 0.195 }
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
        { id: 'mp_potion_4', name: '优级魔法药水', icon: '💧', reqLevel: 35, duration: 8250, exp: 18, materials: { apple: 1, moonlight_mushroom: 1, blossom_honey: 4 } },
        { id: 'hp_potion_5', name: '高级生命药水', icon: '🧪', reqLevel: 50, duration: 9000, exp: 24, materials: { grape: 1, wild_heart: 1, moonlight_honey: 4 } },
        { id: 'mp_potion_5', name: '高级魔法药水', icon: '💧', reqLevel: 50, duration: 9000, exp: 24, materials: { grape: 1, soul_herb: 1, moonlight_honey: 4 } },
        { id: 'hp_potion_6', name: '特级生命药水', icon: '🧪', reqLevel: 65, duration: 10500, exp: 32, materials: { rye: 1, wild_heart: 1, moonlight_honey: 4 } },
        { id: 'mp_potion_6', name: '特级魔法药水', icon: '💧', reqLevel: 65, duration: 10500, exp: 32, materials: { rye: 1, soul_herb: 1, moonlight_honey: 4 } },
        { id: 'hp_potion_7', name: '珍级生命药水', icon: '🧪', reqLevel: 80, duration: 12000, exp: 40, materials: { mist_fruit: 1, bewitch_berry: 1, rock_rose_honey: 4 } },
        { id: 'mp_potion_7', name: '珍级魔法药水', icon: '💧', reqLevel: 80, duration: 12000, exp: 40, materials: { mist_fruit: 1, bewitch_berry: 1, rock_rose_honey: 4 } },
        { id: 'hp_potion_8', name: '至级生命药水', icon: '🧪', reqLevel: 95, duration: 13500, exp: 50, materials: { dragon_blood_fruit: 1, bewitch_berry: 1, rock_rose_honey: 4 } },
        { id: 'mp_potion_8', name: '至级魔法药水', icon: '💧', reqLevel: 95, duration: 13500, exp: 50, materials: { dragon_blood_fruit: 1, bewitch_berry: 1, rock_rose_honey: 4 } }
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
        { id: 'brewing_wine', name: '酿造果酒', icon: '🍷', reqLevel: 20, duration: 10000, exp: 24, materials: { apple: 1, sage_essence: 1, brewing_token: 1 } },
        // 酒箱系列
        { id: 'beginner_wine_box', name: '初级酒箱', icon: '📦', reqLevel: 10, duration: 22000, exp: 40, materials: { sweet_berry: 40, wheat: 40, mint_essence: 20, pine_essence: 20 }, tokenRate: 0.055 },
        { id: 'intermediate_wine_box', name: '中级酒箱', icon: '📦', reqLevel: 35, duration: 34000, exp: 115, materials: { hops: 40, apple: 40, vanilla_essence: 20, sage_essence: 20 }, tokenRate: 0.10 },
        { id: 'advanced_wine_box', name: '高级酒箱', icon: '📦', reqLevel: 65, duration: 60000, exp: 280, materials: { grape: 40, rye: 40, chili_essence: 20, mist_essence: 20 }, tokenRate: 0.14 }
    ],
    
    // 精华配置（提炼功能）
    essences: [
        { id: 'mint_essence', name: '薄荷精华', icon: '🌿', reqLevel: 6, duration: 6000, exp: 4, materials: { wild_mint: 2 } },
        { id: 'pine_essence', name: '松针精华', icon: '🌲', reqLevel: 10, duration: 8000, exp: 8, materials: { pine_needle: 2 } },
        { id: 'vanilla_essence', name: '香草精华', icon: '🌱', reqLevel: 16, duration: 11000, exp: 12, materials: { vanilla: 2 } },
        { id: 'sage_essence', name: '鼠尾草精华', icon: '🌿', reqLevel: 22, duration: 14000, exp: 18, materials: { sage: 2 } },
        { id: 'chili_essence', name: '辣椒精华', icon: '🌶️', reqLevel: 30, duration: 17000, exp: 24, materials: { chili: 2 } },
        { id: 'mist_essence', name: '雾菱精华', icon: '💠', reqLevel: 40, duration: 20000, exp: 32, materials: { mist_flower: 2 } },
        { id: 'clover_essence', name: '四叶草精华', icon: '🍀', reqLevel: 55, duration: 30000, exp: 40, materials: { four_leaf_clover: 2 } }
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
    
    // 工具配置（完整版 - 每种工具8级）
    tools: {
        axes: [
            { id: 'cyan_axe', name: '青闪斧', icon: '🪓', speedBonus: 0.15, reqForgeLevel: 2, reqEquipLevel: 1, duration: 6000, exp: 14 },
            { id: 'red_axe', name: '赤铁斧', icon: '🪓', speedBonus: 0.225, reqForgeLevel: 12, reqEquipLevel: 10, duration: 10500, exp: 32 },
            { id: 'feather_axe', name: '羽斧', icon: '🪓', speedBonus: 0.30, reqForgeLevel: 22, reqEquipLevel: 20, duration: 16000, exp: 70 },
            { id: 'white_axe', name: '白银斧', icon: '🪓', speedBonus: 0.45, reqForgeLevel: 37, reqEquipLevel: 35, duration: 27000, exp: 168 },
            { id: 'hell_axe', name: '狱炎斧', icon: '🪓', speedBonus: 0.60, reqForgeLevel: 52, reqEquipLevel: 50, duration: 45000, exp: 378 },
            { id: 'thunder_axe', name: '雷鸣斧', icon: '🪓', speedBonus: 0.75, reqForgeLevel: 67, reqEquipLevel: 65, duration: 78000, exp: 728 },
            { id: 'brilliant_axe', name: '璀璨斧', icon: '🪓', speedBonus: 0.90, reqForgeLevel: 82, reqEquipLevel: 80, duration: 134000, exp: 1386 },
            { id: 'star_axe', name: '星辉斧', icon: '🪓', speedBonus: 1.05, reqForgeLevel: 97, reqEquipLevel: 95, duration: 235000, exp: 2605 }
        ],
        pickaxes: [
            { id: 'cyan_pickaxe', name: '青闪镐', icon: '⛏️', speedBonus: 0.15, reqForgeLevel: 2, reqEquipLevel: 1, duration: 6000, exp: 14 },
            { id: 'red_pickaxe', name: '赤铁镐', icon: '⛏️', speedBonus: 0.225, reqForgeLevel: 12, reqEquipLevel: 10, duration: 10500, exp: 32 },
            { id: 'feather_pickaxe', name: '羽镐', icon: '⛏️', speedBonus: 0.30, reqForgeLevel: 22, reqEquipLevel: 20, duration: 16000, exp: 70 },
            { id: 'white_pickaxe', name: '白银镐', icon: '⛏️', speedBonus: 0.45, reqForgeLevel: 37, reqEquipLevel: 35, duration: 27000, exp: 168 },
            { id: 'hell_pickaxe', name: '狱炎镐', icon: '⛏️', speedBonus: 0.60, reqForgeLevel: 52, reqEquipLevel: 50, duration: 45000, exp: 378 },
            { id: 'thunder_pickaxe', name: '雷鸣镐', icon: '⛏️', speedBonus: 0.75, reqForgeLevel: 67, reqEquipLevel: 65, duration: 78000, exp: 728 },
            { id: 'brilliant_pickaxe', name: '璀璨镐', icon: '⛏️', speedBonus: 0.90, reqForgeLevel: 82, reqEquipLevel: 80, duration: 134000, exp: 1386 },
            { id: 'star_pickaxe', name: '星辉镐', icon: '⛏️', speedBonus: 1.05, reqForgeLevel: 97, reqEquipLevel: 95, duration: 235000, exp: 2605 }
        ],
        chisels: [
            { id: 'cyan_chisel', name: '青闪凿子', icon: '🔨', speedBonus: 0.15, reqForgeLevel: 2, reqEquipLevel: 1, duration: 6000, exp: 14 },
            { id: 'red_chisel', name: '赤铁凿子', icon: '🔨', speedBonus: 0.225, reqForgeLevel: 12, reqEquipLevel: 10, duration: 10500, exp: 32 },
            { id: 'feather_chisel', name: '轻羽凿子', icon: '🔨', speedBonus: 0.30, reqForgeLevel: 22, reqEquipLevel: 20, duration: 16000, exp: 70 },
            { id: 'white_chisel', name: '白银凿子', icon: '🔨', speedBonus: 0.45, reqForgeLevel: 37, reqEquipLevel: 35, duration: 27000, exp: 168 },
            { id: 'hell_chisel', name: '狱炎凿子', icon: '🔨', speedBonus: 0.60, reqForgeLevel: 52, reqEquipLevel: 50, duration: 45000, exp: 378 },
            { id: 'thunder_chisel', name: '雷鸣凿子', icon: '🔨', speedBonus: 0.75, reqForgeLevel: 67, reqEquipLevel: 65, duration: 78000, exp: 728 },
            { id: 'brilliant_chisel', name: '璀璨凿子', icon: '🔨', speedBonus: 0.90, reqForgeLevel: 82, reqEquipLevel: 80, duration: 134000, exp: 1386 },
            { id: 'star_chisel', name: '星辉凿子', icon: '🔨', speedBonus: 1.05, reqForgeLevel: 97, reqEquipLevel: 95, duration: 235000, exp: 2605 }
        ],
        needles: [
            { id: 'cyan_needle', name: '青闪针', icon: '🪡', speedBonus: 0.15, reqForgeLevel: 2, reqEquipLevel: 1, duration: 6000, exp: 14 },
            { id: 'red_needle', name: '赤铁针', icon: '🪡', speedBonus: 0.225, reqForgeLevel: 12, reqEquipLevel: 10, duration: 10500, exp: 32 },
            { id: 'feather_needle', name: '轻羽针', icon: '🪡', speedBonus: 0.30, reqForgeLevel: 22, reqEquipLevel: 20, duration: 16000, exp: 70 },
            { id: 'white_needle', name: '白银针', icon: '🪡', speedBonus: 0.45, reqForgeLevel: 37, reqEquipLevel: 35, duration: 27000, exp: 168 },
            { id: 'hell_needle', name: '狱炎针', icon: '🪡', speedBonus: 0.60, reqForgeLevel: 52, reqEquipLevel: 50, duration: 45000, exp: 378 },
            { id: 'thunder_needle', name: '雷鸣针', icon: '🪡', speedBonus: 0.75, reqForgeLevel: 67, reqEquipLevel: 65, duration: 78000, exp: 728 },
            { id: 'brilliant_needle', name: '璀璨针', icon: '🪡', speedBonus: 0.90, reqForgeLevel: 82, reqEquipLevel: 80, duration: 134000, exp: 1386 },
            { id: 'star_needle', name: '星辉针', icon: '🪡', speedBonus: 1.05, reqForgeLevel: 97, reqEquipLevel: 95, duration: 235000, exp: 2605 }
        ],
        scythes: [
            { id: 'cyan_scythe', name: '青闪镰刀', icon: '🗡️', speedBonus: 0.15, reqForgeLevel: 2, reqEquipLevel: 1, duration: 6000, exp: 14 },
            { id: 'red_scythe', name: '赤铁镰刀', icon: '🗡️', speedBonus: 0.225, reqForgeLevel: 12, reqEquipLevel: 10, duration: 10500, exp: 32 },
            { id: 'feather_scythe', name: '轻羽镰刀', icon: '🗡️', speedBonus: 0.30, reqForgeLevel: 22, reqEquipLevel: 20, duration: 16000, exp: 70 },
            { id: 'white_scythe', name: '白银镰刀', icon: '🗡️', speedBonus: 0.45, reqForgeLevel: 37, reqEquipLevel: 35, duration: 27000, exp: 168 },
            { id: 'hell_scythe', name: '狱炎镰刀', icon: '🗡️', speedBonus: 0.60, reqForgeLevel: 52, reqEquipLevel: 50, duration: 45000, exp: 378 },
            { id: 'thunder_scythe', name: '雷鸣镰刀', icon: '🗡️', speedBonus: 0.75, reqForgeLevel: 67, reqEquipLevel: 65, duration: 78000, exp: 728 },
            { id: 'brilliant_scythe', name: '璀璨镰刀', icon: '🗡️', speedBonus: 0.90, reqForgeLevel: 82, reqEquipLevel: 80, duration: 134000, exp: 1386 },
            { id: 'star_scythe', name: '星辉镰刀', icon: '🗡️', speedBonus: 1.05, reqForgeLevel: 97, reqEquipLevel: 95, duration: 235000, exp: 2605 }
        ],
        hammers: [
            { id: 'cyan_hammer', name: '青铁锤', icon: '🔨', speedBonus: 0.15, reqForgeLevel: 2, reqEquipLevel: 1, duration: 6000, exp: 14 },
            { id: 'red_hammer', name: '赤铜锤', icon: '🔨', speedBonus: 0.225, reqForgeLevel: 12, reqEquipLevel: 10, duration: 10500, exp: 32 },
            { id: 'feather_hammer', name: '轻羽锤', icon: '🔨', speedBonus: 0.30, reqForgeLevel: 22, reqEquipLevel: 20, duration: 16000, exp: 70 },
            { id: 'white_hammer', name: '白银锤', icon: '🔨', speedBonus: 0.45, reqForgeLevel: 37, reqEquipLevel: 35, duration: 27000, exp: 168 },
            { id: 'hell_hammer', name: '狱炎钢锤', icon: '🔨', speedBonus: 0.60, reqForgeLevel: 52, reqEquipLevel: 50, duration: 45000, exp: 378 },
            { id: 'thunder_hammer', name: '雷鸣钢锤', icon: '🔨', speedBonus: 0.75, reqForgeLevel: 67, reqEquipLevel: 65, duration: 78000, exp: 728 },
            { id: 'brilliant_hammer', name: '璀璨之锤', icon: '🔨', speedBonus: 0.90, reqForgeLevel: 82, reqEquipLevel: 80, duration: 134000, exp: 1386 },
            { id: 'star_hammer', name: '星辉之锤', icon: '🔨', speedBonus: 1.05, reqForgeLevel: 97, reqEquipLevel: 95, duration: 235000, exp: 2605 }
        ],
        tongs: [
            { id: 'cyan_tongs', name: '青闪小桶', icon: '🪣', speedBonus: 0.15, reqForgeLevel: 2, reqEquipLevel: 1, duration: 6000, exp: 14 },
            { id: 'red_tongs', name: '赤铁小桶', icon: '🪣', speedBonus: 0.225, reqForgeLevel: 12, reqEquipLevel: 10, duration: 10500, exp: 32 },
            { id: 'feather_tongs', name: '轻羽小桶', icon: '🪣', speedBonus: 0.30, reqForgeLevel: 22, reqEquipLevel: 20, duration: 16000, exp: 70 },
            { id: 'white_tongs', name: '白银小桶', icon: '🪣', speedBonus: 0.45, reqForgeLevel: 37, reqEquipLevel: 35, duration: 27000, exp: 168 },
            { id: 'hell_tongs', name: '狱炎小桶', icon: '🪣', speedBonus: 0.60, reqForgeLevel: 52, reqEquipLevel: 50, duration: 45000, exp: 378 },
            { id: 'thunder_tongs', name: '雷鸣小桶', icon: '🪣', speedBonus: 0.75, reqForgeLevel: 67, reqEquipLevel: 65, duration: 78000, exp: 728 },
            { id: 'brilliant_tongs', name: '璀璨小桶', icon: '🪣', speedBonus: 0.90, reqForgeLevel: 82, reqEquipLevel: 80, duration: 134000, exp: 1386 },
            { id: 'star_tongs', name: '星辉小桶', icon: '🪣', speedBonus: 1.05, reqForgeLevel: 97, reqEquipLevel: 95, duration: 235000, exp: 2605 }
        ],
        rods: [
            { id: 'cyan_rod', name: '青闪搅拌棒', icon: '🥄', speedBonus: 0.15, reqForgeLevel: 2, reqEquipLevel: 1, duration: 6000, exp: 14 },
            { id: 'red_rod', name: '赤铁搅拌棒', icon: '🥄', speedBonus: 0.225, reqForgeLevel: 12, reqEquipLevel: 10, duration: 10500, exp: 32 },
            { id: 'feather_rod', name: '轻羽搅拌棒', icon: '🥄', speedBonus: 0.30, reqForgeLevel: 22, reqEquipLevel: 20, duration: 16000, exp: 70 },
            { id: 'white_rod', name: '白银搅拌棒', icon: '🥄', speedBonus: 0.45, reqForgeLevel: 37, reqEquipLevel: 35, duration: 27000, exp: 168 },
            { id: 'hell_rod', name: '狱炎搅拌棒', icon: '🥄', speedBonus: 0.60, reqForgeLevel: 52, reqEquipLevel: 50, duration: 45000, exp: 378 },
            { id: 'thunder_rod', name: '雷鸣搅拌棒', icon: '🥄', speedBonus: 0.75, reqForgeLevel: 67, reqEquipLevel: 65, duration: 78000, exp: 728 },
            { id: 'brilliant_rod', name: '璀璨搅拌棒', icon: '🥄', speedBonus: 0.90, reqForgeLevel: 82, reqEquipLevel: 80, duration: 134000, exp: 1386 },
            { id: 'star_rod', name: '星辉搅拌棒', icon: '🥄', speedBonus: 1.05, reqForgeLevel: 97, reqEquipLevel: 95, duration: 235000, exp: 2605 }
        ]
    },
    
    // 工具锻造材料配置
    toolCraftingMaterials: {
        axes: [
            { ore: 10, plank: 6, prevTool: null },
            { ore: 16, plank: 10, prevTool: 'cyan_axe' },
            { ore: 22, plank: 14, prevTool: 'red_axe' },
            { ore: 34, plank: 22, prevTool: 'feather_axe' },
            { ore: 52, plank: 34, prevTool: 'white_axe' },
            { ore: 76, plank: 50, prevTool: 'hell_axe' },
            { ore: 106, plank: 70, prevTool: 'thunder_axe' },
            { ore: 142, plank: 94, prevTool: 'brilliant_axe' }
        ],
        pickaxes: [
            { ore: 10, plank: 6, prevTool: null },
            { ore: 16, plank: 10, prevTool: 'cyan_pickaxe' },
            { ore: 22, plank: 14, prevTool: 'red_pickaxe' },
            { ore: 34, plank: 22, prevTool: 'feather_pickaxe' },
            { ore: 52, plank: 34, prevTool: 'white_pickaxe' },
            { ore: 76, plank: 50, prevTool: 'hell_pickaxe' },
            { ore: 106, plank: 70, prevTool: 'thunder_pickaxe' },
            { ore: 142, plank: 94, prevTool: 'brilliant_pickaxe' }
        ],
        chisels: [
            { ore: 10, plank: 6, prevTool: null },
            { ore: 16, plank: 10, prevTool: 'cyan_chisel' },
            { ore: 22, plank: 14, prevTool: 'red_chisel' },
            { ore: 34, plank: 22, prevTool: 'feather_chisel' },
            { ore: 52, plank: 34, prevTool: 'white_chisel' },
            { ore: 76, plank: 50, prevTool: 'hell_chisel' },
            { ore: 106, plank: 70, prevTool: 'thunder_chisel' },
            { ore: 142, plank: 94, prevTool: 'brilliant_chisel' }
        ],
        needles: [
            { ore: 10, plank: 6, prevTool: null },
            { ore: 16, plank: 10, prevTool: 'cyan_needle' },
            { ore: 22, plank: 14, prevTool: 'red_needle' },
            { ore: 34, plank: 22, prevTool: 'feather_needle' },
            { ore: 52, plank: 34, prevTool: 'white_needle' },
            { ore: 76, plank: 50, prevTool: 'hell_needle' },
            { ore: 106, plank: 70, prevTool: 'thunder_needle' },
            { ore: 142, plank: 94, prevTool: 'brilliant_needle' }
        ],
        scythes: [
            { ore: 10, plank: 6, prevTool: null },
            { ore: 16, plank: 10, prevTool: 'cyan_scythe' },
            { ore: 22, plank: 14, prevTool: 'red_scythe' },
            { ore: 34, plank: 22, prevTool: 'feather_scythe' },
            { ore: 52, plank: 34, prevTool: 'white_scythe' },
            { ore: 76, plank: 50, prevTool: 'hell_scythe' },
            { ore: 106, plank: 70, prevTool: 'thunder_scythe' },
            { ore: 142, plank: 94, prevTool: 'brilliant_scythe' }
        ],
        hammers: [
            { ingot: 10, prevTool: null },
            { ingot: 16, prevTool: 'cyan_hammer' },
            { ingot: 22, prevTool: 'red_hammer' },
            { ingot: 34, prevTool: 'feather_hammer' },
            { ingot: 52, prevTool: 'white_hammer' },
            { ingot: 77, prevTool: 'hell_hammer' },
            { ingot: 107, prevTool: 'thunder_hammer' },
            { ingot: 143, prevTool: 'brilliant_hammer' }
        ],
        tongs: [
            { ore: 10, plank: 6, prevTool: null },
            { ore: 16, plank: 10, prevTool: 'cyan_tongs' },
            { ore: 22, plank: 14, prevTool: 'red_tongs' },
            { ore: 34, plank: 22, prevTool: 'feather_tongs' },
            { ore: 52, plank: 34, prevTool: 'white_tongs' },
            { ore: 76, plank: 50, prevTool: 'hell_tongs' },
            { ore: 106, plank: 70, prevTool: 'thunder_tongs' },
            { ore: 142, plank: 94, prevTool: 'brilliant_tongs' }
        ],
        rods: [
            { ore: 10, plank: 6, prevTool: null },
            { ore: 16, plank: 10, prevTool: 'cyan_rod' },
            { ore: 22, plank: 14, prevTool: 'red_rod' },
            { ore: 34, plank: 22, prevTool: 'feather_rod' },
            { ore: 52, plank: 34, prevTool: 'white_rod' },
            { ore: 76, plank: 50, prevTool: 'hell_rod' },
            { ore: 106, plank: 70, prevTool: 'thunder_rod' },
            { ore: 142, plank: 94, prevTool: 'brilliant_rod' }
        ]
    },
    
    // 笔装备配置（吟游诗人专用）
    pens: [
        { 
            id: 'traveler_pen', 
            name: '旅人之笔', 
            icon: '✒️', 
            reqForgeLevel: 1,
            reqBardLevel: 1,
            materials: { cleaned_feather: 15, conch_ink: 4 },
            duration: 6000,
            exp: 18,
            tokenRate: 0.02,
            value: 15 * 32 + 4 * 300, // 普通净羽价值32 + 海螺墨价值300
            effect: '用以谱写歌谣、书写诗篇，为吟游诗人的歌颂赋予实质的魔力与传世的载体。（无其他效果）'
        },
        { 
            id: 'lyre_pen', 
            name: '琴语之笔', 
            icon: '✒️', 
            reqForgeLevel: 10,
            reqBardLevel: 3,
            materials: { cleaned_feather: 16, jade_cleaned_feather: 12, conch_ink: 8 },
            duration: 8000,
            exp: 40,
            tokenRate: 0.04,
            value: 16 * 32 + 12 * 64 + 8 * 300,
            effect: '+3%精良，+2%史诗'
        },
        { 
            id: 'witness_pen', 
            name: '见闻之笔', 
            icon: '✒️', 
            reqForgeLevel: 20,
            reqBardLevel: 5,
            materials: { cleaned_feather: 12, jade_cleaned_feather: 16, falcon_cleaned_feather: 14, conch_ink: 12 },
            duration: 10000,
            exp: 90,
            tokenRate: 0.076,
            value: 12 * 32 + 16 * 64 + 14 * 96 + 12 * 300,
            effect: '+6%精良，+4%史诗'
        },
        { 
            id: 'awaken_pen', 
            name: '醒木之笔', 
            icon: '✒️', 
            reqForgeLevel: 35,
            reqBardLevel: 7,
            materials: { jade_cleaned_feather: 32, falcon_cleaned_feather: 28, conch_ink: 17 },
            duration: 12000,
            exp: 216,
            tokenRate: 0.145,
            value: 32 * 64 + 28 * 96 + 17 * 300,
            effect: '+9%精良，+6%史诗'
        },
        { 
            id: 'blaze_pen', 
            name: '灼言之笔', 
            icon: '✒️', 
            reqForgeLevel: 50,
            reqBardLevel: 9,
            materials: { jade_cleaned_feather: 24, falcon_cleaned_feather: 30, rainbow_cleaned_feather: 24, conch_ink: 23 },
            duration: 14000,
            exp: 486,
            tokenRate: 0.267,
            value: 24 * 64 + 30 * 96 + 24 * 154 + 23 * 300,
            effect: '+12%精良，+8%史诗'
        },
        { 
            id: 'lionheart_pen', 
            name: '狮心之笔', 
            icon: '✒️', 
            reqForgeLevel: 65,
            reqBardLevel: 11,
            materials: { falcon_cleaned_feather: 50, rainbow_cleaned_feather: 48, conch_ink: 30 },
            duration: 16000,
            exp: 936,
            tokenRate: 0.467,
            value: 50 * 96 + 48 * 154 + 30 * 300,
            effect: '+15%精良，+10%史诗'
        },
        { 
            id: 'echo_pen', 
            name: '回响之笔', 
            icon: '✒️', 
            reqForgeLevel: 80,
            reqBardLevel: 13,
            materials: { falcon_cleaned_feather: 36, rainbow_cleaned_feather: 48, harpy_cleaned_feather: 36, conch_ink: 38 },
            duration: 18000,
            exp: 1782,
            tokenRate: 0.70,
            value: 36 * 96 + 48 * 154 + 36 * 240 + 38 * 300,
            effect: '+18%精良，+12%史诗'
        },
        { 
            id: 'epic_pen', 
            name: '史诗之笔', 
            icon: '✒️', 
            reqForgeLevel: 95,
            reqBardLevel: 16,
            materials: { rainbow_cleaned_feather: 72, harpy_cleaned_feather: 78, conch_ink: 47 },
            duration: 30000,
            exp: 3193,
            tokenRate: 0.90,
            value: 72 * 154 + 78 * 240 + 47 * 300,
            effect: '+21%精良，+14%史诗'
        }
    ],
    
    // 矿石与矿锭的映射
    oreIngotMapping: {
        'cyan_ore': 'cyan_ingot',
        'red_iron': 'red_copper_ingot',
        'feather_ore': 'feather_ingot',
        'hell_ore': 'hell_steel_ingot',
        'white_ore': 'white_silver_ingot',
        'thunder_ore': 'thunder_steel_ingot',
        'brilliant': 'brilliant_crystal',
        'star_ore': 'star_crystal'
    },
    
    // 矿锭与矿石的反向映射（用于锻造工具）
    ingotOreMapping: {
        'cyan_ingot': 'cyan_ore',
        'red_copper_ingot': 'red_iron',
        'feather_ingot': 'feather_ore',
        'white_silver_ingot': 'white_ore',
        'hell_steel_ingot': 'hell_ore',
        'thunder_steel_ingot': 'thunder_ore',
        'brilliant_crystal': 'brilliant',
        'star_crystal': 'star_ore'
    },
    
    // 木板ID映射
    plankIdMapping: {
        0: 'pine_plank',
        1: 'iron_birch_plank',
        2: 'wind_tree_plank',
        3: 'flame_tree_plank',
        4: 'frost_maple_plank',
        5: 'thunder_tree_plank',
        6: 'ancient_oak_plank',
        7: 'world_tree_plank'
    },
    
    // 矿锭ID映射
    ingotIdMapping: {
        0: 'cyan_ingot',
        1: 'red_copper_ingot',
        2: 'feather_ingot',
        3: 'white_silver_ingot',
        4: 'hell_steel_ingot',
        5: 'thunder_steel_ingot',
        6: 'brilliant_crystal',
        7: 'star_crystal'
    },
    
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
    
    // 代币配置
    tokens: [
        { id: 'wood_token', name: '伐木代币', icon: '🪙' },
        { id: 'mining_token', name: '挖矿代币', icon: '🪙' },
        { id: 'gathering_token', name: '采集代币', icon: '🪙' },
        { id: 'crafting_token', name: '制作代币', icon: '🪙' },
        { id: 'forging_token', name: '锻造代币', icon: '🪙' },
        { id: 'tailoring_token', name: '缝制代币', icon: '🪙' },
        { id: 'alchemy_token', name: '炼金代币', icon: '🪙' },
        { id: 'brewing_token', name: '酿造代币', icon: '🪙' }
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
    MANUSCRIPT: { inventoryKey: 'manuscriptsInventory', name: '手稿' },
    CLEANED_FEATHER: { inventoryKey: 'cleanedFeathersInventory', name: '净羽' },
    INGOT: { inventoryKey: 'ingotsInventory', name: '矿锭' },
    THREAD: { inventoryKey: 'threadsInventory', name: '丝线' },
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
    CRAFTING_MANUSCRIPT: {
        id: 'crafting_manuscript',
        name: '手稿',
        configKey: 'manuscripts',
        skillKey: 'craftingLevel',
        expKey: 'craftingExp',
        inventoryKey: 'manuscriptsInventory',
        resultType: 'MANUSCRIPT',
        materialType: 'WOOD',
        needsMaterials: true
    },
    CRAFTING_FEATHER: {
        id: 'crafting_feather',
        name: '净羽',
        configKey: 'cleanedFeathers',
        skillKey: 'craftingLevel',
        expKey: 'craftingExp',
        inventoryKey: 'cleanedFeathersInventory',
        resultType: 'CLEANED_FEATHER',
        materialType: 'GATHERING',
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
    TAILORING_THREAD: {
        id: 'tailoring_thread',
        name: '丝线',
        configKey: 'threads',
        skillKey: 'tailoringLevel',
        expKey: 'tailoringExp',
        inventoryKey: 'threadsInventory',
        resultType: 'THREAD',
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
        skillKey: 'alchemyLevel',
        expKey: 'alchemyExp',
        inventoryKey: 'essencesInventory',
        resultType: 'ESSENCE',
        materialType: 'GATHERING',
        needsMaterials: true
    }
};

// 强化系统配置（添加到 CONFIG）
CONFIG.enhanceConfig = {
    // 强化时间（毫秒）
    duration: 12000,
    
    // 强化加成表（总加成百分比）
    bonusTable: {
        1: 0.020,   // +1: 2.0%
        2: 0.042,   // +2: 4.2%
        3: 0.066,   // +3: 6.6%
        4: 0.092,   // +4: 9.2%
        5: 0.120,   // +5: 12.0%
        6: 0.150,   // +6: 15.0%
        7: 0.182,   // +7: 18.2%
        8: 0.216,   // +8: 21.6%
        9: 0.252,   // +9: 25.2%
        10: 0.290,  // +10: 29.0%
        11: 0.334,  // +11: 33.4%
        12: 0.384,  // +12: 38.4%
        13: 0.440,  // +13: 44.0%
        14: 0.502,  // +14: 50.2%
        15: 0.570,  // +15: 57.0%
        16: 0.644,  // +16: 64.4%
        17: 0.724,  // +17: 72.4%
        18: 0.810,  // +18: 81.0%
        19: 0.902,  // +19: 90.2%
        20: 1.000   // +20: 100.0%
    },
    
    // 金币消耗（按品质等级）
    goldCost: {
        1: 20,     // T1 青闪
        2: 50,     // T2 赤铁
        3: 120,    // T3 轻羽
        4: 300,    // T4 白银
        5: 700,    // T5 狱炎
        6: 1500,   // T6 雷鸣
        7: 2200,   // T7 璀璨
        8: 3000    // T8 星辉
    },
    
    // 强化材料消耗（按品质等级，非锤子）
    materialCost: {
        1: { ore: 2, plank: 2 },    // T1
        2: { ore: 4, plank: 2 },    // T2
        3: { ore: 5, plank: 3 },    // T3
        4: { ore: 7, plank: 5 },    // T4
        5: { ore: 9, plank: 6 },    // T5
        6: { ore: 11, plank: 8 },   // T6
        7: { ore: 12, plank: 8 },   // T7
        8: { ore: 12, plank: 8 }    // T8
    },
    
    // 锤子强化材料消耗（矿锭）
    hammerMaterialCost: {
        1: { ingot: 2 },
        2: { ingot: 3 },
        3: { ingot: 4 },
        4: { ingot: 6 },
        5: { ingot: 9 },
        6: { ingot: 13 },
        7: { ingot: 18 },
        8: { ingot: 18 }
    },
    
    // 成功率
    successRate: {
        1: 0.50,        // +1: 50%
        '2-3': 0.45,    // +2~+3: 45%
        '4-6': 0.40,    // +4~+6: 40%
        '7-10': 0.35,   // +7~+10: 35%
        '11-20': 0.30   // +11~+20: 30%
    },
    
    // 破碎概率（仅+13~+20失败时触发）
    breakRate: {
        13: 0.03,
        14: 0.05,
        15: 0.08,
        16: 0.12,
        17: 0.16,
        18: 0.22,
        19: 0.30,
        20: 0.40
    },
    
    // 经验计算
    expBase: 15,
    qualityMultiplier: {
        1: 1,    // T1
        2: 2,    // T2
        3: 4,    // T3
        4: 8,    // T4
            5: 16,   // T5
        6: 32,   // T6
        7: 64,   // T7
        8: 128   // T8
    },
    levelMultiplier: {
        '1-5': 1,
        '6-10': 2,
        '11-15': 4,
        '16-20': 8
    }
};

// 工具品质等级映射（根据工具ID前缀判断）
CONFIG.toolTierMap = {
    'cyan': 1,      // 青闪 -> T1
    'red': 2,       // 赤铁 -> T2
    'feather': 3,   // 轻羽 -> T3
    'white': 4,     // 白银 -> T4
    'hell': 5,      // 狱炎 -> T5
    'thunder': 6,   // 雷鸣 -> T6
    'brilliant': 7, // 璀璨 -> T7
    'star': 8       // 星辉 -> T8
};

// 矿锭ID映射（用于锤子强化消耗）
CONFIG.ingotIdMapping = {
    0: 'cyan_ingot',
    1: 'red_copper_ingot',
    2: 'feather_ingot',
    3: 'white_silver_ingot',
    4: 'hell_steel_ingot',
    5: 'thunder_steel_ingot',
    6: 'brilliant_crystal',
    7: 'star_crystal'
};

// 木板ID映射
CONFIG.plankIdMapping = {
    0: 'pine_plank',
    1: 'iron_birch_plank',
    2: 'wind_tree_plank',
    3: 'flame_tree_plank',
    4: 'frost_maple_plank',
    5: 'thunder_tree_plank',
    6: 'ancient_oak_plank',
    7: 'world_tree_plank'
};

// 矿石ID映射
CONFIG.oreIdMapping = {
    0: 'cyan_ore',
    1: 'red_iron',
    2: 'feather_ore',
    3: 'hell_ore',
    4: 'white_ore',
    5: 'thunder_ore',
    6: 'brilliant',
    7: 'star_ore'
};

// 材料中文名称映射
CONFIG.materialNames = {
    // 矿锭
    'cyan_ingot': '青闪锭',
    'red_copper_ingot': '赤铜锭',
    'feather_ingot': '羽铁锭',
    'white_silver_ingot': '白银锭',
    'hell_steel_ingot': '狱炎钢锭',
    'thunder_steel_ingot': '雷鸣钢锭',
    'brilliant_crystal': '璀璨晶',
    'star_crystal': '星辉晶',
    
    // 矿石
    'cyan_ore': '青闪矿',
    'red_iron': '赤铁矿',
    'feather_ore': '羽石矿',
    'hell_ore': '狱炎矿',
    'white_ore': '白鸠矿',
    'thunder_ore': '雷鸣矿',
    'brilliant': '璀璨矿',
    'star_ore': '星辉矿',
    
    // 木板
    'pine_plank': '青杉木板',
    'iron_birch_plank': '铁桦木板',
    'wind_tree_plank': '风啸木板',
    'flame_tree_plank': '焰心木板',
    'frost_maple_plank': '霜叶枫木板',
    'thunder_tree_plank': '雷鸣木板',
    'ancient_oak_plank': '古橡木板',
    'world_tree_plank': '世界树木板'
};

module.exports = { CONFIG, ITEM_TYPES, ACTION_TYPES };
