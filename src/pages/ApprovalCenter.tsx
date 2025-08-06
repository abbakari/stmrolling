import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageSquare, 
  Eye, 
  Send,
  Filter,
  Search,
  Calendar,
  User,
  Building,
  Target,
  TrendingUp,
  Bell,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Package
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWorkflow, WorkflowState } from '../contexts/WorkflowContext';
import { useBudget } from '../contexts/BudgetContext';
import WorkflowItemDetailModal from '../components/WorkflowItemDetailModal';

const ApprovalCenter: React.FC = () => {
  const { user } = useAuth();
  const { 
    workflowItems, 
    notifications, 
    getItemsByState, 
    getItemsBySalesman, 
    getItemsByYear,
    getNotificationsForUser,
    markNotificationAsRead 
  } = useWorkflow();
  
  const [selectedFilter, setSelectedFilter] = useState<WorkflowState | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedSalesman, setSelectedSalesman] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Generate years from 2021 to current year + 1
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2021; year <= currentYear + 1; year++) {
      years.push(year.toString());
    }
    return years;
  };

  // Get unique salesmen
  const getSalesmen = () => {
    const salesmen = [...new Set(workflowItems.map(item => item.createdBy))];
    return salesmen;
  };

  // Filter items based on all criteria
  const filteredItems = workflowItems.filter(item => {
    const matchesFilter = selectedFilter === 'all' || item.currentState === selectedFilter;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.createdBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.customers.some(customer => customer.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesYear = selectedYear === 'all' || item.year === selectedYear;
    const matchesSalesman = selectedSalesman === 'all' || item.createdBy === selectedSalesman;
    
    return matchesFilter && matchesSearch && matchesYear && matchesSalesman;
  });

  // Get notifications for current user
  const userNotifications = user ? getNotificationsForUser(user.name, user.role) : [];
  const unreadNotifications = userNotifications.filter(n => !n.read);

  const getStateColor = (state: WorkflowState) => {
    switch (state) {
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_review':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'sent_to_supply_chain':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStateIcon = (state: WorkflowState) => {
    switch (state) {
      case 'submitted':
        return <Clock className="w-4 h-4" />;
      case 'in_review':
        return <Eye className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'sent_to_supply_chain':
        return <Send className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleViewDetails = (item: any) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const toggleCardExpansion = (itemId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedCards(newExpanded);
  };

  // Statistics
  const stats = {
    total: workflowItems.length,
    pending: getItemsByState('submitted').length,
    approved: getItemsByState('approved').length,
    rejected: getItemsByState('rejected').length,
    sentToSupplyChain: getItemsByState('sent_to_supply_chain').length,
    totalValue: workflowItems.reduce((sum, item) => sum + item.totalValue, 0)
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with Statistics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                🏢 Approval Center
                {unreadNotifications.length > 0 && (
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm">
                    {unreadNotifications.length} new
                  </span>
                )}
              </h1>
              <p className="text-gray-600 mt-1">
                Review and approve sales budgets and forecasts from {getSalesmen().length} salesmen
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">Years Available</div>
                <div className="text-lg font-semibold text-gray-900">2021 - {new Date().getFullYear() + 1}</div>
              </div>
            </div>
          </div>

          {/* Statistics Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Total Items</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-900">Pending</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Approved</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-900">Rejected</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Send className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">To Supply</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{stats.sentToSupplyChain}</p>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Total Value</span>
              </div>
              <p className="text-xl font-bold text-gray-600">${(stats.totalValue / 1000).toFixed(0)}K</p>
            </div>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by title, salesman, or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value as WorkflowState | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="sent_to_supply_chain">Sent to Supply Chain</option>
              </select>
            </div>

            {/* Year Filter */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Years</option>
                {generateYears().map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Salesman Filter */}
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <select
                value={selectedSalesman}
                onChange={(e) => setSelectedSalesman(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Salesmen</option>
                {getSalesmen().map(salesman => (
                  <option key={salesman} value={salesman}>{salesman}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedFilter('all');
                setSelectedYear(new Date().getFullYear().toString());
                setSelectedSalesman('all');
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Workflow Items */}
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Main Card Content */}
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStateColor(item.currentState)}`}>
                        {getStateIcon(item.currentState)}
                        {item.currentState.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(item.priority)}`}>
                        {item.priority.toUpperCase()}
                      </span>
                      {item.type === 'sales_budget' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          <Target className="w-3 h-3" />
                          Budget
                        </span>
                      )}
                      {item.type === 'rolling_forecast' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          <TrendingUp className="w-3 h-3" />
                          Forecast
                        </span>
                      )}
                    </div>
                    
                    {/* Summary Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Created By</span>
                        <p className="text-sm font-medium text-gray-900">{item.createdBy}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Year</span>
                        <p className="text-sm font-medium text-gray-900">{item.year}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Customers</span>
                        <p className="text-sm font-medium text-gray-900">{item.customers.length}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Total Value</span>
                        <p className="text-sm font-medium text-green-600">${item.totalValue.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Submitted</span>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(item.submittedAt!).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Comments</span>
                        <p className="text-sm font-medium text-gray-900">{item.comments.length}</p>
                      </div>
                    </div>

                    {/* Customer List */}
                    <div className="mb-4">
                      <span className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">Customers</span>
                      <div className="flex flex-wrap gap-2">
                        {item.customers.slice(0, 3).map((customer, index) => (
                          <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                            <Building className="w-3 h-3" />
                            {customer}
                          </span>
                        ))}
                        {item.customers.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            +{item.customers.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Recent Comments Preview */}
                    {item.comments.length > 0 && (
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Latest Comment</span>
                          <button
                            onClick={() => toggleCardExpansion(item.id)}
                            className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                          >
                            {expandedCards.has(item.id) ? (
                              <>Hide <ChevronUp className="w-3 h-3" /></>
                            ) : (
                              <>Show All <ChevronDown className="w-3 h-3" /></>
                            )}
                          </button>
                        </div>
                        
                        {/* Latest comment */}
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {item.comments[item.comments.length - 1].author}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(item.comments[item.comments.length - 1].timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {item.comments[item.comments.length - 1].message}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 ml-6">
                    <button
                      onClick={() => handleViewDetails(item)}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    
                    {item.currentState === 'submitted' && user?.role === 'manager' && (
                      <>
                        <button
                          onClick={() => handleViewDetails(item)}
                          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Quick Approve
                        </button>
                        <button
                          onClick={() => handleViewDetails(item)}
                          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Quick Reject
                        </button>
                      </>
                    )}
                    
                    {item.currentState === 'approved' && user?.role === 'manager' && (
                      <button
                        onClick={() => handleViewDetails(item)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                        Send to Supply
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Comments Section */}
              {expandedCards.has(item.id) && item.comments.length > 1 && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">All Comments</h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {item.comments.slice(0, -1).map((comment) => (
                      <div key={comment.id} className="bg-white rounded-lg p-3 border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{comment.author}</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              comment.type === 'approval' ? 'bg-green-100 text-green-800' :
                              comment.type === 'rejection' ? 'bg-red-100 text-red-800' :
                              comment.isFollowBack ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {comment.isFollowBack ? 'Follow-back' : comment.type}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="text-gray-500 text-lg mb-2">No items found</div>
            <div className="text-gray-400 text-sm">
              {searchTerm || selectedFilter !== 'all' || selectedYear !== 'all' || selectedSalesman !== 'all' ? 
                'Try adjusting your search criteria or filters' : 
                'No workflow items have been submitted yet'
              }
            </div>
          </div>
        )}

        {/* Recent Notifications */}
        {unreadNotifications.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Recent Notifications ({unreadNotifications.length})
            </h3>
            <div className="space-y-2">
              {unreadNotifications.slice(0, 3).map((notification) => (
                <div key={notification.id} className="bg-white border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-900">{notification.title}</h4>
                      <p className="text-sm text-blue-700 mt-1">{notification.message}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-blue-600">
                        <span>From: {notification.fromUser}</span>
                        <span>•</span>
                        <span>{new Date(notification.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => markNotificationAsRead(notification.id)}
                      className="text-blue-600 hover:text-blue-800 text-xs"
                    >
                      Mark as read
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedItem && (
        <WorkflowItemDetailModal
          item={selectedItem}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedItem(null);
          }}
        />
      )}
    </Layout>
  );
};

export default ApprovalCenter;
