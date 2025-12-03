from fastapi import FastAPI, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware


from .database import Base, engine, get_db
from . import models

app = FastAPI()

# CORS für Entwicklung erlauben
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # in Entwicklung: alles erlauben
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tabellen in der Datenbank erzeugen
Base.metadata.create_all(bind=engine)


# Pydantic-Schemas (für API)

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


# Test-Route

@app.get("/")
def read_root():
    return {"message": "Cura Backend läuft"}


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
