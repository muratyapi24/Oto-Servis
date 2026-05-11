import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000/superadmin-login"
USERNAME = "superadmin@msotoservis.com"
PASSWORD = "SuperAdmin123!"
TIMEOUT = 30

def test_post_serveraction_sendmusterimesaj_validmessage():
    auth = HTTPBasicAuth(USERNAME, PASSWORD)

    # Step 1: Create a service order to tie the message to
    create_order_payload = {
        "serverAction": "createServiceOrder",
        "vehiclePlate": "34TEST01",
        "serviceType": "Oil Change",
        "customerName": "Test Customer",
        "customerPhone": "5551234567",
        "description": "Test service order for messaging"
    }

    headers = {"Content-Type": "application/json"}

    service_order_id = None

    try:
        create_order_resp = requests.post(
            BASE_URL,
            json=create_order_payload,
            auth=auth,
            headers=headers,
            timeout=TIMEOUT
        )
        assert create_order_resp.status_code == 200, f"Failed to create service order, status: {create_order_resp.status_code}"
        assert 'application/json' in create_order_resp.headers.get('Content-Type', ''), "Create order response is not JSON"
        create_order_data = create_order_resp.json()
        assert "id" in create_order_data and create_order_data["id"], "Service order ID missing in response"
        service_order_id = create_order_data["id"]

        # Step 2: Send a message tied to the created service order
        send_message_payload = {
            "serverAction": "sendMusteriMesaj",
            "serviceOrderId": service_order_id,
            "message": "Test message from automated test."
        }

        send_message_resp = requests.post(
            BASE_URL,
            json=send_message_payload,
            auth=auth,
            headers=headers,
            timeout=TIMEOUT
        )
        assert send_message_resp.status_code == 200, f"Sending message failed with status {send_message_resp.status_code}"
        assert 'application/json' in send_message_resp.headers.get('Content-Type', ''), "Send message response is not JSON"
        send_message_data = send_message_resp.json()
        assert send_message_data.get("success") is True or send_message_data.get("status") == "delivered", "No confirmation of message delivery in response"

    finally:
        # Cleanup: Delete the created service order if possible
        if service_order_id:
            delete_payload = {
                "serverAction": "deleteServiceOrder",
                "serviceOrderId": service_order_id
            }
            try:
                requests.post(
                    BASE_URL,
                    json=delete_payload,
                    auth=auth,
                    headers=headers,
                    timeout=TIMEOUT
                )
            except Exception:
                pass

test_post_serveraction_sendmusterimesaj_validmessage()
