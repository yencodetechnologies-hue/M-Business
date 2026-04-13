import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../config';

const AdminPaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({
    status: '',
    type: '',
    userId: '',
    page: 1
  });
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, [filter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/api/payments/all`, {
        params: filter
      });
      setPayments(response.data.payments || []);
    } catch (err) {
      setError('Failed to load payments');
      console.error('Payments fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/payments/stats`);
      setStats(response.data);
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  };

  const handleStatusUpdate = async (paymentId, newStatus) => {
    try {
      await axios.put(`${BASE_URL}/api/payments/${paymentId}/status`, {
        status: newStatus,
        notes: `Status updated by admin`
      });
      
      await fetchPayments();
      setShowStatusModal(false);
      setSelectedPayment(null);
    } catch (err) {
      alert('Failed to update payment status');
      console.error('Status update error:', err);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: '#22C55E',
      pending: '#F59E0B',
      failed: '#EF4444',
      refunded: '#3B82F6',
      cancelled: '#6B7280'
    };
    return colors[status] || '#6B7280';
  };

  const getTypeColor = (type) => {
    const colors = {
      subscription: '#8B5CF6',
      invoice: '#10B981',
      quotation: '#F59E0B',
      other: '#6B7280'
    };
    return colors[type] || '#6B7280';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>        </div>
          <div style={{ color: '#666', fontSize: 14 }}>Loading payment data...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 30 }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#1e293b', fontSize: 28 }}>
          Payment Management
        </h2>
        
        {/* Stats Cards */}
        {stats && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: 16,
            marginBottom: 30
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #22C55E, #16a34a)',
              color: 'white',
              padding: 20,
              borderRadius: 12,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
                {stats.total?.totalRevenue?.toLocaleString('en-IN') || 0}
              </div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>Total Revenue (INR)</div>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #3B82F6, #2563eb)',
              color: 'white',
              padding: 20,
              borderRadius: 12,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
                {stats.total?.totalPayments || 0}
              </div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>Total Transactions</div>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #8B5CF6, #7c3aed)',
              color: 'white',
              padding: 20,
              borderRadius: 12,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
                {stats.total?.avgAmount?.toFixed(0) || 0}
              </div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>Average Amount (INR)</div>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #F59E0B, #d97706)',
              color: 'white',
              padding: 20,
              borderRadius: 12,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
                {stats.stats?.find(s => s._id === 'pending')?.count || 0}
              </div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>Pending Payments</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          padding: 20,
          background: '#f8fafc',
          borderRadius: 12,
          border: '1px solid #e2e8f0'
        }}>
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            style={{
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 8,
              fontSize: 14
            }}
          >
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            style={{
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 8,
              fontSize: 14
            }}
          >
            <option value="">All Types</option>
            <option value="subscription">Subscription</option>
            <option value="invoice">Invoice</option>
            <option value="quotation">Quotation</option>
            <option value="other">Other</option>
          </select>

          <input
            type="text"
            placeholder="Search by User ID or Email"
            value={filter.userId}
            onChange={(e) => setFilter({ ...filter, userId: e.target.value })}
            style={{
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 8,
              fontSize: 14
            }}
          />

          <button
            onClick={() => setFilter({ status: '', type: '', userId: '', page: 1 })}
            style={{
              padding: '10px 16px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: '#fef2f2',
          color: '#dc2626',
          padding: 16,
          borderRadius: 8,
          marginBottom: 20,
          border: '1px solid #fecaca'
        }}>
          {error}
        </div>
      )}

      {/* Payments Table */}
      <div style={{
        background: 'white',
        borderRadius: 12,
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: 20,
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc'
        }}>
          <h3 style={{ margin: 0, color: '#1e293b', fontSize: 18 }}>
            All Payments ({payments.length})
          </h3>
        </div>

        {payments.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 60,
            color: '#6b7280'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>        </div>
            <p>No payments found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#374151',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Payment ID</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#374151',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #e5e7eb'
                  }}>User</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#374151',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Amount</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#374151',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Type</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#374151',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Method</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#374151',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Status</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#374151',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Date</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#374151',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{
                      padding: '12px 16px',
                      fontSize: 13,
                      fontFamily: 'monospace',
                      color: '#6b7280'
                    }}>
                      {payment.paymentId}
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      fontSize: 13
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#1f2937' }}>
                          {payment.userEmail}
                        </div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>
                          ID: {payment.userId?.slice(0, 8)}...
                        </div>
                      </div>
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#059669'
                    }}>
                      {formatCurrency(payment.amount, payment.currency)}
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      fontSize: 13
                    }}>
                      <span style={{
                        background: `${getTypeColor(payment.type)}15`,
                        color: getTypeColor(payment.type),
                        padding: '4px 8px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}>
                        {payment.type}
                      </span>
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      fontSize: 13,
                      color: '#6b7280',
                      textTransform: 'capitalize'
                    }}>
                      {payment.paymentMethod}
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      fontSize: 13
                    }}>
                      <span style={{
                        background: `${getStatusColor(payment.status)}15`,
                        color: getStatusColor(payment.status),
                        padding: '4px 8px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}>
                        {payment.status}
                      </span>
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      fontSize: 13,
                      color: '#6b7280'
                    }}>
                      {formatDate(payment.paymentDate)}
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      fontSize: 13
                    }}>
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowStatusModal(true);
                        }}
                        style={{
                          padding: '6px 12px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 12,
                          cursor: 'pointer',
                          marginRight: 8
                        }}
                      >
                        Update Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedPayment && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            width: '100%',
            maxWidth: 500,
            padding: 24
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>
              Update Payment Status
            </h3>
            
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                Payment ID: <strong>{selectedPayment.paymentId}</strong>
              </p>
              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                Amount: <strong>{formatCurrency(selectedPayment.amount, selectedPayment.currency)}</strong>
              </p>
              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                Current Status: <strong>{selectedPayment.status}</strong>
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                New Status:
              </label>
              <select
                defaultValue={selectedPayment.status}
                id="statusSelect"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: 14
                }}
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedPayment(null);
                }}
                style={{
                  padding: '10px 20px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const newStatus = document.getElementById('statusSelect').value;
                  handleStatusUpdate(selectedPayment._id, newStatus);
                }}
                style={{
                  padding: '10px 20px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentManagement;
