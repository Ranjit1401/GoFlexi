import pytest
from fastapi.testclient import TestClient


def test_01_health_endpoint(client: TestClient):
    """Test 1: Health endpoint returns status ok"""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_02_traveler_registration(client: TestClient):
    """Test 2: Registering a traveler creates user and returns safe info"""
    payload = {
        "name": "Aarav Sharma",
        "email": "aarav.sharma@example.com",
        "password": "securepassword123",
        "role": "traveler"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["message"] == "Registration successful"
    assert "user" in data
    assert data["user"]["name"] == "Aarav Sharma"
    assert data["user"]["email"] == "aarav.sharma@example.com"
    assert data["user"]["role"] == "traveler"
    assert "password_hash" not in data["user"]
    assert "id" in data["user"]


def test_03_agent_registration(client: TestClient):
    """Test 3: Registering an agent creates user and associated Agent profile"""
    payload = {
        "name": "Priya Sen",
        "email": "priya.sen@voyage.mock",
        "password": "agentsecurepassword123",
        "role": "agent",
        "agency_name": "Luxe Escapes India"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["message"] == "Registration successful"
    assert data["user"]["role"] == "agent"
    assert "password_hash" not in data["user"]


def test_04_duplicate_email_rejection(client: TestClient):
    """Test 4: Registering with existing email returns 409 Conflict"""
    payload = {
        "name": "Duplicate User",
        "email": "duplicate@example.com",
        "password": "mypassword123",
        "role": "traveler"
    }
    # First registration
    res1 = client.post("/api/auth/register", json=payload)
    assert res1.status_code == 201

    # Second registration with same email
    res2 = client.post("/api/auth/register", json=payload)
    assert res2.status_code == 409
    assert "already exists" in res2.json()["detail"].lower()


def test_05_login_with_correct_password(client: TestClient):
    """Test 5: Login with valid credentials returns JWT token and safe user info"""
    # Create user
    reg_payload = {
        "name": "Login Tester",
        "email": "login.test@example.com",
        "password": "validpassword456",
        "role": "traveler"
    }
    client.post("/api/auth/register", json=reg_payload)

    # Login
    login_payload = {
        "email": "login.test@example.com",
        "password": "validpassword456"
    }
    response = client.post("/api/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "login.test@example.com"
    assert "password_hash" not in data["user"]


def test_06_login_with_incorrect_password(client: TestClient):
    """Test 6: Login with wrong password returns 401 Unauthorized"""
    reg_payload = {
        "name": "Wrong Pass User",
        "email": "wrongpass@example.com",
        "password": "correctpassword123",
        "role": "traveler"
    }
    client.post("/api/auth/register", json=reg_payload)

    # Attempt login with wrong password
    login_payload = {
        "email": "wrongpass@example.com",
        "password": "wrongpassword999"
    }
    response = client.post("/api/auth/login", json=login_payload)
    assert response.status_code == 401
    assert "invalid email or password" in response.json()["detail"].lower()


def test_07_jwt_authentication_validation(client: TestClient):
    """Test 7: Missing or invalid token returns 401 Unauthorized"""
    # 1. Missing header
    res_missing = client.get("/api/auth/me")
    assert res_missing.status_code == 401

    # 2. Invalid/Malformed token
    headers = {"Authorization": "Bearer invalid.token.value"}
    res_invalid = client.get("/api/auth/me", headers=headers)
    assert res_invalid.status_code == 401


def test_08_auth_me_endpoint(client: TestClient):
    """Test 8: GET /api/auth/me returns authenticated user's profile"""
    email = "me.profile@example.com"
    password = "profilepass123"

    # Register
    client.post("/api/auth/register", json={
        "name": "Profile Owner",
        "email": email,
        "password": password,
        "role": "traveler"
    })

    # Login
    login_res = client.post("/api/auth/login", json={"email": email, "password": password})
    token = login_res.json()["access_token"]

    # Call /api/auth/me
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    data = me_res.json()
    assert data["email"] == email
    assert data["name"] == "Profile Owner"
    assert data["role"] == "traveler"


def test_09_traveler_access_to_agent_endpoint_forbidden(client: TestClient):
    """Test 9: Traveler calling /api/agents/me returns HTTP 403 Forbidden"""
    email = "traveler.user@example.com"
    password = "travelerpass123"

    # Register as traveler
    client.post("/api/auth/register", json={
        "name": "Regular Traveler",
        "email": email,
        "password": password,
        "role": "traveler"
    })

    # Login
    login_res = client.post("/api/auth/login", json={"email": email, "password": password})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Call /api/agents/me
    agent_res = client.get("/api/agents/me", headers=headers)
    assert agent_res.status_code == 403
    assert "agent privileges required" in agent_res.json()["detail"].lower()


def test_10_agent_access_to_agent_endpoint_success(client: TestClient):
    """Test 10: Authenticated Agent calling /api/agents/me succeeds and returns agency info"""
    email = "agent.operator@example.com"
    password = "agentoperatorpass123"
    agency_name = "Apex Travel Operators"

    # Register as agent
    client.post("/api/auth/register", json={
        "name": "Operator Lead",
        "email": email,
        "password": password,
        "role": "agent",
        "agency_name": agency_name
    })

    # Login
    login_res = client.post("/api/auth/login", json={"email": email, "password": password})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Call /api/agents/me
    agent_res = client.get("/api/agents/me", headers=headers)
    assert agent_res.status_code == 200
    data = agent_res.json()
    assert data["user"]["email"] == email
    assert data["user"]["role"] == "agent"
    assert data["agency"]["agency_name"] == agency_name
    assert "id" in data["agency"]


def test_11_login_role_mismatch_prevention(client: TestClient):
    """Test 11: Attempting login with wrong role returns 400 with portal suggestion"""
    email = "agent.mismatch@example.com"
    password = "agentpassword123"

    # Register agent
    client.post("/api/auth/register", json={
        "name": "Mismatch Agent",
        "email": email,
        "password": password,
        "role": "agent",
        "agency_name": "Mismatch Agency"
    })

    # Attempt login as traveler
    res = client.post("/api/auth/login", json={
        "email": email,
        "password": password,
        "role": "traveler"
    })
    assert res.status_code == 400
    assert "account is registered as a tour agent" in res.json()["detail"].lower()


def test_12_login_case_and_whitespace_normalization(client: TestClient):
    """Test 12: Login with mixed-case and padded email normalizes correctly and succeeds"""
    email = "norm.user@example.com"
    password = "normpassword123"

    # Register
    client.post("/api/auth/register", json={
        "name": "Norm User",
        "email": email,
        "password": password,
        "role": "traveler"
    })

    # Login with uppercase & padded email
    res = client.post("/api/auth/login", json={
        "email": "  NORM.USER@EXAMPLE.COM  ",
        "password": password,
        "role": "traveler"
    })
    assert res.status_code == 200
    assert res.json()["user"]["email"] == email
