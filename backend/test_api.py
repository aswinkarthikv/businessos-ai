import unittest
import os
import json

# Set test database env var BEFORE importing app to prevent dropping live DB tables
os.environ['DATABASE_URL'] = 'sqlite:///aierp_test.db'

from app import app, db
from models import Product, Supplier, Customer, SalesOrder, Expense, User
from ml_models import predict_customer_churn, forecast_next_month_sales

class TestAIERPBackend(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///aierp_test.db'
        self.client = app.test_client()
        
        with app.app_context():
            db.create_all()
            from database import seed_data
            seed_data()

    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()
            db.engine.dispose()
        # Clean up database files safely
        for path in ['instance/aierp_test.db', 'aierp_test.db']:
            if os.path.exists(path):
                try:
                    os.remove(path)
                except Exception as e:
                    print(f"Warning: could not delete {path}: {e}")

    def test_database_seeding(self):
        """Verify database tables contain the seeded data."""
        with app.app_context():
            products = Product.query.all()
            suppliers = Supplier.query.all()
            customers = Customer.query.all()
            sales_orders = SalesOrder.query.all()
            expenses = Expense.query.all()
            
            self.assertGreater(len(products), 0, "Products table should be seeded.")
            self.assertGreater(len(suppliers), 0, "Suppliers table should be seeded.")
            self.assertGreater(len(customers), 0, "Customers table should be seeded.")
            self.assertGreater(len(sales_orders), 0, "Sales orders table should be seeded.")
            self.assertGreater(len(expenses), 0, "Expenses table should be seeded.")
            print(f"[OK] DB Seeding OK: {len(products)} products, {len(customers)} customers, {len(sales_orders)} sales orders.")

    def test_ml_algorithms(self):
        """Verify mathematical predictions run and return valid bounds."""
        with app.app_context():
            c1 = Customer.query.first()
            self.assertIsNotNone(c1)
            churn_prob = predict_customer_churn(c1.id)
            self.assertTrue(0.0 <= churn_prob <= 1.0, "Churn probability must be between 0 and 1.")
            
            forecast = forecast_next_month_sales()
            self.assertGreaterEqual(forecast, 0.0, "Forecasted sales must be non-negative.")
            print(f"[OK] ML Engine OK: Churn prob = {churn_prob:.2f}, Sales forecast = Rs. {forecast:.2f}")

    def test_dashboard_endpoint(self):
        """Verify dashboard endpoint returns the correct payload structure."""
        res = self.client.get('/api/dashboard')
        self.assertEqual(res.status_code, 200)
        
        data = json.loads(res.data)
        self.assertIn('kpis', data)
        self.assertIn('sales_forecast', data)
        self.assertIn('top_products', data)
        self.assertIn('ai_suggestions', data)
        
        kpis = data['kpis']
        self.assertIn('total_revenue', kpis)
        self.assertIn('total_expenses', kpis)
        self.assertIn('net_profit', kpis)
        self.assertIn('low_stock_count', kpis)
        print("[OK] REST Dashboard Endpoint OK.")

    def test_products_crud_endpoint(self):
        """Verify products CRUD listing endpoint works."""
        res = self.client.get('/api/products')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertGreater(len(data), 0)
        print("[OK] REST Product CRUD Endpoint OK.")

    def test_report_downloads(self):
        """Verify ReportLab PDF generation handles and returns PDF headers."""
        res = self.client.get('/api/reports/download/sales')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.mimetype, 'application/pdf')
        self.assertTrue(len(res.data) > 0, "PDF content must be generated.")
        print("[OK] ReportLab PDF Generator Endpoint OK.")

    def test_user_login(self):
        """Verify that user login works with correct credentials and fails with incorrect ones."""
        # Test valid login (seeded user)
        res = self.client.post('/api/auth/login', json={
            'email': 'admin@aierp.com',
            'password': 'admin123'
        })
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertEqual(data['email'], 'admin@aierp.com')
        self.assertEqual(data['role'], 'admin')
        
        # Test invalid login
        res = self.client.post('/api/auth/login', json={
            'email': 'admin@aierp.com',
            'password': 'wrongpassword'
        })
        self.assertEqual(res.status_code, 401)
        print("[OK] User Login tests passed.")

    def test_user_registration(self):
        """Verify that role-based user registration works and creates profiles."""
        # Register a vendor
        res = self.client.post('/api/auth/register', json={
            'name': 'New Vendor Partner',
            'email': 'newvendor@example.com',
            'password': 'newpassword123',
            'role': 'vendor',
            'phone': '1234567890',
            'address': '123 Vendor Lane'
        })
        self.assertEqual(res.status_code, 201)
        data = json.loads(res.data)
        self.assertEqual(data['role'], 'vendor')
        self.assertIsNotNone(data['supplier_id'])
        
        # Register a buyer
        res = self.client.post('/api/auth/register', json={
            'name': 'New Buyer Customer',
            'email': 'newbuyer@example.com',
            'password': 'buyerpassword123',
            'role': 'buyer',
            'phone': '9876543210'
        })
        self.assertEqual(res.status_code, 201)
        data = json.loads(res.data)
        self.assertEqual(data['role'], 'buyer')
        self.assertIsNotNone(data['customer_id'])
        print("[OK] User Registration tests passed.")

    def test_admin_user_crud(self):
        """Verify that user list, creation, and deletion work."""
        # List users
        res = self.client.get('/api/users')
        self.assertEqual(res.status_code, 200)
        users = json.loads(res.data)
        self.assertGreaterEqual(len(users), 4) # at least the 4 seeded users
        
        # Create a new user through admin route
        res = self.client.post('/api/users', json={
            'name': 'Admin Created User',
            'email': 'admincreated@example.com',
            'password': 'password123',
            'role': 'buyer',
            'customer_id': 'new' # Test auto-creating customer
        })
        self.assertEqual(res.status_code, 201)
        new_user = json.loads(res.data)
        user_id = new_user['id']
        self.assertIsNotNone(new_user['customer_id'])
        
        # Delete user
        res = self.client.delete(f'/api/users/{user_id}')
        self.assertEqual(res.status_code, 200)
        print("[OK] Admin User CRUD tests passed.")

    def test_executive_report(self):
        """Verify the executive report endpoint returns a valid PDF."""
        res = self.client.get('/api/reports/download/executive')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.mimetype, 'application/pdf')
        self.assertTrue(len(res.data) > 0)
        print("[OK] Executive Summary PDF Report test passed.")

    def test_approve_suggested_procurement(self):
        """Verify that approving a suggested restocking order creates a Purchase Order."""
        res = self.client.post('/api/procurement/approve-suggested', json={
            'product_id': 1,
            'quantity': 25
        })
        self.assertEqual(res.status_code, 201)
        data = json.loads(res.data)
        self.assertEqual(data['status'], 'Ordered')
        print("[OK] Smart Restocking Suggestion Approval test passed.")

if __name__ == '__main__':
    unittest.main()
