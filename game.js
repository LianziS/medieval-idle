/**
 * 中世纪雇佣兵 - 放置游戏（侧边栏版本）
 */

// 经验值表 (1-200 级)
const EXP_TABLE = {
    1: 0, 2: 33, 3: 76, 4: 132, 5: 202, 6: 286, 7: 386, 8: 503, 9: 637, 10: 791,
    11: 964, 12: 1159, 13: 1377, 14: 1620, 15: 1891, 16: 2192, 17: 2525, 18: 2893, 19: 3300, 20: 3750,
    21: 4247, 22: 4795, 23: 5400, 24: 6068, 25: 6805, 26: 7618, 27: 8517, 28: 9508, 29: 10604, 30: 11814,
    31: 13151, 32: 14629, 33: 16262, 34: 18068, 35: 20064, 36: 22271, 37: 24712, 38: 27411, 39: 30396, 40: 33697,
    41: 37346, 42: 41381, 43: 45842, 44: 50773, 45: 56222, 46: 62243, 47: 68895, 48: 76242, 49: 84355, 50: 93311,
    51: 103195, 52: 114100, 53: 126127, 54: 139390, 55: 154009, 56: 170118, 57: 187863, 58: 207403, 59: 228914, 60: 252584,
    61: 278623, 62: 307256, 63: 338731, 64: 373318, 65: 411311, 66: 453030, 67: 498824, 68: 549074, 69: 604193, 70: 664632,
    71: 730881, 72: 803472, 73: 882985, 74: 970050, 75: 1065351, 76: 1169633, 77: 1283701, 78: 1408433, 79: 1544780, 80: 1693774,
    81: 1856536, 82: 2034279, 83: 2228321, 84: 2440088, 85: 2671127, 86: 2923113, 87: 3197861, 88: 3497335, 89: 3823663, 90: 4179145,
    91: 4566274, 92: 4987741, 93: 5446463, 94: 5945587, 95: 6488521, 96: 7078945, 97: 7720834, 98: 8418485, 99: 9176537, 100: 80000000,
    101: 9123981, 102: 10323654, 103: 11611520, 104: 12993664, 105: 14476562, 106: 16067109, 107: 17772646, 108: 19600984, 109: 21560432, 110: 23659830,
    111: 25908577, 112: 28316670, 113: 30894736, 114: 33654067, 115: 36606666, 116: 39765282, 117: 43143462, 118: 46755591, 119: 50616943, 120: 54743736,
    121: 59153183, 122: 63863552, 123: 68894226, 124: 74265915, 125: 80000000,
    126: 91504904, 127: 104096315, 128: 117857724, 129: 132918094, 130: 149401942,
    131: 167438216, 132: 187163614, 133: 208722829, 134: 232269650, 135: 257967222, 136: 285989350, 137: 316521996, 138: 349764842, 139: 385932842, 140: 425257842,
    141: 467989226, 142: 514395388, 143: 564765226, 144: 619409642, 145: 678663074, 146: 742886059, 147: 812467777, 148: 887827585, 149: 969417578, 150: 1057724278,
    151: 1153270378, 152: 1256617512, 153: 1368368154, 154: 1489168414, 155: 1619710978, 156: 1760738070, 157: 1913044430, 158: 2077480294, 159: 2254954454, 160: 2446437334,
    161: 2652964134, 162: 2875638934, 163: 3115638790, 164: 3374218934, 165: 3652716934, 166: 3952556934, 167: 4275254934, 168: 4622423734, 169: 4995777334, 170: 5397137734,
    171: 5828442934, 172: 6291754134, 173: 6789262934, 174: 7323298934, 175: 7896338934, 176: 8511018934, 177: 9170142934, 178: 9876694934, 179: 10633854934, 180: 11445014934,
    181: 12313794934, 182: 13244062934, 183: 14239950934, 184: 15305982934, 185: 16447102934, 186: 17668702934, 187: 18976654934, 188: 20377342934, 189: 21877694934, 190: 23485214934,
    191: 25208014934, 192: 27054862934, 193: 29035214934, 194: 31159262934, 195: 33437982934, 196: 35883182934, 197: 38507582934, 198: 41324894934, 199: 44349894934, 200: 80000000000
};

const CONFIG = {
    resources: ['gold', 'wood', 'stone', 'herb'],
    buildings: [
        // 帐篷（玩家主基地，0-5级）
        { 
            id: 'tent', 
            name: '简陋帐篷', 
            icon: '⛺', 
            baseCost: { pine: 1 }, // 升级消耗青杉木
            production: {}, 
            unlockReq: null,
            maxLevel: 5, // 最高5级
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
        { id: 'pine', name: '青杉', icon: '🌲', reqLevel: 1, duration: 6000, drop: '青杉木', dropIcon: '🪵', exp: 5 },
        { id: 'iron_birch', name: '铁桦', icon: '🌳', reqLevel: 10, duration: 8000, drop: '铁桦木', dropIcon: '🪵', exp: 7.5 },
        { id: 'wind_tree', name: '风啸树', icon: '🌴', reqLevel: 20, duration: 10000, drop: '风啸木', dropIcon: '🪵', exp: 12.5 },
        { id: 'flame_tree', name: '焰心树', icon: '🔥', reqLevel: 35, duration: 12000, drop: '焰心木', dropIcon: '🪵', exp: 20 },
        { id: 'frost_maple', name: '霜叶枫', icon: '❄️', reqLevel: 50, duration: 14000, drop: '霜叶枫木', dropIcon: '🪵', exp: 30 },
        { id: 'thunder_tree', name: '雷鸣树', icon: '⚡', reqLevel: 65, duration: 16000, drop: '雷鸣木', dropIcon: '🪵', exp: 40 },
        { id: 'ancient_oak', name: '古橡', icon: '🌳', reqLevel: 80, duration: 18000, drop: '古橡木', dropIcon: '🪵', exp: 55 },
        { id: 'world_tree', name: '世界树', icon: '🌍', reqLevel: 95, duration: 30000, drop: '世界树枝', dropIcon: '🌿', exp: 73 }
    ],
    // 矿石配置
    ores: [
        { id: 'cyan_ore', name: '青闪矿', icon: '💎', reqLevel: 1, duration: 6000, drop: '青闪石', dropIcon: '💎', exp: 5 },
        { id: 'red_iron', name: '赤铁矿', icon: '🔴', reqLevel: 10, duration: 8000, drop: '赤铁石', dropIcon: '🪨', exp: 7.5 },
        { id: 'feather_ore', name: '羽石矿', icon: '🪶', reqLevel: 20, duration: 10000, drop: '羽石', dropIcon: '🪨', exp: 12.5 },
        { id: 'hell_ore', name: '白鸠矿', icon: '⚪', reqLevel: 35, duration: 12000, drop: '白鸠石', dropIcon: '🪨', exp: 20 },
        { id: 'white_ore', name: '狱炎矿', icon: '🔥', reqLevel: 50, duration: 14000, drop: '狱炎石', dropIcon: '🪨', exp: 30 },
        { id: 'thunder_ore', name: '雷鸣矿', icon: '⚡', reqLevel: 65, duration: 16000, drop: '雷鸣石', dropIcon: '🪨', exp: 40 },
        { id: 'brilliant', name: '曜光结晶', icon: '✨', reqLevel: 80, duration: 18000, drop: '璀璨原石', dropIcon: '💎', exp: 55 },
        { id: 'star_ore', name: '月华结晶', icon: '⭐', reqLevel: 95, duration: 30000, drop: '星辉原石', dropIcon: '💎', exp: 73 }
    ],
    // 采集地点配置
    gatheringLocations: [
        {
            id: 'char_border',
            name: '夏尔边境',
            reqLevel: 1,
            duration: 6000,
            exp: 2,
            items: [
                { id: 'sweet_berry', name: '甜浆果', icon: '🫐', futureUse: ['酿酒'] },
                { id: 'wild_mint', name: '野薄荷', icon: '🌿', futureUse: ['炼金', '酿酒'] },
                { id: 'honey', name: '蜂蜜', icon: '🍯', futureUse: ['制药', '酿酒'] },
                { id: 'blood_rose', name: '血蔷薇', icon: '🌹', futureUse: ['制药'] },
                { id: 'jute', name: '黄麻', icon: '🌾', futureUse: ['裁缝', '锻造'] }
            ]
        },
        {
            id: 'wolf_forest',
            name: '狼林边缘',
            reqLevel: 10,
            duration: 8000,
            exp: 3,
            items: [
                { id: 'wheat', name: '小麦', icon: '🌾', futureUse: ['酿酒'] },
                { id: 'pine_needle', name: '松针', icon: '🌲', futureUse: ['炼金', '酿酒'] },
                { id: 'star_dew_herb', name: '星露草', icon: '🌿', futureUse: ['制药'] },
                { id: 'flax', name: '亚麻', icon: '🧶', futureUse: ['裁缝', '锻造'] },
                { id: 'feather', name: '羽毛', icon: '🪶', futureUse: ['裁缝', '笔'] }
            ]
        },
        {
            id: 'riverland',
            name: '河间地带',
            reqLevel: 20,
            duration: 10000,
            exp: 4,
            items: [
                { id: 'hops', name: '啤酒花', icon: '🌿', futureUse: ['酿酒'] },
                { id: 'vanilla', name: '香草', icon: '🌱', futureUse: ['炼金', '酿酒'] },
                { id: 'blossom_honey', name: '百花蜜', icon: '🍯', futureUse: ['制药', '酿酒'] },
                { id: 'red_serpent_fruit', name: '赤炼蛇果', icon: '🍎', futureUse: ['制药'] },
                { id: 'jade_feather', name: '翡翠羽', icon: '🦜', futureUse: ['裁缝', '笔'] }
            ]
        },
        {
            id: 'arin_valley',
            name: '艾林谷地',
            reqLevel: 35,
            duration: 12000,
            exp: 5,
            items: [
                { id: 'apple', name: '苹果', icon: '🍎', futureUse: ['酿酒'] },
                { id: 'sage', name: '鼠尾草', icon: '🌿', futureUse: ['炼金', '酿酒'] },
                { id: 'moonlight_mushroom', name: '月光菇', icon: '🍄', futureUse: ['制药'] },
                { id: 'wool', name: '羊毛', icon: '🧶', futureUse: ['裁缝', '锻造'] },
                { id: 'falcon_tail_feather', name: '猎隼的尾羽', icon: '🦅', futureUse: ['裁缝', '笔'] }
            ]
        },
        {
            id: 'lorhan_plain',
            name: '洛汗平原',
            reqLevel: 50,
            duration: 15000,
            exp: 6,
            items: [
                { id: 'grape', name: '葡萄', icon: '🍇', futureUse: ['酿酒'] },
                { id: 'chili', name: '辣椒', icon: '🌶️', futureUse: ['炼金', '酿酒'] },
                { id: 'moonlight_honey', name: '月光蜜', icon: '🍯', futureUse: ['制药', '酿酒'] },
                { id: 'silk', name: '蚕丝', icon: '🧵', futureUse: ['锻造', '裁缝'] },
                { id: 'soul_herb', name: '灵魂草', icon: '🌿', futureUse: ['制药'] }
            ]
        },
        {
            id: 'dorn_border',
            name: '多恩边疆',
            reqLevel: 65,
            duration: 18000,
            exp: 7,
            items: [
                { id: 'rye', name: '黑麦', icon: '🌾', futureUse: ['酿酒'] },
                { id: 'mist_flower', name: '雾菱花', icon: '💠', futureUse: ['炼金', '酿酒'] },
                { id: 'wild_heart', name: '原野之心', icon: '💚', futureUse: ['制药'] },
                { id: 'wind_velvet', name: '风语绒', icon: '🧶', futureUse: ['锻造', '裁缝'] },
                { id: 'rainbow_feather', name: '虹羽', icon: '🌈', futureUse: ['裁缝', '笔'] }
            ]
        },
        {
            id: 'sigh_canyon',
            name: '叹息峡谷',
            reqLevel: 80,
            duration: 22000,
            exp: 8,
            items: [
                { id: 'mist_fruit', name: '雾果', icon: '🍑', futureUse: ['酿酒'] },
                { id: 'rock_rose_honey', name: '岩玫瑰蜜', icon: '🍯', futureUse: ['制药', '酿酒'] },
                { id: 'bewitch_berry', name: '迷心浆果', icon: '🫐', futureUse: ['制药'] },
                { id: 'harpy_feather', name: '鹰身人的羽毛', icon: '🦅', futureUse: ['裁缝', '笔'] }
            ]
        },
        {
            id: 'dragon_ridge',
            name: '龙脊山脉',
            reqLevel: 95,
            duration: 30000,
            exp: 10,
            items: [
                { id: 'dragon_blood_fruit', name: '龙血果', icon: '🐉', futureUse: ['酿酒'] },
                { id: 'four_leaf_clover', name: '四叶草', icon: '🍀', futureUse: ['炼金', '酿酒'] },
                { id: 'life_fiber', name: '生命纤维', icon: '🧵', futureUse: ['锻造', '裁缝'] },
                { id: 'star_blossom', name: '星辰花', icon: '⭐', futureUse: ['制药'] }
            ]
        }
    ],
    gatherActions: [
        { id: 'chop', name: '伐木', icon: '🪓', desc: '+5 木材', duration: 3000, reward: { wood: 5 }, exp: 2 },
        { id: 'mine_action', name: '挖矿', icon: '⛏️', desc: '+3 石头', duration: 4000, reward: { stone: 3 }, exp: 3 },
        { id: 'herb', name: '采药', icon: '🌿', desc: '+4 草药', duration: 3500, reward: { herb: 4 }, exp: 2 },
        { id: 'quest', name: '小任务', icon: '📜', desc: '+10 金币', duration: 5000, reward: { gold: 10 }, exp: 5 }
    ],
    craftRecipes: [
        { id: 'iron_sword', name: '铁剑', icon: '🗡️', desc: '攻击 +5', cost: { wood: 20, stone: 30 }, reqBuilding: 'smithy', exp: 10 },
        { id: 'wood_bow', name: '木弓', icon: '🏹', desc: '攻击 +3', cost: { wood: 40 }, reqBuilding: 'workshop', exp: 8 },
        { id: 'health_potion', name: '生命药水', icon: '🧪', desc: '战斗恢复', cost: { herb: 15 }, reqBuilding: 'alchemy', exp: 5 }
    ],
    combatZones: [
        { id: 'forest', name: '迷雾森林', icon: '🌲', difficulty: 1, duration: 10000, rewards: [{ item: 'gold', min: 15, max: 30 }, { item: 'wood', min: 5, max: 15 }], reqLevel: 1 },
        { id: 'cave', name: '哥布林洞穴', icon: '🕳️', difficulty: 2, duration: 15000, rewards: [{ item: 'gold', min: 30, max: 60 }, { item: 'stone', min: 10, max: 20 }], reqLevel: 3 },
        { id: 'ruins', name: '古代废墟', icon: '🏛️', difficulty: 3, duration: 20000, rewards: [{ item: 'gold', min: 60, max: 120 }, { item: 'herb', min: 10, max: 25 }], reqLevel: 5 },
        { id: 'dragon_lair', name: '龙之巢穴', icon: '🐉', difficulty: 5, duration: 30000, rewards: [{ item: 'gold', min: 150, max: 300 }, { item: 'stone', min: 50, max: 100 }], reqLevel: 10 }
    ],
    // 木板制作配置
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
    // 商人配置
    merchants: [
        { 
            id: 'architect', 
            name: '建筑师', 
            title: '建筑大师',
            avatar: '🏗️', 
            favorability: 0,
            goods: [{ id: 'architect_scroll', name: '建筑大师卷轴', icon: '📜', price: 1000, currency: 'gold' }],
            quests: [
                { id: 'architect_quest_1', name: '木材收集', desc: '提交 20 木材', reward: { gold: 200, favorability: 0.5 }, requirement: { wood_material: 20 } }
            ]
        },
        { 
            id: 'carpenter', 
            name: '木匠', 
            title: '木工大师',
            avatar: '🪚', 
            favorability: 0,
            goods: [{ id: 'carpenter_scroll', name: '木工大师卷轴', icon: '📜', price: 1000, currency: 'gold' }],
            quests: [
                { id: 'carpenter_quest_1', name: '木板订单', desc: '提交 10 木板', reward: { gold: 150, favorability: 0.5 }, requirement: { plank: 10 } }
            ]
        },
        { 
            id: 'armorsmith', 
            name: '铸甲师', 
            title: '锻造大师',
            avatar: '⚒️', 
            favorability: 0,
            goods: [{ id: 'armorsmith_scroll', name: '锻造大师卷轴', icon: '📜', price: 1000, currency: 'gold' }],
            quests: [
                { id: 'armorsmith_quest_1', name: '矿锭订单', desc: '提交 10 矿锭', reward: { gold: 150, favorability: 0.5 }, requirement: { ingot: 10 } }
            ]
        },
        { 
            id: 'tailor', 
            name: '缝缀师', 
            title: '裁缝大师',
            avatar: '🧵', 
            favorability: 0,
            goods: [{ id: 'tailor_scroll', name: '裁缝大师卷轴', icon: '📜', price: 1000, currency: 'gold' }],
            quests: [
                { id: 'tailor_quest_1', name: '布料订单', desc: '提交 10 布料', reward: { gold: 120, favorability: 0.5 }, requirement: { fabric: 10 } }
            ]
        },
        { 
            id: 'alchemist', 
            name: '药剂师', 
            title: '炼金大师',
            avatar: '⚗️', 
            favorability: 0,
            goods: [{ id: 'alchemist_scroll', name: '药剂大师卷轴', icon: '📜', price: 1000, currency: 'gold' }],
            quests: [
                { id: 'alchemist_quest_1', name: '甜浆果收集', desc: '提交 10 甜浆果', reward: { gold: 100, favorability: 0.5 }, requirement: { sweet_berry: 10 } }
            ]
        },
        { 
            id: 'tavern', 
            name: '酒馆', 
            title: '美酒佳酿',
            avatar: '🍺', 
            favorability: 0,
            goods: [{ id: 'tavern_scroll', name: '酿酒秘方', icon: '📜', price: 1000, currency: 'gold' }],
            quests: [
                { id: 'tavern_quest_1', name: '酿造材料', desc: '提交 10 蜂蜜', reward: { gold: 180, favorability: 0.5 }, requirement: { honey: 10 } }
            ]
        }
    ],
    // 资源出售价格
    resourcePrices: {
        wood: 2,
        stone: 3,
        herb: 5
    },
    // 代币配置
    tokens: {
        wood_token: { id: 'wood_token', name: '伐木代币', icon: '🪙' },
        mining_token: { id: 'mining_token', name: '挖矿代币', icon: '🪙' },
        gathering_token: { id: 'gathering_token', name: '采集代币', icon: '🪙' },
        forging_token: { id: 'forging_token', name: '锻造代币', icon: '🪙' },
        crafting_token: { id: 'crafting_token', name: '制作代币', icon: '🪙' },
        alchemy_token: { id: 'alchemy_token', name: '制药代币', icon: '🪙' },
        tailoring_token: { id: 'tailoring_token', name: '缝制代币', icon: '🪙' }
    },
    // 代币获取概率配置
    tokenDropRates: {
        // 伐木、挖矿、采集、锻造矿锭、制作木板、制药: 1-8级概率
        standard: [0.017, 0.024, 0.037, 0.053, 0.071, 0.092, 0.149, 0.210],
        // 锻造工具: 1-8级概率
        tool: [0.017, 0.033, 0.061, 0.110, 0.196, 0.343, 0.590, 0.990],
        // 缝制布料: 1-6级概率
        tailoring: [0.017, 0.032, 0.053, 0.078, 0.126, 0.195]
    },
    // 工具配置
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
        ]
    },
    // 工具锻造材料配置
    toolCraftingMaterials: {
        axes: [
            { ore: 10, plank: 6, prevTool: null },                                                      // 青闪斧
            { ore: 16, plank: 10, prevTool: 'cyan_axe' },                                               // 赤铁斧
            { ore: 22, plank: 14, prevTool: 'red_axe' },                                                // 羽斧
            { ore: 34, plank: 22, prevTool: 'feather_axe' },                                            // 白银斧
            { ore: 52, plank: 34, prevTool: 'white_axe' },                                              // 狱炎斧
            { ore: 76, plank: 50, prevTool: 'hell_axe' },                                               // 雷鸣斧
            { ore: 106, plank: 70, prevTool: 'thunder_axe' },                                           // 璀璨斧
            { ore: 142, plank: 94, prevTool: 'brilliant_axe' }                                          // 星辉斧
        ],
        pickaxes: [
            { ore: 10, plank: 6, prevTool: null },                                                      // 青闪镐
            { ore: 16, plank: 10, prevTool: 'cyan_pickaxe' },                                           // 赤铁镐
            { ore: 22, plank: 14, prevTool: 'red_pickaxe' },                                            // 羽镐
            { ore: 34, plank: 22, prevTool: 'feather_pickaxe' },                                        // 白银镐
            { ore: 52, plank: 34, prevTool: 'white_pickaxe' },                                          // 狱炎镐
            { ore: 76, plank: 50, prevTool: 'hell_pickaxe' },                                           // 雷鸣镐
            { ore: 106, plank: 70, prevTool: 'thunder_pickaxe' },                                       // 璀璨镐
            { ore: 142, plank: 94, prevTool: 'brilliant_pickaxe' }                                      // 星辉镐
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
        ]
    },
    // 矿石与矿锭的映射（用于工具锻造）
    oreIngotMapping: {
        'cyan_ore': 'cyan_ingot',
        'red_iron': 'red_copper_ingot',
        'feather_ore': 'feather_ingot',
        'hell_ore': 'white_silver_ingot',
        'white_ore': 'hell_steel_ingot',
        'thunder_ore': 'thunder_steel_ingot',
        'brilliant': 'brilliant_crystal',
        'star_ore': 'star_crystal'
    },
    // 木板ID映射
    plankIdMapping: {
        0: 'pine_plank',      // 青杉木板
        1: 'iron_birch_plank', // 铁桦木板
        2: 'wind_tree_plank',  // 风啸木板
        3: 'frost_maple_plank', // 霜叶木板
        4: 'flame_tree_plank',  // 焰心木板
        5: 'thunder_tree_plank', // 雷鸣木板
        6: 'ancient_oak_plank',  // 古橡木板
        7: 'world_tree_plank'    // 世界木板
    },
    // 矿锭ID映射（用于工具锻造）
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
    // 药水配置（按等级交替排列：素级HP→素级MP→良级HP→良级MP...）
    potions: [
        // 素级
        { id: 'hp_potion_1', name: '素级生命药水', icon: '🧪', type: 'hp', reqLevel: 1, duration: 6000, exp: 4, materials: { sweet_berry: 1, blood_rose: 1, honey: 4 } },
        { id: 'mp_potion_1', name: '素级魔法药水', icon: '💧', type: 'mp', reqLevel: 1, duration: 6000, exp: 4, materials: { sweet_berry: 1, star_dew_herb: 1, honey: 4 } },
        // 良级
        { id: 'hp_potion_2', name: '良级生命药水', icon: '🧪', type: 'hp', reqLevel: 10, duration: 6750, exp: 8, materials: { wheat: 1, blood_rose: 1, honey: 4 } },
        { id: 'mp_potion_2', name: '良级魔法药水', icon: '💧', type: 'mp', reqLevel: 10, duration: 6750, exp: 8, materials: { wheat: 1, star_dew_herb: 1, honey: 4 } },
        // 中级
        { id: 'hp_potion_3', name: '中级生命药水', icon: '🧪', type: 'hp', reqLevel: 20, duration: 7500, exp: 12, materials: { hops: 1, red_serpent_fruit: 1, blossom_honey: 4 } },
        { id: 'mp_potion_3', name: '中级魔法药水', icon: '💧', type: 'mp', reqLevel: 20, duration: 7500, exp: 12, materials: { hops: 1, moonlight_mushroom: 1, blossom_honey: 4 } },
        // 优级
        { id: 'hp_potion_4', name: '优级生命药水', icon: '🧪', type: 'hp', reqLevel: 35, duration: 8250, exp: 18, materials: { apple: 1, red_serpent_fruit: 1, blossom_honey: 4 } },
        { id: 'mp_potion_4', name: '优级魔法药水', icon: '💧', type: 'mp', reqLevel: 35, duration: 8250, exp: 18, materials: { apple: 1, moonlight_mushroom: 1, blossom_honey: 4 } },
        // 高级
        { id: 'hp_potion_5', name: '高级生命药水', icon: '🧪', type: 'hp', reqLevel: 50, duration: 9000, exp: 24, materials: { grape: 1, wild_heart: 1, moonlight_honey: 4 } },
        { id: 'mp_potion_5', name: '高级魔法药水', icon: '💧', type: 'mp', reqLevel: 50, duration: 9000, exp: 24, materials: { grape: 1, soul_herb: 1, moonlight_honey: 4 } },
        // 特级
        { id: 'hp_potion_6', name: '特级生命药水', icon: '🧪', type: 'hp', reqLevel: 65, duration: 10500, exp: 32, materials: { rye: 1, wild_heart: 1, moonlight_honey: 4 } },
        { id: 'mp_potion_6', name: '特级魔法药水', icon: '💧', type: 'mp', reqLevel: 65, duration: 10500, exp: 32, materials: { rye: 1, soul_herb: 1, moonlight_honey: 4 } },
        // 珍级
        { id: 'hp_potion_7', name: '珍级生命药水', icon: '🧪', type: 'hp', reqLevel: 80, duration: 12000, exp: 40, materials: { mist_fruit: 1, bewitch_berry: 1, rock_rose_honey: 4 } },
        { id: 'mp_potion_7', name: '珍级魔法药水', icon: '💧', type: 'mp', reqLevel: 80, duration: 12000, exp: 40, materials: { mist_fruit: 1, bewitch_berry: 1, rock_rose_honey: 4 } },
        // 至级
        { id: 'hp_potion_8', name: '至级生命药水', icon: '🧪', type: 'hp', reqLevel: 95, duration: 13500, exp: 50, materials: { dragon_blood_fruit: 1, bewitch_berry: 1, rock_rose_honey: 4 } },
        { id: 'mp_potion_8', name: '至级魔法药水', icon: '💧', type: 'mp', reqLevel: 95, duration: 13500, exp: 50, materials: { dragon_blood_fruit: 1, bewitch_berry: 1, rock_rose_honey: 4 } }
    ],
    // 提炼精华配置
    essences: [
        { id: 'mint_essence', name: '薄荷精华', icon: '💚', reqLevel: 6, duration: 6000, exp: 4, materials: { wild_mint: 2 } },
        { id: 'pine_essence', name: '松针精华', icon: '🌲', reqLevel: 10, duration: 8000, exp: 8, materials: { pine_needle: 2 } },
        { id: 'vanilla_essence', name: '香草精华', icon: '🌱', reqLevel: 16, duration: 11000, exp: 12, materials: { vanilla: 2 } },
        { id: 'sage_essence', name: '鼠尾草精华', icon: '🌿', reqLevel: 22, duration: 14000, exp: 18, materials: { sage: 2 } },
        { id: 'chili_essence', name: '辣椒精华', icon: '🌶️', reqLevel: 30, duration: 17000, exp: 24, materials: { chili: 2 } },
        { id: 'mist_essence', name: '雾菱精华', icon: '💠', reqLevel: 40, duration: 20000, exp: 32, materials: { mist_flower: 2 } },
        { id: 'clover_essence', name: '四叶草精华', icon: '🍀', reqLevel: 55, duration: 30000, exp: 40, materials: { four_leaf_clover: 2 } }
    ]
};

let gameState = {
    resources: { gold: 0, wood: 0, stone: 0, herb: 0 },
    buildings: {},
    level: 1, exp: 0,
    startTime: Date.now(),
    activeActions: {},
    activeWoodcutting: null,
    activeMining: null,
    combat: { active: false, zoneId: null, endTime: 0 },
    currentZoneIndex: 0,
    currentPage: 'home',
    lastSave: Date.now(),
    // 各技能独立等级和经验
    woodcuttingLevel: 1,
    woodcuttingExp: 0,
    miningLevel: 1,
    miningExp: 0,
    gatheringLevel: 1,
    gatheringExp: 0,
    craftingLevel: 1,
    craftingExp: 0,
    combatLevel: 1,
    combatExp: 0,
    // 采集状态
    activeGathering: null,
    gatheringLocationId: null,
    gatheringItemId: null,
    gatheringRemaining: 0,
    gatheringCount: 0,
    // 全局行动状态
    currentAction: null,
    actionStartTime: 0,
    actionDuration: 0,
    // 商人系统状态
    merchantData: {},
    activeQuests: {},
    warehouseSelection: [],
    isSelectMode: false,
    sellConfirming: false,
    // 物品存储
    woodcuttingInventory: {},
    miningInventory: {},
    gatheringInventory: {},
    // 制作状态
    activeCrafting: null,
    craftingCount: 0,
    craftingRemaining: 0,
    // 木板存储
    planksInventory: {},
    // 锻造状态
    forgingLevel: 1,
    forgingExp: 0,
    activeForging: null,
    forgingCount: 0,
    forgingRemaining: 0,
    // 锻造工具状态
    activeForgingTool: null,
    forgingToolCount: 0,
    forgingToolRemaining: 0,
    // 矿锭存储
    ingotsInventory: {},
    // 缝制状态
    tailoringLevel: 1,
    tailoringExp: 0,
    activeTailoring: null,
    tailoringCount: 0,
    tailoringRemaining: 0,
    // 布料存储
    fabricsInventory: {},
    // 炼金状态
    alchemyLevel: 1,
    alchemyExp: 0,
    activeAlchemy: null,
    alchemyCount: 0,
    alchemyRemaining: 0,
    // 提炼精华状态
    activeEssence: null,
    essenceCount: 0,
    essenceRemaining: 0,
    // 药水存储
    potionsInventory: {},
    // 精华存储
    essencesInventory: {},
    // 代币存储
    tokensInventory: {
        wood_token: 0,        // 伐木代币
        mining_token: 0,      // 挖矿代币
        gathering_token: 0,   // 采集代币
        forging_token: 0,     // 锻造代币
        crafting_token: 0,    // 制作代币
        alchemy_token: 0,     // 制药代币
        tailoring_token: 0    // 缝制代币
    },
    // 装备系统
    equipment: {
        axe: null,
        pickaxe: null,
        chisel: null,
        needle: null,
        scythe: null,
        hammer: null
    },
    toolsInventory: {
        axes: [],
        pickaxes: [],
        chisels: [],
        needles: [],
        scythes: [],
        hammers: []
    },
    // 行动队列系统
    actionQueue: [],     // 行动队列（最多5个）
    maxQueueSize: 4,
    // 当前行动的定时器ID（用于取消时清除）
    actionTimerId: null
};

CONFIG.buildings.forEach(b => { gameState.buildings[b.id] = { level: 0 }; });

// 初始化商人数据
CONFIG.merchants.forEach(m => {
    gameState.merchantData[m.id] = {
        favorability: m.favorability,
        completedQuests: []
    };
});

