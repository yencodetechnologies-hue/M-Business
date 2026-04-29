import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PaymentProcessor = ({ 
  amount, 
  planName, 
  planDuration, 
  userEmail, 
  userId, 
  type = 'subscription',
  onSuccess,
  onFailure,
  description 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 'card', name: 'Credit/Debit Card', icon: 'credit-card' },
    { id: 'upi', name: 'UPI', icon: 'smartphone' },
    { id: 'netbanking', name: 'Net Banking', icon: 'building' },
    { id: 'wallet', name: 'Wallet', icon: 'wallet' }
  ]);
  const [selectedMethod, setSelectedMethod] = useState('card');

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const createPaymentOrder = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.post('/api/payments/create-order', {
        amount,
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        userId,
        userEmail,
        type,
        planName,
        planDuration,
        description: description || `${planName} - ${planDuration} subscription`
      });

      if (response.data.success) {
        initializeRazorpay(response.data.order);
      }
    } catch (err) {
      setError('Failed to create payment order. Please try again.');
      console.error('Payment order creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const initializeRazorpay = (order) => {
    const options = {
key: process.env.REACT_APP_RAZORPAY_KEY_ID, // Test key
      amount: order.amount,
      currency: order.currency,
      name: 'M Business',
      description: order.receipt,
      order_id: order.id,
      handler: async function (response) {
        await verifyPayment(response, order.id);
      },
      prefill: {
        name: userEmail?.split('@')[0] || 'User',
        email: userEmail,
        contact: ''
      },
      notes: {
        paymentId: order.id
      },
      theme: {
        color: '#3399cc'
      },
      modal: {
        ondismiss: function() {
          setLoading(false);
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const verifyPayment = async (paymentResponse, orderId) => {
    try {
      setLoading(true);
      
      const response = await axios.post('/api/payments/verify', {
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        paymentId: orderId,
        paymentMethod: selectedMethod,
        paymentDetails: getPaymentDetails()
      });

      if (response.data.success) {
        onSuccess?.(response.data.payment);
      }
    } catch (err) {
      setError('Payment verification failed. Please contact support.');
      console.error('Payment verification error:', err);
      onFailure?.(err);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentDetails = () => {
    switch (selectedMethod) {
      case 'card':
        return { cardLast4: 'XXXX' };
      case 'upi':
        return { upiId: 'user@upi' };
      case 'netbanking':
        return { bankName: 'Bank Name' };
      case 'wallet':
        return { walletName: 'Wallet Name' };
      default:
        return {};
    }
  };

  const handlePayment = () => {
    if (!amount || amount <= 0) {
      setError('Invalid amount');
      return;
    }
    createPaymentOrder();
  };

  return (
    <div className="payment-processor">
      <div className="payment-summary">
        <h3>Payment Summary</h3>
        <div className="summary-item">
          <span>Plan:</span>
          <span>{planName}</span>
        </div>
        <div className="summary-item">
          <span>Duration:</span>
          <span>{planDuration}</span>
        </div>
        <div className="summary-item total">
          <span>Total Amount:</span>
          <span>INR {amount.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div className="payment-methods">
        <h4>Select Payment Method</h4>
        <div className="methods-grid">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              className={`method-btn ${selectedMethod === method.id ? 'selected' : ''}`}
              onClick={() => setSelectedMethod(method.id)}
              disabled={loading}
            >
              <span className="method-icon">
                {method.id === 'card' && 'credit-card'}
                {method.id === 'upi' && 'smartphone'}
                {method.id === 'netbanking' && 'building'}
                {method.id === 'wallet' && 'wallet'}
              </span>
              <span>{method.name}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="payment-error">
          <p>{error}</p>
        </div>
      )}

      <button
        className="payment-btn"
        onClick={handlePayment}
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="spinner"></span>
            Processing...
          </>
        ) : (
          `Pay INR ${amount.toLocaleString('en-IN')}`
        )}
      </button>

      <div className="payment-security">
        <div className="security-item">
          <span className="security-icon">lock</span>
          <span>Secure Payment</span>
        </div>
        <div className="security-item">
          <span className="security-icon">shield</span>
          <span>SSL Encrypted</span>
        </div>
        <div className="security-item">
          <span className="security-icon">check-circle</span>
          <span>PCI DSS Compliant</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentProcessor;
