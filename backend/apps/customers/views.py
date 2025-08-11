"""
Customer API views with performance optimizations.
"""
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.core.cache import cache
from django.db.models import Q, Sum, Count
from apps.core.pagination import OptimizedCursorPagination
from .models import Customer, CustomerContact
from .serializers import (
    CustomerSerializer, CustomerCreateSerializer, 
    CustomerSummarySerializer, CustomerContactSerializer
)


class CustomerListCreateView(generics.ListCreateAPIView):
    """List customers and create new customers."""
    
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = OptimizedCursorPagination
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CustomerCreateSerializer
        return CustomerSerializer
    
    def get_queryset(self):
        """Get customers based on user permissions and filters."""
        user = self.request.user
        
        # Base queryset with optimizations
        queryset = Customer.objects.select_related('salesperson').prefetch_related('contacts')
        
        # Permission filtering
        if user.role == user.Role.SALESPERSON:
            queryset = queryset.filter(salesperson=user)
        elif user.role == user.Role.VIEWER:
            queryset = queryset.filter(salesperson=user)
        
        # Apply filters
        search = self.request.query_params.get('search', None)
        status_filter = self.request.query_params.get('status', None)
        category = self.request.query_params.get('category', None)
        salesperson_id = self.request.query_params.get('salesperson', None)
        is_active = self.request.query_params.get('is_active', None)
        
        if search:
            queryset = queryset.filter(
                Q(code__icontains=search) |
                Q(name__icontains=search) |
                Q(email__icontains=search)
            )
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if category:
            queryset = queryset.filter(category=category)
        
        if salesperson_id and user.can_manage_users():
            queryset = queryset.filter(salesperson_id=salesperson_id)
        
        if is_active is not None:
            is_active_bool = is_active.lower() in ['true', '1', 'yes']
            queryset = queryset.filter(is_active=is_active_bool)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        """Create customer with automatic salesperson assignment."""
        user = self.request.user
        
        # Auto-assign salesperson if not provided
        if not serializer.validated_data.get('salesperson'):
            if user.role in [user.Role.SALESPERSON, user.Role.MANAGER]:
                serializer.save(salesperson=user)
            else:
                serializer.save()
        else:
            serializer.save()


class CustomerDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a customer."""
    
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get customers based on user permissions."""
        user = self.request.user
        queryset = Customer.objects.select_related('salesperson').prefetch_related('contacts')
        
        if user.role == user.Role.SALESPERSON:
            queryset = queryset.filter(salesperson=user)
        elif user.role == user.Role.VIEWER:
            queryset = queryset.filter(salesperson=user)
        
        return queryset
    
    def perform_update(self, serializer):
        """Update customer with permission check."""
        customer = self.get_object()
        user = self.request.user
        
        # Check permissions for salesperson assignment
        if 'salesperson' in serializer.validated_data:
            if not user.can_manage_users() and user.role != user.Role.MANAGER:
                serializer.validated_data.pop('salesperson')
        
        serializer.save()
    
    def perform_destroy(self, instance):
        """Soft delete customer."""
        instance.is_active = False
        instance.save()


class CustomerSummaryView(generics.ListAPIView):
    """Get customer summary data for dropdowns and references."""
    
    serializer_class = CustomerSummarySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get active customers based on user permissions."""
        user = self.request.user
        queryset = Customer.objects.filter(is_active=True).select_related('salesperson')
        
        if user.role == user.Role.SALESPERSON:
            queryset = queryset.filter(salesperson=user)
        elif user.role == user.Role.VIEWER:
            queryset = queryset.filter(salesperson=user)
        
        return queryset.order_by('name')


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def customer_stats_view(request):
    """Get customer statistics for dashboard."""
    user = request.user
    cache_key = f'customer_stats_{user.id}_{user.role}'
    stats = cache.get(cache_key)
    
    if stats is None:
        # Base queryset based on user permissions
        if user.role == user.Role.SALESPERSON:
            queryset = Customer.objects.filter(salesperson=user)
        elif user.role == user.Role.VIEWER:
            queryset = Customer.objects.filter(salesperson=user)
        else:
            queryset = Customer.objects.all()
        
        # Calculate stats
        stats = {
            'total_customers': queryset.filter(is_active=True).count(),
            'active_customers': queryset.filter(status=Customer.Status.ACTIVE).count(),
            'inactive_customers': queryset.filter(status=Customer.Status.INACTIVE).count(),
            'prospect_customers': queryset.filter(status=Customer.Status.PROSPECT).count(),
            'high_value_customers': queryset.filter(
                is_active=True,
                total_sales_ytd__gt=100000
            ).count(),
            'total_credit_limit': queryset.filter(is_active=True).aggregate(
                total=Sum('credit_limit')
            )['total'] or 0,
            'total_sales_ytd': queryset.filter(is_active=True).aggregate(
                total=Sum('total_sales_ytd')
            )['total'] or 0,
        }
        
        # Category breakdown
        category_stats = queryset.filter(is_active=True).values('category').annotate(
            count=Count('id')
        ).order_by('category')
        
        stats['by_category'] = {
            item['category']: item['count'] for item in category_stats
        }
        
        cache.set(cache_key, stats, 300)  # Cache for 5 minutes
    
    return Response(stats)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def top_customers_view(request):
    """Get top customers by sales."""
    user = request.user
    limit = int(request.query_params.get('limit', 10))
    
    cache_key = f'top_customers_{user.id}_{user.role}_{limit}'
    customers = cache.get(cache_key)
    
    if customers is None:
        # Base queryset based on user permissions
        if user.role == user.Role.SALESPERSON:
            queryset = Customer.objects.filter(salesperson=user, is_active=True)
        elif user.role == user.Role.VIEWER:
            queryset = Customer.objects.filter(salesperson=user, is_active=True)
        else:
            queryset = Customer.objects.filter(is_active=True)
        
        customers_data = queryset.order_by('-total_sales_ytd')[:limit].values(
            'id', 'code', 'name', 'total_sales_ytd', 'category', 'salesperson__full_name'
        )
        
        customers = list(customers_data)
        cache.set(cache_key, customers, 300)  # Cache for 5 minutes
    
    return Response(customers)


class CustomerContactListCreateView(generics.ListCreateAPIView):
    """List and create customer contacts."""
    
    serializer_class = CustomerContactSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get contacts for a specific customer."""
        customer_id = self.kwargs.get('customer_id')
        return CustomerContact.objects.filter(
            customer_id=customer_id,
            is_active=True
        ).order_by('-is_primary', 'name')
    
    def perform_create(self, serializer):
        """Create contact for specific customer."""
        customer_id = self.kwargs.get('customer_id')
        serializer.save(customer_id=customer_id)


class CustomerContactDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a customer contact."""
    
    serializer_class = CustomerContactSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get contacts for a specific customer."""
        customer_id = self.kwargs.get('customer_id')
        return CustomerContact.objects.filter(customer_id=customer_id)
    
    def perform_destroy(self, instance):
        """Soft delete contact."""
        instance.is_active = False
        instance.save()
