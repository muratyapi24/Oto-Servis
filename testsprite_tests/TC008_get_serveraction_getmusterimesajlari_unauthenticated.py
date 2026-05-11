import requests

def test_get_serveraction_getmusterimesajlari_unauthenticated():
    base_url = "http://localhost:3000"
    path = "serverAction:getMusteriMesajlari"
    url = f"{base_url}/{path}"
    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.get(url, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 401, f"Expected 401 Unauthorized, got {response.status_code}"

test_get_serveraction_getmusterimesajlari_unauthenticated()