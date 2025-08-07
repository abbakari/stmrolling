import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  Package, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Building,
  FileText,
  Send,
  ArrowLeft,
  MessageSquare,
  Target,
  BarChart3,
  ShoppingCart,
  Truck,
  Calendar,
  Download,
  Eye,
  RefreshCw,
  Bell
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWorkflow } from '../contexts/WorkflowContext';
import DataPersistenceManager from '../utils/dataPersistence';

interface ProcessedSubmission {
  id: string;
  type: 'sales_budget' | 'rolling_forecast';
  customerName: string;
  submittedBy: string;
  submittedAt: string;
  items: number;
  totalValue: number;
  totalUnits: number;
  status: 'pending' | 'reviewed' | 'processed' | 'completed';
  priority: 'low' | 'medium' | 'high';
  processingNotes: string;
  supplierRequests: number;
  estimatedDelivery: string;
}

interface SupplyChainMetrics {
  totalSubmissions: number;
  pendingReview: number;
  inProgress: number;
  completed: number;
  totalValue: number;
  averageProcessingTime: number;
}

const SupplyChainManagement: React.FC = () => {
  const { user } = useAuth();
  const { workflowItems, getItemsByState } = useWorkflow();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed' | 'processed' | 'completed'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'sales_budget' | 'rolling_forecast'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<ProcessedSubmission | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [followBackMessage, setFollowBackMessage] = useState('');
  const [showFollowBackModal, setShowFollowBackModal] = useState(false);

  // Sample processed submissions data
  const [processedSubmissions, setProcessedSubmissions] = useState<ProcessedSubmission[]>([
    {
      id: 'sub_001',
      type: 'sales_budget',
      customerName: 'Action Aid International (Tz)',
      submittedBy: 'John Salesman',
      submittedAt: '2024-12-03T10:30:00Z',
      items: 4,
      totalValue: 2850000,
      totalUnits: 650,
      status: 'pending',
      priority: 'high',
      processingNotes: 'Large order requiring supplier coordination',
      supplierRequests: 3,
      estimatedDelivery: '2024-12-15'
    },
    {
      id: 'sub_002',
      type: 'rolling_forecast',
      customerName: 'ADVENT CONSTRUCTION LTD.',
      submittedBy: 'Sarah Johnson',
      submittedAt: '2024-12-02T14:20:00Z',
      items: 2,
      totalValue: 1250000,
      totalUnits: 300,
      status: 'reviewed',
      priority: 'medium',
      processingNotes: 'Standard processing, all suppliers contacted',
      supplierRequests: 2,
      estimatedDelivery: '2024-12-12'
    },
    {
      id: 'sub_003',
      type: 'sales_budget',
      customerName: 'Oxfam Tanzania',
      submittedBy: 'Mike Thompson',
      submittedAt: '2024-12-01T09:15:00Z',
      items: 3,
      totalValue: 980000,
      totalUnits: 220,
      status: 'processed',
      priority: 'medium',
      processingNotes: 'Processing complete, awaiting supplier confirmation',
      supplierRequests: 2,
      estimatedDelivery: '2024-12-10'
    }
  ]);

  // Load manager-submitted data
  useEffect(() => {
    const budgetData = DataPersistenceManager.getSalesBudgetData();
    const forecastData = DataPersistenceManager.getRollingForecastData();
    
    // Convert to processed submissions format
    const budgetSubmissions = budgetData
      .filter(item => item.status === 'approved' || item.status === 'submitted')
      .map(item => ({
        id: `budget_${item.id}`,
        type: 'sales_budget' as const,
        customerName: item.customer,
        submittedBy: item.createdBy,
        submittedAt: item.createdAt,
        items: 1,
        totalValue: item.budgetValue2026,
        totalUnits: item.budget2026,
        status: 'pending' as const,
        priority: item.budgetValue2026 > 100000 ? 'high' : 'medium' as const,
        processingNotes: `Budget submission for ${item.item}`,
        supplierRequests: Math.floor(Math.random() * 3) + 1,
        estimatedDelivery: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }));

    const forecastSubmissions = forecastData
      .filter(item => item.status === 'submitted')
      .map(item => ({
        id: `forecast_${item.id}`,
        type: 'rolling_forecast' as const,
        customerName: item.customer,
        submittedBy: item.createdBy,
        submittedAt: item.createdAt,
        items: 1,
        totalValue: item.forecastTotal * 100,
        totalUnits: item.forecastTotal,
        status: 'pending' as const,
        priority: item.forecastTotal > 50 ? 'high' : 'medium' as const,
        processingNotes: `Forecast submission for ${item.item}`,
        supplierRequests: Math.floor(Math.random() * 2) + 1,
        estimatedDelivery: new Date(Date.now() + Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }));

    // Merge with existing submissions
    setProcessedSubmissions(prev => [
      ...prev.filter(sub => !sub.id.startsWith('budget_') && !sub.id.startsWith('forecast_')),
      ...budgetSubmissions,
      ...forecastSubmissions
    ]);
  }, []);

  const calculateMetrics = (): SupplyChainMetrics => {
    const total = processedSubmissions.length;
    const pending = processedSubmissions.filter(s => s.status === 'pending').length;
    const inProgress = processedSubmissions.filter(s => s.status === 'reviewed' || s.status === 'processed').length;
    const completed = processedSubmissions.filter(s => s.status === 'completed').length;
    const totalValue = processedSubmissions.reduce((sum, s) => sum + s.totalValue, 0);
    const avgProcessingTime = 3.5; // days
    
    return {
      totalSubmissions: total,
      pendingReview: pending,
      inProgress,
      completed,
      totalValue,
      averageProcessingTime: avgProcessingTime
    };
  };

  const metrics = calculateMetrics();

  const filteredSubmissions = processedSubmissions.filter(submission => {
    const matchesSearch = 
      submission.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.submittedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    const matchesType = typeFilter === 'all' || submission.type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || submission.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reviewed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processed': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusUpdate = (submissionId: string, newStatus: ProcessedSubmission['status']) => {
    setProcessedSubmissions(prev => prev.map(sub => 
      sub.id === submissionId ? { ...sub, status: newStatus } : sub
    ));
  };

  const handleFollowBack = (submission: ProcessedSubmission) => {
    setSelectedSubmission(submission);
    setShowFollowBackModal(true);
  };

  const sendFollowBack = () => {
    if (selectedSubmission && followBackMessage) {
      // In a real implementation, this would send a notification back to the manager/salesman
      console.log('Sending follow-back to:', selectedSubmission.submittedBy, 'Message:', followBackMessage);
      
      // Update submission with follow-back note
      setProcessedSubmissions(prev => prev.map(sub => 
        sub.id === selectedSubmission.id 
          ? { ...sub, processingNotes: `${sub.processingNotes} | Follow-back: ${followBackMessage}` }
          : sub
      ));
      
      setShowFollowBackModal(false);
      setFollowBackMessage('');
      setSelectedSubmission(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Truck className="w-8 h-8 text-blue-600" />
              Supply Chain Management
            </h1>
            <p className="text-gray-600">
              Process and manage submissions from managers and coordinate with suppliers
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Data
            </button>
            <button
              onClick={() => console.log('Export report')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalSubmissions}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{metrics.pendingReview}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{metrics.inProgress}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{metrics.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-lg font-bold text-green-600">${(metrics.totalValue / 1000000).toFixed(1)}M</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Processing</p>
                <p className="text-2xl font-bold text-purple-600">{metrics.averageProcessingTime}d</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search submissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="processed">Processed</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="sales_budget">Sales Budget</option>
              <option value="rolling_forecast">Rolling Forecast</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setTypeFilter('all');
                setPriorityFilter('all');
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submission</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubmissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{submission.id}</div>
                        <div className="text-sm text-gray-500">
                          {submission.type === 'sales_budget' ? '💰 Sales Budget' : '📊 Rolling Forecast'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{submission.customerName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{submission.submittedBy}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>{submission.items} items</div>
                        <div className="font-medium">${submission.totalValue.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{submission.totalUnits} units</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(submission.status)}`}>
                        {submission.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(submission.priority)}`}>
                        {submission.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setShowDetailModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleFollowBack(submission)}
                          className="text-green-600 hover:text-green-900 p-1 rounded transition-colors"
                          title="Send follow-back"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </button>
                        {submission.status === 'pending' && (
                          <button
                            onClick={() => handleStatusUpdate(submission.id, 'reviewed')}
                            className="text-purple-600 hover:text-purple-900 p-1 rounded transition-colors"
                            title="Mark as reviewed"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSubmissions.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search criteria or wait for new submissions.
              </p>
            </div>
          )}
        </div>

        {/* Follow-back Modal */}
        {showFollowBackModal && selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Send Follow-back Message
                </h3>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">To: {selectedSubmission.submittedBy}</p>
                  <p className="text-sm text-gray-600">Regarding: {selectedSubmission.customerName}</p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={followBackMessage}
                    onChange={(e) => setFollowBackMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Enter your follow-back message..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={sendFollowBack}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                    disabled={!followBackMessage.trim()}
                  >
                    Send Message
                  </button>
                  <button
                    onClick={() => {
                      setShowFollowBackModal(false);
                      setFollowBackMessage('');
                      setSelectedSubmission(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SupplyChainManagement;
