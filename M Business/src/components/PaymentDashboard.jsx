import React, { useState, useEffect } from 'react';
import PaymentProcessor from './PaymentProcessor';
import PaymentHistory from './PaymentHistory';
import axios from 'axios';

const PaymentDashboard = ({ userId, userEmail, userName }) => {
  const [activeTab, setActiveTab] = useState('process');
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentStats, setPaymentStats] = useState(null);

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 1999,
      duration: 'monthly',
      features: [
        'Up to 10 Clients',
        'Up to 5 Projects',
        'Basic Invoice Generation',
        'Email Support',
        '1GB Cloud Storage'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 2999,
      duration: 'monthly',
      features: [
        'Unlimited Clients',
        'Unlimited Projects',
        'Advanced Invoice Generation',
        'Quotation Management',
        'Priority Support',
        '50GB Cloud Storage'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 5999,
      duration: 'monthly',
      features: [
        'Everything in Professional',
        'Multi-User Access',
        'Custom Reports',
        'API Access',
        'Dedicated Support',
        'Unlimited Cloud Storage'
      ]
    }
  ];

  useEffect(() => {
    fetchCurrentSubscription();
    fetchPaymentStats();
  }, [userId]);

  const fetchCurrentSubscription = async () => {
    try {
      const response = await axios.get(`/api/subscriptions/current/${userId}`);
      if (response.data.hasSubscription) {
        setSubscription(response.data.subscription);
      }
    } catch (err) {
      console.error('Subscription fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      const response = await axios.get('/api/payments/stats', {
        params: { userId }
      });
      setPaymentStats(response.data);
    } catch (err) {
      console.error('Payment stats error:', err);
    }
  };

  const handlePaymentSuccess = async (payment) => {
    alert('Payment successful! Your subscription has been activated.');
    await fetchCurrentSubscription();
    setActiveTab('history');
  };

  const handlePaymentFailure = (error) => {
    console.error('Payment failed:', error);
  };

  const getRecommendedPlan = () => {
    if (!subscription) return plans[1]; // Professional as default
    return plans.find(plan => plan.name === subscription.planName) || plans[1];
  };

  const isPlanActive = (planName) => {
    return subscription && subscription.status === 'active' && subscription.planName === planName;
  };

  const getDaysUntilExpiry = () => {
    if (!subscription || !subscription.endDate) return null;
    const now = new Date();
    const expiry = new Date(subscription.endDate);
    const days = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  if (loading) {
    return (
      <div className="payment-dashboard-loading">
        <div className="spinner"></div>
        <p>Loading payment dashboard...</p>
      </div>
    );
  }

  return (
    <div className="payment-dashboard">
      <div className="dashboard-header">
        <h2>Payment & Subscription Center</h2>
        <div className="user-info">
          <span>{userName || userEmail}</span>
        </div>
      </div>

      {subscription && (
        <div className="current-subscription">
          <div className="subscription-card">
            <div className="subscription-header">
              <h3>Current Subscription</h3>
              <span className={`subscription-status ${subscription.status}`}>
                {subscription.status}
              </span>
            </div>
            <div className="subscription-details">
              <div className="plan-info">
                <h4>{subscription.planName}</h4>
                <p>
                  INR {subscription.planPrice.toLocaleString('en-IN')}/{subscription.billingCycle}
                </p>
              </div>
              <div className="subscription-meta">
                <div className="meta-item">
                  <span className="label">Valid Until:</span>
                  <span className="value">
                    {new Date(subscription.endDate).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="label">Days Remaining:</span>
                  <span className="value days-remaining">
                    {getDaysUntilExpiry() || 'Expired'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="payment-tabs">
        <button
          className={`tab-btn ${activeTab === 'process' ? 'active' : ''}`}
          onClick={() => setActiveTab('process')}
        >
          <span className="tab-icon">credit-card</span>
          Make Payment
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <span className="tab-icon">clock-history</span>
          Payment History
        </button>
        <button
          className={`tab-btn ${activeTab === 'plans' ? 'active' : ''}`}
          onClick={() => setActiveTab('plans')}
        >
          <span className="tab-icon">package</span>
          Subscription Plans
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'process' && (
          <div className="payment-process-tab">
            {subscription?.status === 'active' ? (
              <div className="active-subscription-notice">
                <h3>You have an active subscription!</h3>
                <p>Your current {subscription.planName} plan is active until {new Date(subscription.endDate).toLocaleDateString('en-IN')}</p>
                <p>Want to upgrade? Check out our subscription plans.</p>
                <button
                  className="btn-primary"
                  onClick={() => setActiveTab('plans')}
                >
                  View Plans
                </button>
              </div>
            ) : (
              <PaymentProcessor
                amount={getRecommendedPlan().price}
                planName={getRecommendedPlan().name}
                planDuration={getRecommendedPlan().duration}
                userEmail={userEmail}
                userId={userId}
                onSuccess={handlePaymentSuccess}
                onFailure={handlePaymentFailure}
                description={`${getRecommendedPlan().name} - ${getRecommendedPlan().duration} subscription`}
              />
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="payment-history-tab">
            <PaymentHistory userId={userId} userEmail={userEmail} />
          </div>
        )}

        {activeTab === 'plans' && (
          <div className="subscription-plans-tab">
            <h3>Choose Your Plan</h3>
            <div className="plans-grid">
              {plans.map((plan) => (
                <div 
                  key={plan.id} 
                  className={`plan-card ${isPlanActive(plan.name) ? 'active' : ''}`}
                >
                  <div className="plan-header">
                    <h4>{plan.name}</h4>
                    <div className="plan-price">
                      <span className="price-amount">
                        INR {plan.price.toLocaleString('en-IN')}
                      </span>
                      <span className="price-duration">/{plan.duration}</span>
                    </div>
                  </div>
                  <div className="plan-features">
                    <ul>
                      {plan.features.map((feature, index) => (
                        <li key={index}>
                          <span className="feature-icon">check</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="plan-action">
                    {isPlanActive(plan.name) ? (
                      <button className="btn-secondary" disabled>
                        Current Plan
                      </button>
                    ) : (
                      <PaymentProcessor
                        amount={plan.price}
                        planName={plan.name}
                        planDuration={plan.duration}
                        userEmail={userEmail}
                        userId={userId}
                        onSuccess={handlePaymentSuccess}
                        onFailure={handlePaymentFailure}
                        description={`${plan.name} - ${plan.duration} subscription`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {paymentStats && (
        <div className="payment-summary">
          <h4>Your Payment Summary</h4>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Total Payments:</span>
              <span className="summary-value">{paymentStats.total?.totalPayments || 0}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Spent:</span>
              <span className="summary-value">
                INR {paymentStats.total?.totalRevenue?.toLocaleString('en-IN') || 0}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Average Payment:</span>
              <span className="summary-value">
                INR {paymentStats.total?.avgAmount?.toFixed(0) || 0}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentDashboard;