const elements = {
    sidebar: document.getElementById('sidebar'),
    navItems: document.querySelectorAll('.nav-item'),
    pages: document.querySelectorAll('.page'),
    level: document.getElementById('level'),
    topLevel: document.getElementById('top-level'),
    storageGold: document.getElementById('storage-gold'),
    storageWood: document.getElementById('storage-wood'),
    storageStone: document.getElementById('storage-stone'),
    storageHerb: document.getElementById('storage-herb'),
    combatLocation: document.getElementById('combat-location'),
    combatTimer: document.getElementById('combat-timer'),
    combatBtn: document.getElementById('combat-btn'),
    combatRewards: document.getElementById('combat-rewards'),
    combatZones: document.getElementById('combat-zones'),
    buildingsList: document.getElementById('buildings-list'),
    gatherActions: document.getElementById('gather-actions'),
    craftActions: document.getElementById('craft-actions'),
    woodcuttingList: document.getElementById('woodcutting-list'),
    woodcuttingExpFill: document.getElementById('woodcutting-exp-fill'),
    woodcuttingLevel: document.getElementById('woodcutting-level'),
    miningList: document.getElementById('mining-list'),
    miningExpFill: document.getElementById('mining-exp-fill'),
    miningLevel: document.getElementById('mining-level'),
    gatheringTabs: document.getElementById('gathering-tabs'),
    gatheringItemsList: document.getElementById('gathering-items-list'),
    gatheringExpFill: document.getElementById('gathering-exp-fill'),
    gatheringLevel: document.getElementById('gathering-level'),
    // 制作
    craftingExpFill: document.getElementById('crafting-exp-fill'),
    craftingLevel: document.getElementById('crafting-level'),
    craftingPlanksList: document.getElementById('crafting-planks-list'),
    // 锻造
    forgingExpFill: document.getElementById('forging-exp-fill'),
    forgingLevel: document.getElementById('forging-level'),
    forgingIngotsList: document.getElementById('forging-ingots-list'),
    forgingToolsList: document.getElementById('forging-tools-list'),
    // 缝制
    tailoringExpFill: document.getElementById('tailoring-exp-fill'),
    tailoringLevel: document.getElementById('tailoring-level'),
    tailoringFabricsList: document.getElementById('tailoring-fabrics-list'),
    // 炼金
    alchemyExpFill: document.getElementById('alchemy-exp-fill'),
    alchemyLevel: document.getElementById('alchemy-level'),
    alchemyPotionsList: document.getElementById('alchemy-potions-list'),
    alchemyEssencesList: document.getElementById('alchemy-essences-list'),
    navGatheringExp: document.getElementById('nav-gathering-exp'),
    navGatheringLvl: document.getElementById('nav-gathering-lvl'),
    navCraftingExp: document.getElementById('nav-crafting-exp'),
    navCraftingLvl: document.getElementById('nav-crafting-lvl'),
    navForgingExp: document.getElementById('nav-forging-exp'),
    navForgingLvl: document.getElementById('nav-forging-lvl'),
    navTailoringExp: document.getElementById('nav-tailoring-exp'),
    navTailoringLvl: document.getElementById('nav-tailoring-lvl'),
    navAlchemyExp: document.getElementById('nav-alchemy-exp'),
    navAlchemyLvl: document.getElementById('nav-alchemy-lvl'),
    playTime: document.getElementById('play-time'),
    modal: document.getElementById('modal'),
    modalBody: document.getElementById('modal-body'),
    modalClose: document.querySelector('.modal-close'),
    resetBtn: document.getElementById('reset-btn'),
    // 侧边栏技能经验条
    navWoodcuttingExp: document.getElementById('nav-woodcutting-exp'),
    navWoodcuttingLvl: document.getElementById('nav-woodcutting-lvl'),
    navMiningExp: document.getElementById('nav-mining-exp'),
    navMiningLvl: document.getElementById('nav-mining-lvl'),
    navGatherExp: document.getElementById('nav-gather-exp'),
    navGatherLvl: document.getElementById('nav-gather-lvl'),
    navCraftExp: document.getElementById('nav-craft-exp'),
    navCraftLvl: document.getElementById('nav-craft-lvl'),
    navCombatExp: document.getElementById('nav-combat-exp'),
    navCombatLvl: document.getElementById('nav-combat-lvl'),
    // 顶部行动状态栏
    actionStatusBar: document.getElementById('action-status-bar'),
    actionStatusIcon: document.getElementById('action-status-icon'),
    actionStatusName: document.getElementById('action-status-name'),
    actionProgressFill: document.getElementById('action-progress-fill'),
    actionProgressTime: document.getElementById('action-progress-time'),
    actionCancelBtn: document.getElementById('action-cancel-btn'),
    actionRewards: document.getElementById('action-rewards'),
    // 商人系统
    merchantList: document.getElementById('merchant-list'),
    merchantModal: document.getElementById('merchant-modal'),
    merchantModalOverlay: document.getElementById('merchant-modal-overlay'),
    merchantModalClose: document.getElementById('merchant-modal-close'),
    merchantModalAvatar: document.getElementById('merchant-modal-avatar'),
    merchantModalName: document.getElementById('merchant-modal-name'),
    merchantModalFavorability: document.getElementById('merchant-modal-favorability'),
    merchantTabs: document.querySelectorAll('.merchant-tab'),
    merchantTabTrade: document.getElementById('merchant-tab-trade'),
    merchantTabQuest: document.getElementById('merchant-tab-quest'),
    merchantGoodsList: document.getElementById('merchant-goods-list'),
    merchantQuestList: document.getElementById('merchant-quest-list'),
    merchantWarehouseGrid: document.getElementById('merchant-warehouse-grid'),
    merchantSelectBtn: document.getElementById('merchant-select-btn'),
    merchantSellBar: document.getElementById('merchant-sell-bar'),
    merchantSellTotal: document.getElementById('merchant-sell-total'),
    merchantSellBtn: document.getElementById('merchant-sell-btn'),
    // 行动次数选择弹窗
    actionModal: document.getElementById('action-modal'),
    actionModalTitle: document.getElementById('action-modal-title'),
    actionModalClose: document.getElementById('action-modal-close'),
    actionModalCancel: document.getElementById('action-modal-cancel'),
    actionModalConfirm: document.getElementById('action-modal-confirm'),
    actionModalQueue: document.getElementById('action-modal-queue'),
    actionCountInput: document.getElementById('action-count-input'),
    // 替换行动确认弹窗
    replaceModal: document.getElementById('replace-modal'),
    replaceModalClose: document.getElementById('replace-modal-close'),
    replaceModalCancel: document.getElementById('replace-modal-cancel'),
    replaceModalConfirm: document.getElementById('replace-modal-confirm'),
    replaceModalText: document.getElementById('replace-modal-text'),
    // 行动队列
    actionQueueBtn: document.getElementById('action-queue-btn'),
    queuePopover: document.getElementById('queue-popover'),
    queueList: document.getElementById('queue-list'),
    queuePopoverClose: document.getElementById('queue-popover-close'),
    queueClearBtn: document.getElementById('queue-clear-btn'),
    clearQueueModal: document.getElementById('clear-queue-modal'),
    clearQueueModalClose: document.getElementById('clear-queue-modal-close'),
    clearQueueCancel: document.getElementById('clear-queue-cancel'),
    clearQueueConfirm: document.getElementById('clear-queue-confirm')
};

// 临时存储待执行的行动
let pendingAction = null;

function init() {
    loadGame();
    
    // 初始化建筑（新玩家拥有0级帐篷）
    if (!gameState.buildings.tent) {
        gameState.buildings.tent = { level: 0 };
    }
    
    updateTotalLevel(); // 确保总等级正确计算
    setupSidebar();
    setupNavigation();
    renderBuildings();
    renderGatherActions();
    renderCraftActions();
    renderWoodcutting();
    renderMining();
    renderGathering();
    renderCrafting();
    renderForging();
    renderTailoring();
    renderCombatZones();
    renderAlchemy();
    renderEssencesList();
    renderMerchants();
    setupEventListeners();
    setupMerchantListeners();
    startGameLoop();
    updateUI();
    renderWoodcuttingInventory();
    renderMiningInventory();
    renderGatheringInventory();
    renderPlanksInventory();
    renderIngotsInventory();
    renderPotionsInventory();
    renderEssencesInventory();
    renderFabricsInventory();
    renderToolsInventory();
    renderTokensInventory();
    
    // 初始化仓库二级菜单
    setupStorageTabs();
    
    // 初始化装备栏
    renderEquipmentSlots();
    setupEquipmentListeners();
    setupToolSelectModal();
    
    // 初始化锻造标签页
    setupForgingTabs();
    
    // 初始化炼金标签页
    setupAlchemyTabs();
    
    // 初始化行动队列
    setupActionQueue();
    
    // 更新队列按钮显示
    updateQueueButton();
    
    // 修复刷新页面后进度条异常：如果有进行中的行动，重置进度条和开始时间
    if (gameState.currentAction) {
        // 重置进度条为 0
        if (elements.actionProgressFill) {
            elements.actionProgressFill.style.width = '0%';
        }
        // 重置 actionStartTime 为当前时间，避免进度条计算错误
        gameState.actionStartTime = Date.now();
        // 启动进度条动画
        if (animationFrame) cancelAnimationFrame(animationFrame);
        lastActionStartTime = gameState.actionStartTime;
        animationFrame = requestAnimationFrame(updateActionStatusBarSmooth);
    }
    
    console.log('⚔️ 中世纪雇佣兵 已启动!');
}

function setupSidebar() {
    const toggleBtn = document.getElementById('sidebar-toggle');
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.sidebar.classList.toggle('expanded');
    });
    
    elements.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const page = item.dataset.page;
            const isExpanded = elements.sidebar.classList.contains('expanded');
            const isWideScreen = window.innerWidth >= 1200;
            
            // 只有在非宽屏且侧边栏展开时才关闭
            if (isExpanded && !isWideScreen) {
                elements.sidebar.classList.remove('expanded');
            }
            // 如果侧边栏是关闭的，直接跳转不展开
            switchPage(page);
        });
    });
    
    document.querySelector('.game-container').addEventListener('click', () => {
        const isWideScreen = window.innerWidth >= 1200;
        if (!isWideScreen) {
            elements.sidebar.classList.remove('expanded');
        }
    });
    
    // 根据页面宽度自动展开/收起侧边栏
    function checkSidebarWidth() {
        if (!elements.sidebar) return;
        const width = window.innerWidth;
        const isExpanded = elements.sidebar.classList.contains('expanded');
        const shouldExpand = width >= 1200; // 足够宽时自动展开
        
        if (shouldExpand && !isExpanded) {
            elements.sidebar.classList.add('expanded');
        } else if (!shouldExpand && isExpanded) {
            elements.sidebar.classList.remove('expanded');
        }
    }
    
    window.addEventListener('resize', checkSidebarWidth);
    checkSidebarWidth(); // 初始化检查
}

function setupNavigation() {}

// ============ 商人系统 ============

let currentMerchantId = null;

