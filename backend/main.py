"""
Idle Game Backend - FastAPI 服务
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import sqlite3
import json

app = FastAPI(title="Idle Game API", version="0.1.0")

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据库初始化
def init_db():
    conn = sqlite3.connect('game.db')
    cursor = conn.cursor()
    
    # 创建玩家表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            gold INTEGER DEFAULT 0,
            gems INTEGER DEFAULT 0,
            last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 创建建筑表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS buildings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER,
            building_type TEXT NOT NULL,
            level INTEGER DEFAULT 1,
            FOREIGN KEY (player_id) REFERENCES players(id)
        )
    ''')
    
    conn.commit()
    conn.close()

# 数据模型
class PlayerCreate(BaseModel):
    username: str

class PlayerResponse(BaseModel):
    id: int
    username: str
    gold: int
    gems: int
    last_login: str

class BuildingUpgrade(BaseModel):
    player_id: int
    building_type: str

# 游戏配置
GAME_CONFIG = {
    "gold_per_second": 1,
    "building_costs": {
        "mine": 100,
        "farm": 50,
        "factory": 200
    },
    "building_production": {
        "mine": 5,
        "farm": 2,
        "factory": 10
    }
}

@app.on_event("startup")
async def startup_event():
    init_db()
    print("🎮 Idle Game Backend started!")

@app.get("/")
async def root():
    return {"message": "Welcome to Idle Game API", "version": "0.1.0"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/players", response_model=PlayerResponse)
async def create_player(player: PlayerCreate):
    conn = sqlite3.connect('game.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "INSERT INTO players (username) VALUES (?)",
            (player.username,)
        )
        conn.commit()
        player_id = cursor.lastrowid
        
        cursor.execute("SELECT * FROM players WHERE id = ?", (player_id,))
        row = cursor.fetchone()
        
        return PlayerResponse(
            id=row[0],
            username=row[1],
            gold=row[2],
            gems=row[3],
            last_login=row[4]
        )
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Username already exists")
    finally:
        conn.close()

@app.get("/api/players/{player_id}")
async def get_player(player_id: int):
    conn = sqlite3.connect('game.db')
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM players WHERE id = ?", (player_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Player not found")
    
    return PlayerResponse(
        id=row[0],
        username=row[1],
        gold=row[2],
        gems=row[3],
        last_login=row[4]
    )

@app.post("/api/players/{player_id}/gold")
async def add_gold(player_id: int, amount: int = 1):
    conn = sqlite3.connect('game.db')
    cursor = conn.cursor()
    
    cursor.execute(
        "UPDATE players SET gold = gold + ? WHERE id = ?",
        (amount, player_id)
    )
    conn.commit()
    
    cursor.execute("SELECT gold FROM players WHERE id = ?", (player_id,))
    row = cursor.fetchone()
    conn.close()
    
    return {"gold": row[0]}

@app.post("/api/buildings/upgrade")
async def upgrade_building(upgrade: BuildingUpgrade):
    building_type = upgrade.building_type
    if building_type not in GAME_CONFIG["building_costs"]:
        raise HTTPException(status_code=400, detail="Invalid building type")
    
    cost = GAME_CONFIG["building_costs"][building_type]
    
    conn = sqlite3.connect('game.db')
    cursor = conn.cursor()
    
    # 检查玩家金币
    cursor.execute("SELECT gold FROM players WHERE id = ?", (upgrade.player_id,))
    row = cursor.fetchone()
    
    if not row or row[0] < cost:
        conn.close()
        raise HTTPException(status_code=400, detail="Not enough gold")
    
    # 扣除金币并升级
    cursor.execute(
        "UPDATE players SET gold = gold - ? WHERE id = ?",
        (cost, upgrade.player_id)
    )
    conn.commit()
    conn.close()
    
    return {
        "message": f"Upgraded {building_type}",
        "cost": cost,
        "production": GAME_CONFIG["building_production"][building_type]
    }

@app.get("/api/config")
async def get_config():
    return GAME_CONFIG

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
