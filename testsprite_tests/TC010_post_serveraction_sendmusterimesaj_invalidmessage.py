import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
AUTH_CREDENTIALS = HTTPBasicAuth("superadmin@msotoservis.com", "SuperAdmin123!")
TIMEOUT = 30


def test_post_serveraction_sendmusterimesaj_invalidmessage():
    url = f"{BASE_URL}/serverAction:sendMusteriMesaj"
    headers = {
        "Content-Type": "application/json"
    }

    # Test cases with missing service order context or empty message content:
    invalid_payloads = [
        # Missing service order context (e.g. no orderId)
        {"message": "This is a test message without order context"},
        # Empty message content with valid service order context
        {"orderId": "some-order-id", "message": ""},
        # Both missing orderId and empty message
        {},
        {"orderId": None, "message": ""},
    ]

    for payload in invalid_payloads:
        try:
            response = requests.post(url, json=payload, headers=headers, auth=AUTH_CREDENTIALS, timeout=TIMEOUT)
        except requests.RequestException as e:
            assert False, f"Request failed: {e}"

        assert response.status_code == 400, (
            f"Expected HTTP 400 for payload {payload} but got {response.status_code} "
            f"with response body: {response.text}"
        )


test_post_serveraction_sendmusterimesaj_invalidmessage()
