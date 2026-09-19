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
    new_user = models.User(
        name=user.name,
        email=user.email,
        password_hash=user.password or "demo_hash",
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
        # Auto-create demo user for smooth student demo
        db_user = models.User(name=user.name or "Researcher", email=user.email, role="researcher")
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    return {"token": "demo_token_12345", "user": {"id": db_user.id, "name": db_user.name, "email": db_user.email, "role": db_user.role}}

@router.get("/me", response_model=schemas.UserOut)
def get_current_user(db: Session = Depends(database.get_db)):
    user = db.query(models.User).first()
    if not user:
        user = models.User(name="Dr. Alex Vance", email="alex.vance@university.edu", role="lead_researcher")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user
