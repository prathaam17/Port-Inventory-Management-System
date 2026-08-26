from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from .database import engine, get_db, Base
from . import models, schemas, service, scheduler

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NMPA Port Inventory Management System (PIMS) Ledger",
    description="ASynchronous, ACID-compliant ledger for weighbridge tracking, stevedoring tally, and demurrage rent.",
    version="1.0.0"
)

# Start background cron job for demurrage checks
bg_scheduler = scheduler.start_scheduler()


@app.on_event("shutdown")
def shutdown_event():
    if bg_scheduler:
        bg_scheduler.shutdown()
        print("[Demurrage Worker] Daily background scheduler shut down.")


@app.post("/vessel/register", response_model=schemas.VesselCallOut, status_code=status.HTTP_201_CREATED)
def register_vessel(call: schemas.VesselCallCreate, db: Session = Depends(get_db)):
    try:
        return service.create_vessel_call(db, call)
    except service.PIMSException as e:
        raise HTTPException(status_code=400, detail=e.message)


@app.post("/manifest/register/{vcn}", response_model=schemas.VesselCallOut)
def register_manifest(vcn: str, manifest: schemas.IgmManifestRequest, db: Session = Depends(get_db)):
    try:
        return service.register_manifest(db, vcn, manifest)
    except service.PIMSException as e:
        raise HTTPException(status_code=400, detail=e.message)


@app.post("/vessel/berth/{vcn}", response_model=schemas.VesselCallOut)
def berth_vessel(vcn: str, db: Session = Depends(get_db)):
    try:
        return service.first_line_ashore(db, vcn)
    except service.PIMSException as e:
        raise HTTPException(status_code=400, detail=e.message)


@app.post("/discharge/tally/{vcn}")
def discharge_tally(vcn: str, request: schemas.TallyDischargeRequest, db: Session = Depends(get_db)):
    try:
        return service.discharge_cargo_tally(db, vcn, request.cargo_type, request.cargo_id, request.quantity)
    except service.PIMSException as e:
        raise HTTPException(status_code=400, detail=e.message)


@app.post("/yard/allocate", status_code=status.HTTP_201_CREATED)
def allocate_yard_slot(request: schemas.YardSlotAssignRequest, db: Session = Depends(get_db)):
    try:
        db_slot = service.assign_yard_slot(db, request)
        return {
            "slot_id": db_slot.id,
            "vcn": db_slot.vcn,
            "zone": db_slot.zone,
            "slot_number": db_slot.slot_number,
            "coordinates": db_slot.coordinates,
            "storage_start_time": db_slot.storage_start_time,
            "hazard_class": db_slot.hazard_class
        }
    except service.PIMSException as e:
        raise HTTPException(status_code=400, detail=e.message)


@app.post("/gate/evacuate", response_model=schemas.GatePassOut)
def gate_evacuation(request: schemas.GateEvacuationRequest, db: Session = Depends(get_db)):
    try:
        return service.process_gate_evacuation(db, request)
    except service.PIMSException as e:
        raise HTTPException(status_code=400, detail=e.message)


@app.post("/reconcile/variance/{slot_id}")
def reconcile_variance(slot_id: int, request: schemas.VarianceReconcileRequest, db: Session = Depends(get_db)):
    try:
        service.reconcile_yard_variance(db, slot_id, request.physical_survey_weight, request.user_id, request.reason)
        return {"status": "success", "message": f"Slot {slot_id} variance override committed successfully."}
    except service.PIMSException as e:
        raise HTTPException(status_code=400, detail=e.message)


@app.post("/demurrage/check")
def trigger_demurrage_check(db: Session = Depends(get_db)):
    flagged = scheduler.check_demurrage_audit(db)
    return {"status": "success", "flagged_count": len(flagged), "items": flagged}


@app.get("/audit-logs", response_model=List[schemas.AuditLogOut])
def get_audit_logs(db: Session = Depends(get_db)):
    return db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).all()


@app.get("/yard/capacity")
def get_yard_capacity(db: Session = Depends(get_db)):
    zones = db.query(models.YardCapacity).all()
    return [{
        "zone": z.zone,
        "cargo_type": z.cargo_type,
        "max_capacity": z.max_capacity,
        "current_occupancy": z.current_occupancy,
        "available_capacity": z.max_capacity - z.current_occupancy
    } for z in zones]


@app.post("/seed-capacity", status_code=status.HTTP_201_CREATED)
def seed_yard_capacity(db: Session = Depends(get_db)):
    """Helper to initialize NMPA Yard capacity configurations."""
    bulk_zone = db.query(models.YardCapacity).filter(models.YardCapacity.cargo_type == "Bulk").first()
    if not bulk_zone:
        db.add(models.YardCapacity(zone="Bulk Coal Yard A", cargo_type="Bulk", max_capacity=50000.0, current_occupancy=0.0))
    
    container_zone = db.query(models.YardCapacity).filter(models.YardCapacity.cargo_type == "Container").first()
    if not container_zone:
        db.add(models.YardCapacity(zone="Container Yard Grid 01", cargo_type="Container", max_capacity=2000.0, current_occupancy=0.0))
        
    db.commit()
    return {"message": "NMPA capacities seeded successfully."}
