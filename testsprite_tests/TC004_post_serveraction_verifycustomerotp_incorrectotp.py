import requests

def test_post_serveraction_verifycustomerotp_incorrectotp():
    base_url = "http://localhost:3000"
    endpoint = "serverAction:verifyCustomerOTP"
    url = f"{base_url}/{endpoint}"

    headers = {"Content-Type": "application/json"}
    
    # Test missing OTP (empty payload)
    payload_missing_otp = {}
    try:
        response = requests.post(url, json=payload_missing_otp, headers=headers, timeout=30)
        assert response.status_code in [400, 401], (
            f"Expected HTTP 400 or 401 for missing OTP, got {response.status_code}, response: {response.text}"
        )
    except requests.RequestException as e:
        assert False, f"Request failed for missing OTP: {e}"

    # Test incorrect OTP
    payload_incorrect_otp = {
        "otp": "000000"  # assuming OTP is numeric string; deliberately incorrect
    }
    try:
        response = requests.post(url, json=payload_incorrect_otp, headers=headers, timeout=30)
        assert response.status_code in [400, 401], (
            f"Expected HTTP 400 or 401 for incorrect OTP, got {response.status_code}, response: {response.text}"
        )
    except requests.RequestException as e:
        assert False, f"Request failed for incorrect OTP: {e}"

test_post_serveraction_verifycustomerotp_incorrectotp()
