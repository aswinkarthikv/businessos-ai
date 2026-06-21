import random
import hashlib
from datetime import datetime, timedelta
from models import db, Product, Supplier, ProcurementOrder, ProcurementItem, Customer, SalesOrder, SalesItem, Expense, User

def hash_password(password):
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def init_db(app):
    db.init_app(app)
    with app.app_context():
        db.create_all()
        seed_data()

def seed_data():
    # Check if data already exists
    if Product.query.first() is not None:
        print("Database already seeded.")
        # If users are missing, seed them
        if User.query.first() is None:
            print("Seeding default users to existing database...")
            try:
                sup = Supplier.query.filter(Supplier.name.like("%Global Tech%")).first()
                cust1 = Customer.query.filter_by(email="aswin@example.com").first()
                cust2 = Customer.query.filter_by(email="bruce@wayne.corp").first()
                
                users = [
                    User(name="Aswin Admin", email="admin@aierp.com", password_hash=hash_password("admin123"), role="admin"),
                    User(name="Global Tech Supplier", email="global@aierp.com", password_hash=hash_password("vendor123"), role="vendor", supplier_id=sup.id if sup else None),
                    User(name="Aswin Kumar", email="aswin@example.com", password_hash=hash_password("aswin123"), role="buyer", customer_id=cust1.id if cust1 else None),
                    User(name="Bruce Wayne", email="bruce@wayne.corp", password_hash=hash_password("bruce123"), role="buyer", customer_id=cust2.id if cust2 else None)
                ]
                for u in users:
                    db.session.add(u)
                db.session.commit()
                print("Seeded default users successfully.")
            except Exception as e:
                db.session.rollback()
                print(f"Error seeding default users: {e}")
        return

    print("Seeding database with realistic 6-month historical data...")

    # 1. Seed Suppliers
    suppliers = [
        Supplier(name="Global Tech Distributors", email="orders@globaltech.com", phone="+1-555-0199", address="100 Logistics Blvd, Tech City"),
        Supplier(name="Apex Office Furnishings", email="sales@apexoffice.com", phone="+1-555-0244", address="45 Commerce Ave, Industrial Park"),
        Supplier(name="Prime Supply Corp", email="support@primesupply.com", phone="+1-555-0388", address="78 Warehouse Rd, Distribution Center")
    ]
    for s in suppliers:
        db.session.add(s)
    db.session.commit() # Need IDs for reference

    # 2. Seed Products
    products = [
        # Electronics (Supplier: Global Tech)
        Product(name="LED Monitor 24\"", sku="ELEC-MON-24", category="Electronics", stock_quantity=15, reorder_level=5, buy_price=110.0, sell_price=189.99),
        Product(name="Mechanical Keyboard", sku="ELEC-KEY-MECH", category="Electronics", stock_quantity=4, reorder_level=8, buy_price=45.0, sell_price=79.99), # Low Stock
        Product(name="Wireless Mouse", sku="ELEC-MOU-WIRE", category="Electronics", stock_quantity=25, reorder_level=10, buy_price=15.0, sell_price=29.99),
        Product(name="USB-C Hub 7-in-1", sku="ELEC-HUB-USBC", category="Electronics", stock_quantity=3, reorder_level=6, buy_price=20.0, sell_price=39.99), # Low Stock
        Product(name="Smart Router Wi-Fi 6", sku="ELEC-ROU-WIFI", category="Electronics", stock_quantity=12, reorder_level=4, buy_price=60.0, sell_price=99.99),

        # Office Supplies (Supplier: Apex Office Furnishings)
        Product(name="Ergonomic Office Chair", sku="OFF-CHR-ERGO", category="Office Supplies", stock_quantity=8, reorder_level=3, buy_price=120.0, sell_price=249.99),
        Product(name="Standing Desk (Electric)", sku="OFF-DSK-STAN", category="Office Supplies", stock_quantity=2, reorder_level=2, buy_price=250.0, sell_price=499.99),
        Product(name="A4 Paper Box (5 Reams)", sku="OFF-PAP-A4", category="Office Supplies", stock_quantity=30, reorder_level=10, buy_price=12.0, sell_price=24.99),

        # Accessories (Supplier: Prime Supply Corp)
        Product(name="Laptop Sleeve 15\"", sku="ACC-SLV-15", category="Accessories", stock_quantity=18, reorder_level=5, buy_price=10.0, sell_price=19.99),
        Product(name="Adjustable Phone Stand", sku="ACC-PHN-STND", category="Accessories", stock_quantity=2, reorder_level=5, buy_price=5.0, sell_price=12.99), # Low Stock
        Product(name="Noise Cancelling Headset", sku="ACC-HDS-NOISE", category="Accessories", stock_quantity=7, reorder_level=3, buy_price=40.0, sell_price=79.99)
    ]
    for p in products:
        db.session.add(p)
    db.session.commit()

    # Get created entities from DB
    db_products = Product.query.all()
    db_suppliers = Supplier.query.all()

    # 3. Seed Customers
    # We will seed 15 customers with distinct shopping habits to simulate ML Churn Prediction
    customer_data = [
        # Regular active customers (High frequency, recent purchases)
        ("Aswin Kumar", "aswin@example.com", "+1-555-1111", 150), 
        ("Sophia Vance", "sophia.v@example.com", "+1-555-2222", 120),
        ("Liam Neeson", "liam@example.com", "+1-555-3333", 100),
        ("Emma Watson", "emma@example.com", "+1-555-4444", 90),
        ("Oliver Queen", "oliver@example.com", "+1-555-5555", 80),

        # Inactive/At-Risk customers (Bought long ago, haven't bought since, high value but high churn risk)
        ("Bruce Wayne", "bruce@wayne.corp", "+1-555-9999", 180), # 180 days ago
        ("Clark Kent", "clark@dailyplanet.com", "+1-555-8888", 150),
        ("Selina Kyle", "selina@cats.com", "+1-555-7777", 140),

        # Occasional/Mid-level customers
        ("Barry Allen", "barry@star.labs", "+1-555-6666", 60),
        ("Diana Prince", "diana@themyscira.gov", "+1-555-1212", 45),
        ("Arthur Curry", "arthur@atlantis.org", "+1-555-2323", 30),
        ("Hal Jordan", "hal@greenlantern.org", "+1-555-3434", 10),
        
        # New customers (joined recently, 1-2 purchases)
        ("Peter Parker", "peter@dailybugle.com", "+1-555-4545", 5),
        ("Tony Stark", "tony@stark.industries", "+1-555-5656", 2),
        ("Wanda Maximoff", "wanda@westview.io", "+1-555-6767", 1)
    ]

    customers = []
    for name, email, phone, days_ago in customer_data:
        join_date = datetime.utcnow() - timedelta(days=days_ago + random.randint(10, 30))
        c = Customer(name=name, email=email, phone=phone, joining_date=join_date)
        db.session.add(c)
        customers.append((c, days_ago))
    db.session.commit()

    # 4. Seed Sales Orders & Sales Items over the last 6 months
    # We want a clean time-series trend of sales for the forecaster
    # Let's say monthly average sales increases slightly over the 6 months
    # E.g. Month -6 (oldest) has lower sales, Month -1 has higher sales.
    current_time = datetime.utcnow()
    
    # Target monthly revenue targets to make a nice upward trend:
    # Month 6 ago: ~$2,500
    # Month 5 ago: ~$2,800
    # Month 4 ago: ~$3,200
    # Month 3 ago: ~$3,000 (slight dip)
    # Month 2 ago: ~$3,800
    # Month 1 ago (last month): ~$4,500
    # Month 0 (current month so far): ~$2,000
    
    monthly_sales_volumes = [
        (6, 2500),
        (5, 2800),
        (4, 3200),
        (3, 3000),
        (2, 3800),
        (1, 4500),
        (0, 2000)
    ]

    for month_offset, target_rev in monthly_sales_volumes:
        accumulated_rev = 0
        while accumulated_rev < target_rev:
            # Pick a customer based on their membership days_ago
            # Active customers buy in recent months. Churned customers bought in months 6 to 3.
            eligible_customers = []
            for cust, days_ago in customers:
                # If it's a churned customer (Bruce, Clark, Selina), they only buy in months 6, 5, 4, 3
                if cust.name in ["Bruce Wayne", "Clark Kent", "Selina Kyle"]:
                    if month_offset >= 3:
                        eligible_customers.append(cust)
                # If it's a new customer, they only buy in months 1, 0
                elif cust.name in ["Peter Parker", "Tony Stark", "Wanda Maximoff"]:
                    if month_offset <= 1:
                        eligible_customers.append(cust)
                # Regulars buy anytime
                else:
                    eligible_customers.append(cust)
            
            if not eligible_customers:
                eligible_customers = [c[0] for c in customers]

            cust = random.choice(eligible_customers)
            
            # Form order date
            # Ensure it falls within the specific month offset
            days_skew = month_offset * 30 + random.randint(1, 28)
            order_date = current_time - timedelta(days=days_skew)

            # Create Sales Order
            order = SalesOrder(customer=cust, order_date=order_date, status="Delivered", total_amount=0)
            db.session.add(order)
            db.session.commit()

            # Add 1 to 3 items
            num_items = random.randint(1, 3)
            selected_products = random.sample(db_products, num_items)
            order_total = 0
            
            for prod in selected_products:
                qty = random.randint(1, 4)
                price = prod.sell_price
                subtotal = qty * price
                order_total += subtotal
                
                sales_item = SalesItem(order=order, product=prod, quantity=qty, unit_price=price)
                db.session.add(sales_item)
            
            order.total_amount = order_total
            db.session.commit()
            
            accumulated_rev += order_total

    # 5. Seed Procurement Orders (SAP ERP Module)
    # Historic procurement
    proc_dates = [150, 120, 90, 60, 30, 10]
    for p_days in proc_dates:
        order_date = current_time - timedelta(days=p_days)
        supplier = random.choice(db_suppliers)
        po = ProcurementOrder(supplier=supplier, order_date=order_date, status="Received", total_cost=0)
        db.session.add(po)
        db.session.commit()

        num_items = random.randint(1, 3)
        selected_products = random.sample(db_products, num_items)
        total_cost = 0
        for prod in selected_products:
            qty = random.randint(10, 20)
            cost = prod.buy_price
            total_cost += qty * cost
            po_item = ProcurementItem(order=po, product=prod, quantity=qty, unit_price=cost)
            db.session.add(po_item)
        
        po.total_cost = total_cost
        db.session.commit()

    # Active/Draft procurement order to showcase ongoing work
    po_draft = ProcurementOrder(supplier=db_suppliers[0], order_date=current_time - timedelta(days=1), status="Ordered", total_cost=15 * db_products[1].buy_price)
    db.session.add(po_draft)
    db.session.commit()
    po_item_draft = ProcurementItem(order=po_draft, product=db_products[1], quantity=15, unit_price=db_products[1].buy_price)
    db.session.add(po_item_draft)
    db.session.commit()

    # 6. Seed Expenses
    # Categorized expenses for last 6 months (utilities, salaries, marketing, rent)
    expense_cats = [
        ("Rent", 1000.0, "Monthly Warehouse Rent"),
        ("Salaries", 1500.0, "Employee payroll"),
        ("Utilities", 250.0, "Electricity, Water and Internet"),
        ("Marketing", 300.0, "Social media ads and flyers")
    ]

    for m in range(7): # 0 to 6 months ago
        base_date = current_time - timedelta(days=m * 30 + 15)
        for cat, amt, desc in expense_cats:
            # Add some randomness to utilities & marketing
            final_amt = amt
            if cat in ["Utilities", "Marketing"]:
                final_amt += random.uniform(-50.0, 100.0)
            
            exp = Expense(category=cat, amount=final_amt, date=base_date, description=desc)
            db.session.add(exp)
            
    db.session.commit()

    # 7. Seed Default User Accounts
    users = [
        User(name="Aswin Admin", email="admin@aierp.com", password_hash=hash_password("admin123"), role="admin"),
        User(name="Global Tech Supplier", email="global@aierp.com", password_hash=hash_password("vendor123"), role="vendor", supplier_id=db_suppliers[0].id),
        User(name="Aswin Kumar", email="aswin@example.com", password_hash=hash_password("aswin123"), role="buyer", customer_id=Customer.query.filter_by(email="aswin@example.com").first().id),
        User(name="Bruce Wayne", email="bruce@wayne.corp", password_hash=hash_password("bruce123"), role="buyer", customer_id=Customer.query.filter_by(email="bruce@wayne.corp").first().id)
    ]
    for u in users:
        db.session.add(u)
    db.session.commit()

    print("Database seeding completed successfully!")
