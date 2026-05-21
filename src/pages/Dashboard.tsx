import { useState } from "react";
import { Users, UserCheck, UserX, TrendingUp, Calendar, AlertTriangle } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { AttendanceChart } from "@/components/dashboard/AttendanceChart";
import { ProgramParticipationChart } from "@/components/dashboard/ProgramParticipationChart";
import { EngagementPieChart } from "@/components/dashboard/EngagementPieChart";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { dashboardMetrics } from "@/data/mockData";
import { useAuth } from "@/auth/AuthContext";

const Dashboard = () => {
  const { activeMembership } = useAuth();
  const memberLabel = activeMembership?.memberLabel ?? "People";
  const programLabel = activeMembership?.programLabel ?? "Programs";
  const primaryFocus = activeMembership?.primaryFocus ?? "programs";
  const [filters, setFilters] = useState({
    ageGroup: "all",
    gender: "all",
    ministry: "all",
    timePeriod: "all",
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      ageGroup: "all",
      gender: "all",
      ministry: "all",
      timePeriod: "all",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Dashboard Overview</h1>
        <p className="page-description">Welcome back. Here's an overview of your {primaryFocus.toLowerCase()}.</p>
      </div>

      <DashboardFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title={`Total ${memberLabel}`}
          value={dashboardMetrics.totalYouths}
          icon={Users}
          change={{ value: 8, label: "this month" }}
          trend="up"
        />
        <MetricCard
          title="Active Members"
          value={dashboardMetrics.activeYouths}
          icon={UserCheck}
          change={{ value: 5, label: "vs last month" }}
          trend="up"
        />
        <MetricCard
          title="Inactive"
          value={dashboardMetrics.inactiveYouths}
          icon={UserX}
          change={{ value: -2, label: "vs last month" }}
          trend="down"
        />
        <MetricCard
          title="Retention Rate"
          value={`${dashboardMetrics.retentionRate}%`}
          icon={TrendingUp}
          change={{ value: 3, label: "vs last quarter" }}
          trend="up"
        />
        <MetricCard
          title={`Active ${programLabel}`}
          value={dashboardMetrics.activePrograms}
          icon={Calendar}
        />
        <MetricCard
          title="At-Risk"
          value={dashboardMetrics.atRiskCount}
          icon={AlertTriangle}
          change={{ value: 2, label: "new this week" }}
          trend="neutral"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceChart />
        <ProgramParticipationChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <EngagementPieChart />
        </div>
        <div className="lg:col-span-2">
          <RecentActivityFeed />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
