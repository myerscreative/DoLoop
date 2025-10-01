#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Doloop
Tests authentication, loop management, and task management APIs
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://routineloop.preview.emergentagent.com/api"
TEST_USER_EMAIL = "test@doloop.com"
TEST_USER_PASSWORD = "testpass123"
TEST_USER_NAME = "Test User"

class DoloopAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.auth_token = None
        self.user_id = None
        self.test_loop_id = None
        self.test_task_ids = []
        self.results = {
            "passed": 0,
            "failed": 0,
            "errors": []
        }

    def log_result(self, test_name, success, message="", response=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if message:
            print(f"   {message}")
        if response and not success:
            print(f"   Response: {response.status_code} - {response.text[:200]}")
        
        if success:
            self.results["passed"] += 1
        else:
            self.results["failed"] += 1
            self.results["errors"].append(f"{test_name}: {message}")
        print()

    def test_auth_register(self):
        """Test user registration"""
        print("🔐 Testing Authentication - Registration")
        
        # Test successful registration
        payload = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "name": TEST_USER_NAME
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/register", json=payload)
            
            if response.status_code == 201 or response.status_code == 200:
                data = response.json()
                if "token" in data and "user" in data:
                    self.auth_token = data["token"]
                    self.user_id = data["user"]["id"]
                    self.log_result("User Registration", True, f"User created with ID: {self.user_id}")
                else:
                    self.log_result("User Registration", False, "Missing token or user in response", response)
            elif response.status_code == 400 and "already registered" in response.text:
                # User already exists, try to login instead
                self.log_result("User Registration", True, "User already exists (expected)")
                return self.test_auth_login()
            else:
                self.log_result("User Registration", False, f"Unexpected status code: {response.status_code}", response)
                
        except Exception as e:
            self.log_result("User Registration", False, f"Request failed: {str(e)}")

        # Test duplicate email registration
        try:
            response = requests.post(f"{self.base_url}/auth/register", json=payload)
            if response.status_code == 400:
                self.log_result("Duplicate Email Registration", True, "Correctly rejected duplicate email")
            else:
                self.log_result("Duplicate Email Registration", False, "Should reject duplicate email", response)
        except Exception as e:
            self.log_result("Duplicate Email Registration", False, f"Request failed: {str(e)}")

    def test_auth_login(self):
        """Test user login"""
        print("🔐 Testing Authentication - Login")
        
        # Test successful login
        payload = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/login", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if "token" in data and "user" in data:
                    self.auth_token = data["token"]
                    self.user_id = data["user"]["id"]
                    self.log_result("User Login", True, f"Login successful for user: {data['user']['email']}")
                else:
                    self.log_result("User Login", False, "Missing token or user in response", response)
            else:
                self.log_result("User Login", False, f"Login failed with status: {response.status_code}", response)
                
        except Exception as e:
            self.log_result("User Login", False, f"Request failed: {str(e)}")

        # Test invalid credentials
        invalid_payload = {
            "email": TEST_USER_EMAIL,
            "password": "wrongpassword"
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/login", json=invalid_payload)
            if response.status_code == 401:
                self.log_result("Invalid Credentials", True, "Correctly rejected invalid password")
            else:
                self.log_result("Invalid Credentials", False, "Should reject invalid credentials", response)
        except Exception as e:
            self.log_result("Invalid Credentials", False, f"Request failed: {str(e)}")

    def get_auth_headers(self):
        """Get authorization headers"""
        if not self.auth_token:
            return {}
        return {"Authorization": f"Bearer {self.auth_token}"}

    def test_loops_get(self):
        """Test getting user loops"""
        print("🔄 Testing Loop Management - Get Loops")
        
        # Test with authentication
        try:
            headers = self.get_auth_headers()
            response = requests.get(f"{self.base_url}/loops", headers=headers)
            
            if response.status_code == 200:
                loops = response.json()
                self.log_result("Get Loops (Authenticated)", True, f"Retrieved {len(loops)} loops")
            else:
                self.log_result("Get Loops (Authenticated)", False, f"Failed to get loops: {response.status_code}", response)
                
        except Exception as e:
            self.log_result("Get Loops (Authenticated)", False, f"Request failed: {str(e)}")

        # Test without authentication
        try:
            response = requests.get(f"{self.base_url}/loops")
            if response.status_code == 401 or response.status_code == 403:
                self.log_result("Get Loops (Unauthenticated)", True, "Correctly rejected unauthenticated request")
            else:
                self.log_result("Get Loops (Unauthenticated)", False, "Should require authentication", response)
        except Exception as e:
            self.log_result("Get Loops (Unauthenticated)", False, f"Request failed: {str(e)}")

    def test_loops_create(self):
        """Test creating a loop"""
        print("🔄 Testing Loop Management - Create Loop")
        
        # Test with authentication
        payload = {
            "name": "Morning Routine",
            "description": "Daily morning tasks",
            "color": "#FFC93A",
            "reset_rule": "daily"
        }
        
        try:
            headers = self.get_auth_headers()
            response = requests.post(f"{self.base_url}/loops", json=payload, headers=headers)
            
            if response.status_code == 200 or response.status_code == 201:
                loop_data = response.json()
                if "id" in loop_data:
                    self.test_loop_id = loop_data["id"]
                    self.log_result("Create Loop (Authenticated)", True, f"Loop created with ID: {self.test_loop_id}")
                else:
                    self.log_result("Create Loop (Authenticated)", False, "Missing loop ID in response", response)
            else:
                self.log_result("Create Loop (Authenticated)", False, f"Failed to create loop: {response.status_code}", response)
                
        except Exception as e:
            self.log_result("Create Loop (Authenticated)", False, f"Request failed: {str(e)}")

        # Test without authentication
        try:
            response = requests.post(f"{self.base_url}/loops", json=payload)
            if response.status_code == 401 or response.status_code == 403:
                self.log_result("Create Loop (Unauthenticated)", True, "Correctly rejected unauthenticated request")
            else:
                self.log_result("Create Loop (Unauthenticated)", False, "Should require authentication", response)
        except Exception as e:
            self.log_result("Create Loop (Unauthenticated)", False, f"Request failed: {str(e)}")

    def test_tasks_get(self):
        """Test getting tasks for a loop"""
        print("📋 Testing Task Management - Get Tasks")
        
        if not self.test_loop_id:
            self.log_result("Get Tasks", False, "No test loop available")
            return
        
        # Test with authentication
        try:
            headers = self.get_auth_headers()
            response = requests.get(f"{self.base_url}/loops/{self.test_loop_id}/tasks", headers=headers)
            
            if response.status_code == 200:
                tasks = response.json()
                self.log_result("Get Tasks (Authenticated)", True, f"Retrieved {len(tasks)} tasks for loop")
            else:
                self.log_result("Get Tasks (Authenticated)", False, f"Failed to get tasks: {response.status_code}", response)
                
        except Exception as e:
            self.log_result("Get Tasks (Authenticated)", False, f"Request failed: {str(e)}")

        # Test without authentication
        try:
            response = requests.get(f"{self.base_url}/loops/{self.test_loop_id}/tasks")
            if response.status_code == 401 or response.status_code == 403:
                self.log_result("Get Tasks (Unauthenticated)", True, "Correctly rejected unauthenticated request")
            else:
                self.log_result("Get Tasks (Unauthenticated)", False, "Should require authentication", response)
        except Exception as e:
            self.log_result("Get Tasks (Unauthenticated)", False, f"Request failed: {str(e)}")

    def test_tasks_create(self):
        """Test creating tasks"""
        print("📋 Testing Task Management - Create Tasks")
        
        if not self.test_loop_id:
            self.log_result("Create Tasks", False, "No test loop available")
            return

        # Create recurring task
        recurring_payload = {
            "loop_id": self.test_loop_id,
            "description": "Brush teeth",
            "type": "recurring"
        }
        
        try:
            headers = self.get_auth_headers()
            response = requests.post(f"{self.base_url}/loops/{self.test_loop_id}/tasks", 
                                   json=recurring_payload, headers=headers)
            
            if response.status_code == 200 or response.status_code == 201:
                task_data = response.json()
                if "id" in task_data:
                    self.test_task_ids.append(task_data["id"])
                    self.log_result("Create Recurring Task", True, f"Task created with ID: {task_data['id']}")
                else:
                    self.log_result("Create Recurring Task", False, "Missing task ID in response", response)
            else:
                self.log_result("Create Recurring Task", False, f"Failed to create task: {response.status_code}", response)
                
        except Exception as e:
            self.log_result("Create Recurring Task", False, f"Request failed: {str(e)}")

        # Create one-time task
        onetime_payload = {
            "loop_id": self.test_loop_id,
            "description": "Buy new toothbrush",
            "type": "one-time"
        }
        
        try:
            headers = self.get_auth_headers()
            response = requests.post(f"{self.base_url}/loops/{self.test_loop_id}/tasks", 
                                   json=onetime_payload, headers=headers)
            
            if response.status_code == 200 or response.status_code == 201:
                task_data = response.json()
                if "id" in task_data:
                    self.test_task_ids.append(task_data["id"])
                    self.log_result("Create One-time Task", True, f"Task created with ID: {task_data['id']}")
                else:
                    self.log_result("Create One-time Task", False, "Missing task ID in response", response)
            else:
                self.log_result("Create One-time Task", False, f"Failed to create task: {response.status_code}", response)
                
        except Exception as e:
            self.log_result("Create One-time Task", False, f"Request failed: {str(e)}")

    def test_task_complete(self):
        """Test completing tasks"""
        print("📋 Testing Task Management - Complete Tasks")
        
        if not self.test_task_ids:
            self.log_result("Complete Task", False, "No test tasks available")
            return

        # Complete first task
        task_id = self.test_task_ids[0]
        
        try:
            headers = self.get_auth_headers()
            response = requests.put(f"{self.base_url}/tasks/{task_id}/complete", headers=headers)
            
            if response.status_code == 200:
                self.log_result("Complete Task", True, f"Task {task_id} marked as completed")
            else:
                self.log_result("Complete Task", False, f"Failed to complete task: {response.status_code}", response)
                
        except Exception as e:
            self.log_result("Complete Task", False, f"Request failed: {str(e)}")

    def test_loop_reloop(self):
        """Test reloop functionality"""
        print("🔄 Testing Loop Management - Reloop")
        
        if not self.test_loop_id:
            self.log_result("Reloop", False, "No test loop available")
            return

        try:
            headers = self.get_auth_headers()
            response = requests.put(f"{self.base_url}/loops/{self.test_loop_id}/reloop", headers=headers)
            
            if response.status_code == 200:
                self.log_result("Reloop Functionality", True, "Loop reset successfully")
            else:
                self.log_result("Reloop Functionality", False, f"Failed to reset loop: {response.status_code}", response)
                
        except Exception as e:
            self.log_result("Reloop Functionality", False, f"Request failed: {str(e)}")

    def test_progress_calculation(self):
        """Test progress calculation"""
        print("📊 Testing Progress Calculation")
        
        if not self.test_loop_id:
            self.log_result("Progress Calculation", False, "No test loop available")
            return

        try:
            headers = self.get_auth_headers()
            response = requests.get(f"{self.base_url}/loops", headers=headers)
            
            if response.status_code == 200:
                loops = response.json()
                test_loop = next((loop for loop in loops if loop["id"] == self.test_loop_id), None)
                
                if test_loop:
                    progress = test_loop.get("progress", 0)
                    total_tasks = test_loop.get("total_tasks", 0)
                    completed_tasks = test_loop.get("completed_tasks", 0)
                    
                    self.log_result("Progress Calculation", True, 
                                  f"Progress: {progress}%, Total: {total_tasks}, Completed: {completed_tasks}")
                else:
                    self.log_result("Progress Calculation", False, "Test loop not found in response")
            else:
                self.log_result("Progress Calculation", False, f"Failed to get loops: {response.status_code}", response)
                
        except Exception as e:
            self.log_result("Progress Calculation", False, f"Request failed: {str(e)}")

    def test_api_health(self):
        """Test API health endpoint"""
        print("🏥 Testing API Health")
        
        try:
            response = requests.get(f"{self.base_url}/")
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_result("API Health Check", True, f"API is running: {data['message']}")
                else:
                    self.log_result("API Health Check", True, "API responded successfully")
            else:
                self.log_result("API Health Check", False, f"API health check failed: {response.status_code}", response)
                
        except Exception as e:
            self.log_result("API Health Check", False, f"Request failed: {str(e)}")

    def run_all_tests(self):
        """Run all tests in sequence"""
        print(f"🚀 Starting Doloop Backend API Tests")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 60)
        
        # Test API health first
        self.test_api_health()
        
        # Authentication tests
        self.test_auth_register()
        if not self.auth_token:
            self.test_auth_login()
        
        if not self.auth_token:
            print("❌ Cannot continue tests without authentication token")
            return self.print_summary()
        
        # Loop management tests
        self.test_loops_get()
        self.test_loops_create()
        
        # Task management tests
        self.test_tasks_get()
        self.test_tasks_create()
        self.test_task_complete()
        
        # Advanced functionality tests
        self.test_loop_reloop()
        self.test_progress_calculation()
        
        return self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Passed: {self.results['passed']}")
        print(f"❌ Failed: {self.results['failed']}")
        print(f"📈 Success Rate: {(self.results['passed'] / (self.results['passed'] + self.results['failed']) * 100):.1f}%")
        
        if self.results['errors']:
            print("\n🚨 FAILED TESTS:")
            for error in self.results['errors']:
                print(f"   • {error}")
        
        print("=" * 60)
        return self.results['failed'] == 0

if __name__ == "__main__":
    tester = DoloopAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)