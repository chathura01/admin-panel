import React, { useState, useEffect } from 'react';
import { Box, H2, H5, Text, Illustration } from '@adminjs/design-system';
import { ApiClient, useCurrentAdmin } from 'adminjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const api = new ApiClient();

const STATUS_COLORS = {
  pending:   '#ffc107',
  paid:      '#28a745',
  shipped:   '#007bff',
  delivered: '#17a2b8',
  cancelled: '#dc3545',
};

const Dashboard = () => {
  const [data, setData] = useState({});
  const [currentAdmin] = useCurrentAdmin();

  useEffect(() => {
    api.getDashboard().then((response) => {
      setData(response.data || {});
    });
  }, []);

  const isAdmin = currentAdmin && currentAdmin.role === 'admin';

  /* ── Admin analytics data ── */
  const ordersByDay = data.ordersByDay || [];
  const statusCounts = data.statusCounts || {};
  const statusLabels = Object.keys(statusCounts);

  const lineChartData = {
    labels: ordersByDay.map(d => d.date),
    datasets: [{
      label: 'Orders',
      data: ordersByDay.map(d => d.Orders),
      borderColor: '#007bff',
      backgroundColor: 'rgba(0,123,255,0.08)',
      borderWidth: 3,
      pointRadius: 4,
      tension: 0.3,
      fill: true,
    }],
  };

  const barChartData = {
    labels: statusLabels.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
    datasets: [{
      label: 'Orders by Status',
      data: statusLabels.map(s => statusCounts[s]),
      backgroundColor: statusLabels.map(s => STATUS_COLORS[s] || '#6c757d'),
      borderRadius: 5,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
  };

  /* ── Regular user data ── */
  const profile = data.profile || {};
  const myOrders = data.myOrders || [];

  return (
    <Box variant="grey" style={{ padding: '20px' }}>
      {/* Header */}
      <Box variant="white" padding="xl" mb="xl" style={{ borderRadius: '8px' }}>
        <H2>Welcome, {currentAdmin?.name || 'User'}!</H2>
        <Text>{isAdmin ? 'Live overview of your store analytics.' : 'Here is your personal dashboard.'}</Text>
      </Box>

      {isAdmin ? (
        <>
          {/* KPI Cards */}
          <Box flex flexDirection="row" mb="xl" style={{ gap: '16px', flexWrap: 'wrap' }}>
            {[
              { label: 'Total Revenue',  value: `$${Number(data.totalRevenue || 0).toFixed(2)}`, color: '#28a745' },
              { label: 'Total Orders',   value: data.ordersCount   || 0, color: '#007bff' },
              { label: 'Total Users',    value: data.usersCount    || 0, color: '#6f42c1' },
              { label: 'Total Products', value: data.productsCount || 0, color: '#fd7e14' },
            ].map(({ label, value, color }) => (
              <Box key={label} variant="white" padding="xl" flexGrow={1}
                style={{ textAlign: 'center', borderRadius: '8px', minWidth: '140px', borderTop: `4px solid ${color}` }}>
                <H5 style={{ color: '#6c757d', marginBottom: '8px' }}>{label}</H5>
                <H2 style={{ color }}>{value}</H2>
              </Box>
            ))}
          </Box>

          {/* Status mini-cards */}
          <Box flex flexDirection="row" mb="xl" style={{ gap: '12px', flexWrap: 'wrap' }}>
            {statusLabels.map(status => (
              <Box key={status} variant="white" padding="lg" flexGrow={1}
                style={{ textAlign: 'center', borderRadius: '8px', minWidth: '100px', borderLeft: `4px solid ${STATUS_COLORS[status] || '#6c757d'}` }}>
                <Text style={{ color: '#6c757d', fontSize: '12px', textTransform: 'uppercase' }}>{status}</Text>
                <H2 style={{ color: STATUS_COLORS[status] || '#333' }}>{statusCounts[status]}</H2>
              </Box>
            ))}
          </Box>

          {/* Charts */}
          <Box flex flexDirection="row" style={{ gap: '16px', flexWrap: 'wrap' }}>
            <Box variant="white" padding="xl" style={{ borderRadius: '8px', flex: '2 1 400px' }}>
              <H5 mb="xl">Orders Over Time (Last 14 Days)</H5>
              <div style={{ height: 280 }}>
                {ordersByDay.length > 0
                  ? <Line data={lineChartData} options={chartOptions} />
                  : <Text>No order data yet.</Text>
                }
              </div>
            </Box>
            <Box variant="white" padding="xl" style={{ borderRadius: '8px', flex: '1 1 280px' }}>
              <H5 mb="xl">Orders by Status</H5>
              <div style={{ height: 280 }}>
                {statusLabels.length > 0
                  ? <Bar data={barChartData} options={{ ...chartOptions, plugins: { legend: { display: false } } }} />
                  : <Text>No status data yet.</Text>
                }
              </div>
            </Box>
          </Box>
        </>
      ) : (
        <>
          {/* Profile card + order count */}
          <Box flex flexDirection="row" mb="xl" style={{ gap: '16px', flexWrap: 'wrap' }}>
            <Box variant="white" padding="xl" style={{ borderRadius: '8px', flex: '1 1 280px' }}>
              <H5 mb="lg">My Profile</H5>
              <Box mb="lg">
                <Text style={{ color: '#6c757d', fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px' }}>Name</Text>
                <Text style={{ fontWeight: 600 }}>{profile.name || '—'}</Text>
              </Box>
              <Box mb="lg">
                <Text style={{ color: '#6c757d', fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px' }}>Email</Text>
                <Text style={{ fontWeight: 600 }}>{profile.email || '—'}</Text>
              </Box>
              <Box>
                <Text style={{ color: '#6c757d', fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px' }}>Role</Text>
                <Text style={{ fontWeight: 600, textTransform: 'capitalize' }}>{profile.role || '—'}</Text>
              </Box>
            </Box>

            <Box variant="white" padding="xl" style={{ borderRadius: '8px', flex: '1 1 160px', textAlign: 'center', borderTop: '4px solid #007bff' }}>
              <H5 style={{ color: '#6c757d', marginBottom: '8px' }}>My Orders</H5>
              <H2 style={{ color: '#007bff' }}>{myOrders.length}</H2>
            </Box>
          </Box>

          {/* Personal orders table */}
          <Box variant="white" padding="xl" style={{ borderRadius: '8px' }}>
            <H5 mb="xl">My Recent Orders</H5>
            {myOrders.length === 0 ? (
              <Box style={{ textAlign: 'center', padding: '40px 0' }}>
                <Illustration variant="Moon" />
                <Text mt="lg">You have no orders yet.</Text>
              </Box>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e9ecef' }}>
                    {['Order ID', 'Date', 'Status', 'Total'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#6c757d', fontSize: '12px', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myOrders.map((order, i) => (
                    <tr key={order.id} style={{ borderBottom: '1px solid #f1f3f4', background: i % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '13px', color: '#495057' }}>
                        {String(order.id).substring(0, 8)}…
                      </td>
                      <td style={{ padding: '10px 12px', color: '#495057' }}>{order.date}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          padding: '2px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: `${STATUS_COLORS[order.status] || '#6c757d'}22`,
                          color: STATUS_COLORS[order.status] || '#6c757d',
                          border: `1px solid ${STATUS_COLORS[order.status] || '#6c757d'}66`,
                        }}>
                          {order.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#28a745' }}>
                        ${Number(order.totalAmount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default Dashboard;