function renderMerchants() {
    if (!elements.merchantList) return;
    
    const html = CONFIG.merchants.map(merchant => {
        const data = gameState.merchantData[merchant.id];
        const favorability = data ? data.favorability : 0;
        const level = getFavorabilityLevel(favorability);
        const progress = Math.min(100, (favorability % 1) * 100);
        
        return `
            <div class="merchant-card" data-merchant-id="${merchant.id}">
                <div class="merchant-card-header">
                    <div class="merchant-card-avatar">${merchant.avatar}</div>
                    <div class="merchant-card-info">
                        <div class="merchant-card-name">${merchant.name}</div>
                        <div class="merchant-card-title">${merchant.title}</div>
                    </div>
                </div>
                <div class="merchant-favorability-bar">
                    <div class="favorability-label">
                        <span>好感度</span>
                        <span class="favorability-level">${level}</span>
                    </div>
                    <div class="favorability-progress-bg">
                        <div class="favorability-progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    elements.merchantList.innerHTML = html;
    
    // 绑定点击事件
    elements.merchantList.querySelectorAll('.merchant-card').forEach(card => {
        card.addEventListener('click', function() {
            const merchantId = this.dataset.merchantId;
            openMerchantModal(merchantId);
        });
    });
}

function getFavorabilityLevel(favorability) {
    if (favorability >= 3) return '崇敬';
    if (favorability >= 2) return '尊敬';
    if (favorability >= 1) return '友好';
    if (favorability >= 0.5) return '中立';
    return '陌生';
}

function openMerchantModal(merchantId) {
    currentMerchantId = merchantId;
    const merchant = CONFIG.merchants.find(m => m.id === merchantId);
    if (!merchant) return;
    
    // 打开弹窗时恢复 pointer-events
    if (elements.merchantModal) {
        elements.merchantModal.style.pointerEvents = 'auto';
    }
    
    const data = gameState.merchantData[merchant.id];
    
    // 更新弹窗信息
    elements.merchantModalAvatar.textContent = merchant.avatar;
    elements.merchantModalName.textContent = merchant.name;
    elements.merchantModalFavorability.textContent = data.favorability.toFixed(2);
    
    // 重置状态
    gameState.warehouseSelection = [];
    gameState.isSelectMode = false;
    gameState.sellConfirming = false;
    
    // 渲染商品
    renderMerchantGoods(merchant);
    
    // 渲染任务
    renderMerchantQuests(merchant, data);
    
    // 渲染仓库
    renderMerchantWarehouse();
    
    // 显示弹窗
    elements.merchantModal.classList.add('active');
    
    // 默认显示交易栏
    switchMerchantTab('trade');
}

function closeMerchantModal() {
    if (!elements.merchantModal) return;
    elements.merchantModal.classList.remove('active');
    currentMerchantId = null;
    
    // 确保弹窗完全隐藏后不阻挡交互
    // 添加一个短暂的延迟，让 CSS 动画完成
    setTimeout(() => {
        if (elements.merchantModal && !elements.merchantModal.classList.contains('active')) {
            elements.merchantModal.style.pointerEvents = 'none';
        }
    }, 350); // 等待 CSS transition 完成 (0.3s)
}

function renderMerchantGoods(merchant) {
    if (!elements.merchantGoodsList) return;
    
    const html = merchant.goods.map(good => {
        const canAfford = gameState.resources[good.currency] >= good.price;
        return `
            <div class="merchant-goods-item">
                <div class="merchant-goods-icon">${good.icon}</div>
                <div class="merchant-goods-info">
                    <div class="merchant-goods-name">${good.name}</div>
                    <div class="merchant-goods-price">💰 ${good.price} 金币</div>
                </div>
                <button class="merchant-buy-btn" ${!canAfford ? 'disabled' : ''} data-good-id="${good.id}">
                    购买
                </button>
            </div>
        `;
    }).join('');
    
    elements.merchantGoodsList.innerHTML = html;
    
    // 绑定购买事件
    elements.merchantGoodsList.querySelectorAll('.merchant-buy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const goodId = this.dataset.goodId;
            const good = merchant.goods.find(g => g.id === goodId);
            buyGood(merchant, good);
        });
    });
}

function buyGood(merchant, good) {
    const price = good.price;
    const currency = good.currency;
    
    if (gameState.resources[currency] >= price) {
        gameState.resources[currency] -= price;
        showToast(`✅ 购买了 ${good.name}`);
        updateUI();
        saveGame();
        
        // 重新渲染（更新按钮状态）
        renderMerchantGoods(merchant);
    } else {
        showToast('❌ 资源不足');
    }
}

function renderMerchantQuests(merchant, data) {
    if (!elements.merchantQuestList) return;
    
    const html = merchant.quests.map(quest => {
        const isCompleted = data.completedQuests.includes(quest.id);
        const activeQuest = gameState.activeQuests[quest.id];
        const isAccepted = !!activeQuest;
        
        let btnText = '领取任务';
        let btnClass = '';
        let canSubmit = false;
        
        if (isCompleted) {
            btnText = '已完成';
            btnClass = 'disabled';
        } else if (isAccepted) {
            btnText = '提交';
            btnClass = 'submit';
            canSubmit = canSubmitQuest(quest);
        }
        
        return `
            <div class="merchant-quest-item ${isCompleted ? 'completed' : ''}">
                <div class="merchant-quest-header">
                    <div class="merchant-quest-name">${quest.name}</div>
                    <div class="merchant-quest-reward">💰 ${quest.reward.gold} | ❤️ ${quest.reward.favorability}</div>
                </div>
                <div class="merchant-quest-desc">${quest.desc}</div>
                <button class="merchant-quest-btn ${btnClass}" 
                    ${isCompleted ? 'disabled' : ''} 
                    ${isAccepted && !canSubmit ? 'disabled' : ''}
                    data-quest-id="${quest.id}">
                    ${btnText}
                </button>
            </div>
        `;
    }).join('');
    
    elements.merchantQuestList.innerHTML = html;
    
    // 绑定事件
    elements.merchantQuestList.querySelectorAll('.merchant-quest-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const questId = this.dataset.questId;
            const quest = merchant.quests.find(q => q.id === questId);
            handleQuest(merchant, quest, data);
        });
    });
}

function canSubmitQuest(quest) {
    for (const [res, amount] of Object.entries(quest.requirement)) {
        // 检查不同类型的资源
        if (res === 'wood_material') {
            // 木材总数
            const total = Object.values(gameState.woodcuttingInventory || {}).reduce((a, b) => a + b, 0);
            if (total < amount) return false;
        } else if (res === 'plank') {
            // 木板总数
            const total = Object.values(gameState.planksInventory || {}).reduce((a, b) => a + b, 0);
            if (total < amount) return false;
        } else if (res === 'ingot') {
            // 矿锭总数
            const total = Object.values(gameState.ingotsInventory || {}).reduce((a, b) => a + b, 0);
            if (total < amount) return false;
        } else if (res === 'fabric') {
            // 布料总数
            const total = Object.values(gameState.fabricsInventory || {}).reduce((a, b) => a + b, 0);
            if (total < amount) return false;
        } else if (res === 'honey' || res === 'sweet_berry') {
            // 采集物品
            if ((gameState.gatheringInventory[res] || 0) < amount) return false;
        } else if ((gameState.resources[res] || 0) < amount) {
            return false;
        }
    }
    return true;
}

function handleQuest(merchant, quest, data) {
    const activeQuest = gameState.activeQuests[quest.id];
    
    if (activeQuest) {
        // 提交任务
        if (canSubmitQuest(quest)) {
            // 扣除资源
            for (const [res, amount] of Object.entries(quest.requirement)) {
                if (res === 'wood_material') {
                    // 扣除木材（从最低级开始）
                    let remaining = amount;
                    for (const [id, count] of Object.entries(gameState.woodcuttingInventory || {})) {
                        if (remaining <= 0) break;
                        const deduct = Math.min(count, remaining);
                        gameState.woodcuttingInventory[id] -= deduct;
                        remaining -= deduct;
                    }
                } else if (res === 'plank') {
                    // 扣除木板
                    let remaining = amount;
                    for (const [id, count] of Object.entries(gameState.planksInventory || {})) {
                        if (remaining <= 0) break;
                        const deduct = Math.min(count, remaining);
                        gameState.planksInventory[id] -= deduct;
                        remaining -= deduct;
                    }
                } else if (res === 'ingot') {
                    // 扣除矿锭
                    let remaining = amount;
                    for (const [id, count] of Object.entries(gameState.ingotsInventory || {})) {
                        if (remaining <= 0) break;
                        const deduct = Math.min(count, remaining);
                        gameState.ingotsInventory[id] -= deduct;
                        remaining -= deduct;
                    }
                } else if (res === 'fabric') {
                    // 扣除布料
                    let remaining = amount;
                    for (const [id, count] of Object.entries(gameState.fabricsInventory || {})) {
                        if (remaining <= 0) break;
                        const deduct = Math.min(count, remaining);
                        gameState.fabricsInventory[id] -= deduct;
                        remaining -= deduct;
                    }
                } else if (res === 'honey' || res === 'sweet_berry') {
                    gameState.gatheringInventory[res] -= amount;
                } else {
                    gameState.resources[res] -= amount;
                }
            }
            
            // 发放奖励
            gameState.resources.gold += quest.reward.gold;
            gameState.merchantData[merchant.id].favorability += quest.reward.favorability;
            gameState.merchantData[merchant.id].completedQuests.push(quest.id);
            delete gameState.activeQuests[quest.id];
            
            showToast(`✅ 任务完成！+${quest.reward.gold} 金币，+${quest.reward.favorability} 好感度`);
            updateUI();
            saveGame();
            
            // 重新渲染
            renderMerchantQuests(merchant, gameState.merchantData[merchant.id]);
            elements.merchantModalFavorability.textContent = gameState.merchantData[merchant.id].favorability.toFixed(2);
        } else {
            showToast('❌ 资源不足，无法提交任务');
        }
    } else {
        // 领取任务
        gameState.activeQuests[quest.id] = {
            merchantId: merchant.id,
            questId: quest.id,
            acceptedAt: Date.now()
        };
        showToast(`📋 已领取任务：${quest.name}`);
        
        // 重新渲染
        renderMerchantQuests(merchant, data);
    }
}

function renderMerchantWarehouse() {
    if (!elements.merchantWarehouseGrid) return;
    
    let allItems = [];
    
    // 木材（伐木获得）
    const woodNames = { pine: '青杉木', iron_birch: '铁桦木', wind_tree: '风啸木', flame_tree: '焰心木', frost_maple: '霜叶枫木', thunder_tree: '雷鸣木', ancient_oak: '古橡木', world_tree: '世界树枝' };
    Object.entries(gameState.woodcuttingInventory || {}).forEach(([id, count]) => {
        if (count > 0) allItems.push({ id, type: 'wood', icon: '🪵', name: woodNames[id] || id, count });
    });
    
    // 矿石（挖矿获得）
    const oreNames = { cyan_ore: '青闪石', red_iron: '赤铁石', feather_ore: '羽石', hell_ore: '白鸠石', white_ore: '狱炎石', thunder_ore: '雷鸣石', brilliant: '璀璨原石', star_ore: '星辉原石' };
    Object.entries(gameState.miningInventory || {}).forEach(([id, count]) => {
        if (count > 0) allItems.push({ id, type: 'ore', icon: '💎', name: oreNames[id] || id, count });
    });
    
    // 矿锭
    const ingotIcons = { cyan_ingot: '🔩', red_copper_ingot: '🥉', feather_ingot: '🪶', white_silver_ingot: '🪙', hell_steel_ingot: '🔥', thunder_steel_ingot: '⚡', brilliant_crystal: '💎', star_crystal: '✨' };
    const ingotNames = { cyan_ingot: '青闪铁锭', red_copper_ingot: '赤铜锭', feather_ingot: '轻羽锭', white_silver_ingot: '白银锭', hell_steel_ingot: '狱炎钢', thunder_steel_ingot: '雷鸣钢', brilliant_crystal: '璀璨水晶', star_crystal: '星辉水晶' };
    Object.entries(gameState.ingotsInventory || {}).forEach(([id, count]) => {
        if (count > 0) allItems.push({ id, type: 'ingot', icon: ingotIcons[id] || '🔩', name: ingotNames[id] || id, count });
    });
    
    // 木板
    const plankIcons = { pine_plank: '🪵', iron_birch_plank: '🪵', wind_tree_plank: '🪵', frost_maple_plank: '🪵', flame_tree_plank: '🪵', thunder_tree_plank: '🪵', ancient_oak_plank: '🪵', world_tree_plank: '🪵' };
    const plankNames = { pine_plank: '青杉木板', iron_birch_plank: '铁桦木板', wind_tree_plank: '风啸木板', frost_maple_plank: '霜叶木板', flame_tree_plank: '焰心木板', thunder_tree_plank: '雷鸣木板', ancient_oak_plank: '古橡木板', world_tree_plank: '世界木板' };
    Object.entries(gameState.planksInventory || {}).forEach(([id, count]) => {
        if (count > 0) allItems.push({ id, type: 'plank', icon: plankIcons[id] || '🪵', name: plankNames[id] || id, count });
    });
    
    // 布料
    const fabricIcons = { jute_cloth: '🧵', linen_cloth: '🧶', wool_cloth: '🧶', silk_cloth: '🎀', wind_silk: '💨', dream_cloth: '✨' };
    const fabricNames = { jute_cloth: '黄麻布料', linen_cloth: '亚麻布料', wool_cloth: '羊毛布料', silk_cloth: '丝绸布料', wind_silk: '风语绸', dream_cloth: '梦幻布料' };
    Object.entries(gameState.fabricsInventory || {}).forEach(([id, count]) => {
        if (count > 0) allItems.push({ id, type: 'fabric', icon: fabricIcons[id] || '🧵', name: fabricNames[id] || id, count });
    });
    
    // 采集物品
    const gatheringItemInfo = {};
    CONFIG.gatheringLocations.forEach(loc => {
        loc.items.forEach(item => {
            gatheringItemInfo[item.id] = { icon: item.icon, name: item.name };
        });
    });
    Object.entries(gameState.gatheringInventory || {}).forEach(([id, count]) => {
        if (count > 0) {
            const info = gatheringItemInfo[id] || {};
            allItems.push({ id, type: 'gathering', icon: info.icon || '🌿', name: info.name || id, count });
        }
    });
    
    // 药水
    const potionInfo = {};
    CONFIG.potions.forEach(p => { potionInfo[p.id] = { icon: p.icon, name: p.name }; });
    Object.entries(gameState.potionsInventory || {}).forEach(([id, count]) => {
        if (count > 0) {
            const info = potionInfo[id] || {};
            allItems.push({ id, type: 'potion', icon: info.icon || '🧪', name: info.name || id, count });
        }
    });
    
    // 精华
    const essenceInfo = {};
    CONFIG.essences.forEach(e => { essenceInfo[e.id] = { icon: e.icon, name: e.name }; });
    Object.entries(gameState.essencesInventory || {}).forEach(([id, count]) => {
        if (count > 0) {
            const info = essenceInfo[id] || {};
            allItems.push({ id, type: 'essence', icon: info.icon || '✨', name: info.name || id, count });
        }
    });
    
    // 工具（斧、镐、凿、针、镰、锤）
    const toolTypes = [
        { key: 'axes', tools: CONFIG.tools.axes },
        { key: 'pickaxes', tools: CONFIG.tools.pickaxes },
        { key: 'chisels', tools: CONFIG.tools.chisels },
        { key: 'needles', tools: CONFIG.tools.needles },
        { key: 'scythes', tools: CONFIG.tools.scythes },
        { key: 'hammers', tools: CONFIG.tools.hammers }
    ];
    toolTypes.forEach(({ key, tools }) => {
        const inventory = gameState.toolsInventory[key] || [];
        inventory.forEach(toolId => {
            const tool = tools.find(t => t.id === toolId);
            if (tool) {
                allItems.push({ id: toolId, type: 'tool', subtype: key, icon: tool.icon, name: tool.name, count: 1 });
            }
        });
    });
    
    // 代币
    Object.entries(gameState.tokensInventory || {}).forEach(([id, count]) => {
        if (count > 0) {
            const token = CONFIG.tokens[id];
            if (token) {
                allItems.push({ id, type: 'token', icon: token.icon, name: token.name, count });
            }
        }
    });
    
    if (allItems.length === 0) {
        elements.merchantWarehouseGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #666; padding: 40px;">暂无物品</div>';
        elements.merchantSellBar.style.display = 'none';
        return;
    }
    
    const html = allItems.map(item => {
        const isSelected = gameState.warehouseSelection.some(s => s.id === item.id && s.type === item.type);
        const itemKey = `${item.type}:${item.id}`;
        
        return `
            <div class="merchant-warehouse-item ${isSelected ? 'selected' : ''}" 
                data-item-type="${item.type}" data-item-id="${item.id}"
                title="${item.name}"
                ${!gameState.isSelectMode ? 'style="pointer-events: none;"' : ''}>
                <div class="merchant-warehouse-item-icon">${item.icon}</div>
                <div class="merchant-warehouse-item-count">×${item.count}</div>
            </div>
        `;
    }).join('');
    
    elements.merchantWarehouseGrid.innerHTML = html;
    
    // 绑定选择事件
    elements.merchantWarehouseGrid.querySelectorAll('.merchant-warehouse-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            const type = this.dataset.itemType;
            const id = this.dataset.itemId;
            toggleWarehouseSelection({ type, id });
        });
    });
    
    // 更新出售按钮栏
    updateSellBar();
}

function toggleWarehouseSelection(item) {
    const index = gameState.warehouseSelection.findIndex(s => s.type === item.type && s.id === item.id);
    if (index > -1) {
        gameState.warehouseSelection.splice(index, 1);
    } else {
        gameState.warehouseSelection.push(item);
    }
    renderMerchantWarehouse();
}

function updateSellBar() {
    if (!elements.merchantSellBar || !elements.merchantSellTotal) return;
    
    if (gameState.warehouseSelection.length === 0) {
        elements.merchantSellBar.style.display = 'none';
        return;
    }
    
    let total = 0;
    gameState.warehouseSelection.forEach(item => {
        const price = getItemSellPrice(item);
        const count = getItemCount(item);
        total += count * price;
    });
    
    elements.merchantSellTotal.textContent = total;
    elements.merchantSellBar.style.display = 'flex';
    
    if (gameState.sellConfirming) {
        elements.merchantSellBtn.textContent = '确认出售';
        elements.merchantSellBtn.classList.add('confirming');
    } else {
        elements.merchantSellBtn.textContent = '出售';
        elements.merchantSellBtn.classList.remove('confirming');
    }
}

function getItemCount(item) {
    if (item.type === 'wood') return gameState.woodcuttingInventory[item.id] || 0;
    if (item.type === 'ore') return gameState.miningInventory[item.id] || 0;
    if (item.type === 'ingot') return gameState.ingotsInventory[item.id] || 0;
    if (item.type === 'plank') return gameState.planksInventory[item.id] || 0;
    if (item.type === 'fabric') return gameState.fabricsInventory[item.id] || 0;
    if (item.type === 'gathering') return gameState.gatheringInventory[item.id] || 0;
    if (item.type === 'potion') return gameState.potionsInventory[item.id] || 0;
    if (item.type === 'tool') {
        const inventory = gameState.toolsInventory[item.subtype] || [];
        return inventory.includes(item.id) ? 1 : 0;
    }
    if (item.type === 'token') return gameState.tokensInventory[item.id] || 0;
    return 0;
}

function getItemSellPrice(item) {
    if (item.type === 'wood') return 2;
    if (item.type === 'ore') return 3;
    if (item.type === 'ingot') return 5;
    if (item.type === 'plank') return 3;
    if (item.type === 'fabric') return 4;
    if (item.type === 'gathering') return 2;
    if (item.type === 'potion') return 8;
    if (item.type === 'token') return 10; // 代币售价
    if (item.type === 'tool') {
        // 工具根据等级定价
        const allTools = [...CONFIG.tools.axes, ...CONFIG.tools.pickaxes, ...CONFIG.tools.chisels, ...CONFIG.tools.needles, ...CONFIG.tools.scythes, ...CONFIG.tools.hammers];
        const tool = allTools.find(t => t.id === item.id);
        if (tool) {
            const levelIndex = [2, 12, 22, 37, 52, 67, 82, 97].indexOf(tool.reqForgeLevel);
            return 20 + levelIndex * 15; // 20, 35, 50, 65, 80, 95, 110, 125
        }
        return 20;
    }
    return 1;
}

function switchMerchantTab(tab) {
    // 切换标签按钮状态
    document.querySelectorAll('.merchant-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });
    
    // 切换内容区域显示
    document.querySelectorAll('.merchant-tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `merchant-tab-${tab}`);
    });
}

function setupMerchantListeners() {
    // 关闭弹窗 - 关闭按钮
    if (elements.merchantModalClose) {
        elements.merchantModalClose.addEventListener('click', function(e) {
            e.stopPropagation();
            closeMerchantModal();
        });
    }
    
    // 关闭弹窗 - 点击遮罩层
    if (elements.merchantModalOverlay) {
        elements.merchantModalOverlay.addEventListener('click', function(e) {
            e.stopPropagation();
            closeMerchantModal();
        });
    }
    
    // 切换标签 - 重新获取元素确保存在
    const tabs = document.querySelectorAll('.merchant-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.stopPropagation();
            const tabName = this.dataset.tab;
            if (tabName) {
                switchMerchantTab(tabName);
            }
        });
    });
    
    // 选择模式
    if (elements.merchantSelectBtn) {
        elements.merchantSelectBtn.addEventListener('click', function() {
            gameState.isSelectMode = !gameState.isSelectMode;
            gameState.warehouseSelection = [];
            gameState.sellConfirming = false;
            this.classList.toggle('active', gameState.isSelectMode);
            this.textContent = gameState.isSelectMode ? '取消' : '选择';
            renderMerchantWarehouse();
        });
    }
    
    // 出售按钮
    if (elements.merchantSellBtn) {
        elements.merchantSellBtn.addEventListener('click', function() {
            if (gameState.sellConfirming) {
                // 确认出售
                let total = 0;
                gameState.warehouseSelection.forEach(item => {
                    const count = getItemCount(item);
                    const price = getItemSellPrice(item);
                    total += count * price;
                    
                    // 从对应库存中扣除
                    if (item.type === 'wood') gameState.woodcuttingInventory[item.id] = 0;
                    else if (item.type === 'ore') gameState.miningInventory[item.id] = 0;
                    else if (item.type === 'ingot') gameState.ingotsInventory[item.id] = 0;
                    else if (item.type === 'plank') gameState.planksInventory[item.id] = 0;
                    else if (item.type === 'fabric') gameState.fabricsInventory[item.id] = 0;
                    else if (item.type === 'gathering') gameState.gatheringInventory[item.id] = 0;
                    else if (item.type === 'potion') gameState.potionsInventory[item.id] = 0;
                    else if (item.type === 'tool') {
                        const inventory = gameState.toolsInventory[item.subtype] || [];
                        const idx = inventory.indexOf(item.id);
                        if (idx > -1) inventory.splice(idx, 1);
                        // 如果已装备，卸下
                        const equipKey = item.subtype.slice(0, -1); // axes -> axe
                        if (gameState.equipment[equipKey] === item.id) {
                            gameState.equipment[equipKey] = null;
                        }
                    }
                });
                gameState.resources.gold += total;
                
                showToast(`✅ 出售完成！获得 ${total} 金币`);
                
                // 重置状态
                gameState.warehouseSelection = [];
                gameState.isSelectMode = false;
                gameState.sellConfirming = false;
                elements.merchantSelectBtn.classList.remove('active');
                elements.merchantSelectBtn.textContent = '选择';
                
                updateUI();
                saveGame();
                renderMerchantWarehouse();
            } else {
                // 第一次点击，进入确认状态
                gameState.sellConfirming = true;
                updateSellBar();
            }
        });
    }
}

function switchPage(pageId) {
    gameState.currentPage = pageId;
    elements.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === pageId);
    });
    elements.pages.forEach(page => {
        page.classList.toggle('active', page.id === `page-${pageId}`);
    });
}

function setupEventListeners() {
    // 检查元素是否存在再添加事件监听器
    if (elements.combatBtn) {
        elements.combatBtn.addEventListener('click', toggleCombat);
    }
    if (elements.resetBtn) {
        elements.resetBtn.addEventListener('click', resetGame);
    }
    if (elements.modalClose) {
        elements.modalClose.addEventListener('click', () => elements.modal.classList.remove('show'));
    }
    if (elements.modal) {
        elements.modal.addEventListener('click', (e) => {
            if (e.target === elements.modal) elements.modal.classList.remove('show');
        });
    }
    if (elements.actionCancelBtn) {
        elements.actionCancelBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            cancelCurrentAction();
        });
    }
    
    // 行动次数选择弹窗事件
    if (elements.actionModalClose) {
        elements.actionModalClose.addEventListener('click', () => elements.actionModal.classList.remove('show'));
    }
    if (elements.actionModalCancel) {
        elements.actionModalCancel.addEventListener('click', () => elements.actionModal.classList.remove('show'));
    }
    if (elements.actionModal) {
        elements.actionModal.addEventListener('click', (e) => {
            if (e.target === elements.actionModal) elements.actionModal.classList.remove('show');
        });
    }
    if (elements.actionModalConfirm) {
        elements.actionModalConfirm.addEventListener('click', confirmActionCount);
    }
    
    // 选择次数选项
    document.querySelectorAll('.count-option').forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation();
            document.querySelectorAll('.count-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
    
    // 自定义次数输入框
    const countInput = document.getElementById('action-count-input');
    if (countInput) {
        countInput.addEventListener('click', function(e) {
            e.stopPropagation();
            document.querySelectorAll('.count-option').forEach(o => o.classList.remove('selected'));
        });
    }
    
    // 替换行动确认弹窗事件
    if (elements.replaceModalClose) {
        elements.replaceModalClose.addEventListener('click', () => {
            elements.replaceModal.classList.remove('show');
            pendingAction = null;
        });
    }
    if (elements.replaceModalCancel) {
        elements.replaceModalCancel.addEventListener('click', () => {
            elements.replaceModal.classList.remove('show');
            pendingAction = null;
        });
    }
    if (elements.replaceModalConfirm) {
        elements.replaceModalConfirm.addEventListener('click', () => {
            elements.replaceModal.classList.remove('show');
            if (pendingAction) {
                // 清空队列
                gameState.actionQueue = [];
                updateQueueButton();
                
                cancelCurrentAction();
                executePendingAction();
            }
        });
    }
    if (elements.replaceModal) {
        elements.replaceModal.addEventListener('click', (e) => {
            if (e.target === elements.replaceModal) {
                elements.replaceModal.classList.remove('show');
                pendingAction = null;
            }
        });
    }
}

function updateSkillNavExp(skill, expFillElem, levelElem) {
    if (!expFillElem || !levelElem) return;
    const currentExp = getSkillExpForLevel(gameState[skill + 'Level']);
    const nextExp = getSkillExpForLevel(gameState[skill + 'Level'] + 1);
    const expNeeded = nextExp - currentExp;
    const expProgress = gameState[skill + 'Exp'] - currentExp;
    const percentage = expNeeded > 0 ? (expProgress / expNeeded) * 100 : 0;
    expFillElem.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
    levelElem.textContent = gameState[skill + 'Level'];
}

function openActionModal(type, id, name, itemId = null) {
    if (!elements.actionModal) return;
    const typeNames = { 
        woodcutting: '伐木', 
        mining: '挖矿',
        gathering_item: '采集',
        gathering_all: '全采集',
        crafting: '制作',
        forging: '锻造',
        forging_tool: '锻造工具',
        tailoring: '缝制',
        alchemy: '炼药',
        essence: '提炼'
    };
    elements.actionModalTitle.textContent = `选择${typeNames[type] || '行动'}次数 - ${name}`;
    elements.actionCountInput.value = '';
    
    // 清除所有选中状态，然后默认选中第一个（1次）
    const countOptions = document.querySelectorAll('.count-option');
    countOptions.forEach(o => o.classList.remove('selected'));
    if (countOptions.length > 0) {
        countOptions[0].classList.add('selected');
    }
    
    pendingAction = { type, id, name, itemId };
    
    // 更新队列按钮状态
    updateQueueButtonInModal();
    
    elements.actionModal.classList.add('show');
}

function confirmActionCount() {
    if (!pendingAction) return;
    
    // 检查是否有选中的选项
    const selectedOption = document.querySelector('.count-option.selected');
    let count = 1;
    
    if (selectedOption) {
        count = parseInt(selectedOption.dataset.count);
    } else if (elements.actionCountInput && elements.actionCountInput.value) {
        count = parseInt(elements.actionCountInput.value);
    }
    
    if (isNaN(count) || count < 1) {
        showToast('❌ 请输入或选择有效的次数');
        return;
    }
    
    pendingAction.count = count;
    elements.actionModal.classList.remove('show');
    
    // 检查是否有行动正在进行
    if (hasActiveAction()) {
        // 更新替换弹窗文本
        const hasQueue = gameState.actionQueue.length > 0;
        if (hasQueue) {
            elements.replaceModalText.textContent = '当前已有行动正在进行，是否清空队列并替换为新的行动？';
        } else {
            elements.replaceModalText.textContent = '当前已有行动正在进行，是否要替换为新的行动？';
        }
        elements.replaceModal.classList.add('show');
    } else {
        executePendingAction();
    }
}

function executePendingAction() {
    if (!pendingAction) return;
    const { type, id, count, itemId } = pendingAction;
    
    if (type === 'woodcutting') {
        startWoodcuttingWithCount(id, count);
    } else if (type === 'mining') {
        startMiningWithCount(id, count);
    } else if (type === 'gathering_item' || type === 'gathering_all') {
        startGatheringWithCount(type, id, itemId, count);
    } else if (type === 'crafting') {
        startCraftingWithCount(id, count);
    } else if (type === 'forging') {
        startForgingWithCount(id, count);
    } else if (type === 'forging_tool') {
        startForgingToolWithCount(id, count, itemId.toolType, itemId.toolIndex);
    } else if (type === 'tailoring') {
        startTailoringWithCount(id, count);
    } else if (type === 'alchemy') {
        startAlchemyWithCount(id, count);
    } else if (type === 'essence') {
        startEssenceExtraction(id, count);
    }
    
    pendingAction = null;
}

function startWoodcuttingWithCount(treeId, count) {
    const tree = CONFIG.trees.find(t => t.id === treeId);
    gameState.activeWoodcutting = treeId;
    gameState.woodcuttingCount = count;
    gameState.woodcuttingRemaining = count;
    // 重置进度条
    if (elements.actionProgressFill) {
        elements.actionProgressFill.style.width = '0%';
    }
    // 应用装备加成
    const bonus = getEquipmentBonus('woodcutting');
    const actualDuration = Math.floor(tree.duration / (1 + bonus));
    setActionState({ name: `采集${tree.name}`, icon: tree.icon }, actualDuration);
    renderWoodcutting();
    // 启动进度条动画
    if (animationFrame) cancelAnimationFrame(animationFrame);
    lastActionStartTime = gameState.actionStartTime;
    animationFrame = requestAnimationFrame(updateActionStatusBarSmooth);
    scheduleWoodcutting(treeId);
}

function scheduleWoodcutting(treeId) {
    const isInfinite = gameState.woodcuttingCount >= 99999;
    if (!gameState.activeWoodcutting || (!isInfinite && gameState.woodcuttingRemaining <= 0)) {
        gameState.activeWoodcutting = null;
        gameState.woodcuttingCount = 0;
        gameState.woodcuttingRemaining = 0;
        setActionState(null, 0);
        renderWoodcutting();
        // 行动完成，检查队列
        onActionComplete();
        return;
    }
    
    const tree = CONFIG.trees.find(t => t.id === treeId);
    if (!isInfinite) {
        gameState.woodcuttingRemaining--;
    }
    
    // 立即开始下一次行动
    if (gameState.activeWoodcutting === treeId) {
        // 应用装备加成
        const bonus = getEquipmentBonus('woodcutting');
        const actualDuration = Math.floor(tree.duration / (1 + bonus));
        // 重置行动开始时间为当前时间
        setActionState({ name: `采集${tree.name}`, icon: tree.icon }, actualDuration);
        // 重置进度条为 0
        if (elements.actionProgressFill) {
            elements.actionProgressFill.style.width = '0%';
        }
        updateActionStatusBar();
        renderWoodcutting();
        
        // 启动进度条动画
        if (animationFrame) cancelAnimationFrame(animationFrame);
        lastActionStartTime = gameState.actionStartTime;
        animationFrame = requestAnimationFrame(updateActionStatusBarSmooth);
        
        // 等待行动完成后继续
        gameState.actionTimerId = setTimeout(() => {
            if (gameState.activeWoodcutting === treeId) {
                completeWoodcuttingOnce(treeId);
                // 递归调用继续下一次行动
                scheduleWoodcutting(treeId);
            }
        }, actualDuration);
    }
}

function completeWoodcuttingOnce(treeId) {
    const tree = CONFIG.trees.find(t => t.id === treeId);
    const treeIndex = CONFIG.trees.findIndex(t => t.id === treeId);
    
    // 添加对应的木材到物品存储
    if (!gameState.woodcuttingInventory[treeId]) {
        gameState.woodcuttingInventory[treeId] = 0;
    }
    gameState.woodcuttingInventory[treeId]++;
    
    // 检查是否获得伐木代币
    const token = tryGetToken('wood_token', treeIndex, 'standard');
    
    addExp(tree.exp);
    addSkillExp('woodcutting', tree.exp);
    updateUI();
    saveGame();
    // 显示奖励
    if (elements.actionRewards) {
        let rewardHtml = `<span class="action-reward-item">+1 ${tree.dropIcon} ${tree.drop}</span>`;
        if (token) {
            rewardHtml += `<span class="action-reward-item token-reward">+1 ${token.icon} ${token.name}</span>`;
        }
        elements.actionRewards.innerHTML = rewardHtml;
        setTimeout(() => { if (elements.actionRewards) elements.actionRewards.innerHTML = ''; }, 3000);
    }
}

function startMiningWithCount(oreId, count) {
    const ore = CONFIG.ores.find(o => o.id === oreId);
    gameState.activeMining = oreId;
    gameState.miningCount = count;
    gameState.miningRemaining = count;
    // 重置进度条
    if (elements.actionProgressFill) {
        elements.actionProgressFill.style.width = '0%';
    }
    // 应用装备加成
    const bonus = getEquipmentBonus('mining');
    const actualDuration = Math.floor(ore.duration / (1 + bonus));
    setActionState({ name: `挖掘${ore.name}`, icon: ore.icon }, actualDuration);
    renderMining();
    // 启动进度条动画
    if (animationFrame) cancelAnimationFrame(animationFrame);
    lastActionStartTime = gameState.actionStartTime;
    animationFrame = requestAnimationFrame(updateActionStatusBarSmooth);
    scheduleMining(oreId);
}

function scheduleMining(oreId) {
    const isInfinite = gameState.miningCount >= 99999;
    if (!gameState.activeMining || (!isInfinite && gameState.miningRemaining <= 0)) {
        gameState.activeMining = null;
        gameState.miningCount = 0;
        gameState.miningRemaining = 0;
        setActionState(null, 0);
        renderMining();
        onActionComplete();
        return;
    }
    
    const ore = CONFIG.ores.find(o => o.id === oreId);
    if (!isInfinite) {
        gameState.miningRemaining--;
    }
    
    // 立即开始下一次行动
    if (gameState.activeMining === oreId) {
        // 应用装备加成
        const bonus = getEquipmentBonus('mining');
        const actualDuration = Math.floor(ore.duration / (1 + bonus));
        // 重置行动开始时间为当前时间
        setActionState({ name: `挖掘${ore.name}`, icon: ore.icon }, actualDuration);
        // 重置进度条为 0
        if (elements.actionProgressFill) {
            elements.actionProgressFill.style.width = '0%';
        }
        updateActionStatusBar();
        renderMining();
        
        // 启动进度条动画
        if (animationFrame) cancelAnimationFrame(animationFrame);
        lastActionStartTime = gameState.actionStartTime;
        animationFrame = requestAnimationFrame(updateActionStatusBarSmooth);
        
        // 等待行动完成后继续
        gameState.actionTimerId = setTimeout(() => {
            if (gameState.activeMining === oreId) {
                completeMiningOnce(oreId);
                // 递归调用继续下一次行动
                scheduleMining(oreId);
            }
        }, actualDuration);
    }
}

function completeMiningOnce(oreId) {
    const ore = CONFIG.ores.find(o => o.id === oreId);
    const oreIndex = CONFIG.ores.findIndex(o => o.id === oreId);
    
    // 添加对应的矿石到物品存储
    if (!gameState.miningInventory[oreId]) {
        gameState.miningInventory[oreId] = 0;
    }
    gameState.miningInventory[oreId]++;
    
    // 检查是否获得挖矿代币
    const token = tryGetToken('mining_token', oreIndex, 'standard');
    
    addExp(ore.exp);
    addSkillExp('mining', ore.exp);
    updateUI();
    saveGame();
    // 显示奖励
    if (elements.actionRewards) {
        let rewardHtml = `<span class="action-reward-item">+1 ${ore.dropIcon} ${ore.drop}</span>`;
        if (token) {
            rewardHtml += `<span class="action-reward-item token-reward">+1 ${token.icon} ${token.name}</span>`;
        }
        elements.actionRewards.innerHTML = rewardHtml;
        setTimeout(() => { if (elements.actionRewards) elements.actionRewards.innerHTML = ''; }, 3000);
    }
}

// ============ 采集行动循环 ============

function startGatheringWithCount(type, locationId, itemId, count) {
    const location = CONFIG.gatheringLocations.find(l => l.id === locationId);
    gameState.activeGathering = type;
    gameState.gatheringLocationId = locationId;
    gameState.gatheringItemId = itemId;
    gameState.gatheringCount = count;
    gameState.gatheringRemaining = count;
    
    // 重置进度条
    if (elements.actionProgressFill) {
        elements.actionProgressFill.style.width = '0%';
    }
    
    let actionName = '';
    let actionIcon = '🌾';
    
    if (type === 'gathering_item' && itemId) {
        const item = location.items.find(i => i.id === itemId);
        actionName = `采集${item.name}`;
        actionIcon = item.icon;
    } else {
        actionName = `${location.name}·全采集`;
    }
    
    setActionState({ name: actionName, icon: actionIcon }, location.duration);
    renderGathering();
    
    // 启动进度条动画
    if (animationFrame) cancelAnimationFrame(animationFrame);
    lastActionStartTime = gameState.actionStartTime;
    animationFrame = requestAnimationFrame(updateActionStatusBarSmooth);
    
    scheduleGathering(type, locationId, itemId);
}

function scheduleGathering(type, locationId, itemId) {
    const isInfinite = gameState.gatheringCount >= 99999;
    if (!gameState.activeGathering || (!isInfinite && gameState.gatheringRemaining <= 0)) {
        gameState.activeGathering = null;
        gameState.gatheringLocationId = null;
        gameState.gatheringItemId = null;
        gameState.gatheringCount = 0;
        gameState.gatheringRemaining = 0;
        setActionState(null, 0);
        renderGathering();
        onActionComplete();
        return;
    }
    
    const location = CONFIG.gatheringLocations.find(l => l.id === locationId);
    if (!isInfinite) {
        gameState.gatheringRemaining--;
    }
    
    // 立即开始下一次行动
    if (gameState.activeGathering) {
        let actionName = '';
        let actionIcon = '🌾';
        
        if (type === 'gathering_item' && itemId) {
            const item = location.items.find(i => i.id === itemId);
            actionName = `采集${item.name}`;
            actionIcon = item.icon;
        } else {
            actionName = `${location.name}·全采集`;
        }
        
        // 重置行动开始时间为当前时间
        setActionState({ name: actionName, icon: actionIcon }, location.duration);
        // 重置进度条为 0
        if (elements.actionProgressFill) {
            elements.actionProgressFill.style.width = '0%';
        }
        updateActionStatusBar();
        renderGathering();
        
        // 启动进度条动画
        if (animationFrame) cancelAnimationFrame(animationFrame);
        lastActionStartTime = gameState.actionStartTime;
        animationFrame = requestAnimationFrame(updateActionStatusBarSmooth);
        
        // 等待行动完成后继续
        gameState.actionTimerId = setTimeout(() => {
            if (gameState.activeGathering) {
                completeGatheringOnce(type, locationId, itemId);
                // 递归调用继续下一次行动
                scheduleGathering(type, locationId, itemId);
            }
        }, location.duration);
    }
}

function completeGatheringOnce(type, locationId, itemId) {
    const location = CONFIG.gatheringLocations.find(l => l.id === locationId);
    const locationIndex = CONFIG.gatheringLocations.findIndex(l => l.id === locationId);
    
    // 初始化物品仓库（如果不存在）
    if (!gameState.gatheringInventory) {
        gameState.gatheringInventory = {};
    }
    
    let rewards = [];
    
    if (type === 'gathering_item' && itemId) {
        // 单个物品采集 - 100% 获得
        const item = location.items.find(i => i.id === itemId);
        if (!gameState.gatheringInventory[item.id]) {
            gameState.gatheringInventory[item.id] = 0;
        }
        gameState.gatheringInventory[item.id]++;
        rewards.push({ icon: item.icon, name: item.name, amount: 1 });
    } else {
        // 全采集 - 每次行动 100% 成功，但每种物品独立 30% 概率
        location.items.forEach(item => {
            if (Math.random() < 0.3) {
                if (!gameState.gatheringInventory[item.id]) {
                    gameState.gatheringInventory[item.id] = 0;
                }
                gameState.gatheringInventory[item.id]++;
                rewards.push({ icon: item.icon, name: item.name, amount: 1 });
            }
        });
        // 如果全采集什么都没获得，至少给一个随机物品保底
        if (rewards.length === 0 && location.items.length > 0) {
            const randomItem = location.items[Math.floor(Math.random() * location.items.length)];
            if (!gameState.gatheringInventory[randomItem.id]) {
                gameState.gatheringInventory[randomItem.id] = 0;
            }
            gameState.gatheringInventory[randomItem.id]++;
            rewards.push({ icon: randomItem.icon, name: randomItem.name, amount: 1 });
        }
    }
    
    // 检查是否获得采集代币（根据采集地点索引）
    const token = tryGetToken('gathering_token', locationIndex, 'standard');
    
    // 增加经验
    addExp(location.exp);
    addSkillExp('gathering', location.exp);
    
    updateUI();
    saveGame();
    
    // 显示奖励
    if (elements.actionRewards && rewards.length > 0) {
        let rewardHtml = rewards.map(r => 
            `<span class="action-reward-item">+${r.amount} ${r.icon} ${r.name}</span>`
        ).join('');
        if (token) {
            rewardHtml += `<span class="action-reward-item token-reward">+1 ${token.icon} ${token.name}</span>`;
        }
        elements.actionRewards.innerHTML = rewardHtml;
        setTimeout(() => { if (elements.actionRewards) elements.actionRewards.innerHTML = ''; }, 3000);
    }
}

function cancelCurrentAction(skipQueue = false) {
    if (!gameState.currentAction) return;
    
    // 清除当前行动的定时器
    if (gameState.actionTimerId) {
        clearTimeout(gameState.actionTimerId);
        gameState.actionTimerId = null;
    }
    
    // 清除所有进行中的行动，不给予奖励
    if (gameState.activeWoodcutting) {
        gameState.activeWoodcutting = null;
        gameState.woodcuttingCount = 0;
        gameState.woodcuttingRemaining = 0;
    }
    if (gameState.activeMining) {
        gameState.activeMining = null;
        gameState.miningCount = 0;
        gameState.miningRemaining = 0;
    }
    if (gameState.activeGathering) {
        gameState.activeGathering = null;
        gameState.gatheringLocationId = null;
        gameState.gatheringItemId = null;
        gameState.gatheringCount = 0;
        gameState.gatheringRemaining = 0;
    }
    if (gameState.activeCrafting) {
        gameState.activeCrafting = null;
        gameState.craftingCount = 0;
        gameState.craftingRemaining = 0;
    }
    if (gameState.activeForging) {
        gameState.activeForging = null;
        gameState.forgingCount = 0;
        gameState.forgingRemaining = 0;
    }
    if (gameState.activeForgingTool) {
        gameState.activeForgingTool = null;
        gameState.forgingToolCount = 0;
        gameState.forgingToolRemaining = 0;
    }
    if (gameState.activeTailoring) {
        gameState.activeTailoring = null;
        gameState.tailoringCount = 0;
        gameState.tailoringRemaining = 0;
    }
    if (gameState.activeAlchemy) {
        gameState.activeAlchemy = null;
        gameState.alchemyCount = 0;
        gameState.alchemyRemaining = 0;
    }
    for (const actionId in gameState.activeActions) {
        delete gameState.activeActions[actionId];
    }
    if (gameState.combat.active) {
        gameState.combat.active = false;
    }
    
    // 清除奖励显示
    if (elements.actionRewards) {
        elements.actionRewards.innerHTML = '';
    }
    
    setActionState(null, 0);
    updateUI();
    renderWoodcutting();
    renderMining();
    renderGathering();
    renderCrafting();
    renderForging();
    renderTailoring();
    renderGatherActions();
    renderCombatZones();
    showToast('❌ 已停止行动');
    
    // 停止后检查队列，如果有等待的行动则执行第一个（除非是置顶操作）
    if (!skipQueue && gameState.actionQueue.length > 0) {
        setTimeout(() => {
            startNextQueueAction();
        }, 300);
    }
}

// 阻止点击停止按钮时触发其他事件
function setupCancelButton() {
    if (elements.actionCancelBtn) {
        elements.actionCancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            cancelCurrentAction();
        });
    }
}

let animationFrame = null;
let lastActionStartTime = 0;

function updateActionStatusBarSmooth() {
    if (!gameState.currentAction) return;
    
    const now = Date.now();
    const elapsed = now - gameState.actionStartTime;
    const progress = Math.min(100, (elapsed / gameState.actionDuration) * 100);
    
    elements.actionProgressFill.style.width = `${progress}%`;
    
    if (progress < 100) {
        animationFrame = requestAnimationFrame(updateActionStatusBarSmooth);
    }
    // 进度条完成后由 schedule 函数处理重置，这里不做任何操作
}

function formatTime(seconds) {
    if (seconds < 60) {
        return `${seconds.toFixed(1)}s`;
    } else if (seconds < 3600) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}m${s}s`;
    } else {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h${m}m`;
    }
}

function updateActionStatusBar() {
    if (!elements.actionStatusBar) return;
    
    if (gameState.currentAction) {
        elements.actionStatusIcon.textContent = gameState.currentAction.icon;
        
        // 添加次数显示（从零往上增加）
        let countText = '';
        if (gameState.woodcuttingCount > 0 || gameState.miningCount > 0) {
            const total = gameState.woodcuttingCount || gameState.miningCount || 0;
            const remaining = gameState.woodcuttingRemaining || gameState.miningRemaining || 0;
            const completed = total - remaining;
            const countDisplay = total >= 99999 ? '∞' : `${completed}/${total}`;
            countText = ` (${countDisplay})`;
        }
        elements.actionStatusName.textContent = gameState.currentAction.name + countText;
        
        elements.actionProgressTime.textContent = formatTime(gameState.actionDuration / 1000);
        elements.actionCancelBtn.disabled = false;
        elements.actionCancelBtn.classList.add('visible');
        
        // 启动平滑动画
        if (animationFrame) cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(updateActionStatusBarSmooth);
    } else {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        elements.actionStatusIcon.textContent = '∞';
        elements.actionStatusName.textContent = '休息中';
        elements.actionProgressFill.style.width = '0%';
        elements.actionProgressTime.textContent = '-';
        elements.actionCancelBtn.disabled = true;
        elements.actionCancelBtn.classList.remove('visible');
    }
}

function showActionReward(text) {
    if (!elements.actionRewards) return;
    const rewardItem = document.createElement('span');
    rewardItem.className = 'action-reward-item';
    rewardItem.textContent = text;
    elements.actionRewards.appendChild(rewardItem);
    // 3 秒后移除
    setTimeout(() => {
        if (rewardItem.parentNode) {
            rewardItem.parentNode.removeChild(rewardItem);
        }
    }, 3000);
}

function clearActionRewards() {
    if (elements.actionRewards) {
        elements.actionRewards.innerHTML = '';
    }
}

function updateUI() {
    const levelText = gameState.level.toString();
    if (elements.level) elements.level.textContent = levelText;
    if (elements.topLevel) elements.topLevel.textContent = levelText;
    
    if (elements.storageGold) elements.storageGold.textContent = formatNumber(Math.floor(gameState.resources.gold));
    if (elements.storageWood) elements.storageWood.textContent = formatNumber(Math.floor(gameState.resources.wood));
    if (elements.storageStone) elements.storageStone.textContent = formatNumber(Math.floor(gameState.resources.stone));
    if (elements.storageHerb) elements.storageHerb.textContent = formatNumber(Math.floor(gameState.resources.herb));
    
    const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    if (elements.playTime) elements.playTime.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // 更新侧边栏技能经验条
    updateSkillNavExp('woodcutting', elements.navWoodcuttingExp, elements.navWoodcuttingLvl);
    updateSkillNavExp('mining', elements.navMiningExp, elements.navMiningLvl);
    updateSkillNavExp('gathering', elements.navGatheringExp, elements.navGatheringLvl);
    updateSkillNavExp('crafting', elements.navCraftExp, elements.navCraftLvl);
    updateSkillNavExp('combat', elements.navCombatExp, elements.navCombatLvl);
    
    // 更新顶部行动状态栏
    updateActionStatusBar();
    
    updateCombatUI();
    renderBuildings();
    renderGatherActions();
    renderCraftActions();
    renderWoodcutting();
    renderMining();
    renderGathering();
    renderCrafting();
    renderForging();
    renderTailoring();
    renderCombatZones();
    
    // 渲染仓库物品
    renderWoodcuttingInventory();
    renderMiningInventory();
    renderGatheringInventory();
    renderPlanksInventory();
    renderIngotsInventory();
    renderFabricsInventory();
    renderPotionsInventory();
    renderToolsInventory();
    renderTokensInventory();
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Math.floor(num).toString();
}

function checkUnlock(req) {
    if (!req) return true;
    // 检查帐篷等级要求
    if (req.tentLevel !== undefined) {
        const tentLevel = gameState.buildings.tent ? gameState.buildings.tent.level : 0;
        if (tentLevel < req.tentLevel) return false;
    }
    // 检查建筑等级要求
    if (req.buildings) {
        for (const [id, level] of Object.entries(req.buildings)) {
            if (!gameState.buildings[id] || gameState.buildings[id].level < level) return false;
        }
    }
    return true;
}

function canAfford(cost) {
    for (const [res, amount] of Object.entries(cost)) {
        // 检查资源（金币、木材、石头、草药）
        if (['gold', 'wood', 'stone', 'herb'].includes(res)) {
            if (gameState.resources[res] < amount) return false;
        }
        // 检查伐木物品
        else if (CONFIG.trees.find(t => t.id === res)) {
            const owned = gameState.woodcuttingInventory[res] || 0;
            if (owned < amount) return false;
        }
        // 检查其他物品（矿石、采集物等）
        else {
            const owned = gameState.resources[res] || 0;
            if (owned < amount) return false;
        }
    }
    return true;
}

function payCost(cost) {
    for (const [res, amount] of Object.entries(cost)) {
        // 扣除资源
        if (['gold', 'wood', 'stone', 'herb'].includes(res)) {
            gameState.resources[res] -= amount;
        }
        // 扣除伐木物品
        else if (CONFIG.trees.find(t => t.id === res)) {
            gameState.woodcuttingInventory[res] -= amount;
        }
        // 扣除其他物品
        else {
            gameState.resources[res] -= amount;
        }
    }
}

function getExpForLevel(level) {
    if (level >= 200) return EXP_TABLE[200];
    return EXP_TABLE[level] || 0;
}

function getExpToNextLevel() {
    const currentExp = getExpForLevel(gameState.level);
    const nextExp = getExpForLevel(gameState.level + 1);
    return nextExp - currentExp;
}

function addExp(amount) {
    // 玩家总等级由所有技能等级相加，不再有独立经验
    // 此函数保留但不做任何操作
}

// 检查是否获得代币，返回代币信息或null
function tryGetToken(tokenType, levelIndex, rateType = 'standard') {
    const rates = CONFIG.tokenDropRates[rateType];
    const rate = rates[Math.min(levelIndex, rates.length - 1)];
    
    if (Math.random() < rate) {
        const token = CONFIG.tokens[tokenType];
        if (!gameState.tokensInventory[tokenType]) {
            gameState.tokensInventory[tokenType] = 0;
        }
        gameState.tokensInventory[tokenType]++;
        return token; // 返回代币信息
    }
    return null;
}

function updateTotalLevel() {
    // 玩家总等级 = 所有技能等级相加
    gameState.level = (gameState.woodcuttingLevel || 1) + 
                      (gameState.miningLevel || 1) + 
                      (gameState.gatheringLevel || 1) + 
                      (gameState.craftingLevel || 1) + 
                      (gameState.forgingLevel || 1) + 
                      (gameState.tailoringLevel || 1) + 
                      (gameState.alchemyLevel || 1) + 
                      (gameState.combatLevel || 1) - 7; // 减去初始的8个1级
    if (gameState.level < 1) gameState.level = 1;
}

function renderBuildings() {
    if (!elements.buildingsList) return;
    
    // 过滤掉伐木场、矿洞、草药园（它们有独立的页面）
    const displayBuildings = CONFIG.buildings.filter(b => 
        !['lumber', 'mine', 'farm'].includes(b.id)
    );
    
    elements.buildingsList.innerHTML = displayBuildings.map(b => {
        const building = gameState.buildings[b.id];
        const unlocked = checkUnlock(b.unlockReq);
        const level = building.level;
        
        // 帐篷显示等级名称
        let displayName = b.name;
        let levelText = `LV.${level}`;
        if (b.levelNames && b.levelNames[level]) {
            displayName = b.levelNames[level];
            levelText = '';
        }
        
        // 检查是否达到最大等级
        const isMaxLevel = b.maxLevel && level >= b.maxLevel;
        
        return `
            <div class="building-card ${unlocked ? '' : 'locked'}" data-id="${b.id}">
                <div class="building-icon">${b.icon}</div>
                <div class="building-name">${displayName}</div>
                ${levelText ? `<div class="building-level">${levelText}</div>` : ''}
                ${!unlocked ? '<div class="building-cost">🔒 未解锁</div>' : 
                  isMaxLevel ? '<div class="building-cost">已满级</div>' : 
                  `<div class="building-cost">${formatCost(b.baseCost)}</div>`}
            </div>
        `;
    }).join('');
    
    elements.buildingsList.querySelectorAll('.building-card').forEach(card => {
        card.addEventListener('click', () => {
            const buildingId = card.dataset.id;
            const building = CONFIG.buildings.find(b => b.id === buildingId);
            const level = gameState.buildings[buildingId].level;
            
            // 检查是否达到最大等级
            if (building.maxLevel && level >= building.maxLevel) {
                showToast('⚠️ 已达到最高等级');
                return;
            }
            
            if (!checkUnlock(building.unlockReq)) { showToast('🔒 需要先升级帐篷'); return; }
            if (canAfford(building.baseCost)) { buildBuilding(buildingId); }
            else { showToast('❌ 资源不足'); }
        });
    });
}

function formatCost(cost) {
    const icons = { gold: '💰', wood: '🪵', stone: '🪨', herb: '🌿' };
    return Object.entries(cost).map(([res, amount]) => {
        // 检查是否是伐木物品
        const tree = CONFIG.trees.find(t => t.id === res);
        if (tree) {
            return `${tree.dropIcon} ${amount}`;
        }
        return `${icons[res] || res} ${amount}`;
    }).join(' ');
}

function buildBuilding(buildingId) {
    const building = CONFIG.buildings.find(b => b.id === buildingId);
    
    // 检查是否达到最大等级
    if (building.maxLevel && gameState.buildings[buildingId].level >= building.maxLevel) {
        showToast('⚠️ 已达到最高等级');
        return;
    }
    
    payCost(building.baseCost);
    gameState.buildings[buildingId].level++;
    
    // 非帐篷建筑：升级后增加建造费用（帐篷升级费用固定为1青杉木）
    if (buildingId !== 'tent') {
        for (const res in building.baseCost) { building.baseCost[res] = Math.floor(building.baseCost[res] * 1.5); }
    }
    
    addExp(10);
    updateUI();
    saveGame();
    
    // 显示升级信息
    if (building.levelNames) {
        const newName = building.levelNames[gameState.buildings[buildingId].level];
        showToast(`✅ 升级为 ${newName}`);
    } else {
        showToast(`✅ 建造了 ${building.name}`);
    }
}

function renderGatherActions() {
    if (!elements.gatherActions) return;
    elements.gatherActions.innerHTML = CONFIG.gatherActions.map(action => {
        const isActive = gameState.activeActions[action.id];
        return `
            <div class="action-item ${isActive ? 'active' : ''}" data-id="${action.id}">
                <div class="action-icon">${action.icon}</div>
                <div class="action-info">
                    <div class="action-name">${action.name}</div>
                    <div class="action-desc">${action.desc} | +${action.exp} EXP</div>
                </div>
                ${isActive ? '<div class="action-timer">进行中...</div>' : ''}
            </div>
        `;
    }).join('');
    
    elements.gatherActions.querySelectorAll('.action-item').forEach(item => {
        item.addEventListener('click', () => startAction(item.dataset.id));
    });
}

function hasActiveAction() {
    return gameState.currentAction !== null;
}

function setActionState(action, duration) {
    if (action) {
        gameState.currentAction = action;
        gameState.actionStartTime = Date.now();
        gameState.actionDuration = duration;
    } else {
        gameState.currentAction = null;
        gameState.actionStartTime = 0;
        gameState.actionDuration = 0;
    }
}

function startAction(actionId) {
    if (gameState.activeActions[actionId]) return;
    if (hasActiveAction()) { showToast('⏳ 已有行动正在进行中'); return; }
    const action = CONFIG.gatherActions.find(a => a.id === actionId);
    gameState.activeActions[actionId] = Date.now() + action.duration;
    setActionState({ name: action.name, icon: action.icon }, action.duration);
    renderGatherActions();
    setTimeout(() => completeAction(actionId), action.duration);
}

function completeAction(actionId) {
    // 检查行动是否仍然有效（可能已被取消）
    if (!gameState.activeActions[actionId]) return;
    
    const action = CONFIG.gatherActions.find(a => a.id === actionId);
    let rewardHTML = '';
    for (const [res, amount] of Object.entries(action.reward)) {
        gameState.resources[res] += amount;
        const icons = { gold: '💰', wood: '🪵', stone: '🪨', herb: '🌿' };
        const names = { gold: '金币', wood: '木材', stone: '石头', herb: '草药' };
        rewardHTML += `<span class="action-reward-item">+${amount} ${icons[res]} ${names[res]}</span>`;
    }
    addExp(action.exp);
    addSkillExp('gathering', action.exp);
    delete gameState.activeActions[actionId];
    setActionState(null, 0);
    updateUI();
    saveGame();
    // 显示奖励
    if (elements.actionRewards) {
        elements.actionRewards.innerHTML = rewardHTML;
        setTimeout(() => { if (elements.actionRewards) elements.actionRewards.innerHTML = ''; }, 3000);
    }
}

function renderCraftActions() {
    if (!elements.craftActions) return;
    elements.craftActions.innerHTML = CONFIG.craftRecipes.map(recipe => {
        const building = gameState.buildings[recipe.reqBuilding];
        const unlocked = building && building.level > 0;
        return `
            <div class="action-item ${!unlocked ? 'locked' : ''}" data-id="${recipe.id}">
                <div class="action-icon">${recipe.icon}</div>
                <div class="action-info">
                    <div class="action-name">${recipe.name}</div>
                    <div class="action-desc">${recipe.desc} | +${recipe.exp} EXP</div>
                </div>
                <div class="action-timer">${formatCost(recipe.cost)}</div>
            </div>
        `;
    }).join('');
    
    elements.craftActions.querySelectorAll('.action-item').forEach(item => {
        item.addEventListener('click', () => craftItem(item.dataset.id));
    });
}

function getSkillExpForLevel(level) {
    if (level >= 200) return EXP_TABLE[200];
    return EXP_TABLE[level] || 0;
}

function renderWoodcutting() {
    if (!elements.woodcuttingList) return;
    
    // 更新伐木经验条
    if (elements.woodcuttingExpFill && elements.woodcuttingLevel) {
        const currentExp = getSkillExpForLevel(gameState.woodcuttingLevel);
        const nextExp = getSkillExpForLevel(gameState.woodcuttingLevel + 1);
        const expNeeded = nextExp - currentExp;
        const expProgress = gameState.woodcuttingExp - currentExp;
        const percentage = expNeeded > 0 ? (expProgress / expNeeded) * 100 : 0;
        elements.woodcuttingExpFill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        elements.woodcuttingLevel.textContent = gameState.woodcuttingLevel;
    }
    
    elements.woodcuttingList.innerHTML = CONFIG.trees.map(tree => {
        const isActive = gameState.activeWoodcutting === tree.id;
        const isUnlocked = gameState.woodcuttingLevel >= tree.reqLevel;
        let actionStatus = '';
        if (isActive) {
            const remaining = gameState.woodcuttingRemaining || 0;
            const total = gameState.woodcuttingCount || 1;
            const countText = total >= 99999 ? '∞' : `${remaining}/${total}`;
            actionStatus = `<div class="action-timer">采集中... ${countText}</div>`;
        }
        return `
            <div class="tree-card ${!isUnlocked ? 'locked' : ''} ${isActive ? 'active' : ''}" data-id="${tree.id}">
                <div class="tree-icon">${tree.icon}</div>
                <div class="tree-info">
                    <div class="tree-name">${tree.name}</div>
                    <div class="tree-req">等级：${tree.reqLevel} | ${tree.duration/1000}秒</div>
                    <div class="tree-drop">${tree.dropIcon} ${tree.drop} | +${tree.exp} EXP</div>
                </div>
                ${actionStatus}
                ${!isUnlocked ? '<div class="tree-locked">🔒 等级不足</div>' : ''}
            </div>
        `;
    }).join('');
    
    elements.woodcuttingList.querySelectorAll('.tree-card').forEach(card => {
        card.addEventListener('click', () => {
            const treeId = card.dataset.id;
            const tree = CONFIG.trees.find(t => t.id === treeId);
            if (gameState.woodcuttingLevel < tree.reqLevel) { showToast(`❌ 需要伐木等级 ${tree.reqLevel}`); return; }
            // 打开行动次数选择弹窗（即使正在进行也允许添加到队列）
            openActionModal('woodcutting', treeId, tree.name);
        });
    });
}

function startWoodcutting(treeId) {
    if (hasActiveAction()) { showToast('⏳ 已有行动正在进行中'); return; }
    const tree = CONFIG.trees.find(t => t.id === treeId);
    gameState.activeWoodcutting = treeId;
    setActionState({ name: `采集${tree.name}`, icon: tree.icon }, tree.duration);
    renderWoodcutting();
    setTimeout(() => completeWoodcutting(treeId), tree.duration);
}

function addSkillExp(skill, amount) {
    const skillKey = skill + 'Exp';
    const levelKey = skill + 'Level';
    gameState[skillKey] += amount;
    
    let leveledUp = false;
    while (gameState[levelKey] < 200 && gameState[skillKey] >= getSkillExpForLevel(gameState[levelKey] + 1)) {
        gameState[levelKey]++;
        leveledUp = true;
    }
    
    if (leveledUp) {
        updateTotalLevel();
        const skillNames = {
            woodcutting: '伐木',
            mining: '挖矿',
            gathering: '采集',
            crafting: '制作',
            forging: '锻造',
            tailoring: '缝制',
            combat: '战斗'
        };
        showToast(`🎉 ${skillNames[skill] || '技能'}升级了！当前等级：${gameState[levelKey]}`);
    }
}

function completeWoodcutting(treeId) {
    // 检查行动是否仍然有效（可能已被取消）
    if (!gameState.activeWoodcutting) return;
    
    const tree = CONFIG.trees.find(t => t.id === treeId);
    const dropAmount = 1;
    gameState.resources.wood += dropAmount;
    addExp(tree.exp);
    addSkillExp('woodcutting', tree.exp);
    gameState.activeWoodcutting = null;
    setActionState(null, 0);
    updateUI();
    saveGame();
    // 显示奖励
    if (elements.actionRewards) {
        elements.actionRewards.innerHTML = `<span class="action-reward-item">+${dropAmount} ${tree.dropIcon} ${tree.drop}</span>`;
        setTimeout(() => { if (elements.actionRewards) elements.actionRewards.innerHTML = ''; }, 3000);
    }
}

function renderMining() {
    if (!elements.miningList) return;
    
    // 更新挖矿经验条
    if (elements.miningExpFill && elements.miningLevel) {
        const currentExp = getSkillExpForLevel(gameState.miningLevel);
        const nextExp = getSkillExpForLevel(gameState.miningLevel + 1);
        const expNeeded = nextExp - currentExp;
        const expProgress = gameState.miningExp - currentExp;
        const percentage = expNeeded > 0 ? (expProgress / expNeeded) * 100 : 0;
        elements.miningExpFill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        elements.miningLevel.textContent = gameState.miningLevel;
    }
    
    elements.miningList.innerHTML = CONFIG.ores.map(ore => {
        const isActive = gameState.activeMining === ore.id;
        const isUnlocked = gameState.miningLevel >= ore.reqLevel;
        let actionStatus = '';
        if (isActive) {
            const remaining = gameState.miningRemaining || 0;
            const total = gameState.miningCount || 1;
            const countText = total >= 99999 ? '∞' : `${remaining}/${total}`;
            actionStatus = `<div class="action-timer">挖掘中... ${countText}</div>`;
        }
        return `
            <div class="ore-card ${!isUnlocked ? 'locked' : ''} ${isActive ? 'active' : ''}" data-id="${ore.id}">
                <div class="ore-icon">${ore.icon}</div>
                <div class="ore-info">
                    <div class="ore-name">${ore.name}</div>
                    <div class="ore-req">等级：${ore.reqLevel} | ${ore.duration/1000}秒</div>
                    <div class="ore-drop">${ore.dropIcon} ${ore.drop} | +${ore.exp} EXP</div>
                </div>
                ${actionStatus}
                ${!isUnlocked ? '<div class="ore-locked">🔒 等级不足</div>' : ''}
            </div>
        `;
    }).join('');
    
    elements.miningList.querySelectorAll('.ore-card').forEach(card => {
        card.addEventListener('click', () => {
            const oreId = card.dataset.id;
            const ore = CONFIG.ores.find(o => o.id === oreId);
            if (gameState.miningLevel < ore.reqLevel) { showToast(`❌ 需要挖矿等级 ${ore.reqLevel}`); return; }
            // 打开行动次数选择弹窗（即使正在进行也允许添加到队列）
            openActionModal('mining', oreId, ore.name);
        });
    });
}

function startMining(oreId) {
    if (hasActiveAction()) { showToast('⏳ 已有行动正在进行中'); return; }
    const ore = CONFIG.ores.find(o => o.id === oreId);
    gameState.activeMining = oreId;
    setActionState({ name: `挖掘${ore.name}`, icon: ore.icon }, ore.duration);
    renderMining();
    setTimeout(() => completeMining(oreId), ore.duration);
}

function completeMining(oreId) {
    // 检查行动是否仍然有效（可能已被取消）
    if (!gameState.activeMining) return;
    
    const ore = CONFIG.ores.find(o => o.id === oreId);
    const dropAmount = 1;
    gameState.resources.stone += dropAmount;
    addExp(ore.exp);
    addSkillExp('mining', ore.exp);
    gameState.activeMining = null;
    setActionState(null, 0);
    updateUI();
    saveGame();
    // 显示奖励
    if (elements.actionRewards) {
        elements.actionRewards.innerHTML = `<span class="action-reward-item">+${dropAmount} ${ore.dropIcon} ${ore.drop}</span>`;
        setTimeout(() => { if (elements.actionRewards) elements.actionRewards.innerHTML = ''; }, 3000);
    }
}

function craftItem(recipeId) {
    const recipe = CONFIG.craftRecipes.find(r => r.id === recipeId);
    const building = gameState.buildings[recipe.reqBuilding];
    if (!building || building.level === 0) { showToast(`🔒 需要 ${CONFIG.buildings.find(b => b.id === recipe.reqBuilding).name}`); return; }
    if (!canAfford(recipe.cost)) { showToast('❌ 资源不足'); return; }
    payCost(recipe.cost);
    addExp(recipe.exp);
    addSkillExp('crafting', recipe.exp);
    gameState.resources.gold += recipe.exp * 2;
    updateUI();
    saveGame();
    showToast(`✅ 制作了 ${recipe.name}`);
}

// ============ 采集功能 ============

let currentGatheringLocationIndex = 0;

function renderGathering() {
    if (!elements.gatheringTabs || !elements.gatheringItemsList) return;
    
    // 更新采集经验条
    if (elements.gatheringExpFill && elements.gatheringLevel) {
        const currentExp = getSkillExpForLevel(gameState.gatheringLevel);
        const nextExp = getSkillExpForLevel(gameState.gatheringLevel + 1);
        const expNeeded = nextExp - currentExp;
        const expProgress = gameState.gatheringExp - currentExp;
        const percentage = expNeeded > 0 ? (expProgress / expNeeded) * 100 : 0;
        elements.gatheringExpFill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        elements.gatheringLevel.textContent = gameState.gatheringLevel;
    }
    
    // 更新侧边栏采集经验条
    if (elements.navGatheringExp && elements.navGatheringLvl) {
        const currentExp = getSkillExpForLevel(gameState.gatheringLevel);
        const nextExp = getSkillExpForLevel(gameState.gatheringLevel + 1);
        const expNeeded = nextExp - currentExp;
        const expProgress = gameState.gatheringExp - currentExp;
        const percentage = expNeeded > 0 ? (expProgress / expNeeded) * 100 : 0;
        elements.navGatheringExp.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        elements.navGatheringLvl.textContent = gameState.gatheringLevel;
    }
    
    // 渲染地点标签
    renderGatheringTabs();
    
    // 渲染当前地点的采集物
    renderGatheringItems();
}

// ============ 制作系统 ============

function renderCrafting() {
    // 更新制作经验条
    if (elements.craftingExpFill && elements.craftingLevel) {
        const currentExp = getSkillExpForLevel(gameState.craftingLevel);
        const nextExp = getSkillExpForLevel(gameState.craftingLevel + 1);
        const expNeeded = nextExp - currentExp;
        const expProgress = gameState.craftingExp - currentExp;
        const percentage = expNeeded > 0 ? (expProgress / expNeeded) * 100 : 0;
        elements.craftingExpFill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        elements.craftingLevel.textContent = gameState.craftingLevel;
    }
    
    // 更新侧边栏制作经验条
    if (elements.navCraftingExp && elements.navCraftingLvl) {
        const currentExp = getSkillExpForLevel(gameState.craftingLevel);
        const nextExp = getSkillExpForLevel(gameState.craftingLevel + 1);
        const expNeeded = nextExp - currentExp;
        const expProgress = gameState.craftingExp - currentExp;
        const percentage = expNeeded > 0 ? (expProgress / expNeeded) * 100 : 0;
        elements.navCraftingExp.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        elements.navCraftingLvl.textContent = gameState.craftingLevel;
    }
    
    // 渲染木板列表
    renderPlanksList();
}

function renderPlanksList() {
    if (!elements.craftingPlanksList) return;
    
    const html = CONFIG.woodPlanks.map(plank => {
        const isUnlocked = gameState.craftingLevel >= plank.reqLevel;
        const isActive = gameState.activeCrafting === plank.id;
        const canCraft = canCraftPlank(plank);
        
        // 获取材料名称
        const materialNames = Object.entries(plank.materials).map(([woodId, count]) => {
            const tree = CONFIG.trees.find(t => t.id === woodId);
            const owned = gameState.woodcuttingInventory[woodId] || 0;
            return `${tree ? tree.drop : woodId}×${count} (${owned}/${count})`;
        }).join(', ');
        
        let actionStatus = '';
        if (isActive) {
            const remaining = gameState.craftingRemaining || 0;
            const total = gameState.craftingCount || 1;
            const countText = total >= 99999 ? '∞' : `${remaining}/${total}`;
            actionStatus = `<div class="action-timer">制作中... ${countText}</div>`;
        }
        
        return `
            <div class="gathering-item-card ${!isUnlocked ? 'locked' : ''} ${isActive ? 'active' : ''}" data-plank-id="${plank.id}">
                <div class="gathering-item-icon">${plank.icon}</div>
                <div class="gathering-item-info">
                    <div class="gathering-item-name">${plank.name}</div>
                    <div class="gathering-item-desc">${materialNames}</div>
                    <div class="gathering-item-meta">${plank.duration/1000}秒 | +${plank.exp} EXP | Lv.${plank.reqLevel}</div>
                </div>
                ${actionStatus}
                ${!isUnlocked ? '<div class="gathering-item-locked">🔒 等级不足</div>' : ''}
                ${isUnlocked && !canCraft ? '<div class="gathering-item-locked">📦 材料不足</div>' : ''}
            </div>
        `;
    }).join('');
    
    elements.craftingPlanksList.innerHTML = html;
    
    // 绑定点击事件
    elements.craftingPlanksList.querySelectorAll('.gathering-item-card').forEach(card => {
        card.addEventListener('click', function(e) {
            e.stopPropagation();
            
            const plankId = this.dataset.plankId;
            const plank = CONFIG.woodPlanks.find(p => p.id === plankId);
            
            // 检查等级
            if (gameState.craftingLevel < plank.reqLevel) {
                showToast(`❌ 需要制作等级 ${plank.reqLevel}`);
                return;
            }
            
            // 检查材料
            if (!canCraftPlank(plank)) {
                showToast('❌ 材料不足');
                return;
            }
            
            openActionModal('crafting', plankId, plank.name);
        });
    });
}

function canCraftPlank(plank) {
    for (const [woodId, count] of Object.entries(plank.materials)) {
        const owned = gameState.woodcuttingInventory[woodId] || 0;
        if (owned < count) return false;
    }
    return true;
}

function startCraftingWithCount(plankId, count) {
    const plank = CONFIG.woodPlanks.find(p => p.id === plankId);
    if (!plank) return;
    
    // 检查材料是否足够
    if (!canCraftPlank(plank)) {
        showToast('❌ 材料不足');
        return;
    }
    
    gameState.activeCrafting = plankId;
    gameState.craftingCount = count;
    gameState.craftingRemaining = count;
    
    // 重置进度条
    if (elements.actionProgressFill) {
        elements.actionProgressFill.style.width = '0%';
    }
    setActionState({ name: `制作${plank.name}`, icon: plank.icon }, plank.duration);
    renderCrafting();
    
    // 启动进度条动画
    if (animationFrame) cancelAnimationFrame(animationFrame);
    lastActionStartTime = gameState.actionStartTime;
    animationFrame = requestAnimationFrame(updateActionStatusBarSmooth);
    
    scheduleCrafting(plankId);
}

function scheduleCrafting(plankId) {
    const isInfinite = gameState.craftingCount >= 99999;
    if (!gameState.activeCrafting || (!isInfinite && gameState.craftingRemaining <= 0)) {
        gameState.activeCrafting = null;
        gameState.craftingCount = 0;
        gameState.craftingRemaining = 0;
        setActionState(null, 0);
        renderCrafting();
        onActionComplete();
        return;
    }
    
    const plank = CONFIG.woodPlanks.find(p => p.id === plankId);
    if (!plank) return;
    
    // 检查材料
    if (!canCraftPlank(plank)) {
        showToast('❌ 材料不足，制作停止');
        gameState.activeCrafting = null;
        gameState.craftingCount = 0;
        gameState.craftingRemaining = 0;
        setActionState(null, 0);
        renderCrafting();
        onActionComplete();
        return;
    }
    
    if (!isInfinite) {
        gameState.craftingRemaining--;
    }
    
    if (gameState.activeCrafting === plankId) {
        setActionState({ name: `制作${plank.name}`, icon: plank.icon }, plank.duration);
        if (elements.actionProgressFill) {
            elements.actionProgressFill.style.width = '0%';
        }
        updateActionStatusBar();
        renderCrafting();
        
        if (animationFrame) cancelAnimationFrame(animationFrame);
        lastActionStartTime = gameState.actionStartTime;
        animationFrame = requestAnimationFrame(updateActionStatusBarSmooth);
        
        gameState.actionTimerId = setTimeout(() => {
            if (gameState.activeCrafting === plankId) {
                completeCraftingOnce(plankId);
                scheduleCrafting(plankId);
            }
        }, plank.duration);
    }
}

function completeCraftingOnce(plankId) {
    const plank = CONFIG.woodPlanks.find(p => p.id === plankId);
    const plankIndex = CONFIG.woodPlanks.findIndex(p => p.id === plankId);
    if (!plank) return;
    
    // 消耗材料
    for (const [woodId, count] of Object.entries(plank.materials)) {
        gameState.woodcuttingInventory[woodId] -= count;
    }
    
    // 添加木板到存储
    if (!gameState.planksInventory[plankId]) {
        gameState.planksInventory[plankId] = 0;
    }
    gameState.planksInventory[plankId]++;
    
    // 检查是否获得制作代币
    const token = tryGetToken('crafting_token', plankIndex, 'standard');
    
    addExp(plank.exp);
    addSkillExp('crafting', plank.exp);
    updateUI();
    saveGame();
    
    // 显示奖励
    if (elements.actionRewards) {
        let rewardHtml = `<span class="action-reward-item">+1 ${plank.icon} ${plank.name}</span>`;
        if (token) {
            rewardHtml += `<span class="action-reward-item token-reward">+1 ${token.icon} ${token.name}</span>`;
        }
        elements.actionRewards.innerHTML = rewardHtml;
        setTimeout(() => { if (elements.actionRewards) elements.actionRewards.innerHTML = ''; }, 3000);
    }
}

function renderPlanksInventory() {
    const container = document.getElementById('storage-planks-items');
    if (!container) return;
    
    if (!gameState.planksInventory || Object.keys(gameState.planksInventory).length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #666; padding: 40px;">暂无木板</div>';
        return;
    }
    
    const html = Object.entries(gameState.planksInventory)
        .filter(([id, count]) => count > 0)
        .map(([id, count]) => {
            const plank = CONFIG.woodPlanks.find(p => p.id === id);
            const name = plank ? plank.name : id;
            const icon = plank ? plank.icon : '🪵';
            return `
                <div class="storage-item-small">
                    <div class="storage-item-small-icon">${icon}</div>
                    <div class="storage-item-small-name">${name}</div>
                    <div class="storage-item-small-count">×${count}</div>
                </div>
            `;
        })
        .join('');
    
    container.innerHTML = html || '<div style="grid-column: 1/-1; text-align: center; color: #666; padding: 40px;">暂无木板</div>';
}

// ============ 锻造系统 ============

function renderForging() {
    // 更新锻造经验条
    if (elements.forgingExpFill && elements.forgingLevel) {
        const currentExp = getSkillExpForLevel(gameState.forgingLevel);
        const nextExp = getSkillExpForLevel(gameState.forgingLevel + 1);
        const expNeeded = nextExp - currentExp;
        const expProgress = gameState.forgingExp - currentExp;
        const percentage = expNeeded > 0 ? (expProgress / expNeeded) * 100 : 0;
        elements.forgingExpFill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        elements.forgingLevel.textContent = gameState.forgingLevel;
    }
    
    // 更新侧边栏锻造经验条
    if (elements.navForgingExp && elements.navForgingLvl) {
        const currentExp = getSkillExpForLevel(gameState.forgingLevel);
        const nextExp = getSkillExpForLevel(gameState.forgingLevel + 1);
        const expNeeded = nextExp - currentExp;
        const expProgress = gameState.forgingExp - currentExp;
        const percentage = expNeeded > 0 ? (expProgress / expNeeded) * 100 : 0;
        elements.navForgingExp.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        elements.navForgingLvl.textContent = gameState.forgingLevel;
    }
    
    // 渲染矿锭列表
    renderIngotsList();
    // 渲染工具列表
    renderToolsList();
}

function renderIngotsList() {
    if (!elements.forgingIngotsList) return;
    
    const html = CONFIG.ingots.map(ingot => {
        const isUnlocked = gameState.forgingLevel >= ingot.reqLevel;
        const isActive = gameState.activeForging === ingot.id;
        const canForge = canForgeIngot(ingot);
        
        // 获取材料名称
        const materialNames = Object.entries(ingot.materials).map(([oreId, count]) => {
            const ore = CONFIG.ores.find(o => o.id === oreId);
            const owned = gameState.miningInventory[oreId] || 0;
            return `${ore ? ore.drop : oreId}×${count} (${owned}/${count})`;
        }).join(', ');
        
        let actionStatus = '';
        if (isActive) {
            const remaining = gameState.forgingRemaining || 0;
            const total = gameState.forgingCount || 1;
            const countText = total >= 99999 ? '∞' : `${remaining}/${total}`;
            actionStatus = `<div class="action-timer">锻造中... ${countText}</div>`;
        }
        
        return `
            <div class="gathering-item-card ${!isUnlocked ? 'locked' : ''} ${isActive ? 'active' : ''}" data-ingot-id="${ingot.id}">
                <div class="gathering-item-icon">${ingot.icon}</div>
                <div class="gathering-item-info">
                    <div class="gathering-item-name">${ingot.name}</div>
                    <div class="gathering-item-desc">${materialNames}</div>
                    <div class="gathering-item-meta">${ingot.duration/1000}秒 | +${ingot.exp} EXP | Lv.${ingot.reqLevel}</div>
                </div>
                ${actionStatus}
                ${!isUnlocked ? '<div class="gathering-item-locked">🔒 等级不足</div>' : ''}
                ${isUnlocked && !canForge ? '<div class="gathering-item-locked">📦 材料不足</div>' : ''}
            </div>
        `;
    }).join('');
    
    elements.forgingIngotsList.innerHTML = html;
    
    // 绑定点击事件
    elements.forgingIngotsList.querySelectorAll('.gathering-item-card').forEach(card => {
        card.addEventListener('click', function(e) {
            e.stopPropagation();
            
            const ingotId = this.dataset.ingotId;
            const ingot = CONFIG.ingots.find(i => i.id === ingotId);
            
            // 检查等级
            if (gameState.forgingLevel < ingot.reqLevel) {
                showToast(`❌ 需要锻造等级 ${ingot.reqLevel}`);
                return;
            }
            
            // 检查材料
            if (!canForgeIngot(ingot)) {
                showToast('❌ 材料不足');
                return;
            }
            
            // 检查是否正在进行中
            if (this.classList.contains('active')) {
                showToast('⏳ 正在锻造中');
                return;
            }
            
            openActionModal('forging', ingotId, ingot.name);
        });
    });
}

function canForgeIngot(ingot) {
    for (const [oreId, count] of Object.entries(ingot.materials)) {
        const owned = gameState.miningInventory[oreId] || 0;
        if (owned < count) return false;
    }
    return true;
}

// ============ 工具锻造系统 ============

function renderToolsList() {
    if (!elements.forgingToolsList) return;
    
    // 材料名称映射
    const ingotNames = {
        'cyan_ingot': '青闪锭',
        'red_copper_ingot': '赤铜锭',
        'feather_ingot': '羽锭',
        'white_silver_ingot': '白银锭',
        'hell_steel_ingot': '狱钢锭',
        'thunder_steel_ingot': '雷鸣锭',
        'brilliant_crystal': '璀璨晶',
        'star_crystal': '星辉晶'
    };
    
    const plankNames = {
        'pine_plank': '青杉木板',
        'iron_birch_plank': '铁桦木板',
        'wind_tree_plank': '风啸木板',
        'frost_maple_plank': '霜叶木板',
        'flame_tree_plank': '焰心木板',
        'thunder_tree_plank': '雷鸣木板',
        'ancient_oak_plank': '古橡木板',
        'world_tree_plank': '世界木板'
    };
    
    const prevToolNames = {
        'cyan_axe': '青闪斧',
        'red_axe': '赤铁斧',
        'feather_axe': '羽斧',
        'white_axe': '白银斧',
        'hell_axe': '狱炎斧',
        'thunder_axe': '雷鸣斧',
        'brilliant_axe': '璀璨斧',
        'cyan_pickaxe': '青闪镐',
        'red_pickaxe': '赤铁镐',
        'feather_pickaxe': '羽镐',
        'white_pickaxe': '白银镐',
        'hell_pickaxe': '狱炎镐',
        'thunder_pickaxe': '雷鸣镐',
        'brilliant_pickaxe': '璀璨镐'
    };
    
    // 矿石名称映射（斧头和镐子使用矿石）
    const oreNames = {
        'cyan_ore': '青闪石', 'red_iron': '赤铁石', 'feather_ore': '羽石',
        'hell_ore': '白鸠石', 'white_ore': '狱炎石', 'thunder_ore': '雷鸣石',
        'brilliant': '璀璨原石', 'star_ore': '星辉原石'
    };
    const oreIds = ['cyan_ore', 'red_iron', 'feather_ore', 'hell_ore', 'white_ore', 'thunder_ore', 'brilliant', 'star_ore'];
    
    // 渲染斧头部分
    const axesHtml = CONFIG.tools.axes.map((axe, index) => {
        const materials = CONFIG.toolCraftingMaterials.axes[index];
        const isUnlocked = gameState.forgingLevel >= axe.reqForgeLevel;
        const isActive = gameState.activeForgingTool === axe.id;
        const canForge = canForgeTool('axe', index);
        const isOwned = gameState.toolsInventory.axes.includes(axe.id);
        
        // 构建材料描述（斧头使用对应矿石）
        const oreId = oreIds[index];
        const plankId = CONFIG.plankIdMapping[index];
        const ownedOre = gameState.miningInventory[oreId] || 0;
        const ownedPlank = gameState.planksInventory[plankId] || 0;
        const oreName = oreNames[oreId] || '矿石';
        const plankName = plankNames[plankId] || '木板';
        
        let materialDesc = `${oreName}×${materials.ore}(${ownedOre}), ${plankName}×${materials.plank}(${ownedPlank})`;
        if (materials.prevTool) {
            const hasPrevTool = gameState.toolsInventory.axes.includes(materials.prevTool);
            const prevToolName = prevToolNames[materials.prevTool] || '上一级斧头';
            materialDesc += `, ${prevToolName}(${hasPrevTool ? '✓' : '✗'})`;
        }
        
        let actionStatus = '';
        if (isActive) {
            const remaining = gameState.forgingToolRemaining || 0;
            const total = gameState.forgingToolCount || 1;
            const countText = total >= 99999 ? '∞' : `${remaining}/${total}`;
            actionStatus = `<div class="action-timer">锻造中... ${countText}</div>`;
        }
        
        const equipLevelText = `装备需求: 伐木Lv.${axe.reqEquipLevel}`;
        const bonusText = `伐木速度+${Math.round(axe.speedBonus * 100)}%`;
        
        return `
            <div class="gathering-item-card ${!isUnlocked ? 'locked' : ''} ${isActive ? 'active' : ''} ${isOwned ? 'owned' : ''}" 
                data-tool-type="axe" data-tool-index="${index}" data-tool-id="${axe.id}">
                <div class="gathering-item-icon">${axe.icon}</div>
                <div class="gathering-item-info">
                    <div class="gathering-item-name">${axe.name} ${isOwned ? '✓' : ''}</div>
                    <div class="gathering-item-desc">${materialDesc}</div>
                    <div class="gathering-item-meta">${Math.floor(axe.duration/1000)}秒 | +${axe.exp} EXP | 锻造Lv.${axe.reqForgeLevel}</div>
                    <div class="gathering-item-meta" style="color: #6b4f3c;">${bonusText} | ${equipLevelText}</div>
                </div>
                ${actionStatus}
                ${!isUnlocked ? '<div class="gathering-item-locked">🔒 等级不足</div>' : ''}
                ${isUnlocked && !canForge ? '<div class="gathering-item-locked">📦 材料不足</div>' : ''}
            </div>
        `;
    }).join('');
    
    // 渲染镐子部分
    const pickaxesHtml = CONFIG.tools.pickaxes.map((pickaxe, index) => {
        const materials = CONFIG.toolCraftingMaterials.pickaxes[index];
        const isUnlocked = gameState.forgingLevel >= pickaxe.reqForgeLevel;
        const isActive = gameState.activeForgingTool === pickaxe.id;
        const canForge = canForgeTool('pickaxe', index);
        const isOwned = gameState.toolsInventory.pickaxes.includes(pickaxe.id);
        
        // 构建材料描述（镐子使用对应矿石）
        const oreId = oreIds[index];
        const plankId = CONFIG.plankIdMapping[index];
        const ownedOre = gameState.miningInventory[oreId] || 0;
        const ownedPlank = gameState.planksInventory[plankId] || 0;
        const oreName = oreNames[oreId] || '矿石';
        const plankName = plankNames[plankId] || '木板';
        
        let materialDesc = `${oreName}×${materials.ore}(${ownedOre}), ${plankName}×${materials.plank}(${ownedPlank})`;
        if (materials.prevTool) {
            const hasPrevTool = gameState.toolsInventory.pickaxes.includes(materials.prevTool);
            const prevToolName = prevToolNames[materials.prevTool] || '上一级镐子';
            materialDesc += `, ${prevToolName}(${hasPrevTool ? '✓' : '✗'})`;
        }
        
        let actionStatus = '';
        if (isActive) {
            const remaining = gameState.forgingToolRemaining || 0;
            const total = gameState.forgingToolCount || 1;
            const countText = total >= 99999 ? '∞' : `${remaining}/${total}`;
            actionStatus = `<div class="action-timer">锻造中... ${countText}</div>`;
        }
        
        const equipLevelText = `装备需求: 挖矿Lv.${pickaxe.reqEquipLevel}`;
        const bonusText = `挖矿速度+${Math.round(pickaxe.speedBonus * 100)}%`;
        
        return `
            <div class="gathering-item-card ${!isUnlocked ? 'locked' : ''} ${isActive ? 'active' : ''} ${isOwned ? 'owned' : ''}" 
                data-tool-type="pickaxe" data-tool-index="${index}" data-tool-id="${pickaxe.id}">
                <div class="gathering-item-icon">${pickaxe.icon}</div>
                <div class="gathering-item-info">
                    <div class="gathering-item-name">${pickaxe.name} ${isOwned ? '✓' : ''}</div>
                    <div class="gathering-item-desc">${materialDesc}</div>
                    <div class="gathering-item-meta">${Math.floor(pickaxe.duration/1000)}秒 | +${pickaxe.exp} EXP | 锻造Lv.${pickaxe.reqForgeLevel}</div>
                    <div class="gathering-item-meta" style="color: #6b4f3c;">${bonusText} | ${equipLevelText}</div>
                </div>
                ${actionStatus}
                ${!isUnlocked ? '<div class="gathering-item-locked">🔒 等级不足</div>' : ''}
                ${isUnlocked && !canForge ? '<div class="gathering-item-locked">📦 材料不足</div>' : ''}
            </div>
        `;
    }).join('');
    
    // 渲染凿子部分
    const chiselsHtml = CONFIG.tools.chisels.map((chisel, index) => {
        const materials = CONFIG.toolCraftingMaterials.chisels[index];
        const isUnlocked = gameState.forgingLevel >= chisel.reqForgeLevel;
        const isActive = gameState.activeForgingTool === chisel.id;
        const canForge = canForgeTool('chisel', index);
        const chiselInventory = gameState.toolsInventory.chisels || [];
        const isOwned = chiselInventory.includes(chisel.id);
        
        const oreId = oreIds[index];
        const plankId = CONFIG.plankIdMapping[index];
        const ownedOre = gameState.miningInventory[oreId] || 0;
        const ownedPlank = gameState.planksInventory[plankId] || 0;
        
        let materialDesc = `${oreNames[oreId]}×${materials.ore}(${ownedOre}), ${plankNames[plankId]}×${materials.plank}(${ownedPlank})`;
        if (materials.prevTool) {
            const hasPrev = chiselInventory.includes(materials.prevTool);
            materialDesc += `, 上一级(${hasPrev ? '✓' : '✗'})`;
        }
        
        let actionStatus = '';
        if (isActive) {
            const remaining = gameState.forgingToolRemaining || 0;
            const total = gameState.forgingToolCount || 1;
            actionStatus = `<div class="action-timer">锻造中... ${total >= 99999 ? '∞' : remaining + '/' + total}</div>`;
        }
        
        return `
            <div class="gathering-item-card ${!isUnlocked ? 'locked' : ''} ${isActive ? 'active' : ''} ${isOwned ? 'owned' : ''}" 
                data-tool-type="chisel" data-tool-index="${index}" data-tool-id="${chisel.id}">
                <div class="gathering-item-icon">${chisel.icon}</div>
                <div class="gathering-item-info">
                    <div class="gathering-item-name">${chisel.name} ${isOwned ? '✓' : ''}</div>
                    <div class="gathering-item-desc">${materialDesc}</div>
                    <div class="gathering-item-meta">${Math.floor(chisel.duration/1000)}秒 | +${chisel.exp} EXP | 锻造Lv.${chisel.reqForgeLevel}</div>
                    <div class="gathering-item-meta" style="color: #6b4f3c;">制作速度+${Math.round(chisel.speedBonus * 100)}% | 装备需求: 制作Lv.${chisel.reqEquipLevel}</div>
                </div>
                ${actionStatus}
                ${!isUnlocked ? '<div class="gathering-item-locked">🔒 等级不足</div>' : ''}
                ${isUnlocked && !canForge ? '<div class="gathering-item-locked">📦 材料不足</div>' : ''}
            </div>
        `;
    }).join('');
    
    // 渲染针部分
    const needlesHtml = CONFIG.tools.needles.map((needle, index) => {
        const materials = CONFIG.toolCraftingMaterials.needles[index];
        const isUnlocked = gameState.forgingLevel >= needle.reqForgeLevel;
        const isActive = gameState.activeForgingTool === needle.id;
        const canForge = canForgeTool('needle', index);
        const needleInventory = gameState.toolsInventory.needles || [];
        const isOwned = needleInventory.includes(needle.id);
        
        const oreId = oreIds[index];
        const plankId = CONFIG.plankIdMapping[index];
        const ownedOre = gameState.miningInventory[oreId] || 0;
        const ownedPlank = gameState.planksInventory[plankId] || 0;
        
        let materialDesc = `${oreNames[oreId]}×${materials.ore}(${ownedOre}), ${plankNames[plankId]}×${materials.plank}(${ownedPlank})`;
        if (materials.prevTool) {
            const hasPrev = needleInventory.includes(materials.prevTool);
            materialDesc += `, 上一级(${hasPrev ? '✓' : '✗'})`;
        }
        
        let actionStatus = '';
        if (isActive) {
            const remaining = gameState.forgingToolRemaining || 0;
            const total = gameState.forgingToolCount || 1;
            actionStatus = `<div class="action-timer">锻造中... ${total >= 99999 ? '∞' : remaining + '/' + total}</div>`;
        }
        
        return `
            <div class="gathering-item-card ${!isUnlocked ? 'locked' : ''} ${isActive ? 'active' : ''} ${isOwned ? 'owned' : ''}" 
                data-tool-type="needle" data-tool-index="${index}" data-tool-id="${needle.id}">
                <div class="gathering-item-icon">${needle.icon}</div>
                <div class="gathering-item-info">
                    <div class="gathering-item-name">${needle.name} ${isOwned ? '✓' : ''}</div>
                    <div class="gathering-item-desc">${materialDesc}</div>
                    <div class="gathering-item-meta">${Math.floor(needle.duration/1000)}秒 | +${needle.exp} EXP | 锻造Lv.${needle.reqForgeLevel}</div>
                    <div class="gathering-item-meta" style="color: #6b4f3c;">缝制速度+${Math.round(needle.speedBonus * 100)}% | 装备需求: 缝制Lv.${needle.reqEquipLevel}</div>
                </div>
                ${actionStatus}
                ${!isUnlocked ? '<div class="gathering-item-locked">🔒 等级不足</div>' : ''}
                ${isUnlocked && !canForge ? '<div class="gathering-item-locked">📦 材料不足</div>' : ''}
            </div>
        `;
    }).join('');
    
    // 渲染镰刀部分
    const scythesHtml = CONFIG.tools.scythes.map((scythe, index) => {
        const materials = CONFIG.toolCraftingMaterials.scythes[index];
        const isUnlocked = gameState.forgingLevel >= scythe.reqForgeLevel;
        const isActive = gameState.activeForgingTool === scythe.id;
        const canForge = canForgeTool('scythe', index);
        const scytheInventory = gameState.toolsInventory.scythes || [];
        const isOwned = scytheInventory.includes(scythe.id);
        
        const oreId = oreIds[index];
        const plankId = CONFIG.plankIdMapping[index];
        const ownedOre = gameState.miningInventory[oreId] || 0;
        const ownedPlank = gameState.planksInventory[plankId] || 0;
        
        let materialDesc = `${oreNames[oreId]}×${materials.ore}(${ownedOre}), ${plankNames[plankId]}×${materials.plank}(${ownedPlank})`;
        if (materials.prevTool) {
            const hasPrev = scytheInventory.includes(materials.prevTool);
            materialDesc += `, 上一级(${hasPrev ? '✓' : '✗'})`;
        }
        
        let actionStatus = '';
        if (isActive) {
            const remaining = gameState.forgingToolRemaining || 0;
            const total = gameState.forgingToolCount || 1;
            actionStatus = `<div class="action-timer">锻造中... ${total >= 99999 ? '∞' : remaining + '/' + total}</div>`;
        }
        
        return `
            <div class="gathering-item-card ${!isUnlocked ? 'locked' : ''} ${isActive ? 'active' : ''} ${isOwned ? 'owned' : ''}" 
                data-tool-type="scythe" data-tool-index="${index}" data-tool-id="${scythe.id}">
                <div class="gathering-item-icon">${scythe.icon}</div>
                <div class="gathering-item-info">
                    <div class="gathering-item-name">${scythe.name} ${isOwned ? '✓' : ''}</div>
                    <div class="gathering-item-desc">${materialDesc}</div>
                    <div class="gathering-item-meta">${Math.floor(scythe.duration/1000)}秒 | +${scythe.exp} EXP | 锻造Lv.${scythe.reqForgeLevel}</div>
                    <div class="gathering-item-meta" style="color: #6b4f3c;">采集速度+${Math.round(scythe.speedBonus * 100)}% | 装备需求: 采集Lv.${scythe.reqEquipLevel}</div>
                </div>
                ${actionStatus}
                ${!isUnlocked ? '<div class="gathering-item-locked">🔒 等级不足</div>' : ''}
                ${isUnlocked && !canForge ? '<div class="gathering-item-locked">📦 材料不足</div>' : ''}
            </div>
        `;
    }).join('');
    
    // 渲染锤子部分
    const hammersHtml = CONFIG.tools.hammers.map((hammer, index) => {
        const materials = CONFIG.toolCraftingMaterials.hammers[index];
        const isUnlocked = gameState.forgingLevel >= hammer.reqForgeLevel;
        const isActive = gameState.activeForgingTool === hammer.id;
        const canForge = canForgeTool('hammer', index);
        const hammerInventory = gameState.toolsInventory.hammers || [];
        const isOwned = hammerInventory.includes(hammer.id);
        
        // 锤子使用矿锭作为材料
        const ingotIds = ['cyan_ingot', 'red_copper_ingot', 'feather_ingot', 'white_silver_ingot', 'hell_steel_ingot', 'thunder_steel_ingot', 'brilliant_crystal', 'star_crystal'];
        const ingotNames = {
            'cyan_ingot': '青闪铁锭', 'red_copper_ingot': '赤铜锭', 'feather_ingot': '轻羽锭',
            'white_silver_ingot': '白银锭', 'hell_steel_ingot': '狱炎钢', 'thunder_steel_ingot': '雷鸣钢',
            'brilliant_crystal': '璀璨水晶', 'star_crystal': '星辉水晶'
        };
        const ingotId = ingotIds[index];
        const ownedIngot = gameState.ingotsInventory[ingotId] || 0;
        
        let materialDesc = `${ingotNames[ingotId]}×${materials.ingot}(${ownedIngot})`;
        if (materials.prevTool) {
            const hasPrev = hammerInventory.includes(materials.prevTool);
            const prevTool = CONFIG.tools.hammers.find(t => t.id === materials.prevTool);
            const prevToolName = prevTool ? prevTool.name : '上一级锤';
            materialDesc += `, ${prevToolName}(${hasPrev ? '✓' : '✗'})`;
        }
        
        let actionStatus = '';
        if (isActive) {
            const remaining = gameState.forgingToolRemaining || 0;
            const total = gameState.forgingToolCount || 1;
            actionStatus = `<div class="action-timer">锻造中... ${total >= 99999 ? '∞' : remaining + '/' + total}</div>`;
        }
        
        return `
            <div class="gathering-item-card ${!isUnlocked ? 'locked' : ''} ${isActive ? 'active' : ''} ${isOwned ? 'owned' : ''}" 
                data-tool-type="hammer" data-tool-index="${index}" data-tool-id="${hammer.id}">
                <div class="gathering-item-icon">${hammer.icon}</div>
                <div class="gathering-item-info">
                    <div class="gathering-item-name">${hammer.name} ${isOwned ? '✓' : ''}</div>
                    <div class="gathering-item-desc">${materialDesc}</div>
                    <div class="gathering-item-meta">${Math.floor(hammer.duration/1000)}秒 | +${hammer.exp} EXP | 锻造Lv.${hammer.reqForgeLevel}</div>
                    <div class="gathering-item-meta" style="color: #6b4f3c;">锻造速度+${Math.round(hammer.speedBonus * 100)}% | 装备需求: 锻造Lv.${hammer.reqEquipLevel}</div>
                </div>
                ${actionStatus}
                ${!isUnlocked ? '<div class="gathering-item-locked">🔒 等级不足</div>' : ''}
                ${isUnlocked && !canForge ? '<div class="gathering-item-locked">📦 材料不足</div>' : ''}
            </div>
        `;
    }).join('');
    
    elements.forgingToolsList.innerHTML = '<h4 style="margin: 10px 0; color: #E8C57F;">斧头</h4>' + axesHtml + 
                                           '<h4 style="margin: 20px 0 10px; color: #E8C57F;">镐子</h4>' + pickaxesHtml +
                                           '<h4 style="margin: 20px 0 10px; color: #E8C57F;">凿子</h4>' + chiselsHtml +
                                           '<h4 style="margin: 20px 0 10px; color: #E8C57F;">针</h4>' + needlesHtml +
                                           '<h4 style="margin: 20px 0 10px; color: #E8C57F;">镰刀</h4>' + scythesHtml +
                                           '<h4 style="margin: 20px 0 10px; color: #E8C57F;">锤</h4>' + hammersHtml;
    
    // 绑定点击事件
    elements.forgingToolsList.querySelectorAll('.gathering-item-card').forEach(card => {
        card.addEventListener('click', function(e) {
            e.stopPropagation();
            
            const toolType = this.dataset.toolType;
            const toolIndex = parseInt(this.dataset.toolIndex);
            const toolId = this.dataset.toolId;
            const toolConfigKey = toolType === 'axe' ? 'axes' : toolType === 'pickaxe' ? 'pickaxes' : toolType === 'chisel' ? 'chisels' : toolType === 'needle' ? 'needles' : toolType === 'hammer' ? 'hammers' : 'scythes';
            const tool = CONFIG.tools[toolConfigKey][toolIndex];
            
            // 检查等级
            if (gameState.forgingLevel < tool.reqForgeLevel) {
                showToast(`❌ 需要锻造等级 ${tool.reqForgeLevel}`);
                return;
            }
            
            // 检查材料
            if (!canForgeTool(toolType, toolIndex)) {
                showToast('❌ 材料不足');
                return;
            }
            
            // 检查是否正在进行中
            if (this.classList.contains('active')) {
                showToast('⏳ 正在锻造中');
                return;
            }
            
            openActionModal('forging_tool', toolId, tool.name, { toolType, toolIndex });
        });
    });
}

function canForgeTool(toolType, index) {
    const materialsKey = toolType === 'axe' ? 'axes' : toolType === 'pickaxe' ? 'pickaxes' : toolType === 'chisel' ? 'chisels' : toolType === 'needle' ? 'needles' : toolType === 'hammer' ? 'hammers' : 'scythes';
    const materials = CONFIG.toolCraftingMaterials[materialsKey][index];
    
    // 锤子使用矿锭作为材料
    if (toolType === 'hammer') {
        const ingotIds = ['cyan_ingot', 'red_copper_ingot', 'feather_ingot', 'white_silver_ingot', 'hell_steel_ingot', 'thunder_steel_ingot', 'brilliant_crystal', 'star_crystal'];
        const ingotId = ingotIds[index];
        const ownedIngot = gameState.ingotsInventory[ingotId] || 0;
        if (ownedIngot < materials.ingot) return false;
    } else {
        // 其他工具使用矿石和木板
        const oreIds = ['cyan_ore', 'red_iron', 'feather_ore', 'hell_ore', 'white_ore', 'thunder_ore', 'brilliant', 'star_ore'];
        const oreId = oreIds[index];
        const ownedOre = gameState.miningInventory[oreId] || 0;
        if (ownedOre < materials.ore) return false;
        
        const plankId = CONFIG.plankIdMapping[index];
        const ownedPlank = gameState.planksInventory[plankId] || 0;
        if (ownedPlank < materials.plank) return false;
    }
    
    if (materials.prevTool) {
        const inventory = toolType === 'axe' ? gameState.toolsInventory.axes : 
                          toolType === 'pickaxe' ? gameState.toolsInventory.pickaxes :
                          toolType === 'chisel' ? (gameState.toolsInventory.chisels || []) : 
                          toolType === 'needle' ? (gameState.toolsInventory.needles || []) : 
                          toolType === 'hammer' ? (gameState.toolsInventory.hammers || []) :
                          (gameState.toolsInventory.scythes || []);
        if (!inventory.includes(materials.prevTool)) return false;
    }
    
    return true;
}

function startForgingToolWithCount(toolId, count, toolType, toolIndex) {
    const toolsKey = toolType === 'axe' ? 'axes' : toolType === 'pickaxe' ? 'pickaxes' : toolType === 'chisel' ? 'chisels' : toolType === 'needle' ? 'needles' : toolType === 'hammer' ? 'hammers' : 'scythes';
    const tool = CONFIG.tools[toolsKey][toolIndex];
    if (!tool) return;
    
    if (!canForgeTool(toolType, toolIndex)) {
        showToast('❌ 材料不足');
        return;
    }
    
    gameState.activeForgingTool = toolId;
    gameState.forgingToolCount = count;
    gameState.forgingToolRemaining = count;
    gameState.forgingToolType = toolType;
    gameState.forgingToolIndex = toolIndex;
    
    if (elements.actionProgressFill) {
        elements.actionProgressFill.style.width = '0%';
    }
    
    // 应用装备加成（锤子加速锻造）
    const bonus = getEquipmentBonus('forging');
    const actualDuration = Math.floor(tool.duration / (1 + bonus));
    setActionState({ name: `锻造${tool.name}`, icon: tool.icon }, actualDuration);
    renderToolsList();
    
    if (animationFrame) cancelAnimationFrame(animationFrame);
    lastActionStartTime = gameState.actionStartTime;
    animationFrame = requestAnimationFrame(updateActionStatusBarSmooth);
    
    scheduleForgingTool(toolId, toolType, toolIndex);
}

function scheduleForgingTool(toolId, toolType, toolIndex) {
    const isInfinite = gameState.forgingToolCount >= 99999;
    if (!gameState.activeForgingTool || (!isInfinite && gameState.forgingToolRemaining <= 0)) {
        gameState.activeForgingTool = null;
        gameState.forgingToolCount = 0;
        gameState.forgingToolRemaining = 0;
        setActionState(null, 0);
        renderToolsList();
        onActionComplete();
        return;
    }
    
    const toolsKey = toolType === 'axe' ? 'axes' : toolType === 'pickaxe' ? 'pickaxes' : toolType === 'chisel' ? 'chisels' : toolType === 'needle' ? 'needles' : toolType === 'hammer' ? 'hammers' : 'scythes';
    const tool = CONFIG.tools[toolsKey][toolIndex];
    if (!tool) return;
    
    if (!canForgeTool(toolType, toolIndex)) {
        showToast('❌ 材料不足，锻造停止');
        gameState.activeForgingTool = null;
        gameState.forgingToolCount = 0;
        gameState.forgingToolRemaining = 0;
        setActionState(null, 0);
        renderToolsList();
        onActionComplete();
        return;
    }
    
    if (!isInfinite) {
        gameState.forgingToolRemaining--;
    }
    
    if (gameState.activeForgingTool === toolId) {
        // 应用装备加成（锤子加速锻造）
        const bonus = getEquipmentBonus('forging');
        const actualDuration = Math.floor(tool.duration / (1 + bonus));
        setActionState({ name: `锻造${tool.name}`, icon: tool.icon }, actualDuration);
        if (elements.actionProgressFill) {
            elements.actionProgressFill.style.width = '0%';
        }
        updateActionStatusBar();
        renderToolsList();
        
        if (animationFrame) cancelAnimationFrame(animationFrame);
        lastActionStartTime = gameState.actionStartTime;
        animationFrame = requestAnimationFrame(updateActionStatusBarSmooth);
        
        gameState.actionTimerId = setTimeout(() => {
            if (gameState.activeForgingTool === toolId) {
                completeForgingToolOnce(toolId, toolType, toolIndex);
                scheduleForgingTool(toolId, toolType, toolIndex);
            }
        }, actualDuration);
    }
}

function completeForgingToolOnce(toolId, toolType, toolIndex) {
    const toolsKey = toolType === 'axe' ? 'axes' : toolType === 'pickaxe' ? 'pickaxes' : toolType === 'chisel' ? 'chisels' : toolType === 'needle' ? 'needles' : toolType === 'hammer' ? 'hammers' : 'scythes';
    const materialsKey = toolType === 'axe' ? 'axes' : toolType === 'pickaxe' ? 'pickaxes' : toolType === 'chisel' ? 'chisels' : toolType === 'needle' ? 'needles' : toolType === 'hammer' ? 'hammers' : 'scythes';
    const tool = CONFIG.tools[toolsKey][toolIndex];
    if (!tool) return;
    
    const materials = CONFIG.toolCraftingMaterials[materialsKey][toolIndex];
    
    // 锤子使用矿锭作为材料
    if (toolType === 'hammer') {
        const ingotIds = ['cyan_ingot', 'red_copper_ingot', 'feather_ingot', 'white_silver_ingot', 'hell_steel_ingot', 'thunder_steel_ingot', 'brilliant_crystal', 'star_crystal'];
        const ingotId = ingotIds[toolIndex];
        gameState.ingotsInventory[ingotId] -= materials.ingot;
    } else {
        // 其他工具使用矿石和木板
        const oreIds = ['cyan_ore', 'red_iron', 'feather_ore', 'hell_ore', 'white_ore', 'thunder_ore', 'brilliant', 'star_ore'];
        const oreId = oreIds[toolIndex];
        gameState.miningInventory[oreId] -= materials.ore;
        
        const plankId = CONFIG.plankIdMapping[toolIndex];
        gameState.planksInventory[plankId] -= materials.plank;
    }
    
    if (materials.prevTool) {
        const inventory = toolType === 'axe' ? gameState.toolsInventory.axes : 
                          toolType === 'pickaxe' ? gameState.toolsInventory.pickaxes :
                          toolType === 'chisel' ? gameState.toolsInventory.chisels : 
                          toolType === 'needle' ? gameState.toolsInventory.needles : 
                          toolType === 'hammer' ? gameState.toolsInventory.hammers :
                          gameState.toolsInventory.scythes;
        if (inventory) {
            const idx = inventory.indexOf(materials.prevTool);
            if (idx > -1) inventory.splice(idx, 1);
        }
    }
    
    const inventory = toolType === 'axe' ? gameState.toolsInventory.axes : 
                      toolType === 'pickaxe' ? gameState.toolsInventory.pickaxes :
                      toolType === 'chisel' ? gameState.toolsInventory.chisels : 
                      toolType === 'needle' ? gameState.toolsInventory.needles : 
                      toolType === 'hammer' ? gameState.toolsInventory.hammers :
                      gameState.toolsInventory.scythes;
    if (!inventory) {
        if (toolType === 'chisel') gameState.toolsInventory.chisels = [];
        else if (toolType === 'needle') gameState.toolsInventory.needles = [];
        else if (toolType === 'scythe') gameState.toolsInventory.scythes = [];
        else if (toolType === 'hammer') gameState.toolsInventory.hammers = [];
    }
    const targetInventory = toolType === 'axe' ? gameState.toolsInventory.axes : 
                            toolType === 'pickaxe' ? gameState.toolsInventory.pickaxes :
                            toolType === 'chisel' ? gameState.toolsInventory.chisels : 
                            toolType === 'needle' ? gameState.toolsInventory.needles : 
                            toolType === 'hammer' ? gameState.toolsInventory.hammers :
                            gameState.toolsInventory.scythes;
    if (!targetInventory.includes(toolId)) targetInventory.push(toolId);
    
    // 检查是否获得锻造代币（使用工具概率表）
    const token = tryGetToken('forging_token', toolIndex, 'tool');
    
    addExp(tool.exp);
    addSkillExp('forging', tool.exp);
    updateUI();
    saveGame();
    
    if (elements.actionRewards) {
        let rewardHtml = `<span class="action-reward-item">+1 ${tool.icon} ${tool.name}</span>`;
        if (token) {
            rewardHtml += `<span class="action-reward-item token-reward">+1 ${token.icon} ${token.name}</span>`;
        }
        elements.actionRewards.innerHTML = rewardHtml;
        setTimeout(() => { if (elements.actionRewards) elements.actionRewards.innerHTML = ''; }, 3000);
    }
}

function startForgingWithCount(ingotId, count) {
    const ingot = CONFIG.ingots.find(i => i.id === ingotId);
    if (!ingot) return;
    
    // 检查材料是否足够
    if (!canForgeIngot(ingot)) {
        showToast('❌ 材料不足');
        return;
    }
    
    gameState.activeForging = ingotId;
    gameState.forgingCount = count;
    gameState.forgingRemaining = count;
    
    // 重置进度条
    if (elements.actionProgressFill) {
        elements.actionProgressFill.style.width = '0%';
    }
    // 应用装备加成（锤子加速锻造）
    const bonus = getEquipmentBonus('forging');
    const actualDuration = Math.floor(ingot.duration / (1 + bonus));
    setActionState({ name: `锻造${ingot.name}`, icon: ingot.icon }, actualDuration);
    renderForging();
    
    // 启动进度条动画
    if (animationFrame) cancelAnimationFrame(animationFrame);
    lastActionStartTime = gameState.actionStartTime;
    animationFrame = requestAnimationFrame(updateActionStatusBarSmooth);
    
    scheduleForging(ingotId);
}

function scheduleForging(ingotId) {
    const isInfinite = gameState.forgingCount >= 99999;
    if (!gameState.activeForging || (!isInfinite && gameState.forgingRemaining <= 0)) {
        gameState.activeForging = null;
        gameState.forgingCount = 0;
        gameState.forgingRemaining = 0;
        setActionState(null, 0);
        renderForging();
        onActionComplete();
        return;
    }
    
    const ingot = CONFIG.ingots.find(i => i.id === ingotId);
    if (!ingot) return;
    
    // 检查材料
    if (!canForgeIngot(ingot)) {
        showToast('❌ 材料不足，锻造停止');
        gameState.activeForging = null;
        gameState.forgingCount = 0;
        gameState.forgingRemaining = 0;
        setActionState(null, 0);
        renderForging();
        onActionComplete();
        return;
    }
    
    if (!isInfinite) {
        gameState.forgingRemaining--;
    }
    
    if (gameState.activeForging === ingotId) {
        // 应用装备加成（锤子加速锻造）
        const bonus = getEquipmentBonus('forging');
        const actualDuration = Math.floor(ingot.duration / (1 + bonus));
        setActionState({ name: `锻造${ingot.name}`, icon: ingot.icon }, actualDuration);
        if (elements.actionProgressFill) {
            elements.actionProgressFill.style.width = '0%';
        }
        updateActionStatusBar();
        renderForging();
        
        if (animationFrame) cancelAnimationFrame(animationFrame);
        lastActionStartTime = gameState.actionStartTime;
        animationFrame = requestAnimationFrame(updateActionStatusBarSmooth);
        
        gameState.actionTimerId = setTimeout(() => {
            if (gameState.activeForging === ingotId) {
                completeForgingOnce(ingotId);
                scheduleForging(ingotId);
            }
        }, actualDuration);
    }
}

function completeForgingOnce(ingotId) {
    const ingot = CONFIG.ingots.find(i => i.id === ingotId);
    const ingotIndex = CONFIG.ingots.findIndex(i => i.id === ingotId);
    if (!ingot) return;
    
    // 消耗材料
    for (const [oreId, count] of Object.entries(ingot.materials)) {
        gameState.miningInventory[oreId] -= count;
    }
    
    // 添加矿锭到存储
    if (!gameState.ingotsInventory[ingotId]) {
        gameState.ingotsInventory[ingotId] = 0;
    }
    gameState.ingotsInventory[ingotId]++;
    
    // 检查是否获得锻造代币
    const token = tryGetToken('forging_token', ingotIndex, 'standard');
    
    addExp(ingot.exp);
    addSkillExp('forging', ingot.exp);
    updateUI();
    saveGame();
    
    // 显示奖励
    if (elements.actionRewards) {
        let rewardHtml = `<span class="action-reward-item">+1 ${ingot.icon} ${ingot.name}</span>`;
        if (token) {
            rewardHtml += `<span class="action-reward-item token-reward">+1 ${token.icon} ${token.name}</span>`;
        }
        elements.actionRewards.innerHTML = rewardHtml;
        setTimeout(() => { if (elements.actionRewards) elements.actionRewards.innerHTML = ''; }, 3000);
    }
}

function renderIngotsInventory() {
    const container = document.getElementById('storage-ingots-items');
    if (!container) return;
    
    if (!gameState.ingotsInventory || Object.keys(gameState.ingotsInventory).length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #666; padding: 40px;">暂无矿锭</div>';
        return;
    }
    
    const html = Object.entries(gameState.ingotsInventory)
        .filter(([id, count]) => count > 0)
        .map(([id, count]) => {
            const ingot = CONFIG.ingots.find(i => i.id === id);
            const name = ingot ? ingot.name : id;
            const icon = ingot ? ingot.icon : '🔩';
            return `
                <div class="storage-item-small">
                    <div class="storage-item-small-icon">${icon}</div>
                    <div class="storage-item-small-name">${name}</div>
                    <div class="storage-item-small-count">×${count}</div>
                </div>
            `;
        })
        .join('');
    
    container.innerHTML = html || '<div style="grid-column: 1/-1; text-align: center; color: #666; padding: 40px;">暂无矿锭</div>';
}

// ============ 缝制系统 ============

function renderTailoring() {
    // 更新缝制经验条
    if (elements.tailoringExpFill && elements.tailoringLevel) {
        const currentExp = getSkillExpForLevel(gameState.tailoringLevel);
        const nextExp = getSkillExpForLevel(gameState.tailoringLevel + 1);
        const expNeeded = nextExp - currentExp;
        const expProgress = gameState.tailoringExp - currentExp;
        const percentage = expNeeded > 0 ? (expProgress / expNeeded) * 100 : 0;
        elements.tailoringExpFill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        elements.tailoringLevel.textContent = gameState.tailoringLevel;
    }
    
    // 更新侧边栏缝制经验条
    if (elements.navTailoringExp && elements.navTailoringLvl) {
        const currentExp = getSkillExpForLevel(gameState.tailoringLevel);
        const nextExp = getSkillExpForLevel(gameState.tailoringLevel + 1);
        const expNeeded = nextExp - currentExp;
        const expProgress = gameState.tailoringExp - currentExp;
        const percentage = expNeeded > 0 ? (expProgress / expNeeded) * 100 : 0;
        elements.navTailoringExp.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        elements.navTailoringLvl.textContent = gameState.tailoringLevel;
    }
    
    // 渲染布料列表
    renderFabricsList();
}

function renderFabricsList() {
    if (!elements.tailoringFabricsList) return;
    
    const html = CONFIG.fabrics.map(fabric => {
        const isUnlocked = gameState.tailoringLevel >= fabric.reqLevel;
        const isActive = gameState.activeTailoring === fabric.id;
        const canTailor = canTailorFabric(fabric);
        
        // 获取材料名称
        const materialNames = Object.entries(fabric.materials).map(([itemId, count]) => {
            const owned = gameState.gatheringInventory[itemId] || 0;
            // 查找材料名称
            let materialName = itemId;
            for (const loc of CONFIG.gatheringLocations) {
                const item = loc.items.find(i => i.id === itemId);
                if (item) {
                    materialName = item.name;
                    break;
                }
            }
            return `${materialName}×${count} (${owned}/${count})`;
        }).join(', ');
        
        let actionStatus = '';
        if (isActive) {
            const remaining = gameState.tailoringRemaining || 0;
            const total = gameState.tailoringCount || 1;
            const countText = total >= 99999 ? '∞' : `${remaining}/${total}`;
            actionStatus = `<div class="action-timer">缝制中... ${countText}</div>`;
        }
        
        return `
            <div class="gathering-item-card ${!isUnlocked ? 'locked' : ''} ${isActive ? 'active' : ''}" data-fabric-id="${fabric.id}">
                <div class="gathering-item-icon">${fabric.icon}</div>
                <div class="gathering-item-info">
                    <div class="gathering-item-name">${fabric.name}</div>
                    <div class="gathering-item-desc">${materialNames}</div>
                    <div class="gathering-item-meta">${fabric.duration/1000}秒 | +${fabric.exp} EXP | Lv.${fabric.reqLevel}</div>
                </div>
                ${actionStatus}
                ${!isUnlocked ? '<div class="gathering-item-locked">🔒 等级不足</div>' : ''}
                ${isUnlocked && !canTailor ? '<div class="gathering-item-locked">📦 材料不足</div>' : ''}
            </div>
        `;
    }).join('');
    
    elements.tailoringFabricsList.innerHTML = html;
    
    // 绑定点击事件
    elements.tailoringFabricsList.querySelectorAll('.gathering-item-card').forEach(card => {
        card.addEventListener('click', function(e) {
            e.stopPropagation();
            
            const fabricId = this.dataset.fabricId;
            const fabric = CONFIG.fabrics.find(f => f.id === fabricId);
            
            // 检查等级
            if (gameState.tailoringLevel < fabric.reqLevel) {
                showToast(`❌ 需要缝制等级 ${fabric.reqLevel}`);
                return;
            }
            
            // 检查材料
            if (!canTailorFabric(fabric)) {
                showToast('❌ 材料不足');
                return;
            }
            
            // 检查是否正在进行中
            if (this.classList.contains('active')) {
                showToast('⏳ 正在缝制中');
                return;
            }
            
            openActionModal('tailoring', fabricId, fabric.name);
        });
    });
}

function canTailorFabric(fabric) {
    for (const [itemId, count] of Object.entries(fabric.materials)) {
        const owned = gameState.gatheringInventory[itemId] || 0;
        if (owned < count) return false;
    }
    return true;
}

function startTailoringWithCount(fabricId, count) {
    const fabric = CONFIG.fabrics.find(f => f.id === fabricId);
    if (!fabric) return;
    
    // 检查材料是否足够
    if (!canTailorFabric(fabric)) {
        showToast('❌ 材料不足');
        return;
    }
    
    gameState.activeTailoring = fabricId;
    gameState.tailoringCount = count;
    gameState.tailoringRemaining = count;
    
    // 重置进度条
    if (elements.actionProgressFill) {
        elements.actionProgressFill.style.width = '0%';
    }
    setActionState({ name: `缝制${fabric.name}`, icon: fabric.icon }, fabric.duration);
    renderTailoring();
    
    // 启动进度条动画
    if (animationFrame) cancelAnimationFrame(animationFrame);
    lastActionStartTime = gameState.actionStartTime;
    animationFrame = requestAnimationFrame(updateActionStatusBarSmooth);
    
    scheduleTailoring(fabricId);
}

function scheduleTailoring(fabricId) {
    const isInfinite = gameState.tailoringCount >= 99999;
    if (!gameState.activeTailoring || (!isInfinite && gameState.tailoringRemaining <= 0)) {
        gameState.activeTailoring = null;
        gameState.tailoringCount = 0;
        gameState.tailoringRemaining = 0;
        setActionState(null, 0);
        renderTailoring();
        onActionComplete();
        return;
    }
    
    const fabric = CONFIG.fabrics.find(f => f.id === fabricId);
    if (!fabric) return;
    
    // 检查材料
    if (!canTailorFabric(fabric)) {
        showToast('❌ 材料不足，缝制停止');
        gameState.activeTailoring = null;
        gameState.tailoringCount = 0;
        gameState.tailoringRemaining = 0;
        setActionState(null, 0);
        renderTailoring();
        onActionComplete();
        return;
    }
    
    if (!isInfinite) {
        gameState.tailoringRemaining--;
    }
    
    if (gameState.activeTailoring === fabricId) {
        setActionState({ name: `缝制${fabric.name}`, icon: fabric.icon }, fabric.duration);
        if (elements.actionProgressFill) {
            elements.actionProgressFill.style.width = '0%';
        }
        updateActionStatusBar();
        renderTailoring();
        
        if (animationFrame) cancelAnimationFrame(animationFrame);
        lastActionStartTime = gameState.actionStartTime;
        animationFrame = requestAnimationFrame(updateActionStatusBarSmooth);
        
        gameState.actionTimerId = setTimeout(() => {
            if (gameState.activeTailoring === fabricId) {
                completeTailoringOnce(fabricId);
                scheduleTailoring(fabricId);
            }
        }, fabric.duration);
    }
}

function completeTailoringOnce(fabricId) {
    const fabric = CONFIG.fabrics.find(f => f.id === fabricId);
    const fabricIndex = CONFIG.fabrics.findIndex(f => f.id === fabricId);
    if (!fabric) return;
    
    // 消耗材料
    for (const [itemId, count] of Object.entries(fabric.materials)) {
        gameState.gatheringInventory[itemId] -= count;
    }
    
    // 添加布料到存储
    if (!gameState.fabricsInventory[fabricId]) {
        gameState.fabricsInventory[fabricId] = 0;
    }
    gameState.fabricsInventory[fabricId]++;
    
    // 检查是否获得缝制代币
    const token = tryGetToken('tailoring_token', fabricIndex, 'tailoring');
    
    addExp(fabric.exp);
    addSkillExp('tailoring', fabric.exp);
    updateUI();
    saveGame();
    
    // 显示奖励
    if (elements.actionRewards) {
        let rewardHtml = `<span class="action-reward-item">+1 ${fabric.icon} ${fabric.name}</span>`;
        if (token) {
            rewardHtml += `<span class="action-reward-item token-reward">+1 ${token.icon} ${token.name}</span>`;
        }
        elements.actionRewards.innerHTML = rewardHtml;
        setTimeout(() => { if (elements.actionRewards) elements.actionRewards.innerHTML = ''; }, 3000);
    }
}

function renderFabricsInventory() {
    const container = document.getElementById('storage-fabrics-items');
    if (!container) return;
    
    if (!gameState.fabricsInventory || Object.keys(gameState.fabricsInventory).length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #666; padding: 40px;">暂无布料</div>';
        return;
    }
    
    const html = Object.entries(gameState.fabricsInventory)
        .filter(([id, count]) => count > 0)
        .map(([id, count]) => {
            const fabric = CONFIG.fabrics.find(f => f.id === id);
            const name = fabric ? fabric.name : id;
            const icon = fabric ? fabric.icon : '🧵';
            return `
                <div class="storage-item-small">
                    <div class="storage-item-small-icon">${icon}</div>
                    <div class="storage-item-small-name">${name}</div>
                    <div class="storage-item-small-count">×${count}</div>
                </div>
            `;
        })
        .join('');
    
    container.innerHTML = html || '<div style="grid-column: 1/-1; text-align: center; color: #666; padding: 40px;">暂无布料</div>';
}

function renderToolsInventory() {
    const container = document.getElementById('storage-tools-items');
    if (!container) return;
    
    const toolTypes = [
        { key: 'axes', config: 'axes', name: '斧头' },
        { key: 'pickaxes', config: 'pickaxes', name: '镐子' },
        { key: 'chisels', config: 'chisels', name: '凿子' },
        { key: 'needles', config: 'needles', name: '针' },
        { key: 'scythes', config: 'scythes', name: '镰刀' },
        { key: 'hammers', config: 'hammers', name: '锤' }
    ];
    
    let hasTools = false;
    let html = '';
    
    toolTypes.forEach(type => {
        const inventory = gameState.toolsInventory[type.key] || [];
        if (inventory.length > 0) {
            hasTools = true;
            inventory.forEach(toolId => {
                const tool = CONFIG.tools[type.config].find(t => t.id === toolId);
                if (tool) {
                    const isEquipped = gameState.equipment[type.key.slice(0, -1)] === toolId || 
                                       (type.key === 'axes' && gameState.equipment.axe === toolId) ||
                                       (type.key === 'pickaxes' && gameState.equipment.pickaxe === toolId) ||
                                       (type.key === 'chisels' && gameState.equipment.chisel === toolId) ||
                                       (type.key === 'needles' && gameState.equipment.needle === toolId) ||
                                       (type.key === 'scythes' && gameState.equipment.scythe === toolId) ||
                                       (type.key === 'hammers' && gameState.equipment.hammer === toolId);
                    html += `
                        <div class="storage-item-small ${isEquipped ? 'equipped' : ''}">
                            <div class="storage-item-small-icon">${tool.icon}</div>
                            <div class="storage-item-small-name">${tool.name} ${isEquipped ? '✓' : ''}</div>
                            <div class="storage-item-small-count">${isEquipped ? '已装备' : ''}</div>
                        </div>
                    `;
                }
            });
        }
    });
    
    container.innerHTML = html || '<div style="grid-column: 1/-1; text-align: center; color: #666; padding: 40px;">暂无锻造工具</div>';
}

// ============ 炼金系统 ============

function renderAlchemy() {
    // 更新炼金经验条
    if (elements.alchemyExpFill && elements.alchemyLevel) {
        const currentExp = getSkillExpForLevel(gameState.alchemyLevel);
        const nextExp = getSkillExpForLevel(gameState.alchemyLevel + 1);
        const expNeeded = nextExp - currentExp;
        const expProgress = gameState.alchemyExp - currentExp;
        const percentage = expNeeded > 0 ? (expProgress / expNeeded) * 100 : 0;
        elements.alchemyExpFill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        elements.alchemyLevel.textContent = gameState.alchemyLevel;
    }
    
    // 更新侧边栏炼金经验条
    if (elements.navAlchemyExp && elements.navAlchemyLvl) {
        const currentExp = getSkillExpForLevel(gameState.alchemyLevel);
        const nextExp = getSkillExpForLevel(gameState.alchemyLevel + 1);
        const expNeeded = nextExp - currentExp;
        const expProgress = gameState.alchemyExp - currentExp;
        const percentage = expNeeded > 0 ? (expProgress / expNeeded) * 100 : 0;
        elements.navAlchemyExp.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        elements.navAlchemyLvl.textContent = gameState.alchemyLevel;
    }
    
    // 渲染药水列表
    renderPotionsList();
}

function renderPotionsList() {
    if (!elements.alchemyPotionsList) return;
    
    const html = CONFIG.potions.map(potion => {
        const isUnlocked = gameState.alchemyLevel >= potion.reqLevel;
        const isActive = gameState.activeAlchemy === potion.id;
        const canBrew = canBrewPotion(potion);
        
        // 获取材料名称
        const materialNames = Object.entries(potion.materials).map(([itemId, count]) => {
            const owned = gameState.gatheringInventory[itemId] || 0;
            let materialName = itemId;
            let materialIcon = '🌿';
            for (const loc of CONFIG.gatheringLocations) {
                const item = loc.items.find(i => i.id === itemId);
                if (item) {
                    materialName = item.name;
                    materialIcon = item.icon;
                    break;
                }
            }
            return `${materialIcon}${materialName}×${count}(${owned})`;
        }).join(', ');
        
        let actionStatus = '';
        if (isActive) {
            const remaining = gameState.alchemyRemaining || 0;
            const total = gameState.alchemyCount || 1;
            const countText = total >= 99999 ? '∞' : `${remaining}/${total}`;
            actionStatus = `<div class="action-timer">炼制中... ${countText}</div>`;
        }
        
        return `
            <div class="gathering-item-card ${!isUnlocked ? 'locked' : ''} ${isActive ? 'active' : ''}" data-potion-id="${potion.id}">
                <div class="gathering-item-icon">${potion.icon}</div>
                <div class="gathering-item-info">
                    <div class="gathering-item-name">${potion.name}</div>
                    <div class="gathering-item-desc">${materialNames}</div>
                    <div class="gathering-item-meta">${potion.duration/1000}秒 | +${potion.exp} EXP | Lv.${potion.reqLevel}</div>
                </div>
                ${actionStatus}
                ${!isUnlocked ? '<div class="gathering-item-locked">🔒 等级不足</div>' : ''}
                ${isUnlocked && !canBrew ? '<div class="gathering-item-locked">📦 材料不足</div>' : ''}
            </div>
        `;
    }).join('');
    
    elements.alchemyPotionsList.innerHTML = html;
    
    // 绑定点击事件
    elements.alchemyPotionsList.querySelectorAll('.gathering-item-card').forEach(card => {
        card.addEventListener('click', function(e) {
            e.stopPropagation();
            
            const potionId = this.dataset.potionId;
            const potion = CONFIG.potions.find(p => p.id === potionId);
            
            if (gameState.alchemyLevel < potion.reqLevel) {
                showToast(`❌ 需要炼金等级 ${potion.reqLevel}`);
                return;
            }
            
            if (!canBrewPotion(potion)) {
                showToast('❌ 材料不足');
                return;
            }
            
            if (this.classList.contains('active')) {
                showToast('⏳ 正在炼制中');
                return;
            }
            
            openActionModal('alchemy', potionId, potion.name);
        });
    });
}

function canBrewPotion(potion) {
    for (const [itemId, count] of Object.entries(potion.materials)) {
        const owned = gameState.gatheringInventory[itemId] || 0;
        if (owned < count) return false;
    }
    return true;
}

// ============ 提炼精华系统 ============

function renderEssencesList() {
    if (!elements.alchemyEssencesList) return;
    
    const html = CONFIG.essences.map(essence => {
        const isUnlocked = gameState.alchemyLevel >= essence.reqLevel;
        const isActive = gameState.activeEssence === essence.id;
        const canExtract = canExtractEssence(essence);
        
        // 获取材料名称
        const materialNames = Object.entries(essence.materials).map(([itemId, count]) => {
            const owned = gameState.gatheringInventory[itemId] || 0;
            let materialName = itemId;
            let materialIcon = '🌿';
            for (const loc of CONFIG.gatheringLocations) {
                const item = loc.items.find(i => i.id === itemId);
                if (item) {
                    materialName = item.name;
                    materialIcon = item.icon;
                    break;
                }
            }
            return `${materialIcon}${materialName}×${count}(${owned})`;
        }).join(', ');
        
        let actionStatus = '';
        if (isActive) {
            const remaining = gameState.essenceRemaining || 0;
            const total = gameState.essenceCount || 1;
            const countText = total >= 99999 ? '∞' : `${remaining}/${total}`;
            actionStatus = `<div class="action-timer">提炼中... ${countText}</div>`;
        }
        
        return `
            <div class="gathering-item-card ${!isUnlocked ? 'locked' : ''} ${isActive ? 'active' : ''}" data-essence-id="${essence.id}">
                <div class="gathering-item-icon">${essence.icon}</div>
                <div class="gathering-item-info">
                    <div class="gathering-item-name">${essence.name}</div>
                    <div class="gathering-item-desc">${materialNames}</div>
                    <div class="gathering-item-meta">${essence.duration/1000}秒 | +${essence.exp} EXP | Lv.${essence.reqLevel}</div>
                </div>
                ${actionStatus}
                ${!isUnlocked ? '<div class="gathering-item-locked">🔒 等级不足</div>' : ''}
                ${isUnlocked && !canExtract ? '<div class="gathering-item-locked">📦 材料不足</div>' : ''}
            </div>
        `;
    }).join('');
    
    elements.alchemyEssencesList.innerHTML = html;
    
    // 绑定点击事件
    elements.alchemyEssencesList.querySelectorAll('.gathering-item-card').forEach(card => {
        card.addEventListener('click', function(e) {
            e.stopPropagation();
            
            const essenceId = this.dataset.essenceId;
            const essence = CONFIG.essences.find(e => e.id === essenceId);
            
            if (gameState.alchemyLevel < essence.reqLevel) {
                showToast(`❌ 需要炼金等级 ${essence.reqLevel}`);
                return;
            }
            
            if (!canExtractEssence(essence)) {
                showToast('❌ 材料不足');
                return;
            }
            
            if (this.classList.contains('active')) {
                showToast('⏳ 正在提炼中');
                return;
            }
            
            openActionModal('essence', essenceId, essence.name);
        });
    });
}

function canExtractEssence(essence) {
    for (const [itemId, count] of Object.entries(essence.materials)) {
        const owned = gameState.gatheringInventory[itemId] || 0;
        if (owned < count) return false;
    }
    return true;
}

function startEssenceExtraction(essenceId, count) {
    const essence = CONFIG.essences.find(e => e.id === essenceId);
    if (!essence) return;
    
    if (!canExtractEssence(essence)) {
        showToast('❌ 材料不足');
        return;
    }
    
    gameState.activeEssence = essenceId;
    gameState.essenceCount = count;
    gameState.essenceRemaining = count;
    
    if (elements.actionProgressFill) {
        elements.actionProgressFill.style.width = '0%';
    }
    setActionState({ name: `提炼${essence.name}`, icon: essence.icon }, essence.duration);
    renderEssencesList();
    
    if (animationFrame) cancelAnimationFrame(animationFrame);
    lastActionStartTime = gameState.actionStartTime;
    animationFrame = requestAnimationFrame(updateActionStatusBarSmooth);
    
    scheduleEssenceExtraction(essenceId);
}

function scheduleEssenceExtraction(essenceId) {
    const isInfinite = gameState.essenceCount >= 99999;
    if (!gameState.activeEssence || (!isInfinite && gameState.essenceRemaining <= 0)) {
        gameState.activeEssence = null;
        gameState.essenceCount = 0;
        gameState.essenceRemaining = 0;
        setActionState(null, 0);
        renderEssencesList();
        onActionComplete();
        return;
    }
    
    const essence = CONFIG.essences.find(e => e.id === essenceId);
    if (!essence) return;
    
    // 检查材料是否足够
    if (!canExtractEssence(essence)) {
        showToast('❌ 材料不足，停止提炼');
        gameState.activeEssence = null;
        gameState.essenceCount = 0;
        gameState.essenceRemaining = 0;
        setActionState(null, 0);
        renderEssencesList();
        onActionComplete();
        return;
    }
    
    // 消耗材料
    for (const [itemId, count] of Object.entries(essence.materials)) {
        gameState.gatheringInventory[itemId] -= count;
    }
    
    gameState.actionTimerId = setTimeout(() => {
        // 添加精华
        if (!gameState.essencesInventory[essenceId]) {
            gameState.essencesInventory[essenceId] = 0;
        }
        gameState.essencesInventory[essenceId]++;
        
        // 增加经验
        gameState.alchemyExp += essence.exp;
        checkAlchemyLevelUp();
        
        // 更新剩余次数
        if (!isInfinite) {
            gameState.essenceRemaining--;
        }
        
        showToast(`✨ 获得 ${essence.name}`);
        renderEssencesList();
        renderGatheringInventory();
        renderEssencesInventory();
        renderMerchantWarehouse();
        saveGame();
        
        // 继续下一次提炼
        scheduleEssenceExtraction(essenceId);
    }, essence.duration);
}

function startAlchemyWithCount(potionId, count) {
    const potion = CONFIG.potions.find(p => p.id === potionId);
    if (!potion) return;
    
    if (!canBrewPotion(potion)) {
        showToast('❌ 材料不足');
        return;
    }
    
    gameState.activeAlchemy = potionId;
    gameState.alchemyCount = count;
    gameState.alchemyRemaining = count;
    
    if (elements.actionProgressFill) {
        elements.actionProgressFill.style.width = '0%';
    }
    setActionState({ name: `炼制${potion.name}`, icon: potion.icon }, potion.duration);
    renderAlchemy();
    
    if (animationFrame) cancelAnimationFrame(animationFrame);
    lastActionStartTime = gameState.actionStartTime;
    animationFrame = requestAnimationFrame(updateActionStatusBarSmooth);
    
    scheduleAlchemy(potionId);
}

function scheduleAlchemy(potionId) {
    const isInfinite = gameState.alchemyCount >= 99999;
    if (!gameState.activeAlchemy || (!isInfinite && gameState.alchemyRemaining <= 0)) {
        gameState.activeAlchemy = null;
        gameState.alchemyCount = 0;
        gameState.alchemyRemaining = 0;
        setActionState(null, 0);
        renderAlchemy();
        onActionComplete();
        return;
    }
    
    const potion = CONFIG.potions.find(p => p.id === potionId);
    if (!potion) return;
    
    if (!canBrewPotion(potion)) {
        showToast('❌ 材料不足，炼制停止');
        gameState.activeAlchemy = null;
        gameState.alchemyCount = 0;
        gameState.alchemyRemaining = 0;
        setActionState(null, 0);
        renderAlchemy();
        onActionComplete();
        return;
    }
    
    if (!isInfinite) {
        gameState.alchemyRemaining--;
    }
    
    if (gameState.activeAlchemy === potionId) {
        setActionState({ name: `炼制${potion.name}`, icon: potion.icon }, potion.duration);
        if (elements.actionProgressFill) {
            elements.actionProgressFill.style.width = '0%';
        }
        updateActionStatusBar();
        renderAlchemy();
        
        if (animationFrame) cancelAnimationFrame(animationFrame);
        lastActionStartTime = gameState.actionStartTime;
        animationFrame = requestAnimationFrame(updateActionStatusBarSmooth);
        
        gameState.actionTimerId = setTimeout(() => {
            if (gameState.activeAlchemy === potionId) {
                completeAlchemyOnce(potionId);
                scheduleAlchemy(potionId);
            }
        }, potion.duration);
    }
}

function completeAlchemyOnce(potionId) {
    const potion = CONFIG.potions.find(p => p.id === potionId);
    const potionIndex = CONFIG.potions.findIndex(p => p.id === potionId);
    if (!potion) return;
    
    for (const [itemId, count] of Object.entries(potion.materials)) {
        gameState.gatheringInventory[itemId] -= count;
    }
    
    if (!gameState.potionsInventory[potionId]) {
        gameState.potionsInventory[potionId] = 0;
    }
    gameState.potionsInventory[potionId]++;
    
    // 检查是否获得制药代币
    const token = tryGetToken('alchemy_token', potionIndex, 'standard');
    
    addExp(potion.exp);
    addSkillExp('alchemy', potion.exp);
    updateUI();
    saveGame();
    
    if (elements.actionRewards) {
        let rewardHtml = `<span class="action-reward-item">+1 ${potion.icon} ${potion.name}</span>`;
        if (token) {
            rewardHtml += `<span class="action-reward-item token-reward">+1 ${token.icon} ${token.name}</span>`;
        }
        elements.actionRewards.innerHTML = rewardHtml;
        setTimeout(() => { if (elements.actionRewards) elements.actionRewards.innerHTML = ''; }, 3000);
    }
}

function renderPotionsInventory() {
    const container = document.getElementById('storage-potions-items');
    if (!container) return;
    
    if (!gameState.potionsInventory || Object.keys(gameState.potionsInventory).length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #666; padding: 40px;">暂无药水</div>';
        return;
    }
    
    const html = Object.entries(gameState.potionsInventory)
        .filter(([id, count]) => count > 0)
        .map(([id, count]) => {
            const potion = CONFIG.potions.find(p => p.id === id);
            const name = potion ? potion.name : id;
            const icon = potion ? potion.icon : '🧪';
            return `
                <div class="storage-item-small">
                    <div class="storage-item-small-icon">${icon}</div>
                    <div class="storage-item-small-name">${name}</div>
                    <div class="storage-item-small-count">×${count}</div>
                </div>
            `;
        })
        .join('');
    
    container.innerHTML = html || '<div style="grid-column: 1/-1; text-align: center; color: #666; padding: 40px;">暂无药水</div>';
}

function renderEssencesInventory() {
    const container = document.getElementById('storage-essences-items');
    if (!container) return;
    
    if (!gameState.essencesInventory || Object.keys(gameState.essencesInventory).length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #666; padding: 40px;">暂无精华</div>';
        return;
    }
    
    const html = Object.entries(gameState.essencesInventory)
        .filter(([id, count]) => count > 0)
        .map(([id, count]) => {
            const essence = CONFIG.essences.find(e => e.id === id);
            const name = essence ? essence.name : id;
            const icon = essence ? essence.icon : '✨';
            return `
                <div class="storage-item-small">
                    <div class="storage-item-small-icon">${icon}</div>
                    <div class="storage-item-small-name">${name}</div>
                    <div class="storage-item-small-count">×${count}</div>
                </div>
            `;
        })
        .join('');
    
    container.innerHTML = html || '<div style="grid-column: 1/-1; text-align: center; color: #666; padding: 40px;">暂无精华</div>';
}

function renderTokensInventory() {
    const container = document.getElementById('storage-tokens-items');
    if (!container) return;
    
    const tokens = gameState.tokensInventory || {};
    const hasTokens = Object.values(tokens).some(count => count > 0);
    
    if (!hasTokens) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #666; padding: 40px;">暂无代币</div>';
        return;
    }
    
    const html = Object.entries(tokens)
        .filter(([id, count]) => count > 0)
        .map(([id, count]) => {
            const token = CONFIG.tokens[id];
            const name = token ? token.name : id;
            const icon = token ? token.icon : '🪙';
            return `
                <div class="storage-item-small">
                    <div class="storage-item-small-icon">${icon}</div>
                    <div class="storage-item-small-name">${name}</div>
                    <div class="storage-item-small-count">×${count}</div>
                </div>
            `;
        })
        .join('');
    
    container.innerHTML = html;
}

function setupAlchemyTabs() {
    const tabs = document.querySelectorAll('#alchemy-tabs .gathering-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.stopPropagation();
            const tabName = this.dataset.tab;
            
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            const potionsList = document.getElementById('alchemy-potions-list');
            const essencesList = document.getElementById('alchemy-essences-list');
            
            if (potionsList) {
                potionsList.style.display = tabName === 'potions' ? 'block' : 'none';
            }
            if (essencesList) {
                essencesList.style.display = tabName === 'essences' ? 'block' : 'none';
            }
        });
    });
}

function renderGatheringTabs() {
    const html = CONFIG.gatheringLocations.map((loc, index) => {
        const isUnlocked = gameState.level >= loc.reqLevel;
        const isActive = index === currentGatheringLocationIndex;
        return `
            <button class="gathering-tab ${isActive ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}" data-index="${index}">
                ${loc.name}
            </button>
        `;
    }).join('');
    
    elements.gatheringTabs.innerHTML = html;
    
    // 绑定点击事件 - 允许点击切换标签页，但内部物品会有等级限制
    elements.gatheringTabs.querySelectorAll('.gathering-tab').forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.stopPropagation();
            const index = parseInt(this.dataset.index);
            currentGatheringLocationIndex = index;
            renderGatheringTabs();
            renderGatheringItems();
        });
    });
}

function renderGatheringItems() {
    const location = CONFIG.gatheringLocations[currentGatheringLocationIndex];
    if (!location) return;
    
    const isLocationUnlocked = gameState.gatheringLevel >= location.reqLevel;
    
    // 添加"全采集"卡片
    const allGatherCard = `
        <div class="gathering-item-card all-gather ${!isLocationUnlocked ? 'locked' : ''}" data-type="all">
            <div class="gathering-item-icon">🧺</div>
            <div class="gathering-item-info">
                <div class="gathering-item-name">${location.name}</div>
                <div class="gathering-item-desc">每次行动 100% 成功，每种物品 30% 概率获得</div>
                <div class="gathering-item-meta">${location.duration/1000}秒 | +${location.exp} EXP</div>
            </div>
            ${!isLocationUnlocked ? '<div class="gathering-item-locked">🔒 等级不足</div>' : ''}
        </div>
    `;
    
    // 渲染各个采集物
    const itemsHtml = location.items.map(item => {
        const isActive = gameState.activeGathering === 'item' && 
                         gameState.gatheringLocationId === location.id && 
                         gameState.gatheringItemId === item.id;
        
        let actionStatus = '';
        if (isActive) {
            const remaining = gameState.gatheringRemaining || 0;
            const total = gameState.gatheringCount || 1;
            const countText = total >= 99999 ? '∞' : `${remaining}/${total}`;
            actionStatus = `<div class="action-timer">采集中... ${countText}</div>`;
        }
        
        return `
            <div class="gathering-item-card ${!isLocationUnlocked ? 'locked' : ''} ${isActive ? 'active' : ''}" data-type="item" data-item-id="${item.id}">
                <div class="gathering-item-icon">${item.icon}</div>
                <div class="gathering-item-info">
                    <div class="gathering-item-name">${item.name}</div>
                    <div class="gathering-item-meta">${location.duration/1000}秒 | +${location.exp} EXP</div>
                </div>
                ${actionStatus}
                ${!isLocationUnlocked ? '<div class="gathering-item-locked">🔒 等级不足</div>' : ''}
            </div>
        `;
    }).join('');
    
    elements.gatheringItemsList.innerHTML = itemsHtml + allGatherCard;
    
    // 绑定点击事件
    elements.gatheringItemsList.querySelectorAll('.gathering-item-card').forEach(card => {
        card.addEventListener('click', function(e) {
            e.stopPropagation();
            
            const type = this.dataset.type;
            const locationId = this.dataset.locationId || location.id;
            
            // 检查是否锁定
            if (this.classList.contains('locked')) {
                showToast(`❌ 需要采集等级 ${location.reqLevel}`);
                return;
            }
            
            if (type === 'all') {
                openActionModal('gathering_all', locationId, location.name);
            } else {
                const itemId = this.dataset.itemId;
                const item = location.items.find(i => i.id === itemId);
                openActionModal('gathering_item', locationId, item.name, itemId);
            }
        });
    });
}

function startGathering(type, locationId, itemId = null) {
    if (hasActiveAction()) { showToast('⏳ 已有行动正在进行中'); return; }
    
    const location = CONFIG.gatheringLocations.find(l => l.id === locationId);
    gameState.activeGathering = type;
    gameState.gatheringLocationId = locationId;
    gameState.gatheringItemId = itemId;
    
    let actionName = '';
    let actionIcon = '🌾';
    
    if (type === 'item' && itemId) {
        const item = location.items.find(i => i.id === itemId);
        actionName = `采集${item.name}`;
        actionIcon = item.icon;
    } else {
        actionName = `${location.name}·全采集`;
    }
    
    setActionState({ name: actionName, icon: actionIcon }, location.duration);
    renderGathering();
    setTimeout(() => completeGathering(type, locationId, itemId), location.duration);
}

function completeGathering(type, locationId, itemId = null) {
    if (!gameState.activeGathering) return;
    
    const location = CONFIG.gatheringLocations.find(l => l.id === locationId);
    
    // 初始化物品仓库（如果不存在）
    if (!gameState.gatheringInventory) {
        gameState.gatheringInventory = {};
    }
    
    let rewards = [];
    
    if (type === 'item' && itemId) {
        // 单个物品采集
        const item = location.items.find(i => i.id === itemId);
        if (!gameState.gatheringInventory[item.id]) {
            gameState.gatheringInventory[item.id] = 0;
        }
        gameState.gatheringInventory[item.id]++;
        rewards.push({ icon: item.icon, name: item.name, amount: 1 });
    } else {
        // 全采集 - 30% 概率获得每种物品
        location.items.forEach(item => {
            if (Math.random() < 0.3) {
                if (!gameState.gatheringInventory[item.id]) {
                    gameState.gatheringInventory[item.id] = 0;
                }
                gameState.gatheringInventory[item.id]++;
                rewards.push({ icon: item.icon, name: item.name, amount: 1 });
            }
        });
    }
    
    // 增加经验
    addExp(location.exp);
    addSkillExp('gathering', location.exp);
    
    // 清除行动状态
    gameState.activeGathering = null;
    gameState.gatheringLocationId = null;
    gameState.gatheringItemId = null;
    setActionState(null, 0);
    
    updateUI();
    saveGame();
    
    // 显示奖励
    if (elements.actionRewards && rewards.length > 0) {
        elements.actionRewards.innerHTML = rewards.map(r => 
            `<span class="action-reward-item">+${r.amount} ${r.icon} ${r.name}</span>`
        ).join('');
        setTimeout(() => { if (elements.actionRewards) elements.actionRewards.innerHTML = ''; }, 3000);
    }
}

// 渲染仓库中的采集物品
function renderWoodcuttingInventory() {
    const container = document.getElementById('storage-woodcutting-items');
    if (!container) return;
    
    if (!gameState.woodcuttingInventory || Object.keys(gameState.woodcuttingInventory).length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #666; padding: 40px;">暂无伐木物品</div>';
        return;
    }
    
    const html = Object.entries(gameState.woodcuttingInventory)
        .filter(([id, count]) => count > 0)
        .map(([id, count]) => {
            const tree = CONFIG.trees.find(t => t.id === id);
            const name = tree ? tree.drop : id;
            const icon = tree ? tree.dropIcon : '🪵';
            return `
                <div class="storage-item-small">
                    <div class="storage-item-small-icon">${icon}</div>
                    <div class="storage-item-small-name">${name}</div>
                    <div class="storage-item-small-count">×${count}</div>
                </div>
            `;
        })
        .join('');
    
    container.innerHTML = html || '<div style="grid-column: 1/-1; text-align: center; color: #666; padding: 40px;">暂无伐木物品</div>';
}

function renderMiningInventory() {
    const container = document.getElementById('storage-mining-items');
    if (!container) return;
    
    if (!gameState.miningInventory || Object.keys(gameState.miningInventory).length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #666; padding: 40px;">暂无挖矿物品</div>';
        return;
    }
    
    const html = Object.entries(gameState.miningInventory)
        .filter(([id, count]) => count > 0)
        .map(([id, count]) => {
            const ore = CONFIG.ores.find(o => o.id === id);
            const name = ore ? ore.drop : id;
            const icon = ore ? ore.dropIcon : '🪨';
            return `
                <div class="storage-item-small">
                    <div class="storage-item-small-icon">${icon}</div>
                    <div class="storage-item-small-name">${name}</div>
                    <div class="storage-item-small-count">×${count}</div>
                </div>
            `;
        })
        .join('');
    
    container.innerHTML = html || '<div style="grid-column: 1/-1; text-align: center; color: #666; padding: 40px;">暂无挖矿物品</div>';
}

function renderGatheringInventory() {
    const container = document.getElementById('storage-gathering-items');
    if (!container) return;
    
    if (!gameState.gatheringInventory || Object.keys(gameState.gatheringInventory).length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #666; padding: 40px;">暂无采集物品</div>';
        return;
    }
    
    // 构建所有采集物的映射表（用于查找图标和名称）
    const itemMap = {};
    CONFIG.gatheringLocations.forEach(loc => {
        loc.items.forEach(item => {
            itemMap[item.id] = { name: item.name, icon: item.icon };
        });
    });
    
    const html = Object.entries(gameState.gatheringInventory)
        .filter(([id, count]) => count > 0)
        .map(([id, count]) => {
            const item = itemMap[id] || { name: id, icon: '📦' };
            return `
                <div class="storage-item-small">
                    <div class="storage-item-small-icon">${item.icon}</div>
                    <div class="storage-item-small-name">${item.name}</div>
                    <div class="storage-item-small-count">×${count}</div>
                </div>
            `;
        })
        .join('');
    
    container.innerHTML = html || '<div style="grid-column: 1/-1; text-align: center; color: #666; padding: 40px;">暂无采集物品</div>';
}

function renderCombatZones() {
    if (!elements.combatZones) return;
    elements.combatZones.innerHTML = CONFIG.combatZones.map((zone, index) => {
        const isActive = gameState.combat.active && gameState.combat.zoneId === zone.id;
        const isLocked = gameState.level < zone.reqLevel;
        return `
            <div class="zone-item ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}" data-index="${index}">
                <div class="zone-icon">${zone.icon}</div>
                <div class="zone-info">
                    <div class="zone-name">${zone.name}</div>
                    <div class="zone-req">等级要求：${zone.reqLevel} | ${zone.duration/1000}秒</div>
                    <div class="zone-rewards">掉落：金币、资源</div>
                </div>
            </div>
        `;
    }).join('');
    
    elements.combatZones.querySelectorAll('.zone-item').forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.dataset.index);
            if (gameState.level < CONFIG.combatZones[index].reqLevel) { showToast(`❌ 需要等级 ${CONFIG.combatZones[index].reqLevel}`); return; }
            gameState.currentZoneIndex = index;
            renderCombatZones();
            updateCombatUI();
        });
    });
}

function updateCombatUI() {
    // 如果战斗相关元素不存在，直接返回
    if (!elements.combatLocation || !elements.combatTimer || !elements.combatBtn) return;
    
    const now = Date.now();
    const zone = CONFIG.combatZones[gameState.currentZoneIndex];
    if (gameState.combat.active) {
        const remaining = Math.max(0, gameState.combat.endTime - now);
        elements.combatLocation.textContent = CONFIG.combatZones.find(z => z.id === gameState.combat.zoneId)?.name || '战斗中';
        elements.combatTimer.textContent = `剩余：${Math.ceil(remaining / 1000)}秒`;
        elements.combatBtn.textContent = '战斗中...';
        elements.combatBtn.disabled = true;
    } else {
        elements.combatLocation.textContent = `${zone.icon} ${zone.name}`;
        elements.combatTimer.textContent = `预计：${zone.duration/1000}秒 | 等级要求：${zone.reqLevel}`;
        elements.combatBtn.textContent = '出征';
        elements.combatBtn.disabled = gameState.level < zone.reqLevel;
    }
}

function toggleCombat() {
    if (gameState.combat.active) return;
    if (hasActiveAction()) { showToast('⏳ 已有行动正在进行中'); return; }
    const zone = CONFIG.combatZones[gameState.currentZoneIndex];
    if (gameState.level < zone.reqLevel) { showToast(`❌ 需要等级 ${zone.reqLevel}`); return; }
    gameState.combat.active = true;
    gameState.combat.zoneId = zone.id;
    gameState.combat.endTime = Date.now() + zone.duration;
    setActionState({ name: `${zone.name}`, icon: zone.icon }, zone.duration);
    updateCombatUI();
    renderCombatZones();
    setTimeout(() => completeCombat(zone), zone.duration);
}

function completeCombat(zone) {
    // 检查行动是否仍然有效（可能已被取消）
    if (!gameState.combat.active) return;
    
    gameState.combat.active = false;
    setActionState(null, 0);
    let rewards = [];
    let rewardHTML = '';
    zone.rewards.forEach(r => {
        const amount = Math.floor(Math.random() * (r.max - r.min + 1)) + r.min;
        gameState.resources[r.item] += amount;
        const icons = { gold: '💰', wood: '🪵', stone: '🪨', herb: '🌿' };
        const name = r.item === 'gold' ? '金币' : r.item === 'wood' ? '木材' : r.item === 'stone' ? '石头' : '草药';
        rewards.push(`+${amount} ${icons[r.item]} ${name}`);
        rewardHTML += `<span class="action-reward-item">+${amount} ${icons[r.item]} ${name}</span>`;
    });
    const expReward = zone.difficulty * 10;
    addExp(expReward);
    addSkillExp('combat', expReward);
    elements.combatRewards.innerHTML = `🎉 战斗奖励：${rewards.join('  |  ')}`;
    // 显示奖励
    if (elements.actionRewards) {
        elements.actionRewards.innerHTML = rewardHTML;
        setTimeout(() => { if (elements.actionRewards) elements.actionRewards.innerHTML = ''; }, 3000);
    }
    gameState.currentZoneIndex = (gameState.currentZoneIndex + 1) % CONFIG.combatZones.length;
    updateUI();
    saveGame();
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `position: fixed; top: 110px; left: 50%; transform: translateX(-50%); background: rgba(139, 44, 45, 0.95); color: #fff; padding: 8px 14px; border-radius: 6px; z-index: 3000; animation: toastFade 3s ease-out; border: 1px solid rgba(139, 44, 45, 0.5); font-size: 0.85rem; text-align: center; white-space: nowrap;`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

const style = document.createElement('style');
style.textContent = `@keyframes toastFade { 0% { opacity: 0; transform: translateX(-50%) translateY(-20px); } 10% { opacity: 1; transform: translateX(-50%) translateY(0); } 90% { opacity: 1; transform: translateX(-50%) translateY(0); } 100% { opacity: 0; transform: translateX(-50%) translateY(-20px); } }`;
document.head.appendChild(style);

function saveGame() {
    gameState.lastSave = Date.now();
    localStorage.setItem('medievalMercenarySave', JSON.stringify(gameState));
}

function loadGame() {
    const saved = localStorage.getItem('medievalMercenarySave');
    if (saved) {
        try {
            const loaded = JSON.parse(saved);
            gameState = { ...gameState, ...loaded };
            const now = Date.now();
            for (const [actionId, endTime] of Object.entries(gameState.activeActions)) {
                if (endTime > now) setTimeout(() => completeAction(actionId), endTime - now);
                else delete gameState.activeActions[actionId];
            }
            if (gameState.combat.active && gameState.combat.endTime > now) {
                setTimeout(() => completeCombat(CONFIG.combatZones.find(z => z.id === gameState.combat.zoneId)), gameState.combat.endTime - now);
            } else { gameState.combat.active = false; }
            
            // 离线计算 - 伐木
            if (gameState.activeWoodcutting && gameState.woodcuttingRemaining > 0) {
                const tree = CONFIG.trees.find(t => t.id === gameState.activeWoodcutting);
                if (tree) {
                    const offlineTime = now - gameState.actionStartTime;
                    const actionDuration = tree.duration;
                    const completedCount = Math.floor(offlineTime / actionDuration);
                    const remainingTime = offlineTime % actionDuration;
                    
                    // 给予离线完成的奖励
                    const actualCompleted = Math.min(completedCount, gameState.woodcuttingRemaining);
                    for (let i = 0; i < actualCompleted; i++) {
                        // 添加木材
                        if (!gameState.woodcuttingInventory[tree.id]) {
                            gameState.woodcuttingInventory[tree.id] = 0;
                        }
                        gameState.woodcuttingInventory[tree.id]++;
                        addExp(tree.exp);
                        addSkillExp('woodcutting', tree.exp);
                    }
                    gameState.woodcuttingRemaining -= actualCompleted;
                    
                    // 更新行动开始时间
                    gameState.actionStartTime = now - remainingTime;
                    
                    // 显示离线奖励
                    if (actualCompleted > 0) {
                        showToast(`⏰ 离线完成 ${actualCompleted} 次伐木！`);
                    }
                    
                    // 如果还有剩余次数，继续执行
                    if (gameState.woodcuttingRemaining > 0 || gameState.woodcuttingCount >= 99999) {
                        setActionState({ name: `采集${tree.name}`, icon: tree.icon }, actionDuration);
                        
                        if (remainingTime > 0) {
                            setTimeout(() => {
                                if (gameState.activeWoodcutting === tree.id) {
                                    completeWoodcuttingOnce(tree.id);
                                    scheduleWoodcutting(tree.id);
                                }
                            }, actionDuration - remainingTime);
                        } else {
                            scheduleWoodcutting(tree.id);
                        }
                        
                        if (animationFrame) cancelAnimationFrame(animationFrame);
                        lastActionStartTime = gameState.actionStartTime;
                        animationFrame = requestAnimationFrame(updateActionStatusBarSmooth);
                        renderWoodcutting();
                    } else {
                        // 全部完成，重置状态
                        gameState.activeWoodcutting = null;
                        gameState.woodcuttingCount = 0;
                        setActionState(null, 0);
                    }
                }
            }
            
            // 离线计算 - 挖矿
            if (gameState.activeMining && gameState.miningRemaining > 0) {
                const ore = CONFIG.ores.find(o => o.id === gameState.activeMining);
                if (ore) {
                    const offlineTime = now - gameState.actionStartTime;
                    const actionDuration = ore.duration;
                    const completedCount = Math.floor(offlineTime / actionDuration);
                    const remainingTime = offlineTime % actionDuration;
                    
                    const actualCompleted = Math.min(completedCount, gameState.miningRemaining);
                    for (let i = 0; i < actualCompleted; i++) {
                        if (!gameState.miningInventory[ore.id]) {
                            gameState.miningInventory[ore.id] = 0;
                        }
                        gameState.miningInventory[ore.id]++;
                        addExp(ore.exp);
                        addSkillExp('mining', ore.exp);
                    }
                    gameState.miningRemaining -= actualCompleted;
                    
                    gameState.actionStartTime = now - remainingTime;
                    
                    if (actualCompleted > 0) {
                        showToast(`⏰ 离线完成 ${actualCompleted} 次挖矿！`);
                    }
                    
                    if (gameState.miningRemaining > 0 || gameState.miningCount >= 99999) {
                        setActionState({ name: `挖掘${ore.name}`, icon: ore.icon }, actionDuration);
                        
                        if (remainingTime > 0) {
                            setTimeout(() => {
                                if (gameState.activeMining === ore.id) {
                                    completeMiningOnce(ore.id);
                                    scheduleMining(ore.id);
                                }
                            }, actionDuration - remainingTime);
                        } else {
                            scheduleMining(ore.id);
                        }
                        
                        if (animationFrame) cancelAnimationFrame(animationFrame);
                        lastActionStartTime = gameState.actionStartTime;
                        animationFrame = requestAnimationFrame(updateActionStatusBarSmooth);
                        renderMining();
                    } else {
                        gameState.activeMining = null;
                        gameState.miningCount = 0;
                        setActionState(null, 0);
                    }
                }
            }
            
            // 更新玩家总等级
            updateTotalLevel();
            
            // 离线计算 - 采集
            if (gameState.activeGathering && gameState.gatheringRemaining > 0) {
                const location = CONFIG.gatheringLocations.find(l => l.id === gameState.gatheringLocationId);
                if (location) {
                    const offlineTime = now - gameState.actionStartTime;
                    const actionDuration = location.duration;
                    const completedCount = Math.floor(offlineTime / actionDuration);
                    const remainingTime = offlineTime % actionDuration;
                    
                    const actualCompleted = Math.min(completedCount, gameState.gatheringRemaining);
                    for (let i = 0; i < actualCompleted; i++) {
                        // 模拟采集奖励
                        if (!gameState.gatheringInventory) gameState.gatheringInventory = {};
                        if (gameState.gatheringItemId) {
                            if (!gameState.gatheringInventory[gameState.gatheringItemId]) {
                                gameState.gatheringInventory[gameState.gatheringItemId] = 0;
                            }
                            gameState.gatheringInventory[gameState.gatheringItemId]++;
                        } else {
                            // 全采集逻辑
                            location.items.forEach(item => {
                                if (Math.random() < 0.3) {
                                    if (!gameState.gatheringInventory[item.id]) {
                                        gameState.gatheringInventory[item.id] = 0;
                                    }
                                    gameState.gatheringInventory[item.id]++;
                                }
                            });
                        }
                        addExp(location.exp);
                        addSkillExp('gathering', location.exp);
                    }
                    gameState.gatheringRemaining -= actualCompleted;
                    
                    gameState.actionStartTime = now - remainingTime;
                    
                    if (actualCompleted > 0) {
                        showToast(`⏰ 离线完成 ${actualCompleted} 次采集！`);
                    }
                    
                    if (gameState.gatheringRemaining > 0 || gameState.gatheringCount >= 99999) {
                        setActionState({ name: `采集`, icon: '🌾' }, actionDuration);
                        
                        if (remainingTime > 0) {
                            setTimeout(() => {
                                if (gameState.activeGathering) {
                                    completeGatheringOnce(gameState.activeGathering, gameState.gatheringLocationId, gameState.gatheringItemId);
                                    scheduleGathering(gameState.activeGathering, gameState.gatheringLocationId, gameState.gatheringItemId);
                                }
                            }, actionDuration - remainingTime);
                        } else {
                            scheduleGathering(gameState.activeGathering, gameState.gatheringLocationId, gameState.gatheringItemId);
                        }
                        
                        if (animationFrame) cancelAnimationFrame(animationFrame);
                        lastActionStartTime = gameState.actionStartTime;
                        animationFrame = requestAnimationFrame(updateActionStatusBarSmooth);
                        renderGathering();
                    } else {
                        gameState.activeGathering = null;
                        gameState.gatheringCount = 0;
                        setActionState(null, 0);
                    }
                }
            }
            
            // 离线计算 - 制作
            if (gameState.activeCrafting && gameState.craftingRemaining > 0) {
                const plank = CONFIG.woodPlanks.find(p => p.id === gameState.activeCrafting);
                if (plank && canCraftPlank(plank)) {
                    const offlineTime = now - gameState.actionStartTime;
                    const actionDuration = plank.duration;
                    const completedCount = Math.floor(offlineTime / actionDuration);
                    const remainingTime = offlineTime % actionDuration;
                    
                    const actualCompleted = Math.min(completedCount, gameState.craftingRemaining);
                    for (let i = 0; i < actualCompleted; i++) {
                        if (canCraftPlank(plank)) {
                            for (const [woodId, count] of Object.entries(plank.materials)) {
                                gameState.woodcuttingInventory[woodId] -= count;
                            }
                            if (!gameState.planksInventory[plank.id]) {
                                gameState.planksInventory[plank.id] = 0;
                            }
                            gameState.planksInventory[plank.id]++;
                            addExp(plank.exp);
                            addSkillExp('crafting', plank.exp);
                        }
                    }
                    gameState.craftingRemaining -= actualCompleted;
                    
                    gameState.actionStartTime = now - remainingTime;
                    
                    if (actualCompleted > 0) {
                        showToast(`⏰ 离线完成 ${actualCompleted} 次制作！`);
                    }
                    
                    if (canCraftPlank(plank) && (gameState.craftingRemaining > 0 || gameState.craftingCount >= 99999)) {
                        setActionState({ name: `制作${plank.name}`, icon: plank.icon }, actionDuration);
                        
                        if (remainingTime > 0) {
                            setTimeout(() => {
                                if (gameState.activeCrafting === plank.id) {
                                    completeCraftingOnce(plank.id);
                                    scheduleCrafting(plank.id);
                                }
                            }, actionDuration - remainingTime);
                        } else {
                            scheduleCrafting(plank.id);
                        }
                        
                        if (animationFrame) cancelAnimationFrame(animationFrame);
                        lastActionStartTime = gameState.actionStartTime;
                        animationFrame = requestAnimationFrame(updateActionStatusBarSmooth);
                        renderCrafting();
                    } else {
                        gameState.activeCrafting = null;
                        gameState.craftingCount = 0;
                        setActionState(null, 0);
                    }
                }
            }
            
            // 离线计算 - 锻造
            if (gameState.activeForging && gameState.forgingRemaining > 0) {
                const ingot = CONFIG.ingots.find(i => i.id === gameState.activeForging);
                if (ingot && canForgeIngot(ingot)) {
                    const offlineTime = now - gameState.actionStartTime;
                    const actionDuration = ingot.duration;
                    const completedCount = Math.floor(offlineTime / actionDuration);
                    const remainingTime = offlineTime % actionDuration;
                    
                    const actualCompleted = Math.min(completedCount, gameState.forgingRemaining);
                    for (let i = 0; i < actualCompleted; i++) {
                        if (canForgeIngot(ingot)) {
                            for (const [oreId, count] of Object.entries(ingot.materials)) {
                                gameState.miningInventory[oreId] -= count;
                            }
                            if (!gameState.ingotsInventory[ingot.id]) {
                                gameState.ingotsInventory[ingot.id] = 0;
                            }
                            gameState.ingotsInventory[ingot.id]++;
                            addExp(ingot.exp);
                            addSkillExp('forging', ingot.exp);
                        }
                    }
                    gameState.forgingRemaining -= actualCompleted;
                    
                    gameState.actionStartTime = now - remainingTime;
                    
                    if (actualCompleted > 0) {
                        showToast(`⏰ 离线完成 ${actualCompleted} 次锻造！`);
                    }
                    
                    if (canForgeIngot(ingot) && (gameState.forgingRemaining > 0 || gameState.forgingCount >= 99999)) {
                        setActionState({ name: `锻造${ingot.name}`, icon: ingot.icon }, actionDuration);
                        
                        if (remainingTime > 0) {
                            setTimeout(() => {
                                if (gameState.activeForging === ingot.id) {
                                    completeForgingOnce(ingot.id);
                                    scheduleForging(ingot.id);
                                }
                            }, actionDuration - remainingTime);
                        } else {
                            scheduleForging(ingot.id);
                        }
                        
                        if (animationFrame) cancelAnimationFrame(animationFrame);
                        lastActionStartTime = gameState.actionStartTime;
                        animationFrame = requestAnimationFrame(updateActionStatusBarSmooth);
                        renderForging();
                    } else {
                        gameState.activeForging = null;
                        gameState.forgingCount = 0;
                        setActionState(null, 0);
                    }
                }
            }
            
            // 离线计算 - 缝制
            if (gameState.activeTailoring && gameState.tailoringRemaining > 0) {
                const fabric = CONFIG.fabrics.find(f => f.id === gameState.activeTailoring);
                if (fabric && canTailorFabric(fabric)) {
                    const offlineTime = now - gameState.actionStartTime;
                    const actionDuration = fabric.duration;
                    const completedCount = Math.floor(offlineTime / actionDuration);
                    const remainingTime = offlineTime % actionDuration;
                    
                    const actualCompleted = Math.min(completedCount, gameState.tailoringRemaining);
                    for (let i = 0; i < actualCompleted; i++) {
                        if (canTailorFabric(fabric)) {
                            for (const [itemId, count] of Object.entries(fabric.materials)) {
                                gameState.gatheringInventory[itemId] -= count;
                            }
                            if (!gameState.fabricsInventory[fabric.id]) {
                                gameState.fabricsInventory[fabric.id] = 0;
                            }
                            gameState.fabricsInventory[fabric.id]++;
                            addExp(fabric.exp);
                            addSkillExp('tailoring', fabric.exp);
                        }
                    }
                    gameState.tailoringRemaining -= actualCompleted;
                    
                    gameState.actionStartTime = now - remainingTime;
                    
                    if (actualCompleted > 0) {
                        showToast(`⏰ 离线完成 ${actualCompleted} 次缝制！`);
                    }
                    
                    if (canTailorFabric(fabric) && (gameState.tailoringRemaining > 0 || gameState.tailoringCount >= 99999)) {
                        setActionState({ name: `缝制${fabric.name}`, icon: fabric.icon }, actionDuration);
                        
                        if (remainingTime > 0) {
                            setTimeout(() => {
                                if (gameState.activeTailoring === fabric.id) {
                                    completeTailoringOnce(fabric.id);
                                    scheduleTailoring(fabric.id);
                                }
                            }, actionDuration - remainingTime);
                        } else {
                            scheduleTailoring(fabric.id);
                        }
                        
                        if (animationFrame) cancelAnimationFrame(animationFrame);
                        lastActionStartTime = gameState.actionStartTime;
                        animationFrame = requestAnimationFrame(updateActionStatusBarSmooth);
                        renderTailoring();
                    } else {
                        gameState.activeTailoring = null;
                        gameState.tailoringCount = 0;
                        setActionState(null, 0);
                    }
                }
            }
            
            // 离线计算 - 工具锻造
            if (gameState.activeForgingTool && gameState.forgingToolRemaining > 0) {
                const toolType = gameState.forgingToolType;
                const toolIndex = gameState.forgingToolIndex;
                const tools = CONFIG.tools[toolType === 'axe' ? 'axes' : 'pickaxes'];
                const tool = tools[toolIndex];
                
                if (tool && canForgeTool(toolType, toolIndex)) {
                    const offlineTime = now - gameState.actionStartTime;
                    const actionDuration = tool.duration;
                    const completedCount = Math.floor(offlineTime / actionDuration);
                    const remainingTime = offlineTime % actionDuration;
                    
                    const actualCompleted = Math.min(completedCount, gameState.forgingToolRemaining);
                    for (let i = 0; i < actualCompleted; i++) {
                        if (canForgeTool(toolType, toolIndex)) {
                            // 消耗材料并添加工具
                            const materials = CONFIG.toolCraftingMaterials[toolType === 'axe' ? 'axes' : 'pickaxes'][toolIndex];
                            const ingotId = CONFIG.ingotIdMapping[toolIndex];
                            const plankId = CONFIG.plankIdMapping[toolIndex];
                            
                            gameState.ingotsInventory[ingotId] -= materials.ore;
                            gameState.planksInventory[plankId] -= materials.plank;
                            
                            if (materials.prevTool) {
                                const inventory = toolType === 'axe' ? gameState.toolsInventory.axes : gameState.toolsInventory.pickaxes;
                                const idx = inventory.indexOf(materials.prevTool);
                                if (idx > -1) inventory.splice(idx, 1);
                            }
                            
                            const inventory = toolType === 'axe' ? gameState.toolsInventory.axes : gameState.toolsInventory.pickaxes;
                            if (!inventory.includes(tool.id)) inventory.push(tool.id);
                            
                            addExp(tool.exp);
                            addSkillExp('forging', tool.exp);
                        }
                    }
                    gameState.forgingToolRemaining -= actualCompleted;
                    gameState.actionStartTime = now - remainingTime;
                    
                    if (actualCompleted > 0) {
                        showToast(`⏰ 离线完成 ${actualCompleted} 次工具锻造！`);
                    }
                    
                    if (canForgeTool(toolType, toolIndex) && (gameState.forgingToolRemaining > 0 || gameState.forgingToolCount >= 99999)) {
                        setActionState({ name: `锻造${tool.name}`, icon: tool.icon }, actionDuration);
                        
                        if (remainingTime > 0) {
                            setTimeout(() => {
                                if (gameState.activeForgingTool === tool.id) {
                                    completeForgingToolOnce(tool.id, toolType, toolIndex);
                                    scheduleForgingTool(tool.id, toolType, toolIndex);
                                }
                            }, actionDuration - remainingTime);
                        } else {
                            scheduleForgingTool(tool.id, toolType, toolIndex);
                        }
                        
                        if (animationFrame) cancelAnimationFrame(animationFrame);
                        lastActionStartTime = gameState.actionStartTime;
                        animationFrame = requestAnimationFrame(updateActionStatusBarSmooth);
                        renderToolsList();
                    } else {
                        gameState.activeForgingTool = null;
                        gameState.forgingToolCount = 0;
                        setActionState(null, 0);
                    }
                }
            }
            
            console.log('💾 游戏已加载');
            
            // 确保新商人数据被初始化
            CONFIG.merchants.forEach(m => {
                if (!gameState.merchantData[m.id]) {
                    gameState.merchantData[m.id] = {
                        favorability: m.favorability || 0,
                        completedQuests: []
                    };
                    console.log(`✅ 新商人已初始化: ${m.name}`);
                }
            });
            
            // 确保新建筑数据被初始化
            CONFIG.buildings.forEach(b => {
                if (!gameState.buildings[b.id]) {
                    gameState.buildings[b.id] = { level: 0 };
                    console.log(`✅ 新建筑已初始化: ${b.name}`);
                }
            });
            
        } catch (e) { console.error('加载失败:', e); }
    }
}

function resetGame() {
    if (confirm('⚠️ 确定要重置所有进度吗？')) {
        localStorage.removeItem('medievalMercenarySave');
        location.reload();
    }
}

function startGameLoop() {
    setInterval(() => {
        CONFIG.buildings.forEach(b => {
            const building = gameState.buildings[b.id];
            if (building.level > 0 && b.production) {
                for (const [res, amount] of Object.entries(b.production)) {
                    gameState.resources[res] += amount * building.level;
                }
            }
        });
        updateUI();
    }, 1000);
    setInterval(saveGame, 5000);
}

window.addEventListener('DOMContentLoaded', () => {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
    init();
});
window.addEventListener('beforeunload', () => {
    // 取消动画帧，防止内存泄漏
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }
    saveGame();
});

// ============ 装备系统 ============

let currentSelectSlot = null;

function setupStorageTabs() {
    const tabs = document.querySelectorAll('.storage-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            if (!tabName) return;
            
            // 更新标签状态
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // 切换内容
            document.querySelectorAll('.storage-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            const targetContent = document.getElementById(`storage-tab-${tabName}`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

function setupForgingTabs() {
    const forgingTabs = document.querySelectorAll('#forging-tabs .gathering-tab');
    const ingotsList = document.getElementById('forging-ingots-list');
    const toolsList = document.getElementById('forging-tools-list');
    
    forgingTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            // 更新标签状态
            forgingTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // 切换内容
            ingotsList.classList.remove('active');
            toolsList.classList.remove('active');
            
            if (tabName === 'ingots') {
                ingotsList.classList.add('active');
            } else if (tabName === 'tools') {
                toolsList.classList.add('active');
            }
        });
    });
}

function renderEquipmentSlots() {
    // 渲染斧头槽位
    const axeSlot = document.getElementById('equipment-slot-axe');
    const axeName = document.getElementById('equipment-slot-axe-name');
    if (gameState.equipment.axe) {
        const tool = CONFIG.tools.axes.find(t => t.id === gameState.equipment.axe);
        if (tool) {
            axeSlot.textContent = tool.icon + ' ✓';
            axeName.textContent = tool.name;
        }
    } else {
        axeSlot.textContent = '🔧';
        axeName.textContent = '空';
    }
    
    // 渲染镐子槽位
    const pickaxeSlot = document.getElementById('equipment-slot-pickaxe');
    const pickaxeName = document.getElementById('equipment-slot-pickaxe-name');
    if (gameState.equipment.pickaxe) {
        const tool = CONFIG.tools.pickaxes.find(t => t.id === gameState.equipment.pickaxe);
        if (tool) {
            pickaxeSlot.textContent = tool.icon + ' ✓';
            pickaxeName.textContent = tool.name;
        }
    } else {
        pickaxeSlot.textContent = '⛏️';
        pickaxeName.textContent = '空';
    }
    
    // 渲染凿子槽位
    const chiselSlot = document.getElementById('equipment-slot-chisel');
    const chiselName = document.getElementById('equipment-slot-chisel-name');
    if (gameState.equipment.chisel) {
        const tool = CONFIG.tools.chisels.find(t => t.id === gameState.equipment.chisel);
        if (tool) {
            chiselSlot.textContent = tool.icon + ' ✓';
            chiselName.textContent = tool.name;
        }
    } else {
        chiselSlot.textContent = '🔨';
        chiselName.textContent = '空';
    }
    
    // 渲染针槽位
    const needleSlot = document.getElementById('equipment-slot-needle');
    const needleName = document.getElementById('equipment-slot-needle-name');
    if (gameState.equipment.needle) {
        const tool = CONFIG.tools.needles.find(t => t.id === gameState.equipment.needle);
        if (tool) {
            needleSlot.textContent = tool.icon + ' ✓';
            needleName.textContent = tool.name;
        }
    } else {
        needleSlot.textContent = '🪡';
        needleName.textContent = '空';
    }
    
    // 渲染镰刀槽位
    const scytheSlot = document.getElementById('equipment-slot-scythe');
    const scytheName = document.getElementById('equipment-slot-scythe-name');
    if (gameState.equipment.scythe) {
        const tool = CONFIG.tools.scythes.find(t => t.id === gameState.equipment.scythe);
        if (tool) {
            scytheSlot.textContent = tool.icon + ' ✓';
            scytheName.textContent = tool.name;
        }
    } else {
        scytheSlot.textContent = '🗡️';
        scytheName.textContent = '空';
    }
    
    // 渲染锤子槽位
    const hammerSlot = document.getElementById('equipment-slot-hammer');
    const hammerName = document.getElementById('equipment-slot-hammer-name');
    if (gameState.equipment.hammer) {
        const tool = CONFIG.tools.hammers.find(t => t.id === gameState.equipment.hammer);
        if (tool) {
            hammerSlot.textContent = tool.icon + ' ✓';
            hammerName.textContent = tool.name;
        }
    } else {
        hammerSlot.textContent = '🔨';
        hammerName.textContent = '空';
    }
    
    // 更新槽位状态
    document.querySelectorAll('.equipment-slot').forEach(slot => {
        const slotType = slot.dataset.slot;
        if (gameState.equipment[slotType]) {
            slot.classList.add('equipped');
        } else {
            slot.classList.remove('equipped');
        }
    });
}

function setupEquipmentListeners() {
    document.querySelectorAll('.equipment-slot').forEach(slot => {
        slot.addEventListener('click', function() {
            if (this.classList.contains('locked')) return;
            
            const slotType = this.dataset.slot;
            const validSlots = ['axe', 'pickaxe', 'chisel', 'needle', 'scythe', 'hammer'];
            if (validSlots.includes(slotType)) {
                openToolSelectModal(slotType);
            }
        });
    });
}

function setupToolSelectModal() {
    const modal = document.getElementById('tool-select-modal');
    const closeBtn = document.getElementById('tool-select-close');
    const cancelBtn = document.getElementById('tool-select-cancel');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    }
}

