import os
import json
import math
from datetime import datetime
from models import db, Customer, SalesOrder, Product

WEIGHTS_FILE = os.path.join(os.path.dirname(__file__), 'ml_weights.json')

# --- PURE PYTHON LOGISTIC REGRESSION ---
class PureLogisticRegression:
    def __init__(self, lr=0.05, epochs=300):
        self.lr = lr
        self.epochs = epochs
        self.weights = []
        self.bias = 0.0
        self.max_vals = []

    def _sigmoid(self, z):
        z = max(-50.0, min(50.0, z))  # Prevent overflow
        return 1.0 / (1.0 + math.exp(-z))

    def fit(self, X, y):
        n_samples = len(X)
        if n_samples == 0:
            return
        n_features = len(X[0])
        
        # Initialize weights and bias
        self.weights = [0.0] * n_features
        self.bias = 0.0
        
        # Scale features: Division by maximum absolute value to keep inputs in [-1, 1]
        self.max_vals = []
        for j in range(n_features):
            col_max = max(1e-5, max(abs(row[j]) for row in X))
            self.max_vals.append(col_max)
            
        scaled_X = [[row[j] / self.max_vals[j] for j in range(n_features)] for row in X]
        
        # Stochastic Gradient Descent
        for _ in range(self.epochs):
            for i in range(n_samples):
                z = sum(scaled_X[i][j] * self.weights[j] for j in range(n_features)) + self.bias
                pred = self._sigmoid(z)
                err = pred - y[i]
                
                # Update weights
                for j in range(n_features):
                    self.weights[j] -= self.lr * err * scaled_X[i][j]
                self.bias -= self.lr * err

    def predict_proba(self, X_row):
        if not self.weights or not self.max_vals:
            return 0.5
        scaled_row = [X_row[j] / self.max_vals[j] for j in range(len(X_row))]
        z = sum(scaled_row[j] * self.weights[j] for j in range(len(self.weights))) + self.bias
        return self._sigmoid(z)

# --- PURE PYTHON LINEAR REGRESSION ---
class PureLinearRegression:
    def __init__(self):
        self.slope = 0.0
        self.intercept = 0.0

    def fit(self, X, y):
        # X: list of lists [[x1], [x2]], y: list of floats
        n = len(X)
        if n < 2:
            self.slope = 0.0
            self.intercept = sum(y) / max(1, n)
            return
        
        xs = [row[0] for row in X]
        mean_x = sum(xs) / n
        mean_y = sum(y) / n
        
        num = sum((xs[i] - mean_x) * (y[i] - mean_y) for i in range(n))
        den = sum((xs[i] - mean_x) ** 2 for i in range(n))
        
        if den == 0:
            self.slope = 0.0
            self.intercept = mean_y
        else:
            self.slope = num / den
            self.intercept = mean_y - self.slope * mean_x

    def predict(self, x_val):
        return self.slope * x_val + self.intercept


# --- CORE TRAINING & PREDICTION HANDLERS ---

def train_churn_model():
    """
    Extracts customer shopping profiles from the DB and trains our pure Logistic Regression classifier.
    """
    customers = Customer.query.all()
    if not customers or len(customers) < 5:
        print("Not enough customers to train churn model.")
        return False

    current_time = datetime.utcnow()
    features = []
    labels = []

    for cust in customers:
        orders = SalesOrder.query.filter_by(customer_id=cust.id).all()
        num_orders = len(orders)
        total_spent = sum(o.total_amount for o in orders)
        
        if num_orders > 0:
            last_order_date = max(o.order_date for o in orders)
            recency_days = (current_time - last_order_date).days
            avg_order_value = total_spent / num_orders
        else:
            recency_days = (current_time - cust.joining_date).days
            avg_order_value = 0.0

        # Churn definition: Recency > 90 days
        is_churned = 1 if recency_days > 90 else 0

        features.append([num_orders, total_spent, recency_days, avg_order_value])
        labels.append(is_churned)

    # Fit Logistic Regression model
    lr_model = PureLogisticRegression()
    lr_model.fit(features, labels)

    # Save model weights to JSON
    save_model_data('churn_model', {
        'weights': lr_model.weights,
        'bias': lr_model.bias,
        'max_vals': lr_model.max_vals
    })
    return True

