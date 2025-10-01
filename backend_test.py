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

class DoloopAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.auth_token = None
        self.test_user_id = None
        self.test_loop_id = None
        self.session = requests.Session()
        
    def log(self, message: str, level: str = "INFO"):
        """Log test messages with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, 
                    auth_required: bool = True) -> requests.Response:
        """Make HTTP request with optional authentication"""
        url = f"{self.base_url}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if auth_required and self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
            
        if method.upper() == "GET":
            response = self.session.get(url, headers=headers)
        elif method.upper() == "POST":
            response = self.session.post(url, headers=headers, json=data)
        elif method.upper() == "PUT":
            response = self.session.put(url, headers=headers, json=data)
        elif method.upper() == "DELETE":
            response = self.session.delete(url, headers=headers)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
            
        return response
        
    def test_user_registration_and_login(self) -> bool:
        """Test user registration and login to get auth token"""
        self.log("Testing user registration and login...")
        
        # Register user
        register_data = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "name": TEST_USER_NAME
        }
        
        response = self.make_request("POST", "/auth/register", register_data, auth_required=False)
        
        if response.status_code == 400:
            # User might already exist, try login
            self.log("User already exists, attempting login...")
            login_data = {
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            }
            response = self.make_request("POST", "/auth/login", login_data, auth_required=False)
            
        if response.status_code in [200, 201]:
            data = response.json()
            self.auth_token = data["token"]
            self.test_user_id = data["user"]["id"]
            self.log(f"✅ Authentication successful. User ID: {self.test_user_id}")
            return True
        else:
            self.log(f"❌ Authentication failed: {response.status_code} - {response.text}", "ERROR")
            return False
            
    def create_test_loop(self) -> Optional[str]:
        """Create a test loop for deletion testing"""
        self.log("Creating test loop...")
        
        loop_data = {
            "name": "Test Loop for Deletion",
            "description": "This loop will be used to test deletion functionality",
            "color": "#FFC93A",
            "reset_rule": "daily"
        }
        
        response = self.make_request("POST", "/loops", loop_data)
        
        if response.status_code in [200, 201]:
            data = response.json()
            loop_id = data["id"]
            self.test_loop_id = loop_id
            self.log(f"✅ Test loop created successfully. Loop ID: {loop_id}")
            return loop_id
        else:
            self.log(f"❌ Failed to create test loop: {response.status_code} - {response.text}", "ERROR")
            return None
            
    def test_soft_delete_loop(self, loop_id: str) -> bool:
        """Test soft deletion of a loop"""
        self.log(f"Testing soft delete for loop {loop_id}...")
        
        response = self.make_request("DELETE", f"/loops/{loop_id}")
        
        if response.status_code == 200:
            data = response.json()
            self.log(f"✅ Loop soft deleted successfully: {data.get('message', 'No message')}")
            return True
        else:
            self.log(f"❌ Soft delete failed: {response.status_code} - {response.text}", "ERROR")
            return False
            
    def test_get_deleted_loops(self) -> bool:
        """Test retrieving deleted loops with days remaining calculation"""
        self.log("Testing GET /api/loops/deleted endpoint...")
        
        response = self.make_request("GET", "/loops/deleted")
        
        if response.status_code == 200:
            data = response.json()
            self.log(f"✅ Retrieved {len(data)} deleted loops")
            
            # Verify structure and days_remaining calculation
            for loop in data:
                required_fields = ["id", "name", "color", "deleted_at", "days_remaining"]
                missing_fields = [field for field in required_fields if field not in loop]
                
                if missing_fields:
                    self.log(f"❌ Missing fields in deleted loop: {missing_fields}", "ERROR")
                    return False
                    
                # Verify days_remaining is reasonable (0-30)
                days_remaining = loop["days_remaining"]
                if not (0 <= days_remaining <= 30):
                    self.log(f"❌ Invalid days_remaining value: {days_remaining}", "ERROR")
                    return False
                    
                self.log(f"   Loop: {loop['name']} - Days remaining: {days_remaining}")
                
            return True
        else:
            self.log(f"❌ Failed to get deleted loops: {response.status_code} - {response.text}", "ERROR")
            return False
            
    def test_restore_loop(self, loop_id: str) -> bool:
        """Test restoring a soft-deleted loop"""
        self.log(f"Testing restore for loop {loop_id}...")
        
        response = self.make_request("POST", f"/loops/{loop_id}/restore")
        
        if response.status_code == 200:
            data = response.json()
            self.log(f"✅ Loop restored successfully: {data.get('message', 'No message')}")
            
            # Verify loop is back in regular loops list
            response = self.make_request("GET", "/loops")
            if response.status_code == 200:
                loops = response.json()
                restored_loop = next((loop for loop in loops if loop["id"] == loop_id), None)
                if restored_loop:
                    self.log("✅ Restored loop found in regular loops list")
                    return True
                else:
                    self.log("❌ Restored loop not found in regular loops list", "ERROR")
                    return False
            else:
                self.log("❌ Failed to verify restoration by checking loops list", "ERROR")
                return False
        else:
            self.log(f"❌ Restore failed: {response.status_code} - {response.text}", "ERROR")
            return False
            
    def test_permanent_delete_loop(self, loop_id: str) -> bool:
        """Test permanent deletion of a soft-deleted loop"""
        self.log(f"Testing permanent delete for loop {loop_id}...")
        
        response = self.make_request("DELETE", f"/loops/{loop_id}/permanent")
        
        if response.status_code == 200:
            data = response.json()
            self.log(f"✅ Loop permanently deleted: {data.get('message', 'No message')}")
            
            # Verify loop is no longer in deleted loops list
            response = self.make_request("GET", "/loops/deleted")
            if response.status_code == 200:
                deleted_loops = response.json()
                found_loop = next((loop for loop in deleted_loops if loop["id"] == loop_id), None)
                if not found_loop:
                    self.log("✅ Permanently deleted loop not found in deleted loops list")
                    return True
                else:
                    self.log("❌ Permanently deleted loop still found in deleted loops list", "ERROR")
                    return False
            else:
                self.log("❌ Failed to verify permanent deletion", "ERROR")
                return False
        else:
            self.log(f"❌ Permanent delete failed: {response.status_code} - {response.text}", "ERROR")
            return False
            
    def test_authentication_requirements(self) -> bool:
        """Test that all endpoints require authentication"""
        self.log("Testing authentication requirements...")
        
        # Save current token
        original_token = self.auth_token
        
        # Test without token
        self.auth_token = None
        
        endpoints_to_test = [
            ("GET", "/loops/deleted"),
            ("POST", f"/loops/{self.test_loop_id or 'dummy'}/restore"),
            ("DELETE", f"/loops/{self.test_loop_id or 'dummy'}/permanent"),
            ("DELETE", f"/loops/{self.test_loop_id or 'dummy'}")
        ]
        
        all_protected = True
        
        for method, endpoint in endpoints_to_test:
            response = self.make_request(method, endpoint, auth_required=False)
            if response.status_code not in [401, 403]:
                self.log(f"❌ Endpoint {method} {endpoint} not properly protected: {response.status_code}", "ERROR")
                all_protected = False
            else:
                self.log(f"✅ Endpoint {method} {endpoint} properly protected")
                
        # Restore token
        self.auth_token = original_token
        
        return all_protected
        
    def test_invalid_loop_ids(self) -> bool:
        """Test error handling for invalid loop IDs"""
        self.log("Testing error handling for invalid loop IDs...")
        
        invalid_ids = ["invalid-id", "000000000000000000000000", "nonexistent"]
        
        all_handled_correctly = True
        
        for invalid_id in invalid_ids:
            endpoints_to_test = [
                ("POST", f"/loops/{invalid_id}/restore"),
                ("DELETE", f"/loops/{invalid_id}/permanent"),
                ("DELETE", f"/loops/{invalid_id}")
            ]
            
            for method, endpoint in endpoints_to_test:
                response = self.make_request(method, endpoint)
                if response.status_code != 404:
                    self.log(f"❌ Invalid ID {invalid_id} not handled correctly for {method} {endpoint}: {response.status_code}", "ERROR")
                    all_handled_correctly = False
                else:
                    self.log(f"✅ Invalid ID {invalid_id} handled correctly for {method} {endpoint}")
                    
        return all_handled_correctly
        
    def test_restore_non_deleted_loop(self) -> bool:
        """Test attempting to restore a loop that isn't deleted"""
        self.log("Testing restore of non-deleted loop...")
        
        # Create a new loop that isn't deleted
        loop_id = self.create_test_loop()
        if not loop_id:
            return False
            
        response = self.make_request("POST", f"/loops/{loop_id}/restore")
        
        if response.status_code == 404:
            self.log("✅ Correctly rejected restore of non-deleted loop")
            return True
        else:
            self.log(f"❌ Should have rejected restore of non-deleted loop: {response.status_code}", "ERROR")
            return False
            
    def test_permanent_delete_non_deleted_loop(self) -> bool:
        """Test attempting to permanently delete a loop that isn't soft-deleted"""
        self.log("Testing permanent delete of non-deleted loop...")
        
        # Use the loop we just created
        if not self.test_loop_id:
            return False
            
        response = self.make_request("DELETE", f"/loops/{self.test_loop_id}/permanent")
        
        if response.status_code == 404:
            self.log("✅ Correctly rejected permanent delete of non-deleted loop")
            return True
        else:
            self.log(f"❌ Should have rejected permanent delete of non-deleted loop: {response.status_code}", "ERROR")
            return False
            
    def run_comprehensive_test(self) -> Dict[str, bool]:
        """Run all deleted loops functionality tests"""
        self.log("=" * 60)
        self.log("STARTING COMPREHENSIVE DELETED LOOPS BACKEND TESTING")
        self.log("=" * 60)
        
        results = {}
        
        # 1. Authentication
        results["authentication"] = self.test_user_registration_and_login()
        if not results["authentication"]:
            self.log("❌ Cannot proceed without authentication", "ERROR")
            return results
            
        # 2. Create test loop
        test_loop_created = self.create_test_loop() is not None
        if not test_loop_created:
            self.log("❌ Cannot proceed without test loop", "ERROR")
            return results
            
        # 3. Test authentication requirements
        results["auth_requirements"] = self.test_authentication_requirements()
        
        # 4. Test invalid loop ID handling
        results["invalid_ids"] = self.test_invalid_loop_ids()
        
        # 5. Test restore/permanent delete of non-deleted loops
        results["restore_non_deleted"] = self.test_restore_non_deleted_loop()
        results["permanent_delete_non_deleted"] = self.test_permanent_delete_non_deleted_loop()
        
        # 6. Test soft delete
        results["soft_delete"] = self.test_soft_delete_loop(self.test_loop_id)
        
        # 7. Test get deleted loops
        results["get_deleted_loops"] = self.test_get_deleted_loops()
        
        # 8. Test restore functionality
        results["restore_loop"] = self.test_restore_loop(self.test_loop_id)
        
        # 9. Soft delete again for permanent delete test
        if results["restore_loop"]:
            self.test_soft_delete_loop(self.test_loop_id)
            
        # 10. Test permanent delete
        results["permanent_delete"] = self.test_permanent_delete_loop(self.test_loop_id)
        
        # Summary
        self.log("=" * 60)
        self.log("TEST RESULTS SUMMARY")
        self.log("=" * 60)
        
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{test_name}: {status}")
            
        self.log(f"\nOverall: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            self.log("🎉 ALL DELETED LOOPS TESTS PASSED!")
        else:
            self.log("⚠️  Some tests failed - see details above")
            
        return results

def main():
    """Main test execution"""
    tester = DoloopAPITester()
    results = tester.run_comprehensive_test()
    
    # Return exit code based on results
    all_passed = all(results.values())
    return 0 if all_passed else 1

if __name__ == "__main__":
    exit(main())