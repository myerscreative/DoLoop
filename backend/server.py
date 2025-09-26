from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import jwt
import bcrypt
from bson import ObjectId


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Doloop API", description="A looping to-do list app for routines")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# JWT Configuration
JWT_SECRET = "doloop-secret-key-change-in-production"  # TODO: Use environment variable
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# Security
security = HTTPBearer()

# Helper to convert ObjectId to string
def str_object_id(obj):
    if isinstance(obj, dict):
        for key, value in obj.items():
            if isinstance(value, ObjectId):
                obj[key] = str(value)
    return obj

# Pydantic Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: datetime

class AuthResponse(BaseModel):
    user: UserResponse
    token: str

class LoopCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: str
    reset_rule: str = Field(..., regex="^(manual|daily|weekly)$")

class LoopResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    color: str
    owner_id: str
    reset_rule: str
    created_at: datetime
    updated_at: datetime
    progress: int = 0
    total_tasks: int = 0
    completed_tasks: int = 0

class TaskCreate(BaseModel):
    loop_id: str
    description: str
    type: str = Field(..., regex="^(recurring|one-time)$")
    assigned_user_id: Optional[str] = None

class TaskResponse(BaseModel):
    id: str
    loop_id: str
    description: str
    type: str
    assigned_user_id: Optional[str]
    status: str
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    order: int

