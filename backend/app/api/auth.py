import secrets
import hashlib
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import models, database
from app.schemas import schemas

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=schemas.UserOut)
def register_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        return db_user
    pwd_hash = (
        hashlib.sha256(user.password.encode()).hexdigest()
        if user.password
        else hashlib.sha256(secrets.token_hex(16).encode()).hexdigest()
    )
    new_user = models.User(
        name=user.name,
        email=user.email,
        password_hash=pwd_hash,
        role=user.role or "researcher"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login")
def login_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user:
        pwd_hash = (
            hashlib.sha256(user.password.encode()).hexdigest()
            if user.password
            else hashlib.sha256(secrets.token_hex(16).encode()).hexdigest()
        )
        db_user = models.User(
            name=user.name or "Primary Researcher",
            email=user.email,
            password_hash=pwd_hash,
            role="lead_researcher"
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    token = f"session_{secrets.token_hex(16)}"
    return {"token": token, "user": {"id": db_user.id, "name": db_user.name, "email": db_user.email, "role": db_user.role}}

@router.get("/me", response_model=schemas.UserOut)
def get_current_user(db: Session = Depends(database.get_db)):
    user = db.query(models.User).first()
    if not user:
        user = models.User(
            name="Autonomous Researcher",
            email="researcher@autonomous-discovery.org",
            role="lead_researcher"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user
