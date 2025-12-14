from fastapi import FastAPI, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine, get_db
from . import models
from fastapi import HTTPException
from typing import Optional


app = FastAPI()


# CORS erlauben (für Verbindung zu Frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # für Entwicklung okay
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Datenbank-Tabellen erzeugen
Base.metadata.create_all(bind=engine)


# Pydantic-Schemas

# -------- Patienten --------
class PatientBase(BaseModel):
    name: str
    age: int
    room_number: str
    diagnosis: str
    medication: str
    notes: str


class PatientCreate(PatientBase):
    pass


class PatientOut(PatientBase):
    id: int

    class Config:
        orm_mode = True


# -------- Todos --------
class TodoBase(BaseModel):
    title: str
    done: bool = False


class TodoCreate(TodoBase):
    pass


class TodoOut(TodoBase):
    id: int
    patient_id: int

    class Config:
        orm_mode = True

# ---------------------------
# Todo-Update Schema
# ---------------------------
class TodoUpdate(BaseModel):
    title: Optional[str] = None
    done: Optional[bool] = None





# ---------------------------
# Todo Update Route (PATCH)
# ---------------------------
@app.patch("/todos/{todo_id}", response_model=TodoOut)
def update_todo(todo_id: int, todo: TodoUpdate, db: Session = Depends(get_db)):
    db_todo = db.query(models.Todo).filter(models.Todo.id == todo_id).first()
    if not db_todo:
        raise HTTPException(status_code=404, detail="Todo nicht gefunden")

    # Nur übergebene Felder updaten
    if todo.title is not None:
        db_todo.title = todo.title
    if todo.done is not None:
        db_todo.done = todo.done

    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo


# Test-Route
@app.get("/")
def read_root():
    return {"message": "Cura Backend läuft 🚑"}


# Patienten-Routen

@app.post("/patients", response_model=PatientOut)
def create_patient(patient: PatientCreate, db: Session = Depends(get_db)):
    db_patient = models.Patient(
        name=patient.name,
        age=patient.age,
        room_number=patient.room_number,
        diagnosis=patient.diagnosis,
        medication=patient.medication,
        notes=patient.notes,
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient


@app.get("/patients", response_model=list[PatientOut])
def get_patients(db: Session = Depends(get_db)):
    patients = db.query(models.Patient).all()
    return patients

@app.get("/patients/{patient_id}", response_model=PatientOut)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient nicht gefunden")
    return patient


@app.delete("/patients/{patient_id}", status_code=204)
def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    """
    Entfernt einen Patienten und zugehörige Todos.
    """
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient nicht gefunden")

    db.delete(patient)
    db.commit()
    return


# Todo-Routen pro Patient

@app.post("/patients/{patient_id}/todos", response_model=TodoOut)
def create_todo_for_patient(
    patient_id: int,
    todo: TodoCreate,
    db: Session = Depends(get_db)
):
    db_todo = models.Todo(
        patient_id=patient_id,
        title=todo.title,
        done=todo.done
    )
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo


@app.get("/patients/{patient_id}/todos", response_model=list[TodoOut])
def get_todos_for_patient(patient_id: int, db: Session = Depends(get_db)):
    todos = db.query(models.Todo).filter(models.Todo.patient_id == patient_id).all()
    return todos