# Auth Helper Functions
def create_access_token(user_id: str):
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {"user_id": user_id, "exp": expire}
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return str_object_id(user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Auth Routes
@api_router.post("/auth/register", response_model=AuthResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    password_hash = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt())
    
    # Create user
    user_doc = {
        "_id": ObjectId(),
        "email": user_data.email,
        "password_hash": password_hash,
        "name": user_data.name,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user_doc)
    
    # Create token
    token = create_access_token(str(user_doc["_id"]))
    
    # Return response
    user_response = UserResponse(
        id=str(user_doc["_id"]),
        email=user_doc["email"],
        name=user_doc["name"],
        created_at=user_doc["created_at"]
    )
    
    return AuthResponse(user=user_response, token=token)

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(login_data: UserLogin):
    # Find user
    user = await db.users.find_one({"email": login_data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check password
    if not bcrypt.checkpw(login_data.password.encode('utf-8'), user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create token
    token = create_access_token(str(user["_id"]))
    
    # Return response
    user_response = UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        name=user["name"],
        created_at=user["created_at"]
    )
    
    return AuthResponse(user=user_response, token=token)

# Loop Routes
@api_router.get("/loops", response_model=List[LoopResponse])
async def get_loops(current_user = Depends(get_current_user)):
    loops = await db.loops.find({"owner_id": current_user["_id"]}).to_list(1000)
    
    # Calculate progress for each loop
    result = []
    for loop in loops:
        # Get task counts
        total_tasks = await db.tasks.count_documents({"loop_id": str(loop["_id"]), "status": {"$ne": "archived"}})
        completed_tasks = await db.tasks.count_documents({"loop_id": str(loop["_id"]), "status": "completed"})
        
        progress = int((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0)
        
        loop_response = LoopResponse(
            id=str(loop["_id"]),
            name=loop["name"],
            description=loop.get("description"),
            color=loop["color"],
            owner_id=str(loop["owner_id"]),
            reset_rule=loop["reset_rule"],
            created_at=loop["created_at"],
            updated_at=loop["updated_at"],
            progress=progress,
            total_tasks=total_tasks,
            completed_tasks=completed_tasks
        )
        result.append(loop_response)
    
    return result

@api_router.post("/loops", response_model=LoopResponse)
async def create_loop(loop_data: LoopCreate, current_user = Depends(get_current_user)):
    loop_doc = {
        "_id": ObjectId(),
        "name": loop_data.name,
        "description": loop_data.description,
        "color": loop_data.color,
        "owner_id": current_user["_id"],
        "reset_rule": loop_data.reset_rule,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.loops.insert_one(loop_doc)
    
    return LoopResponse(
        id=str(loop_doc["_id"]),
        name=loop_doc["name"],
        description=loop_doc["description"],
        color=loop_doc["color"],
        owner_id=str(loop_doc["owner_id"]),
        reset_rule=loop_doc["reset_rule"],
        created_at=loop_doc["created_at"],
        updated_at=loop_doc["updated_at"],
        progress=0,
        total_tasks=0,
        completed_tasks=0
    )

# Task Routes
@api_router.get("/loops/{loop_id}/tasks", response_model=List[TaskResponse])
async def get_tasks(loop_id: str, current_user = Depends(get_current_user)):
    # Verify loop ownership
    loop = await db.loops.find_one({"_id": ObjectId(loop_id), "owner_id": current_user["_id"]})
    if not loop:
        raise HTTPException(status_code=404, detail="Loop not found")
    
    tasks = await db.tasks.find({"loop_id": loop_id}).sort("order", 1).to_list(1000)
    
    result = []
    for task in tasks:
        task_response = TaskResponse(
            id=str(task["_id"]),
            loop_id=task["loop_id"],
            description=task["description"],
            type=task["type"],
            assigned_user_id=task.get("assigned_user_id"),
            status=task["status"],
            completed_at=task.get("completed_at"),
            created_at=task["created_at"],
            updated_at=task["updated_at"],
            order=task["order"]
        )
        result.append(task_response)
    
    return result

@api_router.post("/loops/{loop_id}/tasks", response_model=TaskResponse)
async def create_task(loop_id: str, task_data: TaskCreate, current_user = Depends(get_current_user)):
    # Verify loop ownership
    loop = await db.loops.find_one({"_id": ObjectId(loop_id), "owner_id": current_user["_id"]})
    if not loop:
        raise HTTPException(status_code=404, detail="Loop not found")
    
    # Get next order
    last_task = await db.tasks.find({"loop_id": loop_id}).sort("order", -1).limit(1).to_list(1)
    next_order = (last_task[0]["order"] + 1) if last_task else 1
    
    task_doc = {
        "_id": ObjectId(),
        "loop_id": loop_id,
        "description": task_data.description,
        "type": task_data.type,
        "assigned_user_id": task_data.assigned_user_id,
        "status": "pending",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "order": next_order
    }
    
    await db.tasks.insert_one(task_doc)
    
    return TaskResponse(
        id=str(task_doc["_id"]),
        loop_id=task_doc["loop_id"],
        description=task_doc["description"],
        type=task_doc["type"],
        assigned_user_id=task_doc.get("assigned_user_id"),
        status=task_doc["status"],
        completed_at=task_doc.get("completed_at"),
        created_at=task_doc["created_at"],
        updated_at=task_doc["updated_at"],
        order=task_doc["order"]
    )

@api_router.put("/tasks/{task_id}/complete")
async def complete_task(task_id: str, current_user = Depends(get_current_user)):
    # Find task and verify ownership through loop
    task = await db.tasks.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    loop = await db.loops.find_one({"_id": ObjectId(task["loop_id"]), "owner_id": current_user["_id"]})
    if not loop:
        raise HTTPException(status_code=404, detail="Loop not found")
    
    # Update task status
    await db.tasks.update_one(
        {"_id": ObjectId(task_id)},
        {
            "$set": {
                "status": "completed",
                "completed_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Task completed"}

@api_router.put("/loops/{loop_id}/reloop")
async def reloop(loop_id: str, current_user = Depends(get_current_user)):
    # Verify loop ownership
    loop = await db.loops.find_one({"_id": ObjectId(loop_id), "owner_id": current_user["_id"]})
    if not loop:
        raise HTTPException(status_code=404, detail="Loop not found")
    
    # Reset recurring tasks to pending, archive one-time completed tasks
    await db.tasks.update_many(
        {"loop_id": loop_id, "type": "recurring"},
        {
            "$set": {
                "status": "pending",
                "updated_at": datetime.utcnow()
            },
            "$unset": {"completed_at": ""}
        }
    )
    
    await db.tasks.update_many(
        {"loop_id": loop_id, "type": "one-time", "status": "completed"},
        {
            "$set": {
                "status": "archived",
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Loop reset successfully"}

# Test route
@api_router.get("/")
async def root():
    return {"message": "Doloop API is running"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
