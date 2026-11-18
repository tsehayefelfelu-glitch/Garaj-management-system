import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
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
  Filler,
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
  Legend,
  Filler
);

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const lineChartData = {
    labels: stats?.timeline?.labels || ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
    datasets: [
      {
        label: 'Job Card Timeline (Vehicles Serviced)',
        data: stats?.timeline?.data || [35, 42, 58, 65, 80, 72, 95],
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.15)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const revenueChartData = {
    labels: stats?.timeline?.labels || ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
    datasets: [
      {
        label: 'Monthly Gross Revenue (ETB)',
        data: stats?.timeline?.revenue || [120000, 150000, 210000, 185000, 290000, 245000, 310000],
        backgroundColor: '#10b981',
        borderRadius: 6,
      },
    ],
  };

  return (
    <>
      <Head>
        <title>Dashboard | Wise Digital Garage System</title>
      </Head>

      <div className="container-fluid p-0">
        {/* Welcome Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
          <div>
            <h4 className="fw-bold mb-1 text-dark">Workshop Overview & Analytics</h4>
            <p className="text-muted small mb-0">
              Welcome to Wise Digital Garage Management & Operations Tracking System
            </p>
          </div>
          <div className="d-flex gap-2">
            <Link href="/customer-service" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1">
              <i className="bi bi-search"></i>
              <span>Customer Service</span>
            </Link>
            <Link href="/job-cards/new" className="btn btn-primary btn-sm d-flex align-items-center gap-1">
              <i className="bi bi-plus-circle"></i>
              <span>New Job Card</span>
            </Link>
          </div>
        </div>

        {/* Low Stock Alert Banner */}
        {stats?.lowStockCount > 0 && (
          <div className="alert alert-warning border-0 shadow-sm d-flex align-items-center justify-content-between mb-4">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill fs-5 text-warning"></i>
              <div>
                <strong>Inventory Stock Alert:</strong> {stats.lowStockCount} spare part items have fallen below safety reorder threshold!
              </div>
            </div>
            <Link href="/inventory" className="btn btn-sm btn-dark text-nowrap">
              Review Low Stock
            </Link>
          </div>
        )}

        {/* 4 Colored Metric Cards (Matching Photo 6 AGMS Style) */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-xl-3">
            <div className="card stat-card text-white" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}>
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="text-white-50 small text-uppercase fw-semibold">Job Cards</div>
                    <h2 className="fw-bold my-2">{stats?.cards?.totalJobCards || 0}</h2>
                    <div className="small">
                      <span className="badge bg-white text-dark me-1">Active: {stats?.cards?.activeJobCards || 0}</span>
                      <span className="badge bg-white bg-opacity-25">Closed: {stats?.cards?.terminatedJobCards || 0}</span>
                    </div>
                  </div>
                  <div className="bg-white bg-opacity-25 rounded-3 p-3">
                    <i className="bi bi-card-checklist fs-3"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="card stat-card text-white" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' }}>
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="text-white-50 small text-uppercase fw-semibold">Proformas</div>
                    <h2 className="fw-bold my-2">{stats?.cards?.totalProformas || 0}</h2>
                    <div className="small">
                      <span className="badge bg-white text-dark me-1">Active: {stats?.cards?.activeProformas || 0}</span>
                      <span className="badge bg-white bg-opacity-25">Converted: {stats?.cards?.convertedProformas || 0}</span>
                    </div>
                  </div>
                  <div className="bg-white bg-opacity-25 rounded-3 p-3">
                    <i className="bi bi-file-earmark-spreadsheet fs-3"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="card stat-card text-white" style={{ background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' }}>
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="text-white-50 small text-uppercase fw-semibold">Vehicles</div>
                    <h2 className="fw-bold my-2">{stats?.cards?.totalVehicles || 0}</h2>
                    <div className="small text-white-75">
                      <i className="bi bi-person-check me-1"></i> {stats?.cards?.totalCustomers || 0} Registered Clients
                    </div>
                  </div>
                  <div className="bg-white bg-opacity-25 rounded-3 p-3">
                    <i className="bi bi-car-front fs-3"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="card stat-card text-white" style={{ background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)' }}>
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="text-white-50 small text-uppercase fw-semibold">Total Revenue</div>
                    <h2 className="fw-bold my-2" style={{ fontSize: '1.6rem' }}>
                      ETB {(stats?.cards?.totalRevenue || 0).toLocaleString()}
                    </h2>
                    <div className="small text-white-75">
                      <i className="bi bi-receipt me-1"></i> Invoiced & Received
                    </div>
                  </div>
                  <div className="bg-white bg-opacity-25 rounded-3 p-3">
                    <i className="bi bi-cash-stack fs-3"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-lg-7">
            <div className="card border-0 shadow-sm rounded-3 h-100">
              <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                <h6 className="fw-bold mb-0 text-dark">
                  <i className="bi bi-activity text-primary me-2"></i>
                  Job Card Timeline (Vehicles Serviced)
                </h6>
                <span className="badge bg-light text-muted">Monthly</span>
              </div>
              <div className="card-body p-3" style={{ height: '320px' }}>
                <Line
                  data={lineChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top' as const },
                    },
                    scales: {
                      y: { beginAtZero: true },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-5">
            <div className="card border-0 shadow-sm rounded-3 h-100">
              <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                <h6 className="fw-bold mb-0 text-dark">
                  <i className="bi bi-bar-chart-line text-success me-2"></i>
                  Revenue Distribution
                </h6>
                <span className="badge bg-success-subtle text-success">ETB</span>
              </div>
              <div className="card-body p-3" style={{ height: '320px' }}>
                <Bar
                  data={revenueChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      y: { beginAtZero: true },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Job Cards Table */}
        <div className="card border-0 shadow-sm rounded-3">
          <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
            <h6 className="fw-bold mb-0 text-dark">
              <i className="bi bi-clock-history text-info me-2"></i>
              Recent Job Cards
            </h6>
            <Link href="/job-cards" className="btn btn-sm btn-outline-secondary">
              View All
            </Link>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 custom-table">
              <thead>
                <tr>
                  <th>Card Number</th>
                  <th>Customer Name</th>
                  <th>Vehicle Plate</th>
                  <th>Entry Date</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentJobCards?.map((jc: any) => (
                  <tr key={jc.id}>
                    <td className="fw-bold text-primary">{jc.cardNumber}</td>
                    <td>{jc.customer?.name}</td>
                    <td>
                      <span className="badge bg-light text-dark border">{jc.vehicle?.plateNumber}</span>
                    </td>
                    <td>{new Date(jc.entryDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${jc.status === 'ACTIVE' ? 'bg-primary' : 'bg-secondary'}`}>
                        {jc.status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${jc.paymentStatus === 'PAID' ? 'bg-success' : 'bg-warning text-dark'}`}>
                        {jc.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <Link href={`/job-cards/${jc.id}`} className="btn btn-sm btn-light border">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