function openToolSelectModal(slotType) {
    currentSelectSlot = slotType;
    const modal = document.getElementById('tool-select-modal');
    const title = document.getElementById('tool-select-title');
    const list = document.getElementById('tool-select-list');
    
    const slotNames = { 
        axe: '斧头', 
        pickaxe: '镐子', 
        chisel: '凿子', 
        needle: '针', 
        scythe: '镰刀',
        hammer: '锤'
    };
    const slotSkills = {
        axe: 'woodcuttingLevel',
        pickaxe: 'miningLevel',
        chisel: 'craftingLevel',
        needle: 'tailoringLevel',
        scythe: 'gatheringLevel',
        hammer: 'forgingLevel'
    };
    const slotBonusNames = {
        axe: '伐木',
        pickaxe: '挖矿',
        chisel: '制作',
        needle: '缝制',
        scythe: '采集',
        hammer: '锻造'
    };
    
    title.textContent = `选择${slotNames[slotType] || '工具'}`;
    
    const tools = CONFIG.tools[slotType === 'axe' ? 'axes' : slotType === 'pickaxe' ? 'pickaxes' : slotType === 'chisel' ? 'chisels' : slotType === 'needle' ? 'needles' : slotType === 'hammer' ? 'hammers' : 'scythes'];
    const inventory = gameState.toolsInventory[slotType === 'axe' ? 'axes' : slotType === 'pickaxe' ? 'pickaxes' : slotType === 'chisel' ? 'chisels' : slotType === 'needle' ? 'needles' : slotType === 'hammer' ? 'hammers' : 'scythes'] || [];
    const currentEquipped = gameState.equipment[slotType];
    
    if (inventory.length === 0) {
        list.innerHTML = '<div class="tool-empty-message">没有可用工具</div>';
    } else {
        const html = tools.filter(t => inventory.includes(t.id)).map(tool => {
            const isEquipped = currentEquipped === tool.id;
            const canEquip = gameState[slotSkills[slotType]] >= tool.reqEquipLevel;
            const bonusText = `${slotBonusNames[slotType]}速度+${Math.round(tool.speedBonus * 100)}%`;
            
            return `
                <div class="tool-select-item ${isEquipped ? 'equipped' : ''} ${!canEquip ? 'locked' : ''}" 
                    data-tool-id="${tool.id}" 
                    data-slot-type="${slotType}">
                    <div class="tool-select-icon">${tool.icon}</div>
                    <div class="tool-select-info">
                        <div class="tool-select-name">${tool.name} ${isEquipped ? '✓' : ''}</div>
                        <div class="tool-select-desc">${bonusText} | 装备需求: Lv.${tool.reqEquipLevel}</div>
                    </div>
                    ${isEquipped ? '<span class="tool-select-badge">已装备</span>' : ''}
                    ${!canEquip ? '<span class="tool-select-badge" style="background: rgba(139, 44, 45, 0.3); color: #8B2C2D;">等级不足</span>' : ''}
                </div>
            `;
        }).join('');
        
        list.innerHTML = html;
        
        // 绑定点击事件
        list.querySelectorAll('.tool-select-item').forEach(item => {
            item.addEventListener('click', function() {
                if (this.classList.contains('locked')) return;
                
                const toolId = this.dataset.toolId;
                const slotType = this.dataset.slotType;
                
                // 如果已装备，则卸下
                if (gameState.equipment[slotType] === toolId) {
                    gameState.equipment[slotType] = null;
                    showToast(`已卸下 ${this.querySelector('.tool-select-name').textContent}`);
                } else {
                    // 装备新工具
                    gameState.equipment[slotType] = toolId;
                    showToast(`已装备 ${this.querySelector('.tool-select-name').textContent}`);
                }
                
                saveGame();
                renderEquipmentSlots();
                modal.classList.remove('show');
            });
        });
    }
    
    modal.classList.add('show');
}

