import requests
from requests.auth import HTTPBasicAuth

def test_get_serveraction_getmusterimesajlari_authenticated():
    base_url = "http://localhost:3000"
    auth = HTTPBasicAuth('superadmin@msotoservis.com', 'SuperAdmin123!')
    headers = {
        "Content-Type": "application/json"
    }
    url = f"{base_url}/serverAction:getMusteriMesajlari"
    try:
        response = requests.get(url, headers=headers, auth=auth, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
    try:
        json_response = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert isinstance(json_response, (dict, list)), "Response JSON is neither dict nor list"

    if isinstance(json_response, dict):
        assert len(json_response) > 0, "Response JSON dict is empty"
    else:
        assert isinstance(json_response, list), "Response is not a list as expected"

test_get_serveraction_getmusterimesajlari_authenticated()