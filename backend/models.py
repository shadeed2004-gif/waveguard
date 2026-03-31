from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime, timezone
from database import Base


class Reading(Base):
    """One row = one reading POSTed by the physical buoy."""
    __tablename__ = "readings"

    id           = Column(Integer, primary_key=True, index=True)
    buoy_id      = Column(String, index=True)
    avg_motion   = Column(Float,  nullable=False)
    wave_speed   = Column(Float,  nullable=True,  default=0.0)
    lat          = Column(Float,  nullable=True)
    lon          = Column(Float,  nullable=True)
    eta          = Column(Float,  nullable=True,  default=None)  # ETA in minutes
    device_status = Column(String, nullable=True,  default=None) # Status reported by device itself
    buoy_status  = Column(String, nullable=False)
    timestamp    = Column(DateTime, default=datetime.utcnow)
