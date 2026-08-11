import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Customer {
  id: string;
  customerName: string;
  businessName?: string;
}

interface Product {
  id: string;
  productName: string;
  sku: string;
  unitPrice: number;
  currentStock: number;
}

interface FormItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  maxStock: number;
}

interface CreateChallanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateChallanModal: React.FC<CreateChallanModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [items, setItems] = useState<FormItem[]>([
    { productId: '', quantity: 1, unitPrice: 0, maxStock: 0 },
  ]);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Fetch Customers and Products when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [custRes, prodRes] = await Promise.all([
            axios.get('/api/customers'),
            axios.get('/api/products'),
          ]);
          setCustomers(custRes.data.data || []);
          setProducts(prodRes.data.data || []);
        } catch (err) {
          console.error('Failed to load customers or products:', err);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle item selection change
  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      productId,
      unitPrice: product ? product.unitPrice : 0,
      maxStock: product ? product.currentStock : 0,
    };
    setItems(updatedItems);
  };

  // Handle quantity change
  const handleQuantityChange = (index: number, quantity: number) => {
    const updatedItems = [...items];
    updatedItems[index].quantity = Math.max(1, quantity);
    setItems(updatedItems);
  };

  // Add new product line
  const addItemRow = () => {
    setItems([...items, { productId: '', quantity: 1, unitPrice: 0, maxStock: 0 }]);
  };

  // Remove product line
  const removeItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomerId) {
      alert('Please select a customer');
      return;
    }

    const invalidItem = items.find((i) => !i.productId || i.quantity <= 0);
    if (invalidItem) {
      alert('Please select a valid product and quantity for all rows');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        customerId: selectedCustomerId,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      };

      const res = await axios.post('/api/challans', payload);
      if (res.data.success) {
        alert('Delivery Challan created successfully in DRAFT mode');
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error('Failed to create challan:', err);
      alert(err.response?.data?.message || 'Failed to create delivery challan');
    } finally {
      setSubmitting(false);
    }
  };

  // Total Quantity & Estimated Amount
  const totalQty = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalAmount = items.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 relative max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Create Delivery Challan</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customerName} {c.businessName ? `(${c.businessName})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Item Rows */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Challan Items</label>
            {items.map((item, index) => (
              <div key={index} className="flex gap-2 items-center bg-gray-50 p-2 rounded border">
                {/* Product Dropdown */}
                <div className="flex-1">
                  <select
                    value={item.productId}
                    onChange={(e) => handleProductChange(index, e.target.value)}
                    className="w-full border border-gray-300 rounded p-1.5 text-sm"
                    required
                  >
                    <option value="">-- Select Product --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.productName} ({p.sku}) - Stock: {p.currentStock}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div className="w-24">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                    className="w-full border border-gray-300 rounded p-1.5 text-sm text-center"
                    placeholder="Qty"
                    required
                  />
                </div>

                {/* Subtotal Display */}
                <div className="w-28 text-right text-sm font-medium text-gray-600">
                  ₹{(item.quantity * item.unitPrice).toFixed(2)}
                </div>

                {/* Remove Row Button */}
                <button
                  type="button"
                  onClick={() => removeItemRow(index)}
                  disabled={items.length === 1}
                  className="px-2 py-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-30"
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addItemRow}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              + Add Item Row
            </button>
          </div>

          {/* Footer Totals */}
          <div className="border-t pt-3 flex justify-between text-sm font-semibold text-gray-700">
            <div>Total Quantity: {totalQty} pcs</div>
            <div>Estimated Value: ₹{totalAmount.toFixed(2)}</div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md text-sm text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Draft Challan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};