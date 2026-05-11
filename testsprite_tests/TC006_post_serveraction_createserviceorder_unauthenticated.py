import requests

BASE_URL = "http://localhost:3000/superadmin-login"
TIMEOUT = 30

def test_post_serveraction_createserviceorder_unauthenticated():
    url = f"{BASE_URL}/serverAction:createServiceOrder"

    # Define invalid order data (empty payload)
    invalid_data = {}

    headers_no_auth = {
        "Content-Type": "application/json"
    }

    # Attempt without authentication token - expect 401 Unauthorized
    response_no_auth = requests.post(url, json=invalid_data, headers=headers_no_auth, timeout=TIMEOUT)
    assert response_no_auth.status_code in (401, 400), f"Expected 401 or 400 when no auth, got {response_no_auth.status_code}"
    
    # Attempt with invalid order data but no auth token - still expect 401 or 400
    invalid_order_data = {
        # Presumably missing required fields, example minimal invalid data
        "vehicleId": "",
        "serviceDetails": ""
    }
    response_invalid_data = requests.post(url, json=invalid_order_data, headers=headers_no_auth, timeout=TIMEOUT)
    assert response_invalid_data.status_code in (401, 400), f"Expected 401 or 400 with invalid data and no auth, got {response_invalid_data.status_code}"

test_post_serveraction_createserviceorder_unauthenticated()