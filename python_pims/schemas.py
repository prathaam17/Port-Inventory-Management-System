from pydantic import BaseModel, Field, field_validator, model_validator
from typing import List, Optional
from datetime import datetime

# Vessel Call Schemas
class VesselCallBase(BaseModel):
    vcn: str = Field(..., description="Unique Vessel Call Number")
    vessel_name: str = Field(..., min_length=2, description="Vessel Name")
    estimated_arrival: datetime
    voyage_number: str = Field(..., min_length=1, description="Voyage Number")
    loa: Optional[float] = Field(None, gt=0, description="Length Overall in meters")
    beam: Optional[float] = Field(None, gt=0, description="Beam width in meters")
    draft: Optional[float] = Field(None, gt=0, description="Max Draft in meters")
    grt: Optional[float] = Field(None, gt=0, description="Gross Registered Tonnage")

    @field_validator('vcn', 'vessel_name', 'voyage_number', mode='before')
    @classmethod
    def strip_and_check_strings(cls, v: str) -> str:
        if isinstance(v, str):
            v_trimmed = v.trim() if hasattr(v, 'trim') else v.strip()
            if not v_trimmed:
                raise ValueError("String field cannot be empty or whitespace-only.")
            return v_trimmed
        return v

class VesselCallCreate(VesselCallBase):
    pass

class VesselCallOut(VesselCallBase):
    arrival_status: str
    first_line_ashore_time: Optional[datetime] = None

    class Config:
        from_attributes = True

# Cargo Schemas for Manifest
class BulkCargoManifestEntry(BaseModel):
    commodity_name: str = Field(..., min_length=2, description="Commodity Name")
    manifested_weight: float = Field(..., gt=0, description="Weight in Metric Tonnes")

    @field_validator('commodity_name', mode='before')
    @classmethod
    def clean_commodity_name(cls, v: str) -> str:
        if isinstance(v, str):
            v_trimmed = v.strip()
            if not v_trimmed:
                raise ValueError("Commodity name cannot be empty or whitespace-only.")
            return v_trimmed
        return v

class ContainerCargoManifestEntry(BaseModel):
    container_no: str = Field(..., pattern=r"^[A-Z]{4}\d{7}$", description="Standard ISO container number (e.g. MSKU1234567)")
    teu: float = Field(..., gt=0, description="TEU equivalency, typically 1.0 or 2.0")
    iso_code: str
    bay: str
    row: str
    tier: str

    @field_validator('container_no', 'iso_code', mode='before')
    @classmethod
    def clean_container_strings(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().upper()
        return v

class IgmManifestRequest(BaseModel):
    bulk_items: List[BulkCargoManifestEntry] = []
    container_items: List[ContainerCargoManifestEntry] = []

# Tally Discharge Schemas
class TallyDischargeRequest(BaseModel):
    cargo_type: str = Field(..., pattern="^(Bulk|Container)$")
    cargo_id: int = Field(..., gt=0)
    quantity: float = Field(..., gt=0, description="Amount discharged (weight in MT or TEU count)")

# Yard Slot Assignment Schemas
class YardSlotAssignRequest(BaseModel):
    cargo_type: str = Field(..., pattern="^(Bulk|Container)$")
    cargo_id: int = Field(..., gt=0)
    zone: str = Field(..., min_length=2)
    slot_number: str = Field(..., min_length=1)
    coordinates: Optional[str] = None
    hazard_class: Optional[str] = "None"
    free_days_limit: Optional[int] = Field(5, ge=0)

# Gate Evacuation Schemas
class GateEvacuationRequest(BaseModel):
    truck_id: str = Field(..., min_length=3, description="Truck Registration Number")
    tare_weight: float = Field(..., gt=0, description="Empty truck weight in Metric Tonnes")
    gross_weight: float = Field(..., gt=0, description="Loaded truck weight in Metric Tonnes")
    yard_slot_id: int = Field(..., gt=0)

    @field_validator('truck_id', mode='before')
    @classmethod
    def clean_truck_id(cls, v: str) -> str:
        if isinstance(v, str):
            v_trimmed = v.strip().upper()
            if not v_trimmed:
                raise ValueError("Truck ID cannot be empty.")
            return v_trimmed
        return v

    @model_validator(mode='after')
    def validate_weights(self) -> 'GateEvacuationRequest':
        if self.gross_weight <= self.tare_weight:
            raise ValueError(f"Gross weight ({self.gross_weight} MT) must be strictly greater than tare weight ({self.tare_weight} MT).")
        return self

class GatePassOut(BaseModel):
    id: int
    truck_id: str
    vcn: str
    yard_slot_id: int
    tare_weight: float
    gross_weight: float
    net_weight: float
    evacuation_time: datetime
    pass_code: str

    class Config:
        from_attributes = True

# Supervisor Reconcile Schemas
class VarianceReconcileRequest(BaseModel):
    user_id: str = Field(..., min_length=2)
    physical_survey_weight: float = Field(..., ge=0, description="Corrected physical weight/TEU in yard")
    reason: str = Field(..., min_length=10, description="Auditable justification for the override")

    @field_validator('user_id', 'reason', mode='before')
    @classmethod
    def clean_reconcile_strings(cls, v: str) -> str:
        if isinstance(v, str):
            v_trimmed = v.strip()
            if not v_trimmed:
                raise ValueError("Reconcile text field cannot be empty or whitespace-only.")
            return v_trimmed
        return v

# Audit Log Schemas
class AuditLogOut(BaseModel):
    id: int
    timestamp: datetime
    action: str
    entity_type: str
    entity_id: str
    user_id: str
    old_value: Optional[str]
    new_value: Optional[str]
    justification: str

    class Config:
        from_attributes = True
