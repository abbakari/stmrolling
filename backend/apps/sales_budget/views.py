"""
Sales Budget API views with performance optimizations.
"""
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.core.cache import cache
from django.db.models import Q, Sum, Count, Avg, F
from django.utils import timezone
from decimal import Decimal
from apps.core.pagination import OptimizedCursorPagination
from .models import SalesBudget, SalesBudgetTemplate
from .serializers import (
    SalesBudgetSerializer, SalesBudgetCreateSerializer,
    SalesBudgetBulkCreateSerializer, SalesBudgetTemplateSerializer,
    SalesBudgetSummarySerializer, MonthlyBudgetSerializer
)


class SalesBudgetListCreateView(generics.ListCreateAPIView):
    """List sales budget entries and create new entries."""
    
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = OptimizedCursorPagination
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SalesBudgetCreateSerializer
        return SalesBudgetSerializer
    
    def get_queryset(self):
        """Get sales budget entries with filters and permissions."""
        user = self.request.user
        
        # Base queryset with optimizations
        queryset = SalesBudget.objects.select_related(
            'customer', 'item', 'item__category', 'item__brand',
            'salesperson', 'created_by'
        )
        
        # Permission filtering
        if user.role == user.Role.SALESPERSON:
            queryset = queryset.filter(
                Q(salesperson=user) | Q(customer__salesperson=user)
            )
        elif user.role == user.Role.VIEWER:
            queryset = queryset.filter(
                Q(salesperson=user) | Q(customer__salesperson=user)
            )
        
        # Apply filters
        year = self.request.query_params.get('year', None)
        month = self.request.query_params.get('month', None)
        quarter = self.request.query_params.get('quarter', None)
        customer_id = self.request.query_params.get('customer', None)
        item_id = self.request.query_params.get('item', None)
        salesperson_id = self.request.query_params.get('salesperson', None)
        status_filter = self.request.query_params.get('status', None)
        distribution_type = self.request.query_params.get('distribution_type', None)
        is_manual = self.request.query_params.get('is_manual', None)
        
        if year:
            queryset = queryset.filter(year=year)
        
        if month:
            queryset = queryset.filter(month=month)
        
        if quarter:
            quarter_months = {
                '1': [1, 2, 3], '2': [4, 5, 6],
                '3': [7, 8, 9], '4': [10, 11, 12]
            }
            if quarter in quarter_months:
                queryset = queryset.filter(month__in=quarter_months[quarter])
        
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        
        if item_id:
            queryset = queryset.filter(item_id=item_id)
        
        if salesperson_id and user.can_manage_users():
            queryset = queryset.filter(salesperson_id=salesperson_id)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if distribution_type:
            queryset = queryset.filter(distribution_type=distribution_type)
        
        if is_manual is not None:
            is_manual_bool = is_manual.lower() in ['true', '1', 'yes']
            queryset = queryset.filter(is_manual_entry=is_manual_bool)
        
        return queryset.order_by('-year', '-month', 'customer__name', 'item__name')


class SalesBudgetDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a sales budget entry."""
    
    serializer_class = SalesBudgetSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get sales budget entries based on user permissions."""
        user = self.request.user
        queryset = SalesBudget.objects.select_related(
            'customer', 'item', 'salesperson', 'created_by'
        )
        
        if user.role == user.Role.SALESPERSON:
            queryset = queryset.filter(
                Q(salesperson=user) | Q(customer__salesperson=user)
            )
        elif user.role == user.Role.VIEWER:
            queryset = queryset.filter(
                Q(salesperson=user) | Q(customer__salesperson=user)
            )
        
        return queryset
    
    def perform_update(self, serializer):
        """Update with permission checks."""
        instance = self.get_object()
        user = self.request.user
        
        # Check if user can modify this entry
        if instance.status == SalesBudget.Status.APPROVED and not user.is_admin():
            raise permissions.PermissionDenied("Cannot modify approved budget entries.")
        
        serializer.save()
    
    def perform_destroy(self, instance):
        """Delete with permission checks."""
        user = self.request.user
        
        if instance.status == SalesBudget.Status.APPROVED and not user.is_admin():
            raise permissions.PermissionDenied("Cannot delete approved budget entries.")
        
        instance.delete()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def bulk_create_budget_view(request):
    """Bulk create sales budget entries."""
    serializer = SalesBudgetBulkCreateSerializer(
        data=request.data,
        context={'request': request}
    )
    
    if serializer.is_valid():
        data = serializer.validated_data
        customer = data['customer']
        items = data['items']
        year = data['year']
        total_amount = data['total_amount']
        distribution_type = data['distribution_type']
        
        # Calculate amount per item
        amount_per_item = total_amount / len(items)
        
        # Calculate seasonal multipliers if needed
        seasonal_multipliers = {}
        if distribution_type == SalesBudget.DistributionType.SEASONAL:
            # Inverted seasonal pattern (high Jan-Apr, low Nov-Dec)
            seasonal_multipliers = {
                1: 1.60, 2: 1.50, 3: 1.40, 4: 1.30,  # High months
                5: 1.20, 6: 1.10, 7: 1.00, 8: 0.90,  # Medium months
                9: 0.80, 10: 0.75, 11: 0.70, 12: 0.60  # Low months (holidays)
            }
        
        created_entries = []
        for month in range(1, 13):
            for item in items:
                # Calculate quantity based on item price and distribution
                base_quantity = amount_per_item / item.unit_price if item.unit_price > 0 else 0
                
                if distribution_type == SalesBudget.DistributionType.SEASONAL:
                    multiplier = seasonal_multipliers.get(month, 1.0)
                    quantity = base_quantity * multiplier
                    seasonal_multiplier = multiplier
                else:
                    quantity = base_quantity
                    seasonal_multiplier = 1.0
                
                # Create budget entry
                budget_entry = SalesBudget.objects.create(
                    customer=customer,
                    item=item,
                    year=year,
                    month=month,
                    quantity=quantity,
                    unit_price=item.unit_price,
                    distribution_type=distribution_type,
                    seasonal_multiplier=seasonal_multiplier,
                    salesperson=customer.salesperson or request.user,
                    created_by=request.user,
                    status=SalesBudget.Status.DRAFT
                )
                created_entries.append(budget_entry)
        
        return Response({
            'message': f'Successfully created {len(created_entries)} budget entries.',
            'entries_created': len(created_entries)
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def budget_summary_view(request):
    """Get sales budget summary statistics."""
    user = request.user
    year = request.query_params.get('year', timezone.now().year)
    
    cache_key = f'budget_summary_{user.id}_{user.role}_{year}'
    summary = cache.get(cache_key)
    
    if summary is None:
        # Base queryset based on permissions
        if user.role == user.Role.SALESPERSON:
            queryset = SalesBudget.objects.filter(
                Q(salesperson=user) | Q(customer__salesperson=user),
                year=year
            )
        elif user.role == user.Role.VIEWER:
            queryset = SalesBudget.objects.filter(
                Q(salesperson=user) | Q(customer__salesperson=user),
                year=year
            )
        else:
            queryset = SalesBudget.objects.filter(year=year)
        
        # Calculate summary statistics
        summary = queryset.aggregate(
            total_amount=Sum('total_amount'),
            total_quantity=Sum('quantity'),
            entry_count=Count('id'),
            avg_unit_price=Avg('unit_price'),
            approved_amount=Sum(
                'total_amount',
                filter=Q(status=SalesBudget.Status.APPROVED)
            ),
            draft_amount=Sum(
                'total_amount',
                filter=Q(status=SalesBudget.Status.DRAFT)
            )
        )
        
        # Add percentage calculations
        total = summary['total_amount'] or 0
        if total > 0:
            summary['approved_percentage'] = (
                (summary['approved_amount'] or 0) / total * 100
            )
            summary['draft_percentage'] = (
                (summary['draft_amount'] or 0) / total * 100
            )
        else:
            summary['approved_percentage'] = 0
            summary['draft_percentage'] = 0
        
        # Monthly breakdown
        monthly_data = queryset.values('month').annotate(
            monthly_total=Sum('total_amount'),
            monthly_quantity=Sum('quantity'),
            monthly_count=Count('id')
        ).order_by('month')
        
        summary['monthly_breakdown'] = list(monthly_data)
        
        cache.set(cache_key, summary, 300)  # Cache for 5 minutes
    
    return Response(summary)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def monthly_budget_view(request):
    """Get detailed monthly budget data."""
    user = request.user
    year = request.query_params.get('year', timezone.now().year)
    month = request.query_params.get('month', timezone.now().month)
    
    cache_key = f'monthly_budget_{user.id}_{user.role}_{year}_{month}'
    data = cache.get(cache_key)
    
    if data is None:
        # Base queryset based on permissions
        if user.role == user.Role.SALESPERSON:
            queryset = SalesBudget.objects.filter(
                Q(salesperson=user) | Q(customer__salesperson=user),
                year=year, month=month
            )
        elif user.role == user.Role.VIEWER:
            queryset = SalesBudget.objects.filter(
                Q(salesperson=user) | Q(customer__salesperson=user),
                year=year, month=month
            )
        else:
            queryset = SalesBudget.objects.filter(year=year, month=month)
        
        # Calculate monthly totals
        monthly_totals = queryset.aggregate(
            total_amount=Sum('total_amount'),
            total_quantity=Sum('quantity'),
            entry_count=Count('id')
        )
        
        # Top items for the month
        top_items = queryset.values(
            'item__code', 'item__name', 'item__category__name'
        ).annotate(
            item_total=Sum('total_amount')
        ).order_by('-item_total')[:5]
        
        # Top customers for the month
        top_customers = queryset.values(
            'customer__code', 'customer__name'
        ).annotate(
            customer_total=Sum('total_amount')
        ).order_by('-customer_total')[:5]
        
        month_names = [
            '', 'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ]
        
        data = {
            'month': month,
            'month_name': month_names[int(month)],
            'total_amount': monthly_totals['total_amount'] or 0,
            'total_quantity': monthly_totals['total_quantity'] or 0,
            'entry_count': monthly_totals['entry_count'] or 0,
            'top_items': list(top_items),
            'top_customers': list(top_customers)
        }
        
        cache.set(cache_key, data, 300)  # Cache for 5 minutes
    
    return Response(data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def approve_budget_entries_view(request):
    """Approve multiple budget entries."""
    entry_ids = request.data.get('entry_ids', [])
    
    if not entry_ids:
        return Response(
            {'error': 'No entry IDs provided.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = request.user
    
    # Check if user can approve entries
    if not user.can_manage_users():
        return Response(
            {'error': 'You do not have permission to approve budget entries.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get entries to approve
    queryset = SalesBudget.objects.filter(
        id__in=entry_ids,
        status=SalesBudget.Status.SUBMITTED
    )
    
    # Update entries
    updated_count = queryset.update(
        status=SalesBudget.Status.APPROVED,
        approved_by=user,
        approved_at=timezone.now()
    )
    
    return Response({
        'message': f'Successfully approved {updated_count} budget entries.',
        'approved_count': updated_count
    })


# Sales Budget Template Views
class SalesBudgetTemplateListCreateView(generics.ListCreateAPIView):
    """List and create sales budget templates."""
    
    serializer_class = SalesBudgetTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get templates based on user permissions."""
        queryset = SalesBudgetTemplate.objects.all()
        
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            is_active_bool = is_active.lower() in ['true', '1', 'yes']
            queryset = queryset.filter(is_active=is_active_bool)
        
        return queryset.order_by('name')


class SalesBudgetTemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a sales budget template."""
    
    serializer_class = SalesBudgetTemplateSerializer
    queryset = SalesBudgetTemplate.objects.all()
    permission_classes = [permissions.IsAuthenticated]
