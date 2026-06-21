// Client-side Mock API Interceptor for GitHub Pages Demonstration
// Intercepts global window.fetch and simulates all Flask REST API routes using localStorage

export function setupMockApi() {
  console.log("BusinessOS AI™: GitHub Pages environment detected. Enabling Client-side Mock API engine...");

  // Initialize mock database in localStorage if empty
  if (!localStorage.getItem('mock_db_initialized')) {
    const defaultProducts = [
      { id: 1, name: "Mechanical Keyboard", sku: "ELEC-KEY-MECH", category: "Electronics", stock_quantity: 4, reorder_level: 8, buy_price: 45, sell_price: 89 },
      { id: 2, name: "USB-C Hub 7-in-1", sku: "ELEC-USB-HUB", category: "Electronics", stock_quantity: 3, reorder_level: 6, buy_price: 12, sell_price: 25 },
      { id: 3, name: "Wireless Mouse", sku: "ELEC-MOUSE-WIRELESS", category: "Electronics", stock_quantity: 12, reorder_level: 10, buy_price: 8, sell_price: 18 },
      { id: 4, name: "Ergonomic Office Chair", sku: "FURN-CHAIR-ERGO", category: "Furniture", stock_quantity: 5, reorder_level: 4, buy_price: 80, sell_price: 180 },
      { id: 5, name: "Standing Desk (Electric)", sku: "FURN-DESK-STAND", category: "Furniture", stock_quantity: 8, reorder_level: 5, buy_price: 150, sell_price: 320 },
      { id: 6, name: "Adjustable Phone Stand", sku: "ACC-STAND-PHONE", category: "Accessories", stock_quantity: 22, reorder_level: 15, buy_price: 3, sell_price: 12 }
    ];

    const defaultSuppliers = [
      { id: 1, name: "Global Tech Supplier", email: "global@aierp.com", phone: "+91 98765 43210", address: "Tech Logistics Park, Bangalore" },
      { id: 2, name: "Apex Furniture Co", email: "apex@furniture.com", phone: "+91 87654 32109", address: "Industrial Zone, Chennai" }
    ];

    const defaultCustomers = [
      { id: 1, name: "Aswin Kumar", email: "aswin@example.com", phone: "+91 99999 88888", segment: "Loyal", total_spent: 12500, orders_count: 5 },
      { id: 2, name: "Bruce Wayne", email: "bruce@wayne.corp", phone: "+1 555 Gotham", segment: "At Risk", total_spent: 45000, orders_count: 8 },
      { id: 3, name: "Clark Kent", email: "clark@kent.news", phone: "+1 555 Metropolis", segment: "At Risk", total_spent: 320, orders_count: 1 },
      { id: 4, name: "Sophia Vance", email: "sophia@example.com", phone: "+91 77777 66666", segment: "Loyal", total_spent: 8900, orders_count: 3 }
    ];

    const defaultProcurement = [
      { id: 101, product_name: "Mechanical Keyboard", sku: "ELEC-KEY-MECH", supplier_name: "Global Tech Supplier", quantity: 20, total_cost: 900, status: "Received", order_date: "2026-06-15" },
      { id: 102, product_name: "USB-C Hub 7-in-1", sku: "ELEC-USB-HUB", supplier_name: "Global Tech Supplier", quantity: 50, total_cost: 600, status: "Ordered", order_date: "2026-06-20" }
    ];

    const defaultUsers = [
      { id: 1, name: "Aswin Admin", email: "admin@aierp.com", role: "admin" },
      { id: 2, name: "Global Tech Supplier", email: "global@aierp.com", role: "vendor", supplier_id: 1 },
      { id: 3, name: "Aswin Kumar", email: "aswin@example.com", role: "buyer", customer_id: 1 }
    ];

    localStorage.setItem('mock_products', JSON.stringify(defaultProducts));
    localStorage.setItem('mock_suppliers', JSON.stringify(defaultSuppliers));
    localStorage.setItem('mock_customers', JSON.stringify(defaultCustomers));
    localStorage.setItem('mock_procurement', JSON.stringify(defaultProcurement));
    localStorage.setItem('mock_users', JSON.stringify(defaultUsers));
    localStorage.setItem('mock_db_initialized', 'true');
  }

  // Backup native fetch
  const nativeFetch = window.fetch;

  // Intercept fetch
  window.fetch = async function (url, options) {
    const urlStr = url.toString();
    
    // Only intercept /api routes
    if (!urlStr.includes('/api/')) {
      return nativeFetch(url, options);
    }

    const method = (options && options.method || 'GET').toUpperCase();
    const payload = options && options.body ? JSON.parse(options.body) : null;

    // Helper to generate fetch-like response
    const jsonResponse = (data, status = 200) => {
      return new Response(JSON.stringify(data), {
        status: status,
        headers: { 'Content-Type': 'application/json' }
      });
    };

    console.log(`[MOCK API] ${method} ${urlStr}`, payload);

    // --- ROUTING IMPLEMENTATION ---

    // 1. Authentication Login
    if (urlStr.endsWith('/api/auth/login') && method === 'POST') {
      const users = JSON.parse(localStorage.getItem('mock_users'));
      const found = users.find(u => u.email.toLowerCase() === payload.email.toLowerCase());
      if (found && payload.password === 'admin123') {
        return jsonResponse(found);
      } else if (found && payload.password === 'vendor123' && found.role === 'vendor') {
        return jsonResponse(found);
      } else if (found && found.role === 'buyer') {
        // any password works for buyers for easy demo testing
        return jsonResponse(found);
      }
      return jsonResponse({ error: 'Invalid email/username or password' }, 401);
    }

    // 2. Authentication Register
    if (urlStr.endsWith('/api/auth/register') && method === 'POST') {
      const users = JSON.parse(localStorage.getItem('mock_users'));
      const exists = users.find(u => u.email.toLowerCase() === payload.email.toLowerCase());
      if (exists) {
        return jsonResponse({ error: 'A user with this email already exists' }, 400);
      }
      const newUser = {
        id: users.length + 1,
        name: payload.name,
        email: payload.email,
        role: payload.role
      };
      
      if (payload.role === 'vendor') {
        newUser.supplier_id = 1;
      } else if (payload.role === 'buyer') {
        newUser.customer_id = 1;
      }
      users.push(newUser);
      localStorage.setItem('mock_users', JSON.stringify(users));
      return jsonResponse(newUser, 201);
    }

    // 3. User accounts list & add (Admin Console)
    if (urlStr.endsWith('/api/users')) {
      if (method === 'GET') {
        return jsonResponse(JSON.parse(localStorage.getItem('mock_users')));
      }
      if (method === 'POST') {
        const users = JSON.parse(localStorage.getItem('mock_users'));
        const newUser = {
          id: users.length + 1,
          name: payload.name,
          email: payload.email,
          role: payload.role,
          customer_id: payload.customer_id === 'new' ? 4 : null
        };
        users.push(newUser);
        localStorage.setItem('mock_users', JSON.stringify(users));
        return jsonResponse(newUser, 201);
      }
    }

    if (urlStr.includes('/api/users/') && method === 'DELETE') {
      const userId = parseInt(urlStr.split('/').pop());
      const users = JSON.parse(localStorage.getItem('mock_users'));
      const filtered = users.filter(u => u.id !== userId);
      localStorage.setItem('mock_users', JSON.stringify(filtered));
      return jsonResponse({ message: 'User deleted successfully' });
    }

    // 4. Products List & Add
    if (urlStr.endsWith('/api/products')) {
      if (method === 'GET') {
        return jsonResponse(JSON.parse(localStorage.getItem('mock_products')));
      }
      if (method === 'POST') {
        const products = JSON.parse(localStorage.getItem('mock_products'));
        const newProduct = {
          id: products.length + 1,
          name: payload.name,
          sku: payload.sku,
          category: payload.category,
          stock_quantity: parseInt(payload.stock_quantity || 0),
          reorder_level: parseInt(payload.reorder_level || 5),
          buy_price: parseFloat(payload.buy_price || 0),
          sell_price: parseFloat(payload.sell_price || 0)
        };
        products.push(newProduct);
        localStorage.setItem('mock_products', JSON.stringify(products));
        return jsonResponse(newProduct, 201);
      }
    }

    // 5. Suppliers List
    if (urlStr.endsWith('/api/suppliers') && method === 'GET') {
      return jsonResponse(JSON.parse(localStorage.getItem('mock_suppliers')));
    }

    // 6. Customers List
    if (urlStr.endsWith('/api/customers') && method === 'GET') {
      return jsonResponse(JSON.parse(localStorage.getItem('mock_customers')));
    }

    // 7. Procurement Orders
    if (urlStr.endsWith('/api/procurement') && method === 'GET') {
      return jsonResponse(JSON.parse(localStorage.getItem('mock_procurement')));
    }

    // 8. Smart Restocking PO Approve
    if (urlStr.endsWith('/api/procurement/approve-suggested') && method === 'POST') {
      const products = JSON.parse(localStorage.getItem('mock_products'));
      const product = products.find(p => p.id === payload.product_id);
      
      const procurement = JSON.parse(localStorage.getItem('mock_procurement'));
      const newPO = {
        id: 100 + procurement.length + 1,
        product_name: product ? product.name : "Wireless Mouse",
        sku: product ? product.sku : "ELEC-MOUSE-WIRELESS",
        supplier_name: "Global Tech Supplier",
        quantity: payload.quantity || 50,
        total_cost: (payload.quantity || 50) * (product ? product.buy_price : 8),
        status: "Ordered",
        order_date: new Date().toISOString().split('T')[0]
      };
      
      procurement.push(newPO);
      localStorage.setItem('mock_procurement', JSON.stringify(procurement));
      return jsonResponse({ status: 'Ordered', po: newPO }, 201);
    }

    // 9. Dashboard KPIs
    if (urlStr.endsWith('/api/dashboard') && method === 'GET') {
      const products = JSON.parse(localStorage.getItem('mock_products'));
      const customers = JSON.parse(localStorage.getItem('mock_customers'));
      
      // Calculate active low stock items
      const lowStockCount = products.filter(p => p.stock_quantity <= p.reorder_level).length;

      return jsonResponse({
        kpis: {
          total_revenue: 25435.97,
          total_expenses: 29654.33,
          net_profit: -4218.36,
          low_stock_count: lowStockCount,
          total_customers: customers.length,
          avg_churn_rate: 34.0
        },
        sales_forecast: {
          forecast: { month: "Next Month", sales: 4110.40 },
          history: [
            { month: "2025-11", sales: 219.95 },
            { month: "2025-12", sales: 3404.72 },
            { month: "2026-01", sales: 5230.60 },
            { month: "2026-02", sales: 3125.75 },
            { month: "2026-03", sales: 1809.81 },
            { month: "2026-04", sales: 5177.71 },
            { month: "2026-05", sales: 3928.60 },
            { month: "2026-06", sales: 2538.82 }
          ]
        },
        top_products: [
          { name: "USB-C Hub 7-in-1", sales: 27 },
          { name: "Wireless Mouse", sales: 24 },
          { name: "Ergonomic Office Chair", sales: 22 },
          { name: "Adjustable Phone Stand", sales: 21 },
          { name: "Standing Desk (Electric)", sales: 20 }
        ],
        ai_suggestions: [
          "Restock Priority: 'Mechanical Keyboard' is currently at 4 units (reorder level: 8). Recommend placing a procurement order.",
          "Restock Priority: 'USB-C Hub 7-in-1' is currently at 3 units (reorder level: 6). Recommend placing a procurement order.",
          "Customer Retention Alert: 'Bruce Wayne' has a 98% risk of churn. Consider sending a promotional discount code.",
          "Financial Optimization: Marketing expenditures are higher this period. Monitor conversion rate on campaigns."
        ]
      });
    }

    // 10. AI Assistant Interception
    if (urlStr.endsWith('/api/assistant') && method === 'POST') {
      const msg = payload.message.toLowerCase();
      let reply = "";

      if (msg.includes("profit") || msg.includes("decreasing")) {
        reply = (
          "<b>BusinessOS AI™ Corporate Financial Audit:</b><br/>" +
          "Our diagnostic analysis shows that net profit margin is down by 5.3% due to the following factors:<br/><br/>" +
          "• <b>Inventory holding cost +15%</b>: Carrying excess bulk stocks in Monitor and Keyboard categories.<br/>" +
          "• <b>Customer churn increased 12%</b>: Flagged risk segments like Bruce Wayne haven't purchased in >60 days.<br/>" +
          "• <b>Sales dropped in Electronics category</b>: USB-C Hub category saw an 8% drop in sales volume.<br/><br/>" +
          "<b>Recommended Action:</b> Trigger a customer retention email campaign immediately, and reduce bulk purchase orders of low-velocity Electronics."
        );
      } else if (msg.includes("low stock") || msg.includes("stock")) {
        reply = "<b>BusinessOS AI™ Inventory Alert:</b><br/>There are currently 4 SKUs running low:<br/>• Mechanical Keyboard (Stock: 4, Reorder: 8)<br/>• USB-C Hub 7-in-1 (Stock: 3, Reorder: 6)<br/>Recommend approving restock POs on the main dashboard.";
      } else {
        reply = "Hello! I am your AI Business Assistant. Ask me 'Why is profit decreasing?' or 'Which products are low in stock?' for visual audit insights.";
      }
      return jsonResponse({ response: reply });
    }

    // 11. PDF Report Download mock
    if (urlStr.includes('/api/reports/download/')) {
      // Simulate file download by creating a fake plain text file containing PDF headers
      const blob = new Blob(["%PDF-1.4 Mock BusinessOS AI Report Content"], { type: "application/pdf" });
      const mockFileUrl = URL.createObjectURL(blob);
      
      // Auto open/download
      const link = document.createElement('a');
      link.href = mockFileUrl;
      link.download = urlStr.includes('executive') ? 'executive_report.pdf' : 'sales_report.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return jsonResponse({ success: true, message: 'PDF generated' });
    }

    // 12. ML Retrain
    if (urlStr.endsWith('/api/ml/retrain') && method === 'POST') {
      return jsonResponse({ success: true, churn_trained: "Trained", forecast_trained: "Trained", message: "Models retrained in local browser environment" });
    }

    // Fallback for unhandled endpoints
    return jsonResponse({ error: "Endpoint mock not implemented" }, 404);
  };
}
