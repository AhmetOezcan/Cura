from sqlalchemy import Column, Integer, String, Text
from .database import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    age = Column(Integer)
    room_number = Column(String)
    diagnosis = Column(String)
    medication = Column(String)
    notes = Column(Text)
