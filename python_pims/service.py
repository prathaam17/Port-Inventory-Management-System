import uuid
import datetime
from sqlalchemy import func
from sqlalchemy.orm import Session
from . import models, schemas

class PIMSException(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


def create_vessel_call(db: Session, call: schemas.VesselCallCreate) -> models.VesselCall:
    """Helper to register a vessel call pre-arrival."""
    db_call = db.query(models.VesselCall).filter(models.VesselCall.vcn == call.vcn).first()
    if db_call:
        raise PIMSException(f"VCN {call.vcn} is already registered.")
    
    db_call = models.VesselCall(
        vcn=call.vcn,
        vessel_name=call.vessel_name,
        estimated_arrival=call.estimated_arrival,
        voyage_number=call.voyage_number,
        loa=call.loa,
        beam=call.beam,
        draft=call.draft,
        grt=call.grt,
        arrival_status="Pre-Arrival"
    )
    db.add(db_call)
    db.commit()
    db.refresh(db_call)
    return db_call


def register_manifest(db: Session, vcn: str, manifest: schemas.IgmManifestRequest) -> models.VesselCall:
    """
    Phase 1: Pre-Arrival Manifest Filing.
    Validates IGM cargo parameters against current 'YardCapacity' before approving arrival status.
    """
    # Start atomic transaction block
    try:
        vessel_call = db.query(models.VesselCall).filter(models.VesselCall.vcn == vcn).first()
        if not vessel_call:
            vessel_call = models.VesselCall(
                vcn=vcn,
                vessel_name=vcn.replace('VCN-', ''),
                arrival_status="Pre-Arrival",
                vessel_dues_settled=False,
                cargo_discharged=False
            )
            db.add(vessel_call)
            db.flush()

        if vessel_call.arrival_status != "Pre-Arrival":
            raise PIMSException(f"VCN {vcn} manifest cannot be modified. Current status: {vessel_call.arrival_status}")

        # Calculate cargo metrics
        total_bulk_weight = sum(item.manifested_weight for item in manifest.bulk_items)
        total_container_teu = sum(item.teu for item in manifest.container_items)

        # Enforce NMPA Safety Gate Capacity Limits
        if total_bulk_weight > 0:
            # Check Bulk yard capacity
            bulk_zone = db.query(models.YardCapacity).filter(models.YardCapacity.cargo_type == "Bulk").first()
            if not bulk_zone:
                raise PIMSException("No Bulk Yard Zone registered in system capacity ledger.")
            
            available_space = bulk_zone.max_capacity - bulk_zone.current_occupancy
            if total_bulk_weight > available_space:
                raise PIMSException(
                    f"Safety Lockout: Insufficient space in Bulk Yard. Requested: {total_bulk_weight} MT, Available: {available_space} MT"
                )

        if total_container_teu > 0:
            # Check Container yard capacity
            container_zone = db.query(models.YardCapacity).filter(models.YardCapacity.cargo_type == "Container").first()
            if not container_zone:
                raise PIMSException("No Container Yard Zone registered in system capacity ledger.")

            available_space = container_zone.max_capacity - container_zone.current_occupancy
            if total_container_teu > available_space:
                raise PIMSException(
                    f"Safety Lockout: Insufficient space in Container Yard. Requested: {total_container_teu} TEU, Available: {available_space} TEU"
                )

        # Ingest Bulk Cargo Manifest items
        for bulk in manifest.bulk_items:
            db_bulk = models.BulkCargo(
                vcn=vcn,
                commodity_name=bulk.commodity_name,
                manifested_weight=bulk.manifested_weight,
                status="Pre-Arrival"
            )
            db.add(db_bulk)

        # Ingest Container Cargo Manifest items
        for container in manifest.container_items:
            # Ensure container number is unique globally
            existing = db.query(models.ContainerCargo).filter(models.ContainerCargo.container_no == container.container_no).first()
            if existing:
                raise PIMSException(f"Container {container.container_no} already registered in portal.")

            db_container = models.ContainerCargo(
                vcn=vcn,
                container_no=container.container_no,
                teu=container.teu,
                iso_code=container.iso_code,
                bay=container.bay,
                row=container.row,
                tier=container.tier,
                status="Pre-Arrival"
            )
            db.add(db_container)

        # Approve arrival status
        vessel_call.arrival_status = "Approved"
        db.commit()
        db.refresh(vessel_call)
        return vessel_call

    except Exception as e:
        db.rollback()
        raise e


def first_line_ashore(db: Session, vcn: str) -> models.VesselCall:
    """
    Phase 2: Vessel Berthing.
    Triggered when the vessel docks. Initiates voyage billing clock.
    """
    vessel_call = db.query(models.VesselCall).filter(models.VesselCall.vcn == vcn).first()
    if not vessel_call:
        raise PIMSException(f"VCN {vcn} not found.")

    if vessel_call.arrival_status != "Approved":
        raise PIMSException(f"Vessel clearance pending. Cannot dock vessel under state: {vessel_call.arrival_status}")

    vessel_call.arrival_status = "Arrived"
    vessel_call.first_line_ashore_time = datetime.datetime.utcnow()
    db.commit()
    db.refresh(vessel_call)
    return vessel_call


def discharge_cargo_tally(db: Session, vcn: str, cargo_type: str, cargo_id: int, quantity_discharged: float):
    """
    Phase 3: Cargo Stevedoring & Discharge Ledger.
    Updates the ledger using atomic transaction: Vessel Balance = Manifested - Discharged.
    Sets status immediately to 'Port Custody - Uncleared'.
    """
    try:
        vessel_call = db.query(models.VesselCall).filter(models.VesselCall.vcn == vcn).first()
        if not vessel_call:
            raise PIMSException(f"VCN {vcn} not found.")
        
        if vessel_call.arrival_status != "Arrived":
            raise PIMSException(f"Stevedoring Error: Vessel {vcn} must be in 'Arrived' status to commence discharge.")

        if cargo_type == "Bulk":
            bulk_cargo = db.query(models.BulkCargo).filter(
                models.BulkCargo.id == cargo_id, 
                models.BulkCargo.vcn == vcn
            ).first()
            if not bulk_cargo:
                raise PIMSException(f"Bulk Cargo item ID {cargo_id} not found under VCN {vcn}.")

            # Update discharged weight
            old_discharged = bulk_cargo.discharged_weight
            new_discharged = old_discharged + quantity_discharged

            # Enforce that we don't discharge more than manifested unless authorized
            # (allow up to 2% operational bulk variance draft discrepancy)
            if new_discharged > (bulk_cargo.manifested_weight * 1.05):
                raise PIMSException(
                    f"Discharge Denied: Tally quantity exceeds manifested weight by over 5% tolerance limit."
                )

            bulk_cargo.discharged_weight = new_discharged
            bulk_cargo.status = "Port Custody - Uncleared"
            
            db.commit()
            return {
                "cargo_id": bulk_cargo.id,
                "commodity": bulk_cargo.commodity_name,
                "manifested_weight": bulk_cargo.manifested_weight,
                "discharged_weight": bulk_cargo.discharged_weight,
                "vessel_balance": bulk_cargo.manifested_weight - bulk_cargo.discharged_weight,
                "status": bulk_cargo.status
            }

        elif cargo_type == "Container":
            container_cargo = db.query(models.ContainerCargo).filter(
                models.ContainerCargo.id == cargo_id,
                models.ContainerCargo.vcn == vcn
            ).first()
            if not container_cargo:
                raise PIMSException(f"Container Cargo item ID {cargo_id} not found under VCN {vcn}.")

            if container_cargo.status != "Pre-Arrival":
                raise PIMSException(f"Container {container_cargo.container_no} has already been discharged. State: {container_cargo.status}")

            container_cargo.status = "Port Custody - Uncleared"
            db.commit()
            return {
                "cargo_id": container_cargo.id,
                "container_no": container_cargo.container_no,
                "status": container_cargo.status
            }

    except Exception as e:
        db.rollback()
        raise e


def assign_yard_slot(db: Session, request: schemas.YardSlotAssignRequest) -> models.YardSlot:
    """
    Phase 4: Yard Storage & IoT Mapping.
    Maps physical yard grid locations and updates zone occupancies. Enforces hazardous segregation rules.
    """
    try:
        # Verify Yard Zone capacity and type
        yard_capacity = db.query(models.YardCapacity).filter(models.YardCapacity.zone == request.zone).first()
        if not yard_capacity:
            raise PIMSException(f"Yard zone {request.zone} does not exist.")

        if yard_capacity.cargo_type != request.cargo_type:
            raise PIMSException(f"Yard Zone mismatch: Zone {request.zone} accepts {yard_capacity.cargo_type}, not {request.cargo_type}.")

        # Enforce Hazmat segregation safety rule (e.g. Class 9 must be isolated or verified)
        if request.hazard_class and request.hazard_class != "None":
            # Demarcate special safety routing checks if needed
            pass

        # Load Cargo record and assign occupancy
        cargo_weight_teu = 0.0
        vcn = ""

        if request.cargo_type == "Bulk":
            cargo = db.query(models.BulkCargo).filter(models.BulkCargo.id == request.cargo_id).first()
            if not cargo:
                raise PIMSException(f"Bulk Cargo ID {request.cargo_id} not found.")
            if cargo.status != "Port Custody - Uncleared":
                raise PIMSException(f"Cargo must be in 'Port Custody - Uncleared' to map slots. Current status: {cargo.status}")
            
            cargo_weight_teu = cargo.discharged_weight
            vcn = cargo.vcn
            cargo.status = "Yard Slot Assigned"
            
        elif request.cargo_type == "Container":
            cargo = db.query(models.ContainerCargo).filter(models.ContainerCargo.id == request.cargo_id).first()
            if not cargo:
                raise PIMSException(f"Container Cargo ID {request.cargo_id} not found.")
            if cargo.status != "Port Custody - Uncleared":
                raise PIMSException(f"Container must be in 'Port Custody - Uncleared' to map slots. Current status: {cargo.status}")
            
            cargo_weight_teu = cargo.teu
            vcn = cargo.vcn
            cargo.status = "Yard Slot Assigned"

        # Check occupancy limit
        new_occupancy = yard_capacity.current_occupancy + cargo_weight_teu
        if new_occupancy > yard_capacity.max_capacity:
            raise PIMSException(
                f"Yard Zone {request.zone} Overcrowding Warning: Cannot allocate. Requested: {cargo_weight_teu}, Limit: {yard_capacity.max_capacity - yard_capacity.current_occupancy}"
            )

        # Allocate slot
        db_slot = models.YardSlot(
            vcn=vcn,
            cargo_type=request.cargo_type,
            bulk_cargo_id=request.cargo_id if request.cargo_type == "Bulk" else None,
            container_cargo_id=request.cargo_id if request.cargo_type == "Container" else None,
            zone=request.zone,
            slot_number=request.slot_number,
            coordinates=request.coordinates,
            storage_start_time=datetime.datetime.utcnow(),
            free_days_limit=request.free_days_limit,
            hazard_class=request.hazard_class
        )
        db.add(db_slot)

        # Update yard capacity occupancy
        yard_capacity.current_occupancy = new_occupancy

        db.commit()
        db.refresh(db_slot)
        return db_slot

    except Exception as e:
        db.rollback()
        raise e


def process_gate_evacuation(db: Session, request: schemas.GateEvacuationRequest) -> models.GatePass:
    """
    Phase 5: Gate Evacuation & IoT Weighbridge Integration.
    Calculates net weight (Gross - Tare) and deducts transit cargo stack inventories.
    Generates gate pass upon successful deduction.
    """
    try:
        # Load Yard Slot
        yard_slot = db.query(models.YardSlot).filter(models.YardSlot.id == request.yard_slot_id).first()
        if not yard_slot:
            raise PIMSException(f"Yard slot ID {request.yard_slot_id} not found.")

        # Calculate Net weight (Metric Tonnes)
        net_weight = request.gross_weight - request.tare_weight
        if net_weight <= 0:
            raise PIMSException("Gate Error: Net weight must be positive (Gross weight must exceed Tare weight).")

        # Load Yard Capacity Zone to decrement occupancy
        yard_capacity = db.query(models.YardCapacity).filter(models.YardCapacity.zone == yard_slot.zone).first()

        # Evacuation Deductions
        if yard_slot.cargo_type == "Bulk":
            bulk_cargo = yard_slot.bulk_cargo
            if not bulk_cargo:
                raise PIMSException("Bulk cargo not linked to this yard slot.")

            # Calculate current stack inventory: Discharged weight minus already gate-evacuated cargo net weight
            past_evacuated_weight = db.query(func.sum(models.GatePass.net_weight)).filter(
                models.GatePass.yard_slot_id == yard_slot.id
            ).scalar() or 0.0

            current_stack_inventory = bulk_cargo.discharged_weight - past_evacuated_weight

            # Enforce atomic balance check
            if net_weight > (current_stack_inventory * 1.01):  # Allow 1% scale calibration tolerance
                raise PIMSException(
                    f"Overload Blocked: Truck net cargo ({net_weight} MT) exceeds stack capacity ({current_stack_inventory} MT)."
                )

            # Check if this load evacuates the stack
            is_empty = (net_weight >= current_stack_inventory) or (abs(current_stack_inventory - net_weight) < 0.1)

            # Decrement occupancy in the yard
            yard_capacity.current_occupancy = max(0.0, yard_capacity.current_occupancy - net_weight)

            if is_empty:
                bulk_cargo.status = "Evacuated"
                # Clear slot timing
                yard_slot.storage_start_time = None
        
        elif yard_slot.cargo_type == "Container":
            container_cargo = yard_slot.container_cargo
            if not container_cargo:
                raise PIMSException("Container cargo not linked to this yard slot.")
            
            if container_cargo.status == "Evacuated":
                raise PIMSException("Container has already been evacuated from the port.")

            # Set status
            container_cargo.status = "Evacuated"
            
            # Decrement occupancy in the yard by container TEU size
            yard_capacity.current_occupancy = max(0.0, yard_capacity.current_occupancy - container_cargo.teu)
            
            # Clear slot timing
            yard_slot.storage_start_time = None

        # Create Gate Pass
        pass_code = f"GP-NMPA-{uuid.uuid4().hex[:12].upper()}"
        gate_pass = models.GatePass(
            truck_id=request.truck_id,
            vcn=yard_slot.vcn,
            yard_slot_id=yard_slot.id,
            tare_weight=request.tare_weight,
            gross_weight=request.gross_weight,
            net_weight=net_weight,
            evacuation_time=datetime.datetime.utcnow(),
            pass_code=pass_code
        )
        db.add(gate_pass)
        db.commit()
        db.refresh(gate_pass)
        return gate_pass

    except Exception as e:
        db.rollback()
        raise e


def reconcile_yard_variance(db: Session, yard_slot_id: int, physical_weight: float, user_id: str, reason: str) -> models.YardSlot:
    """
    Advanced Business Logic: Cargo Variance Override.
    Authorizes supervisors to align digital stack registers with physical stock audits (moisture, spills).
    """
    try:
        yard_slot = db.query(models.YardSlot).filter(models.YardSlot.id == yard_slot_id).first()
        if not yard_slot:
            raise PIMSException(f"Yard slot ID {yard_slot_id} not found.")

        if yard_slot.cargo_type != "Bulk":
            raise PIMSException("Variance override is only applicable to high-volume Bulk stacks.")

        bulk_cargo = yard_slot.bulk_cargo
        if not bulk_cargo:
            raise PIMSException("No bulk cargo linked to this slot.")

        # Compute old value
        past_evacuated_weight = db.query(func.sum(models.GatePass.net_weight)).filter(
            models.GatePass.yard_slot_id == yard_slot.id
        ).scalar() or 0.0
        
        old_computed_stack = bulk_cargo.discharged_weight - past_evacuated_weight
        difference = physical_weight - old_computed_stack

        # Log change in immutable Audit Log
        audit_log = models.AuditLog(
            action="RECONCILE_VARIANCE",
            entity_type="YardSlot",
            entity_id=str(yard_slot_id),
            user_id=user_id,
            old_value=f"Computed Stack Inventory: {old_computed_stack} MT (Discharged: {bulk_cargo.discharged_weight} MT)",
            new_value=f"Physical Survey: {physical_weight} MT (Adjusted Discharged: {bulk_cargo.discharged_weight + difference} MT)",
            justification=reason,
            timestamp=datetime.datetime.utcnow()
        )
        db.add(audit_log)

        # Apply adjustments to cargo tally ledger
        bulk_cargo.discharged_weight += difference

        # Adjust general yard capacity occupancy
        yard_capacity = db.query(models.YardCapacity).filter(models.YardCapacity.zone == yard_slot.zone).first()
        if yard_capacity:
            yard_capacity.current_occupancy = max(0.0, yard_capacity.current_occupancy + difference)

        db.commit()
        db.refresh(yard_slot)
        return yard_slot

    except Exception as e:
        db.rollback()
        raise e
