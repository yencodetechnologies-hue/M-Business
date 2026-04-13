import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PaymentHistory = ({ userId, userEmail }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, [userId, filter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/payments/payments/${userId}`);
      let filteredPayments = response.data;

      if (filter !== 'all') {
        filteredPayments = response.data.filter(payment => payment.status === filter);
      }

      setPayments(filteredPayments);
    } catch (err) {
      setError('Failed to load payment history');
      console.error('Payment history error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/payments/stats', {
        params: { userId }
      });
      setStats(response.data);
    } catch (err) {
      console.error('Payment stats error:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'danger';
      case 'refunded':
        return 'info';
      case 'cancelled':
        return 'secondary';
      default:
        return 'primary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'pending':
        return 'clock';
      case 'failed':
        return 'x-circle';
      case 'refunded':
        return 'arrow-return-left';
      case 'cancelled':
        return 'x-circle';
      default:
        return 'info-circle';
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'card':
        return 'credit-card';
      case 'upi':
        return 'smartphone';
      case 'netbanking':
        return 'building';
      case 'wallet':
        return 'wallet';
      case 'cash':
        return 'cash';
      default:
        return 'credit-card';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadReceipt = async (payment) => {
    try {
      if (payment.receiptUrl) {
        window.open(payment.receiptUrl, '_blank');
      } else {
        alert('Receipt not available');
      }
    } catch (err) {
      console.error('Download receipt error:', err);
    }
  };

  const requestRefund = async (paymentId) => {
    try {
      const reason = prompt('Please provide reason for refund:');
      if (!reason) return;

      await axios.post('/api/payments/refund', {
        paymentId,
        reason
      });

      alert('Refund request submitted successfully');
      fetchPayments();
    } catch (err) {
      alert('Failed to process refund request');
      console.error('Refund error:', err);
    }
  };

  if (loading) {
    return (
      <div className="payment-history-loading">
        <div className="spinner"></div>
        <p>Loading payment history...</p>
      </div>
    );
  }

  return (
    <div className="payment-history">
      <div className="payment-history-header">
        <h3>Payment History</h3>
        <div className="payment-filters">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Payments</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {stats && (
        <div className="payment-stats">
          <div className="stat-card">
            <div className="stat-value">
              INR {stats.total?.totalRevenue?.toLocaleString('en-IN') || 0}
            </div>
            <div className="stat-label">Total Spent</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.total?.totalPayments || 0}</div>
            <div className="stat-label">Total Transactions</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              INR {stats.total?.avgAmount?.toFixed(0) || 0}
            </div>
            <div className="stat-label">Average Amount</div>
          </div>
        </div>
      )}

      {error && (
        <div className="payment-error">
          <p>{error}</p>
        </div>
      )}

      {payments.length === 0 ? (
        <div className="no-payments">
          <p>No payment records found</p>
        </div>
      ) : (
        <div className="payments-list">
          {payments.map((payment) => (
            <div key={payment._id} className="payment-item">
              <div className="payment-header">
                <div className="payment-info">
                  <div className="payment-id">
                    <span className="label">Payment ID:</span>
                    <span className="value">{payment.paymentId}</span>
                  </div>
                  <div className="payment-date">
                    {formatDate(payment.paymentDate)}
                  </div>
                </div>
                <div className="payment-amount">
                  <span className="amount">
                    INR {payment.amount.toLocaleString('en-IN')}
                  </span>
                  <span className={`status status-${getStatusColor(payment.status)}`}>
                    <span className="status-icon">
                      {getStatusIcon(payment.status)}
                    </span>
                    {payment.status}
                  </span>
                </div>
              </div>

              <div className="payment-details">
                <div className="detail-row">
                  <div className="detail-item">
                    <span className="detail-icon">
                      {getPaymentMethodIcon(payment.paymentMethod)}
                    </span>
                    <span className="detail-text">
                      {payment.paymentMethod.charAt(0).toUpperCase() + payment.paymentMethod.slice(1)}
                    </span>
                  </div>
                  {payment.planName && (
                    <div className="detail-item">
                      <span className="detail-icon">package</span>
                      <span className="detail-text">{payment.planName}</span>
                    </div>
                  )}
                  {payment.invoiceNo && (
                    <div className="detail-item">
                      <span className="detail-icon">file-text</span>
                      <span className="detail-text">Invoice: {payment.invoiceNo}</span>
                    </div>
                  )}
                </div>
                {payment.description && (
                  <div className="payment-description">
                    {payment.description}
                  </div>
                )}
              </div>

              <div className="payment-actions">
                {payment.status === 'completed' && payment.receiptUrl && (
                  <button
                    className="action-btn"
                    onClick={() => downloadReceipt(payment)}
                  >
                    <span className="btn-icon">download</span>
                    Download Receipt
                  </button>
                )}
                {payment.status === 'completed' && payment.type === 'subscription' && (
                  <button
                    className="action-btn secondary"
                    onClick={() => requestRefund(payment._id)}
                  >
                    <span className="btn-icon">arrow-return-left</span>
                    Request Refund
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
