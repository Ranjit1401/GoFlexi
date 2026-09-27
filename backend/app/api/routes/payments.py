import hashlib
import hmac
import uuid
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.config import settings


router = APIRouter(
    prefix="/payments",
    tags=["Payments"],
)


class CreateOrderRequest(BaseModel):
    amount: int = Field(
        default=72022,
        gt=0,
        description="Amount in INR",
    )
    currency: str = Field(
        default="INR",
        min_length=3,
        max_length=3,
    )
    receipt: str | None = None


class VerifyPaymentRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str


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
    amount_paise = int(payload.amount * 100)

    receipt = (
        payload.receipt
        or f"goflexi_{uuid.uuid4().hex[:20]}"
    )

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
                    "notes": {
                        "platform": "GoFlexi",
                        "trip": "Mumbai-Dubai",
                    },
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

    return {
        "verified": True,
        "payment_id": payload.razorpay_payment_id,
        "order_id": payload.razorpay_order_id,
    }