// 给玩家添加一个测试工具（用于测试）
function addTestTool(type) {
    if (type === 'axe') {
        if (!gameState.toolsInventory.axes.includes('stone_axe')) {
            gameState.toolsInventory.axes.push('stone_axe');
        }
    } else if (type === 'pickaxe') {
        if (!gameState.toolsInventory.pickaxes.includes('stone_pickaxe')) {
            gameState.toolsInventory.pickaxes.push('stone_pickaxe');
        }
    }
    saveGame();
}

// 获取装备效果加成
function getEquipmentBonus(type) {
    let bonus = 0;
    
    if (type === 'woodcutting' && gameState.equipment.axe) {
        const tool = CONFIG.tools.axes.find(t => t.id === gameState.equipment.axe);
        if (tool) {
            bonus = tool.speedBonus || 0;
        }
    } else if (type === 'mining' && gameState.equipment.pickaxe) {
        const tool = CONFIG.tools.pickaxes.find(t => t.id === gameState.equipment.pickaxe);
        if (tool) {
            bonus = tool.speedBonus || 0;
        }
    } else if (type === 'crafting' && gameState.equipment.chisel) {
        const tool = CONFIG.tools.chisels.find(t => t.id === gameState.equipment.chisel);
        if (tool) {
            bonus = tool.speedBonus || 0;
        }
    } else if (type === 'tailoring' && gameState.equipment.needle) {
        const tool = CONFIG.tools.needles.find(t => t.id === gameState.equipment.needle);
        if (tool) {
            bonus = tool.speedBonus || 0;
        }
    } else if (type === 'gathering' && gameState.equipment.scythe) {
        const tool = CONFIG.tools.scythes.find(t => t.id === gameState.equipment.scythe);
        if (tool) {
            bonus = tool.speedBonus || 0;
        }
    } else if (type === 'forging' && gameState.equipment.hammer) {
        const tool = CONFIG.tools.hammers.find(t => t.id === gameState.equipment.hammer);
        if (tool) {
            bonus = tool.speedBonus || 0;
        }
    }
    
    return bonus;
}

