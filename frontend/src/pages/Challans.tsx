import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

interface Customer {
  id: string;
  customerName: string;
  businessName?: string;
}

interface Product {
  id: string;
  productName: string;
  unitPrice: number;
  currentStock: number;
}

interface ChallanItem {
  id: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  subtotal: number;
}

interface Challan {
  id: string;
  challanNumber: string;
  customer: Customer;
  totalQuantity: number;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  items: ChallanItem[];
}

export const Challans: React.FC = () => {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: '', quantity: 1 },
  ]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [challanRes, custRes, prodRes] = await Promise.all([
        api.get('/challans'),
        api.get('/customers'),
        api.get('/products'),
      ]);
      if (challanRes.data.success) setChallans(challanRes.data.data);
      if (custRes.data.success) setCustomers(custRes.data.data);
      if (prodRes.data.success) setProducts(prodRes.data.data);
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItemRow = () => {
    setSelectedItems([...selectedItems, { productId: '', quantity: 1 }]);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...selectedItems];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedItems(updated);
  };

  const handleCreateChallan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/challans', {
        customerId: selectedCustomerId,
        items: selectedItems.map((item) => ({ ...item, quantity: Number(item.quantity) })),
      });
      if (response.data.success) {
        setIsModalOpen(false);
        setSelectedCustomerId('');
        setSelectedItems([{ productId: '', quantity: 1 }]);
        fetchInitialData();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create delivery challan');
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const response = await api.patch(`/challans/${id}/status`, { status });
      if (response.data.success) {
        fetchInitialData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Status update failed');
    }
  };

  // PDF Export Download Handler
  const handleDownloadPDF = async (challanId: string, challanNumber: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/challans/${challanId}/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('PDF download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Challan-${challanNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Failed to download PDF challan');
    }
  };

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#111827' }}>📄 Delivery Challans & Dispatches</h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
            Create goods delivery notes and confirm stock dispatches
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '0.625rem 1.25rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
        >
          + Create Delivery Challan
        </button>
      </div>

      {loading ? (
        <p>Loading delivery challans...</p>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#374151', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Challan No.</th>
                <th style={{ padding: '0.75rem 1rem' }}>Customer</th>
                <th style={{ padding: '0.75rem 1rem' }}>Items Included</th>
                <th style={{ padding: '0.75rem 1rem' }}>Total Qty</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {challans.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
                    No delivery challans issued yet. Click <strong>"+ Create Delivery Challan"</strong> to generate your first order dispatch!
                  </td>
                </tr>
              ) : (
                challans.map((ch) => (
                  <tr key={ch.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 'bold', color: '#2563eb' }}>{ch.challanNumber}</td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ fontWeight: '600', color: '#111827' }}>{ch.customer?.customerName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{ch.customer?.businessName}</div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.8rem', color: '#374151' }}>
                        {ch.items.map((it) => (
                          <li key={it.id}>
                            {it.productNameSnapshot} &times; <strong>{it.quantity}</strong> (₹{Number(it.unitPriceSnapshot).toFixed(2)})
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 'bold' }}>{ch.totalQuantity} units</td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span
                        style={{
                          backgroundColor: ch.status === 'CONFIRMED' ? '#dcfce7' : ch.status === 'DRAFT' ? '#fef3c7' : '#fee2e2',
                          color: ch.status === 'CONFIRMED' ? '#15803d' : ch.status === 'DRAFT' ? '#b45309' : '#b91c1c',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                        }}
                      >
                        {ch.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {/* Integrated PDF Download Button */}
                        <button
                          onClick={() => handleDownloadPDF(ch.id, ch.challanNumber)}
                          style={{
                            backgroundColor: '#4b5563',
                            color: 'white',
                            border: 'none',
                            padding: '0.35rem 0.65rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                          }}
                        >
                          📥 PDF
                        </button>

                        {/* Status Change Buttons */}
                        {ch.status === 'DRAFT' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(ch.id, 'CONFIRMED')}
                              style={{
                                backgroundColor: '#16a34a',
                                color: 'white',
                                border: 'none',
                                padding: '0.35rem 0.65rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                              }}
                            >
                              ✓ Confirm & Dispatch Stock
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(ch.id, 'CANCELLED')}
                              style={{
                                backgroundColor: '#dc2626',
                                color: 'white',
                                border: 'none',
                                padding: '0.35rem 0.65rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                              }}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Create Delivery Challan */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '600px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>New Delivery Challan</h3>
            {error && <div style={{ color: '#dc2626', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

            <form onSubmit={handleCreateChallan}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Select Client / Customer *</label>
                <select required value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} style={inputStyle}>
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.customerName} ({c.businessName || 'Personal'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Select Line Items *</label>
                {selectedItems.map((item, index) => (
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <select
                      required
                      value={item.productId}
                      onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                      style={inputStyle}
                    >
                      <option value="">-- Choose Item --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.productName} (Avail: {p.currentStock} pcs @ ₹{Number(p.unitPrice).toFixed(2)})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddItemRow}
                  style={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.25rem' }}
                >
                  + Add Another Item
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '0.5rem 1rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Save Draft Challan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const inputStyle = { width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' as const };