def predict_customer_churn(customer_id):
    """
    Predicts the churn probability for a given customer.
    """
    model_data = load_model_data('churn_model')
    if not model_data:
        train_churn_model()
        model_data = load_model_data('churn_model')
        if not model_data:
            return 0.5  # Fallback

    lr_model = PureLogisticRegression()
    lr_model.weights = model_data.get('weights', [])
    lr_model.bias = model_data.get('bias', 0.0)
    lr_model.max_vals = model_data.get('max_vals', [])

    cust = Customer.query.get(customer_id)
    if not cust:
        return 0.0

    current_time = datetime.utcnow()
    orders = SalesOrder.query.filter_by(customer_id=cust.id).all()
    num_orders = len(orders)
    total_spent = sum(o.total_amount for o in orders)
    
    if num_orders > 0:
        last_order_date = max(o.order_date for o in orders)
        recency_days = (current_time - last_order_date).days
        avg_order_value = total_spent / num_orders
    else:
        recency_days = (current_time - cust.joining_date).days
        avg_order_value = 0.0

    X_row = [num_orders, total_spent, recency_days, avg_order_value]
    return lr_model.predict_proba(X_row)

def train_forecast_model():
    """
    Aggregates orders by month and fits our pure Linear Regression model.
    """
    orders = SalesOrder.query.all()
    if not orders:
        print("No sales orders available for forecasting.")
        return False

    # Extract dates and amounts and group by month in pure Python
    monthly_sales_dict = {}
    for o in orders:
        month_str = o.order_date.strftime("%Y-%m")
        monthly_sales_dict[month_str] = monthly_sales_dict.get(month_str, 0.0) + o.total_amount

    # Sort months chronologically
    sorted_months = sorted(monthly_sales_dict.keys())
    
    if len(sorted_months) < 3:
        print("Not enough months to train linear forecast model (minimum 3 required).")
        return False

    X = [[i] for i in range(len(sorted_months))]
    y = [monthly_sales_dict[m] for m in sorted_months]

    # Fit model
    lin_model = PureLinearRegression()
    lin_model.fit(X, y)

    # Save to JSON
    save_model_data('forecast_model', {
        'slope': lin_model.slope,
        'intercept': lin_model.intercept,
        'num_months': len(sorted_months),
        'months': sorted_months,
        'sales': y
    })
    return True

def forecast_next_month_sales():
    """
    Forecasts next month's total revenue.
    """
    model_data = load_model_data('forecast_model')
    if not model_data:
        train_forecast_model()
        model_data = load_model_data('forecast_model')
        if not model_data:
            # Fallback estimation based on average sales
            orders = SalesOrder.query.all()
            if not orders:
                return 0.0
            total_sales = sum(o.total_amount for o in orders)
            return float(total_sales / max(1, len(orders)) * 30)

    lin_model = PureLinearRegression()
    lin_model.slope = model_data.get('slope', 0.0)
    lin_model.intercept = model_data.get('intercept', 0.0)
    num_months = model_data.get('num_months', 0)

    # Next month index
    next_month_index = num_months
    predicted = lin_model.predict(next_month_index)
    return max(0.0, float(predicted))

def get_forecast_chart_data():
    """
    Returns historical monthly sales and next month's prediction.
    """
    model_data = load_model_data('forecast_model')
    if not model_data:
        train_forecast_model()
        model_data = load_model_data('forecast_model')
        
    if not model_data:
        # Generate raw empty dictionary if no data
        return {'history': [], 'forecast': {'month': 'Next Month', 'sales': 0.0}}

    months = model_data.get('months', [])
    sales = model_data.get('sales', [])
    
    history = []
    for m, s in zip(months, sales):
        history.append({
            'month': m,
            'sales': float(s)
        })
        
    forecast_val = forecast_next_month_sales()
    
    # Calculate next month label
    if months:
        try:
            last_m_str = months[-1]
            dt = datetime.strptime(last_m_str, "%Y-%m")
            # add ~32 days to roll over month
            next_dt = dt + timedelta(days=32)
            next_month_name = next_dt.strftime("%Y-%m")
        except Exception:
            next_month_name = "Next Month"
    else:
        next_month_name = "Next Month"
        
    return {
        'history': history,
        'forecast': {
            'month': next_month_name,
            'sales': forecast_val
        }
    }

# --- JSON PERSISTENCE HELPERS ---

def save_model_data(model_name, data):
    """
    Saves weights dictionary to JSON file.
    """
    all_data = {}
    if os.path.exists(WEIGHTS_FILE):
        try:
            with open(WEIGHTS_FILE, 'r') as f:
                all_data = json.load(f)
        except Exception:
            pass
            
    all_data[model_name] = data
    
    try:
        with open(WEIGHTS_FILE, 'w') as f:
            json.dump(all_data, f, indent=4)
    except Exception as e:
        print(f"Error saving ML weights to file: {e}")

def load_model_data(model_name):
    """
    Loads weights dictionary from JSON file.
    """
    if not os.path.exists(WEIGHTS_FILE):
        return None
    try:
        with open(WEIGHTS_FILE, 'r') as f:
            all_data = json.load(f)
            return all_data.get(model_name)
    except Exception:
        return None
