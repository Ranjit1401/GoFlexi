import hashlib
import hmac
import uuid
from datetime import datetime, timezone
from typing import Any, Optional, Dict

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.config import settings
from app.db.database import get_db
from app.models.trip import Trip


router = APIRouter(
    prefix="/payments",
    tags=["Payments"],
)


class CreateOrderRequest(BaseModel):
    amount: float = Field(
        default=72022.0,
        gt=0,
        description="Amount in INR",
    )
    currency: str = Field(
        default="INR",
        min_length=3,
        max_length=3,
    )
    receipt: Optional[str] = None
    trip_id: Optional[str] = None
    notes: Optional[Dict[str, Any]] = None


class VerifyPaymentRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str
    trip_id: Optional[str] = None


@router.get("/config", summary="Get Razorpay public configuration")
def get_payment_config() -> dict[str, Any]:
    return {
        "key_id": settings.RAZORPAY_KEY_ID,
        "enabled": bool(settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET),
        "currency": "INR",
    }


@router.post("/create-order")
async def create_order(
    payload: CreateOrderRequest,
) -> dict[str, Any]:

    # Check Razorpay credentials
    if (
        not settings.RAZORPAY_KEY_ID
        or not settings.RAZORPAY_KEY_SECRET
    ):
        raise HTTPException(
            status_code=503,
            detail="Razorpay test keys are not configured on the backend.",
        )

    # Razorpay expects INR amount in paise
    amount_paise = int(round(payload.amount * 100))

    receipt = (
        payload.receipt
        or f"goflexi_{uuid.uuid4().hex[:12]}"
    )[:40]

    order_notes = payload.notes or {}
    order_notes.setdefault("platform", "GoFlexi")
    if payload.trip_id:
        order_notes["trip_id"] = str(payload.trip_id)

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:

            response = await client.post(
                "https://api.razorpay.com/v1/orders",

                auth=(
                    settings.RAZORPAY_KEY_ID,
                    settings.RAZORPAY_KEY_SECRET,
                ),

                json={
                    "amount": amount_paise,
                    "currency": payload.currency.upper(),
                    "receipt": receipt,
                    "notes": order_notes,
                },
            )

    except httpx.HTTPError as exc:

        raise HTTPException(
            status_code=502,
            detail="Could not reach Razorpay.",
        ) from exc

    # Razorpay rejected request
    if response.status_code >= 400:

        detail = "Razorpay rejected the order request."

        try:
            detail = (
                response.json()
                .get("error", {})
                .get("description", detail)
            )
        except Exception:
            pass

        raise HTTPException(
            status_code=response.status_code,
            detail=detail,
        )

    order = response.json()

    return {
        "order_id": order["id"],
        "amount": order["amount"],
        "currency": order["currency"],
        "key_id": settings.RAZORPAY_KEY_ID,
    }


@router.post("/verify")
def verify_payment(
    payload: VerifyPaymentRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:

    if not settings.RAZORPAY_KEY_SECRET:

        raise HTTPException(
            status_code=503,
            detail="Razorpay secret is not configured.",
        )

    # Razorpay signature verification
    message = (
        f"{payload.razorpay_order_id}|"
        f"{payload.razorpay_payment_id}"
    ).encode()

    expected_signature = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        message,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(
        expected_signature,
        payload.razorpay_signature,
    ):

        raise HTTPException(
            status_code=400,
            detail="Invalid Razorpay payment signature.",
        )

    # If associated with a trip in the database, automatically mark as paid
    if payload.trip_id:
        try:
            t_uuid = uuid.UUID(payload.trip_id)
            trip = db.execute(select(Trip).where(Trip.id == t_uuid)).scalar_one_or_none()
            if trip:
                trip.payment_status = "Paid"
                trip.payment_id = payload.razorpay_payment_id
                trip.paid_at = datetime.now(timezone.utc)
                db.commit()
                db.refresh(trip)
        except Exception as e:
            # Non-blocking for verification response
            pass

    return {
        "verified": True,
        "payment_id": payload.razorpay_payment_id,
        "order_id": payload.razorpay_order_id,
    }