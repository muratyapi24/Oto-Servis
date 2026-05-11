import requests

def test_post_serveraction_sendcustomerotp_validphone():
    base_url = "http://localhost:3000"
    url = f"{base_url}/serverAction:sendCustomerOTP"
    timeout = 30
    headers = {
        "Content-Type": "application/json"
    }
    # Example of a valid registered phone number and vehicle plate (these should be valid on the system)
    payload = {
        "phone": "+905312345678",
        "vehiclePlate": "34ABC123"
    }

    try:
        response = requests.post(
            url,
            json=payload,
            headers=headers,
            timeout=timeout
        )
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected HTTP 200 but got {response.status_code}"
    resp_json = response.json()
    # Assert the response contains confirmation keys or messages indicating OTP sent
    assert "message" in resp_json, "Response JSON missing 'message' key"
    assert any(keyword in resp_json["message"].lower() for keyword in ["otp", "sent", "success"]), \
        f"Response message does not confirm OTP sent: {resp_json['message']}"

test_post_serveraction_sendcustomerotp_validphone()
