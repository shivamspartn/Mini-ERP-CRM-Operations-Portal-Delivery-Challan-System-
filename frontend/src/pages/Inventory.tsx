import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

interface Product {
  id: string;
  productName: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minimumStock: number;
  warehouseLocation: string;
}

export const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Product Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addError, setAddError] = useState('');
  const [newProduct, setNewProduct] = useState({
    productName: '',
    sku: '',
    category: '',
    unitPrice: 0,
    currentStock: 0,
    minimumStock: 5,
    warehouseLocation: 'Bay-1',
  });

  // Adjust Stock Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockAdjustment, setStockAdjustment] = useState({
    quantity: 1,
    movementType: 'IN' as 'IN' | 'OUT',
    reason: 'Restock received',
  });
  const [adjustError, setAdjustError] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      if (response.data.success) {
        setProducts(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    try {
      const response = await api.post('/products', {
        ...newProduct,
        unitPrice: Number(newProduct.unitPrice),
        currentStock: Number(newProduct.currentStock),
        minimumStock: Number(newProduct.minimumStock),
      });
      if (response.data.success) {
        setIsAddModalOpen(false);
        setNewProduct({ productName: '', sku: '', category: '', unitPrice: 0, currentStock: 0, minimumStock: 5, warehouseLocation: 'Bay-1' });
        fetchProducts();
      }
    } catch (err: any) {
      setAddError(err.response?.data?.message || 'Failed to create product');
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setAdjustError('');
    try {
      const response = await api.post(`/products/${selectedProduct.id}/stock`, {
        ...stockAdjustment,
        quantity: Number(stockAdjustment.quantity),
      });
      if (response.data.success) {
        setSelectedProduct(null);
        fetchProducts();
      }
    } catch (err: any) {
      setAdjustError(err.response?.data?.message || 'Failed to update stock');
    }
  };

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#111827' }}>📦 Inventory & Warehouse Management</h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>Track catalog items, minimum thresholds, and bin locations</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '0.625rem 1.25rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
        >
          + Add New Product
        </button>
      </div>

      {loading ? (
        <p>Loading inventory...</p>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#374151', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Product & SKU</th>
                <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                <th style={{ padding: '0.75rem 1rem' }}>Unit Price</th>
                <th style={{ padding: '0.75rem 1rem' }}>Warehouse Location</th>
                <th style={{ padding: '0.75rem 1rem' }}>Stock Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
                    No items in inventory. Click <strong>"+ Add New Product"</strong> to populate your catalog!
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLowStock = p.currentStock <= p.minimumStock;
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ fontWeight: '600', color: '#111827' }}>{p.productName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>SKU: {p.sku}</div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>{p.category}</td>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: '600' }}>₹{Number(p.unitPrice).toFixed(2)}</td>
                      <td style={{ padding: '0.875rem 1rem' }}>{p.warehouseLocation}</td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '1rem', color: isLowStock ? '#dc2626' : '#16a34a' }}>
                            {p.currentStock} units
                          </span>
                          {isLowStock && (
                            <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>
                              LOW STOCK (&le; {p.minimumStock})
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <button
                          onClick={() => setSelectedProduct(p)}
                          style={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
                        >
                          ⚡ Adjust Stock
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Add Product */}
      {isAddModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Add New Catalog Item</h3>
            {addError && <div style={{ color: '#dc2626', marginBottom: '1rem', fontSize: '0.875rem' }}>{addError}</div>}
            <form onSubmit={handleCreateProduct}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={labelStyle}>Product Name *</label>
                  <input type="text" required value={newProduct.productName} onChange={(e) => setNewProduct({ ...newProduct, productName: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>SKU Code *</label>
                  <input type="text" required placeholder="e.g. PRD-1001" value={newProduct.sku} onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={labelStyle}>Category *</label>
                  <input type="text" required placeholder="Electronics, Hardware..." value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Unit Price (₹) *</label>
                  <input type="number" step="0.01" required value={newProduct.unitPrice} onChange={(e) => setNewProduct({ ...newProduct, unitPrice: parseFloat(e.target.value) })} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={labelStyle}>Initial Stock</label>
                  <input type="number" value={newProduct.currentStock} onChange={(e) => setNewProduct({ ...newProduct, currentStock: parseInt(e.target.value) })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Low Threshold</label>
                  <input type="number" value={newProduct.minimumStock} onChange={(e) => setNewProduct({ ...newProduct, minimumStock: parseInt(e.target.value) })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Bin Location</label>
                  <input type="text" value={newProduct.warehouseLocation} onChange={(e) => setNewProduct({ ...newProduct, warehouseLocation: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} style={btnSecondary}>Cancel</button>
                <button type="submit" style={btnPrimary}>Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adjust Stock */}
      {selectedProduct && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ margin: '0 0 0.25rem 0' }}>Stock Adjustment</h3>
            <p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '0.875rem' }}>Item: <strong>{selectedProduct.productName}</strong> (Current: {selectedProduct.currentStock} units)</p>
            {adjustError && <div style={{ color: '#dc2626', marginBottom: '1rem', fontSize: '0.875rem' }}>{adjustError}</div>}
            <form onSubmit={handleAdjustStock}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Adjustment Type</label>
                <select value={stockAdjustment.movementType} onChange={(e) => setStockAdjustment({ ...stockAdjustment, movementType: e.target.value as 'IN' | 'OUT' })} style={inputStyle}>
                  <option value="IN">➕ Restock / Stock IN</option>
                  <option value="OUT">➖ Damage / Manual Stock OUT</option>
                </select>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Quantity</label>
                <input type="number" min="1" required value={stockAdjustment.quantity} onChange={(e) => setStockAdjustment({ ...stockAdjustment, quantity: parseInt(e.target.value) })} style={inputStyle} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle}>Reason / Reference Note</label>
                <input type="text" required value={stockAdjustment.reason} onChange={(e) => setStockAdjustment({ ...stockAdjustment, reason: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setSelectedProduct(null)} style={btnSecondary}>Cancel</button>
                <button type="submit" style={btnPrimary}>Confirm Stock Movement</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const modalOverlayStyle = { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContentStyle = { backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '520px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' };
const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem', color: '#374151' };
const inputStyle = { width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' as const };
const btnPrimary = { padding: '0.5rem 1rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' };
const btnSecondary = { padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' };