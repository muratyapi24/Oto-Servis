import requests

BASE_URL = "http://localhost:3000/superadmin-login"
TIMEOUT = 30

def test_post_serveraction_createserviceorder_unauthorized():
    # Sending createServiceOrder request without auth token should return 401 unauthorized as per PRD
    payload = {
        "vehicle": {
            "plateNumber": "34ABC123",
            "brand": "Toyota",
            "model": "Corolla",
            "year": 2020,
            "vin": "JTDBR32E720077777"
        },
        "serviceOrder": {
            "description": "Oil change and tire rotation",
            "customerId": "customer-12345",
            "priority": "normal",
            "estimatedCompletionDate": "2026-06-15T17:00:00Z"
        }
    }

    response = requests.post(
        f"{BASE_URL}/serverAction:createServiceOrder",
        json=payload,
        timeout=TIMEOUT
    )
    assert response.status_code == 401, f"Expected status 401 but got {response.status_code}"


test_post_serveraction_createserviceorder_unauthorized()