// ============ 行动队列系统 ============

function setupActionQueue() {
    // 队列按钮点击
    if (elements.actionQueueBtn) {
        elements.actionQueueBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleQueuePopover();
        });
    }
    
    // 队列弹出卡片关闭按钮
    if (elements.queuePopoverClose) {
        elements.queuePopoverClose.addEventListener('click', () => {
            elements.queuePopover.classList.remove('show');
        });
    }
    
    // 点击外部关闭弹出卡片
    document.addEventListener('click', (e) => {
        if (elements.queuePopover && elements.queuePopover.classList.contains('show')) {
            if (!elements.queuePopover.contains(e.target) && e.target !== elements.actionQueueBtn) {
                elements.queuePopover.classList.remove('show');
            }
        }
    });
    
    // 清空队列按钮
    if (elements.queueClearBtn) {
        elements.queueClearBtn.addEventListener('click', () => {
            elements.clearQueueModal.classList.add('show');
        });
    }
    
    // 清空确认弹窗
    if (elements.clearQueueModalClose) {
        elements.clearQueueModalClose.addEventListener('click', () => {
            elements.clearQueueModal.classList.remove('show');
        });
    }
    if (elements.clearQueueCancel) {
        elements.clearQueueCancel.addEventListener('click', () => {
            elements.clearQueueModal.classList.remove('show');
        });
    }
    if (elements.clearQueueConfirm) {
        elements.clearQueueConfirm.addEventListener('click', () => {
            gameState.actionQueue = [];
            saveGame();
            updateQueueButton();
            renderQueueList();
            elements.clearQueueModal.classList.remove('show');
            elements.queuePopover.classList.remove('show');
            showToast('✅ 队列已清空');
        });
    }
    if (elements.clearQueueModal) {
        elements.clearQueueModal.addEventListener('click', (e) => {
            if (e.target === elements.clearQueueModal) {
                elements.clearQueueModal.classList.remove('show');
            }
        });
    }
    
    // 添加到队列按钮
    if (elements.actionModalQueue) {
        elements.actionModalQueue.addEventListener('click', addToQueue);
    }
}

