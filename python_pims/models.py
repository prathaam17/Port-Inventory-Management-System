import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from .database import Base

class VesselCall(Base):
    __tablename__ = "vessel_calls"

    vcn = Column(String, primary_key=True, index=True)
    vessel_name = Column(String, nullable=False)
    arrival_status = Column(
        String, 
        default="Pre-Arrival"
    )  # Pre-Arrival, Approved, Arrived, Departed
    first_line_ashore_time = Column(DateTime, nullable=True)
    estimated_arrival = Column(DateTime, nullable=False)
    voyage_number = Column(String, nullable=False)
    loa = Column(Float, nullable=True)  # Length Overall (meters)
    beam = Column(Float, nullable=True)  # Beam (meters)
    draft = Column(Float, nullable=True)  # Draft (meters)
    grt = Column(Float, nullable=True)  # Gross Registered Tonnage

    # Relationships
    bulk_cargos = relationship("BulkCargo", back_populates="vessel_call", cascade="all, delete-orphan")
    container_cargos = relationship("ContainerCargo", back_populates="vessel_call", cascade="all, delete-orphan")
    yard_slots = relationship("YardSlot", back_populates="vessel_call", cascade="all, delete-orphan")


class YardCapacity(Base):
    __tablename__ = "yard_capacity"

    zone = Column(String, primary_key=True, index=True)  # e.g., "Coal Yard Zone A", "Container Grid 01"
    cargo_type = Column(String, nullable=False)  # "Bulk" or "Container"
    max_capacity = Column(Float, nullable=False)  # Metric Tonnes for Bulk, TEU count for Container
    current_occupancy = Column(Float, default=0.0)

    # Relationships
    yard_slots = relationship("YardSlot", back_populates="yard_capacity")


class BulkCargo(Base):
    __tablename__ = "bulk_cargo"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    vcn = Column(String, ForeignKey("vessel_calls.vcn"), nullable=False)
    commodity_name = Column(String, nullable=False)
    manifested_weight = Column(Float, nullable=False)  # In Metric Tonnes
    discharged_weight = Column(Float, default=0.0)  # Cumulative tally discharged
    status = Column(String, default="Pre-Arrival")  # Pre-Arrival, Port Custody - Uncleared, Cleared, Evacuated

    # Relationships
    vessel_call = relationship("VesselCall", back_populates="bulk_cargos")
    yard_slots = relationship("YardSlot", back_populates="bulk_cargo")


class ContainerCargo(Base):
    __tablename__ = "container_cargo"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    vcn = Column(String, ForeignKey("vessel_calls.vcn"), nullable=False)
    container_no = Column(String, unique=True, index=True, nullable=False)
    teu = Column(Float, nullable=False)  # 1.0 (20ft) or 2.0 (40ft)
    iso_code = Column(String, nullable=False)  # e.g. 22G1
    bay = Column(String, nullable=False)
    row = Column(String, nullable=False)
    tier = Column(String, nullable=False)
    status = Column(String, default="Pre-Arrival")  # Pre-Arrival, Port Custody - Uncleared, Yard Slot Assigned, Evacuated

    # Relationships
    vessel_call = relationship("VesselCall", back_populates="container_cargos")
    yard_slots = relationship("YardSlot", back_populates="container_cargo")


class YardSlot(Base):
    __tablename__ = "yard_slots"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    vcn = Column(String, ForeignKey("vessel_calls.vcn"), nullable=False)
    cargo_type = Column(String, nullable=False)  # "Bulk" or "Container"
    
    # Optional foreign keys based on type
    bulk_cargo_id = Column(Integer, ForeignKey("bulk_cargo.id"), nullable=True)
    container_cargo_id = Column(Integer, ForeignKey("container_cargo.id"), nullable=True)
    
    zone = Column(String, ForeignKey("yard_capacity.zone"), nullable=False)
    slot_number = Column(String, nullable=False)  # For container grid coordinate or bulk stack partition
    coordinates = Column(String, nullable=True)  # Visual or GPS coordinates
    
    storage_start_time = Column(DateTime, nullable=True)
    free_days_limit = Column(Integer, default=5)  # NMPA standard free storage allowance
    demurrage_flag = Column(Boolean, default=False)
    transit_duration_days = Column(Integer, default=0)
    hazard_class = Column(String, nullable=True, default="None")

    # Relationships
    vessel_call = relationship("VesselCall", back_populates="yard_slots")
    yard_capacity = relationship("YardCapacity", back_populates="yard_slots")
    bulk_cargo = relationship("BulkCargo", back_populates="yard_slots")
    container_cargo = relationship("ContainerCargo", back_populates="yard_slots")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    action = Column(String, nullable=False)  # e.g., "RECONCILE_VARIANCE"
    entity_type = Column(String, nullable=False)  # e.g., "YardSlot"
    entity_id = Column(String, nullable=False)
    user_id = Column(String, nullable=False)
    old_value = Column(String, nullable=True)
    new_value = Column(String, nullable=True)
    justification = Column(Text, nullable=False)
