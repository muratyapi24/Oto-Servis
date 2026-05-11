import requests

BASE_URL = "http://localhost:3000/superadmin-login"
TIMEOUT = 30

def test_post_serveraction_sendcustomerotp():
    session = requests.Session()
    try:
        # Step 1: Send OTP to a valid phone number and vehicle plate to receive confirmation
        send_otp_payload = {
            "action": "serverAction:sendCustomerOTP",
            "phoneNumber": "+905301234567",  # example valid phone number
            "vehiclePlate": "34ABC123"       # example valid vehicle plate
        }
        send_otp_response = session.post(
            BASE_URL,
            json=send_otp_payload,
            timeout=TIMEOUT
        )
        assert send_otp_response.status_code == 200, f"Expected 200 on sendCustomerOTP, got {send_otp_response.status_code}"
        content_type = send_otp_response.headers.get('Content-Type', '')
        assert 'application/json' in content_type.lower(), "Response is not JSON"
        send_otp_json = send_otp_response.json()
        # Check for confirmation of OTP sent
        assert ("otpSent" in send_otp_json and send_otp_json["otpSent"] is True) or 
               ("message" in send_otp_json and "success" in send_otp_json["message"].lower()), \
            "OTP not confirmed sent in response"

    finally:
        session.close()

test_post_serveraction_sendcustomerotp()
