import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

interface DashboardData {
  customers: { total: number; active: number; leads: number };
  inventory: { totalProducts: number; lowStockCount: number; totalStockValue: number };
  challans: { total: number; confirmed: number; draft: number };
  recentMovements: Array<{
    id: string;
    quantity: number;
    movementType: 'IN' | 'OUT';
    reason: string;
    createdAt: string;
    product: { productName: string; sku: string };
    user: { name: string };
  }>;
}

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await api.get('/analytics/metrics');
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading operational metrics...</div>;
  if (!data) return <div style={{ padding: '2rem', color: '#dc2626' }}>Failed to load dashboard data.</div>;

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#111827' }}>📊 Operations Overview & Metrics</h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
          Real-time summary of sales pipeline, warehouse valuation, and dispatches
        </p>
      </div>

      {/* Metric Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <Card title="🏢 CRM Directory" mainVal={`${data.customers.total} Total`} subVal={`${data.customers.active} Active • ${data.customers.leads} Leads`} color="#2563eb" />
        <Card title="📦 Catalog Items" mainVal={`${data.inventory.totalProducts} Products`} subVal={`₹${data.inventory.totalStockValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })} Total Value`} color="#059669" />
        <Card title="⚠️ Low Stock Items" mainVal={`${data.inventory.lowStockCount} Items`} subVal={data.inventory.lowStockCount > 0 ? 'Requires Restock' : 'Inventory Optimal'} color={data.inventory.lowStockCount > 0 ? '#dc2626' : '#16a34a'} />
        <Card title="📄 Delivery Challans" mainVal={`${data.challans.total} Issued`} subVal={`${data.challans.confirmed} Dispatched • ${data.challans.draft} Drafts`} color="#d97706" />
      </div>

      {/* Recent Stock Movements Table */}
      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#111827' }}>⚡ Recent Stock Audit Log</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#374151', textTransform: 'uppercase', fontSize: '0.75rem' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Product</th>
              <th style={{ padding: '0.75rem 1rem' }}>Movement</th>
              <th style={{ padding: '0.75rem 1rem' }}>Quantity</th>
              <th style={{ padding: '0.75rem 1rem' }}>Reason</th>
              <th style={{ padding: '0.75rem 1rem' }}>Recorded By</th>
              <th style={{ padding: '0.75rem 1rem' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {data.recentMovements.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '1.5rem', textAlign: 'center', color: '#9ca3af' }}>No recent stock movements recorded.</td>
              </tr>
            ) : (
              data.recentMovements.map((m) => (
                <tr key={m.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 'bold' }}>{m.product.productName} ({m.product.sku})</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span style={{ backgroundColor: m.movementType === 'IN' ? '#dcfce7' : '#fee2e2', color: m.movementType === 'IN' ? '#15803d' : '#b91c1c', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.75rem' }}>
                      {m.movementType}
                    </span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 'bold' }}>{m.quantity} pcs</td>
                  <td style={{ padding: '0.875rem 1rem', color: '#4b5563' }}>{m.reason}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>{m.user.name}</td>
                  <td style={{ padding: '0.875rem 1rem', color: '#6b7280' }}>{new Date(m.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Card: React.FC<{ title: string; mainVal: string; subVal: string; color: string }> = ({ title, mainVal, subVal, color }) => (
  <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '8px', borderLeft: `5px solid ${color}`, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
    <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.5rem' }}>{title}</div>
    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.25rem' }}>{mainVal}</div>
    <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>{subVal}</div>
  </div>
);