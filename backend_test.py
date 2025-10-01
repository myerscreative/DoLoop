#!/usr/bin/env python3
"""
Backend API Testing for Enhanced Task Functionality
Tests the new task fields: assigned_email, due_date, tags, notes, attachments
"""

import requests
import json
from datetime import datetime, timedelta
import sys
import os

# Get backend URL from frontend .env
BACKEND_URL = "https://routineloop.preview.emergentagent.com/api"

class TaskFieldsTestSuite:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.auth_token = None
        self.test_user_email = "taskfields@test.com"
        self.test_user_password = "testpass123"
        self.test_user_name = "Task Fields Tester"
        self.test_loop_id = None
        self.test_task_id = None
        self.passed_tests = 0
        self.total_tests = 0
        
    def log(self, message, level="INFO"):
        """Log test messages"""
        print(f"[{level}] {message}")
        
    def make_request(self, method, endpoint, data=None, headers=None):
        """Make HTTP request with proper error handling"""
        url = f"{self.base_url}{endpoint}"
        
        if headers is None:
            headers = {}
            
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
            
        headers["Content-Type"] = "application/json"
        
        try:
            if method == "GET":
                response = requests.get(url, headers=headers)
            elif method == "POST":
                response = requests.post(url, json=data, headers=headers)
            elif method == "PUT":
                response = requests.put(url, json=data, headers=headers)
            elif method == "DELETE":
                response = requests.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            self.log(f"Request failed: {str(e)}", "ERROR")
            return None
            
    def test_auth_setup(self):
        """Setup authentication for testing"""
        self.log("Setting up authentication...")
        
        # Register test user
        register_data = {
            "email": self.test_user_email,
            "password": self.test_user_password,
            "name": self.test_user_name
        }
        
        response = self.make_request("POST", "/auth/register", register_data)
        
        if response and response.status_code == 200:
            data = response.json()
            self.auth_token = data["token"]
            self.log("✅ User registration successful")
            return True
        elif response and response.status_code == 400:
            # User already exists, try login
            login_data = {
                "email": self.test_user_email,
                "password": self.test_user_password
            }
            
            response = self.make_request("POST", "/auth/login", login_data)
            if response and response.status_code == 200:
                data = response.json()
                self.auth_token = data["token"]
                self.log("✅ User login successful")
                return True
                
        self.log("❌ Authentication setup failed", "ERROR")
        return False
        
    def test_create_test_loop(self):
        """Create a test loop for task testing"""
        self.log("Creating test loop...")
        
        loop_data = {
            "name": "Task Fields Test Loop",
            "description": "Loop for testing enhanced task fields",
            "color": "#FFC93A",
            "reset_rule": "manual"
        }
        
        response = self.make_request("POST", "/loops", loop_data)
        
        if response and response.status_code == 200:
            data = response.json()
            self.test_loop_id = data["id"]
            self.log(f"✅ Test loop created with ID: {self.test_loop_id}")
            return True
            
        self.log("❌ Failed to create test loop", "ERROR")
        return False
        
    def test_create_task_with_new_fields(self):
        """Test creating a task with all new fields"""
        self.total_tests += 1
        self.log("Testing task creation with new fields...")
        
        # Create a task with all new fields
        due_date = (datetime.utcnow() + timedelta(days=7)).isoformat()
        
        task_data = {
            "loop_id": self.test_loop_id,
            "description": "Task with enhanced fields",
            "type": "recurring",
            "assigned_email": "assignee@example.com",
            "due_date": due_date,
            "tags": ["urgent", "important", "test"],
            "notes": "This is a test task with notes and enhanced fields",
            "attachments": [
                {"name": "document.pdf", "url": "https://example.com/doc.pdf", "type": "pdf"},
                {"name": "image.jpg", "url": "https://example.com/img.jpg", "type": "image"}
            ]
        }
        
        response = self.make_request("POST", f"/loops/{self.test_loop_id}/tasks", task_data)
        
        if response and response.status_code == 200:
            data = response.json()
            self.test_task_id = data["id"]
            
            # Verify all fields are present and correct
            success = True
            
            if data.get("assigned_email") != "assignee@example.com":
                self.log(f"❌ assigned_email mismatch: expected 'assignee@example.com', got '{data.get('assigned_email')}'", "ERROR")
                success = False
                
            if not data.get("due_date"):
                self.log("❌ due_date not returned", "ERROR")
                success = False
                
            if data.get("tags") != ["urgent", "important", "test"]:
                self.log(f"❌ tags mismatch: expected ['urgent', 'important', 'test'], got {data.get('tags')}", "ERROR")
                success = False
                
            if data.get("notes") != "This is a test task with notes and enhanced fields":
                self.log(f"❌ notes mismatch: expected note text, got '{data.get('notes')}'", "ERROR")
                success = False
                
            if len(data.get("attachments", [])) != 2:
                self.log(f"❌ attachments count mismatch: expected 2, got {len(data.get('attachments', []))}", "ERROR")
                success = False
                
            if success:
                self.log("✅ Task created successfully with all new fields")
                self.passed_tests += 1
                return True
            else:
                self.log("❌ Task created but some fields are incorrect", "ERROR")
                return False
        else:
            self.log(f"❌ Failed to create task. Status: {response.status_code if response else 'No response'}", "ERROR")
            if response:
                self.log(f"Response: {response.text}", "ERROR")
            return False
            
    def test_get_task_with_new_fields(self):
        """Test retrieving tasks and verify new fields are returned"""
        self.total_tests += 1
        self.log("Testing task retrieval with new fields...")
        
        response = self.make_request("GET", f"/loops/{self.test_loop_id}/tasks")
        
        if response and response.status_code == 200:
            tasks = response.json()
            
            if not tasks:
                self.log("❌ No tasks returned", "ERROR")
                return False
                
            task = tasks[0]  # Get the first task (our test task)
            
            # Verify all new fields are present
            success = True
            required_fields = ["assigned_email", "due_date", "tags", "notes", "attachments"]
            
            for field in required_fields:
                if field not in task:
                    self.log(f"❌ Field '{field}' missing from task response", "ERROR")
                    success = False
                    
            if success:
                self.log("✅ Task retrieval successful - all new fields present")
                self.passed_tests += 1
                return True
            else:
                self.log("❌ Task retrieval failed - missing fields", "ERROR")
                return False
        else:
            self.log(f"❌ Failed to retrieve tasks. Status: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
    def test_update_task_with_new_fields(self):
        """Test updating a task with new fields"""
        self.total_tests += 1
        self.log("Testing task update with new fields...")
        
        # Update the task with new values
        new_due_date = (datetime.utcnow() + timedelta(days=14)).isoformat()
        
        update_data = {
            "description": "Updated task description",
            "assigned_email": "newassignee@example.com",
            "due_date": new_due_date,
            "tags": ["updated", "modified", "test"],
            "notes": "Updated notes for the task",
            "attachments": [
                {"name": "updated_doc.pdf", "url": "https://example.com/updated.pdf", "type": "pdf"}
            ]
        }
        
        response = self.make_request("PUT", f"/tasks/{self.test_task_id}", update_data)
        
        if response and response.status_code == 200:
            data = response.json()
            
            # Verify updated fields
            success = True
            
            if data.get("description") != "Updated task description":
                self.log(f"❌ description not updated: expected 'Updated task description', got '{data.get('description')}'", "ERROR")
                success = False
                
            # Check if new fields are updated - this will likely fail due to the bug in server.py
            if data.get("assigned_email") != "newassignee@example.com":
                self.log(f"❌ assigned_email not updated: expected 'newassignee@example.com', got '{data.get('assigned_email')}'", "ERROR")
                success = False
                
            if data.get("tags") != ["updated", "modified", "test"]:
                self.log(f"❌ tags not updated: expected ['updated', 'modified', 'test'], got {data.get('tags')}", "ERROR")
                success = False
                
            if data.get("notes") != "Updated notes for the task":
                self.log(f"❌ notes not updated: expected 'Updated notes for the task', got '{data.get('notes')}'", "ERROR")
                success = False
                
            if len(data.get("attachments", [])) != 1:
                self.log(f"❌ attachments not updated: expected 1 attachment, got {len(data.get('attachments', []))}", "ERROR")
                success = False
                
            if success:
                self.log("✅ Task updated successfully with all new fields")
                self.passed_tests += 1
                return True
            else:
                self.log("❌ Task update failed - some fields not updated correctly", "ERROR")
                return False
        else:
            self.log(f"❌ Failed to update task. Status: {response.status_code if response else 'No response'}", "ERROR")
            if response:
                self.log(f"Response: {response.text}", "ERROR")
            return False
            
    def test_create_task_minimal_fields(self):
        """Test creating a task with only required fields (backward compatibility)"""
        self.total_tests += 1
        self.log("Testing backward compatibility - task creation with minimal fields...")
        
        task_data = {
            "loop_id": self.test_loop_id,
            "description": "Minimal task",
            "type": "one-time"
        }
        
        response = self.make_request("POST", f"/loops/{self.test_loop_id}/tasks", task_data)
        
        if response and response.status_code == 200:
            data = response.json()
            
            # Verify optional fields have default values
            success = True
            
            if data.get("assigned_email") is not None:
                self.log(f"❌ assigned_email should be None, got '{data.get('assigned_email')}'", "ERROR")
                success = False
                
            if data.get("due_date") is not None:
                self.log(f"❌ due_date should be None, got '{data.get('due_date')}'", "ERROR")
                success = False
                
            if data.get("tags") != []:
                self.log(f"❌ tags should be empty array, got {data.get('tags')}", "ERROR")
                success = False
                
            if data.get("notes") is not None:
                self.log(f"❌ notes should be None, got '{data.get('notes')}'", "ERROR")
                success = False
                
            if data.get("attachments") != []:
                self.log(f"❌ attachments should be empty array, got {data.get('attachments')}", "ERROR")
                success = False
                
            if success:
                self.log("✅ Backward compatibility test passed - minimal task created correctly")
                self.passed_tests += 1
                return True
            else:
                self.log("❌ Backward compatibility test failed", "ERROR")
                return False
        else:
            self.log(f"❌ Failed to create minimal task. Status: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
    def test_datetime_serialization(self):
        """Test that datetime objects are properly serialized"""
        self.total_tests += 1
        self.log("Testing datetime serialization...")
        
        # Create task with due_date
        due_date = datetime.utcnow() + timedelta(days=5)
        
        task_data = {
            "loop_id": self.test_loop_id,
            "description": "DateTime test task",
            "type": "recurring",
            "due_date": due_date.isoformat()
        }
        
        response = self.make_request("POST", f"/loops/{self.test_loop_id}/tasks", task_data)
        
        if response and response.status_code == 200:
            data = response.json()
            
            # Verify due_date is returned as string and is parseable
            due_date_str = data.get("due_date")
            if due_date_str:
                try:
                    parsed_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00'))
                    self.log("✅ DateTime serialization test passed")
                    self.passed_tests += 1
                    return True
                except ValueError:
                    self.log(f"❌ Invalid datetime format returned: {due_date_str}", "ERROR")
                    return False
            else:
                self.log("❌ due_date not returned", "ERROR")
                return False
        else:
            self.log(f"❌ Failed to create datetime test task. Status: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
    def run_all_tests(self):
        """Run all test cases"""
        self.log("=" * 60)
        self.log("STARTING ENHANCED TASK FIELDS TESTING")
        self.log("=" * 60)
        
        # Setup
        if not self.test_auth_setup():
            self.log("❌ Authentication setup failed - aborting tests", "ERROR")
            return False
            
        if not self.test_create_test_loop():
            self.log("❌ Test loop creation failed - aborting tests", "ERROR")
            return False
            
        # Run tests
        self.test_create_task_with_new_fields()
        self.test_get_task_with_new_fields()
        self.test_update_task_with_new_fields()
        self.test_create_task_minimal_fields()
        self.test_datetime_serialization()
        
        # Summary
        self.log("=" * 60)
        self.log("TEST SUMMARY")
        self.log("=" * 60)
        self.log(f"Total Tests: {self.total_tests}")
        self.log(f"Passed: {self.passed_tests}")
        self.log(f"Failed: {self.total_tests - self.passed_tests}")
        self.log(f"Success Rate: {(self.passed_tests / self.total_tests * 100):.1f}%")
        
        if self.passed_tests == self.total_tests:
            self.log("🎉 ALL TESTS PASSED!")
            return True
        else:
            self.log("❌ SOME TESTS FAILED!")
            return False

def main():
    """Main test execution"""
    test_suite = TaskFieldsTestSuite()
    success = test_suite.run_all_tests()
    
    if success:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()