function updateQueueButton() {
    if (!elements.actionQueueBtn) return;
    
    const queueLength = gameState.actionQueue.length;
    
    if (queueLength === 0) {
        elements.actionQueueBtn.style.display = 'none';
    } else {
        elements.actionQueueBtn.style.display = 'inline-block';
        elements.actionQueueBtn.textContent = `+${queueLength}行动`;
    }
}

function updateQueueButtonInModal() {
    if (!elements.actionModalQueue) return;
    
    const queueLength = gameState.actionQueue.length;
    const hasCurrentAction = gameState.currentAction !== null;
    
    // 如果队列已满（5个），按钮不可用
    if (queueLength >= gameState.maxQueueSize) {
        elements.actionModalQueue.disabled = true;
        elements.actionModalQueue.textContent = '添加到队列';
        elements.actionModalQueue.style.opacity = '0.5';
    } else if (!hasCurrentAction) {
        // 如果没有正在进行的行动，按钮不可用
        elements.actionModalQueue.disabled = true;
        elements.actionModalQueue.textContent = '添加到队列';
        elements.actionModalQueue.style.opacity = '0.5';
    } else {
        // 正常状态
        elements.actionModalQueue.disabled = false;
        elements.actionModalQueue.textContent = `添加到队列#${queueLength + 2}`;
        elements.actionModalQueue.style.opacity = '1';
    }
}

