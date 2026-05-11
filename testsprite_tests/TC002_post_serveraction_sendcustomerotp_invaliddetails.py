import requests
from requests.auth import HTTPBasicAuth

def test_post_serveraction_sendcustomerotp_invaliddetails():
    base_url = "http://localhost:3000/superadmin-login"
    endpoint = f"{base_url}/serverAction:sendCustomerOTP"
    auth = HTTPBasicAuth("superadmin@msotoservis.com", "SuperAdmin123!")
    headers = {
        "Content-Type": "application/json"
    }
    # Use invalid or unregistered customer details
    payload = {
        "phoneNumber": "+900000000000",
        "vehiclePlate": "INVALID123"
    }

    try:
        response = requests.post(endpoint, json=payload, headers=headers, auth=auth, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed with exception: {e}"

    # Expecting 400 or 404 error code indicating invalid customer details and OTP not sent
    assert response.status_code in (400, 404), f"Expected status code 400 or 404, got {response.status_code}"
    # Response should indicate error detail in body (optional validation)
    json_response = {}
    try:
        json_response = response.json()
    except Exception:
        pass

    # Check typical error message keys if present
    assert ("error" in json_response or "message" in json_response or len(json_response) == 0), "Expected error message in response"

test_post_serveraction_sendcustomerotp_invaliddetails()