from datetime import datetime

txnHistory = {}
deviceHistory = {}
merchantHistory = {}


def evaluate_transaction(txn):

    payer_id = txn["payer_id"]
    payee_id = txn["payee_id"]
    amount = txn["amount"]
    timestamp = txn["timestamp"]
    location = txn["location"]
    device_id = txn["device_id"]

    ts = datetime.fromisoformat(timestamp).timestamp() * 1000

    reasons = []
    score = 0

    if payer_id not in txnHistory:
        txnHistory[payer_id] = []

    if payer_id not in deviceHistory:
        deviceHistory[payer_id] = set()

    if payer_id not in merchantHistory:
        merchantHistory[payer_id] = set()

    prevTxns = txnHistory[payer_id]
    prevDevices = deviceHistory[payer_id]
    prevMerchants = merchantHistory[payer_id]

    # ─── Rule 1: Amount Based Fraud ─────────────────

    if amount > 500000:
        score += 70
        reasons.append("Extremely high transaction amount")

    elif amount > 100000:
        score += 55
        reasons.append("Very high transaction amount")

    elif amount > 50000:
        score += 40
        reasons.append("High value transaction")

    elif amount > 10000:
        score += 25
        reasons.append("High transaction amount")

    # ─── Rule 2: High Velocity ──────────────────────

    fiveMinAgo = ts - 5 * 60 * 1000

    recentCount = len([
        t for t in prevTxns if t > fiveMinAgo
    ])

    if recentCount >= 10:
        score += 30
        reasons.append("High transaction velocity")

    # ─── Rule 3: High Frequency High Value ──────────

    oneMinAgo = ts - 60 * 1000

    recentAmounts = len([
        t for t in prevTxns if t > oneMinAgo
    ])

    if recentAmounts >= 3 and amount > 10000:
        score += 20
        reasons.append("High frequency high-value transaction")

    # ─── Rule 4: New Merchant ───────────────────────

    isNewMerchant = payee_id not in prevMerchants

    if isNewMerchant and amount > 5000:
        score += 20
        reasons.append("First-time merchant with high amount")

    # ─── Rule 5: Unusual Time ───────────────────────

    hour = datetime.fromisoformat(timestamp).hour

    if hour >= 23 or hour <= 5:
        score += 15
        reasons.append("Unusual transaction hour")

    # ─── Rule 6: Device Change ──────────────────────

    isNewDevice = device_id not in prevDevices

    if isNewDevice and isNewMerchant:
        score += 20
        reasons.append("New device with new beneficiary")

    # ─── Rule 7: Unknown Location ───────────────────

    if location.lower() == "unknown":
        score += 10
        reasons.append("Unknown location")

    # ─── Update Histories ───────────────────────────

    txnHistory[payer_id].append(ts)
    deviceHistory[payer_id].add(device_id)
    merchantHistory[payer_id].add(payee_id)

    # ─── Risk Capping ───────────────────────────────

    capped = min(score, 100)

    if capped >= 70:
        riskLevel = "CRITICAL"

    elif capped >= 40:
        riskLevel = "HIGH"

    elif capped >= 20:
        riskLevel = "MEDIUM"

    else:
        riskLevel = "LOW"

    return {
        "score": capped,
        "riskLevel": riskLevel,
        "reasons": reasons,
        "flagged": capped >= 40
    }