function toggleQueuePopover() {
    if (!elements.queuePopover || !elements.actionQueueBtn) return;
    
    if (elements.queuePopover.classList.contains('show')) {
        elements.queuePopover.classList.remove('show');
    } else {
        // 计算弹出卡片位置：在按钮下方居中
        const btnRect = elements.actionQueueBtn.getBoundingClientRect();
        const popover = elements.queuePopover;
        
        // 设置位置：按钮下方，居中对齐
        popover.style.top = `${btnRect.bottom + 10}px`;
        popover.style.left = `${btnRect.left + btnRect.width / 2 - 190}px`; // 190是卡片宽度的一半
        
        renderQueueList();
        popover.classList.add('show');
    }
}

function renderQueueList() {
    if (!elements.queueList) return;
    
    if (gameState.actionQueue.length === 0) {
        elements.queueList.innerHTML = '<div class="queue-empty-message">队列中没有等待的行动</div>';
        return;
    }
    
    const html = gameState.actionQueue.map((action, index) => {
        const countText = action.count >= 99999 ? '∞' : `${action.count}次`;
        return `
            <div class="queue-item" data-index="${index}">
                <span class="queue-item-order">#${index + 2}</span>
                <span class="queue-item-icon">${action.icon}</span>
                <div class="queue-item-info">
                    <div class="queue-item-name">${action.name}</div>
                    <div class="queue-item-count">${countText}</div>
                </div>
                <div class="queue-item-actions">
                    <button class="queue-action-btn" onclick="event.stopPropagation(); moveQueueItem(${index}, 'top')" title="置顶">⏫</button>
                    <button class="queue-action-btn" onclick="event.stopPropagation(); moveQueueItem(${index}, 'up')" title="上移">▲</button>
                    <button class="queue-action-btn" onclick="event.stopPropagation(); moveQueueItem(${index}, 'down')" title="下移">▼</button>
                    <button class="queue-action-btn" onclick="event.stopPropagation(); moveQueueItem(${index}, 'bottom')" title="置底">⏬</button>
                    <button class="queue-action-btn delete" onclick="event.stopPropagation(); removeQueueItem(${index})" title="删除">✕</button>
                </div>
            </div>
        `;
    }).join('');
    
    elements.queueList.innerHTML = html;
}

function addToQueue() {
    if (!pendingAction) return;
    
    const queueLength = gameState.actionQueue.length;
    
    // 检查队列是否已满
    if (queueLength >= gameState.maxQueueSize) {
        showToast('❌ 队列已满（最多4个）');
        return;
    }
    
    // 检查是否有正在进行的行动
    if (!gameState.currentAction) {
        showToast('❌ 没有正在进行的行动');
        return;
    }
    
    // 获取选择的次数
    const selectedOption = document.querySelector('.count-option.selected');
    let count = 1;
    
    if (selectedOption) {
        count = parseInt(selectedOption.dataset.count);
    } else if (elements.actionCountInput && elements.actionCountInput.value) {
        count = parseInt(elements.actionCountInput.value);
    }
    
    if (isNaN(count) || count < 1) {
        count = 1;
    }
    
    // 添加到队列（允许添加相同的行动）
    const action = {
        ...pendingAction,
        count: count,
        icon: getActionIcon(pendingAction.type, pendingAction.id)
    };
    
    gameState.actionQueue.push(action);
    saveGame();
    
    // 更新UI
    updateQueueButton();
    updateQueueButtonInModal();
    renderQueueList();
    
    // 关闭弹窗
    elements.actionModal.classList.remove('show');
    
    showToast(`✅ 已添加到队列 #${queueLength + 2}`);
    pendingAction = null;
}

function getActionIcon(type, id) {
    switch (type) {
        case 'woodcutting':
            const tree = CONFIG.trees.find(t => t.id === id);
            return tree ? tree.icon : '🪓';
        case 'mining':
            const ore = CONFIG.ores.find(o => o.id === id);
            return ore ? ore.icon : '⛏️';
        case 'gathering_item':
        case 'gathering_all':
            return '🌾';
        case 'crafting':
            const plank = CONFIG.woodPlanks.find(p => p.id === id);
            return plank ? plank.icon : '🔨';
        case 'forging':
            const ingot = CONFIG.ingots.find(i => i.id === id);
            return ingot ? ingot.icon : '⚒️';
        case 'forging_tool':
            const tools = CONFIG.tools[pendingAction.itemId?.toolType === 'axe' ? 'axes' : 'pickaxes'];
            const tool = tools?.find(t => t.id === id);
            return tool ? tool.icon : '⚒️';
        case 'tailoring':
            const fabric = CONFIG.fabrics.find(f => f.id === id);
            return fabric ? fabric.icon : '🧵';
        default:
            return '⚔️';
    }
}

function moveQueueItem(index, direction) {
    const queue = gameState.actionQueue;
    const maxIndex = queue.length - 1;
    
    // 特殊处理：置顶操作，直接替换当前行动
    if (direction === 'top') {
        // 获取要置顶的行动
        const topAction = queue.splice(index, 1)[0];
        
        // 将当前行动保存到队列第一个
        const currentAction = getCurrentActionInfo();
        if (currentAction) {
            // 取消当前行动（跳过队列检查，因为我们会手动执行）
            cancelCurrentAction(true);
            
            // 将当前行动添加到队列第一个
            queue.unshift(currentAction);
        }
        
        // 执行被置顶的行动
        pendingAction = topAction;
        executePendingAction();
        
        saveGame();
        updateQueueButton();
        renderQueueList();
        showToast('✅ 已替换当前行动');
        return;
    }
    
    // 第一个行动上移，也需要替换当前行动
    if (direction === 'up' && index === 0) {
        // 将当前行动保存到队列第一个
        const currentAction = getCurrentActionInfo();
        if (currentAction) {
            // 取消当前行动（跳过队列检查，因为我们会手动执行）
            cancelCurrentAction(true);
            
            // 将当前行动添加到队列第一个
            queue.unshift(currentAction);
        }
        
        // 取出队列第二个行动（原来的第一个）
        const newAction = queue.splice(1, 1)[0];
        
        // 执行新行动
        pendingAction = newAction;
        executePendingAction();
        
        saveGame();
        updateQueueButton();
        renderQueueList();
        showToast('✅ 已替换当前行动');
        return;
    }
    
    // 普通的移动操作
    if (direction === 'bottom') {
        if (index === maxIndex) return;
        const item = queue.splice(index, 1)[0];
        queue.push(item);
    } else if (direction === 'up') {
        if (index === 0) return;
        [queue[index - 1], queue[index]] = [queue[index], queue[index - 1]];
    } else if (direction === 'down') {
        if (index === maxIndex) return;
        [queue[index], queue[index + 1]] = [queue[index + 1], queue[index]];
    }
    
    saveGame();
    renderQueueList();
}

function getCurrentActionInfo() {
    // 获取当前正在进行的行动信息
    // 注意：remaining 是"剩余待执行的次数"，不包括当前正在执行的那一次
    // 但如果当前正在执行，我们应该把当前这次也算进去
    if (gameState.activeWoodcutting) {
        const tree = CONFIG.trees.find(t => t.id === gameState.activeWoodcutting);
        // 如果是无限次，保持无限次
        const totalCount = gameState.woodcuttingCount >= 99999 ? 99999 : gameState.woodcuttingRemaining + 1;
        return {
            type: 'woodcutting',
            id: gameState.activeWoodcutting,
            name: tree ? tree.name : '伐木',
            count: totalCount,
            icon: tree ? tree.icon : '🪓'
        };
    }
    if (gameState.activeMining) {
        const ore = CONFIG.ores.find(o => o.id === gameState.activeMining);
        const totalCount = gameState.miningCount >= 99999 ? 99999 : gameState.miningRemaining + 1;
        return {
            type: 'mining',
            id: gameState.activeMining,
            name: ore ? ore.name : '挖矿',
            count: totalCount,
            icon: ore ? ore.icon : '⛏️'
        };
    }
    if (gameState.activeGathering) {
        const location = CONFIG.gatheringLocations.find(l => l.id === gameState.gatheringLocationId);
        const totalCount = gameState.gatheringCount >= 99999 ? 99999 : gameState.gatheringRemaining + 1;
        return {
            type: 'gathering_item',
            id: gameState.activeGathering,
            name: location ? location.name : '采集',
            count: totalCount,
            icon: '🌾',
            itemId: gameState.gatheringItemId
        };
    }
    if (gameState.activeCrafting) {
        const plank = CONFIG.woodPlanks.find(p => p.id === gameState.activeCrafting);
        const totalCount = gameState.craftingCount >= 99999 ? 99999 : gameState.craftingRemaining + 1;
        return {
            type: 'crafting',
            id: gameState.activeCrafting,
            name: plank ? plank.name : '制作',
            count: totalCount,
            icon: plank ? plank.icon : '🔨'
        };
    }
    if (gameState.activeForging) {
        const ingot = CONFIG.ingots.find(i => i.id === gameState.activeForging);
        const totalCount = gameState.forgingCount >= 99999 ? 99999 : gameState.forgingRemaining + 1;
        return {
            type: 'forging',
            id: gameState.activeForging,
            name: ingot ? ingot.name : '锻造',
            count: totalCount,
            icon: ingot ? ingot.icon : '⚒️'
        };
    }
    if (gameState.activeForgingTool) {
        const tools = CONFIG.tools[gameState.forgingToolType === 'axe' ? 'axes' : 'pickaxes'];
        const tool = tools[gameState.forgingToolIndex];
        const totalCount = gameState.forgingToolCount >= 99999 ? 99999 : gameState.forgingToolRemaining + 1;
        return {
            type: 'forging_tool',
            id: gameState.activeForgingTool,
            name: tool ? tool.name : '锻造工具',
            count: totalCount,
            icon: tool ? tool.icon : '⚒️',
            itemId: { toolType: gameState.forgingToolType, toolIndex: gameState.forgingToolIndex }
        };
    }
    if (gameState.activeTailoring) {
        const fabric = CONFIG.fabrics.find(f => f.id === gameState.activeTailoring);
        const totalCount = gameState.tailoringCount >= 99999 ? 99999 : gameState.tailoringRemaining + 1;
        return {
            type: 'tailoring',
            id: gameState.activeTailoring,
            name: fabric ? fabric.name : '缝制',
            count: totalCount,
            icon: fabric ? fabric.icon : '🧵'
        };
    }
    if (gameState.activeAlchemy) {
        const potion = CONFIG.potions.find(p => p.id === gameState.activeAlchemy);
        const totalCount = gameState.alchemyCount >= 99999 ? 99999 : gameState.alchemyRemaining + 1;
        return {
            type: 'alchemy',
            id: gameState.activeAlchemy,
            name: potion ? potion.name : '炼金',
            count: totalCount,
            icon: potion ? potion.icon : '⚗️'
        };
    }
    return null;
}

function removeQueueItem(index) {
    gameState.actionQueue.splice(index, 1);
    saveGame();
    updateQueueButton();
    renderQueueList();
    showToast('✅ 已从队列中移除');
}

function startNextQueueAction() {
    if (gameState.actionQueue.length === 0) return;
    
    const action = gameState.actionQueue.shift();
    saveGame();
    updateQueueButton();
    
    // 执行行动
    pendingAction = action;
    executePendingAction();
}

// 当行动完成时调用
function onActionComplete() {
    // 检查队列中是否有等待的行动
    if (gameState.actionQueue.length > 0) {
        setTimeout(() => {
            startNextQueueAction();
        }, 500); // 短暂延迟后开始下一个
    }
}
