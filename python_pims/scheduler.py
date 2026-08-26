import datetime
from sqlalchemy.orm import Session
from .database import SessionLocal
from .models import YardSlot

def check_demurrage_audit(db: Session):
    """
    Scans all yard stacks/slots and flags rent-heavy batches.
    Runs daily via background worker or triggered manually via API.
    """
    now = datetime.datetime.utcnow()
    slots = db.query(YardSlot).filter(YardSlot.storage_start_time != None).all()
    
    flagged_slots = []
    for slot in slots:
        delta = now - slot.storage_start_time
        duration_days = delta.days

        # For demonstration purposes, if the slot has been there for more than 1 minute,
        # we can calculate it as overstaying to make testing/mocking easy,
        # but here we follow the days limit.
        slot.transit_duration_days = duration_days

        if duration_days > slot.free_days_limit:
            slot.demurrage_flag = True
            flagged_slots.append({
                "slot_id": slot.id,
                "vcn": slot.vcn,
                "zone": slot.zone,
                "slot_number": slot.slot_number,
                "duration_days": duration_days,
                "free_limit": slot.free_days_limit
            })
    
    db.commit()
    return flagged_slots

def start_scheduler():
    """
    Initializes background cron job running check_demurrage_audit daily.
    Uses APScheduler to run background tasks safely without blocking execution loop.
    """
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        
        def scheduled_job():
            db = SessionLocal()
            try:
                flagged = check_demurrage_audit(db)
                print(f"[Demurrage Worker] Daily check finished. Flagged {len(flagged)} overstaying stacks.")
            finally:
                db.close()

        scheduler = BackgroundScheduler()
        # Run job once a day at midnight
        scheduler.add_job(scheduled_job, 'cron', hour=0, minute=0)
        scheduler.start()
        print("[Demurrage Worker] Daily background scheduler started successfully.")
        return scheduler
    except ImportError:
        print("[Demurrage Worker] apscheduler package not installed. Skipping cron startup.")
        return None
