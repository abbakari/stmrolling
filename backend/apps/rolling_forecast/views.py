"""
Rolling Forecast API views with performance optimizations.
"""
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.core.cache import cache
from django.db.models import Q, Sum, Count, Avg, F
from django.utils import timezone
from decimal import Decimal
from apps.core.pagination import OptimizedCursorPagination
from .models import RollingForecast
from .serializers import (
    RollingForecastSerializer, RollingForecastCreateSerializer,
    ForecastVarianceAnalysisSerializer,
    MonthlyForecastSerializer
)


class RollingForecastListCreateView(generics.ListCreateAPIView):
    """List rolling forecast entries and create new entries."""
    
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = OptimizedCursorPagination
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return RollingForecastCreateSerializer
        return RollingForecastSerializer
    
    def get_queryset(self):
        """Get rolling forecast entries with filters and permissions."""
        user = self.request.user
        
        # Base queryset with optimizations
        queryset = RollingForecast.objects.select_related(
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
        forecast_type = self.request.query_params.get('forecast_type', None)
        is_latest = self.request.query_params.get('is_latest', None)
        
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
        
        if forecast_type:
            queryset = queryset.filter(forecast_type=forecast_type)
        
        if is_latest is not None:
            is_latest_bool = is_latest.lower() in ['true', '1', 'yes']
            queryset = queryset.filter(is_latest=is_latest_bool)
        
        return queryset.order_by('-year', '-month', '-version', 'customer__name', 'item__name')


class RollingForecastDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a rolling forecast entry."""
    
    serializer_class = RollingForecastSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get rolling forecast entries based on user permissions."""
        user = self.request.user
        queryset = RollingForecast.objects.select_related(
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
        if instance.status == RollingForecast.Status.APPROVED and not user.is_admin():
            raise permissions.PermissionDenied("Cannot modify approved forecast entries.")
        
        serializer.save()
    
    def perform_destroy(self, instance):
        """Delete with permission checks."""
        user = self.request.user
        
        if instance.status == RollingForecast.Status.APPROVED and not user.is_admin():
            raise permissions.PermissionDenied("Cannot delete approved forecast entries.")
        
        instance.delete()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def bulk_create_forecast_view(request):
    """Bulk create rolling forecast entries."""
    serializer = RollingForecastBulkCreateSerializer(
        data=request.data,
        context={'request': request}
    )
    
    if serializer.is_valid():
        data = serializer.validated_data
        customer = data['customer']
        items = data['items']
        year = data['year']
        forecast_data = data['forecast_data']
        
        created_entries = []
        for forecast_month_data in forecast_data:
            month = forecast_month_data['month']
            forecasted_amount = forecast_month_data['forecasted_amount']
            forecast_type = forecast_month_data.get('forecast_type', 'realistic')
            
            for item in items:
                # Create forecast entry
                forecast_entry = RollingForecast.objects.create(
                    customer=customer,
                    item=item,
                    year=year,
                    month=month,
                    forecasted_amount=forecasted_amount,
                    forecasted_quantity=forecasted_amount / item.unit_price if item.unit_price > 0 else 0,
                    forecast_type=forecast_type,
                    confidence_level=80,  # Default confidence
                    salesperson=customer.salesperson or request.user,
                    created_by=request.user,
                    status=RollingForecast.Status.DRAFT
                )
                created_entries.append(forecast_entry)
        
        return Response({
            'message': f'Successfully created {len(created_entries)} forecast entries.',
            'entries_created': len(created_entries)
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def variance_analysis_view(request):
    """Get rolling forecast variance analysis."""
    user = request.user
    year = request.query_params.get('year', timezone.now().year)
    
    cache_key = f'forecast_variance_{user.id}_{user.role}_{year}'
    analysis = cache.get(cache_key)
    
    if analysis is None:
        # Base queryset based on permissions
        if user.role == user.Role.SALESPERSON:
            queryset = RollingForecast.objects.filter(
                Q(salesperson=user) | Q(customer__salesperson=user),
                year=year, is_latest=True
            )
        elif user.role == user.Role.VIEWER:
            queryset = RollingForecast.objects.filter(
                Q(salesperson=user) | Q(customer__salesperson=user),
                year=year, is_latest=True
            )
        else:
            queryset = RollingForecast.objects.filter(year=year, is_latest=True)
        
        # Calculate variance analysis
        variance_data = queryset.aggregate(
            total_forecast_amount=Sum('forecasted_amount'),
            total_budget_amount=Sum('budget_amount'),
            total_variance=Sum('amount_variance'),
            avg_variance_percentage=Avg('amount_variance_percentage'),
            positive_variances=Count('id', filter=Q(amount_variance__gt=0)),
            negative_variances=Count('id', filter=Q(amount_variance__lt=0)),
            total_entries=Count('id'),
            avg_confidence=Avg('confidence_level')
        )
        
        # Calculate accuracy score
        total_forecast = variance_data['total_forecast_amount'] or 0
        total_budget = variance_data['total_budget_amount'] or 0
        
        if total_budget > 0:
            accuracy_score = max(0, 100 - abs((total_forecast - total_budget) / total_budget * 100))
        else:
            accuracy_score = 0
        
        analysis = {
            'period': f'{year}',
            'total_forecast_amount': variance_data['total_forecast_amount'] or 0,
            'total_budget_amount': variance_data['total_budget_amount'] or 0,
            'total_variance': variance_data['total_variance'] or 0,
            'variance_percentage': variance_data['avg_variance_percentage'] or 0,
            'positive_variances': variance_data['positive_variances'] or 0,
            'negative_variances': variance_data['negative_variances'] or 0,
            'total_entries': variance_data['total_entries'] or 0,
            'accuracy_score': round(accuracy_score, 2),
            'avg_confidence': variance_data['avg_confidence'] or 0
        }
        
        cache.set(cache_key, analysis, 300)  # Cache for 5 minutes
    
    return Response(analysis)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def forecast_summary_view(request):
    """Get rolling forecast summary statistics."""
    user = request.user
    year = request.query_params.get('year', timezone.now().year)
    
    cache_key = f'forecast_summary_{user.id}_{user.role}_{year}'
    summary = cache.get(cache_key)
    
    if summary is None:
        # Base queryset based on permissions
        if user.role == user.Role.SALESPERSON:
            queryset = RollingForecast.objects.filter(
                Q(salesperson=user) | Q(customer__salesperson=user),
                year=year, is_latest=True
            )
        elif user.role == user.Role.VIEWER:
            queryset = RollingForecast.objects.filter(
                Q(salesperson=user) | Q(customer__salesperson=user),
                year=year, is_latest=True
            )
        else:
            queryset = RollingForecast.objects.filter(year=year, is_latest=True)
        
        # Calculate summary statistics
        summary = queryset.aggregate(
            total_forecast_amount=Sum('forecasted_amount'),
            total_entries=Count('id'),
            avg_confidence=Avg('confidence_level'),
            approved_amount=Sum(
                'forecasted_amount',
                filter=Q(status=RollingForecast.Status.APPROVED)
            ),
            draft_amount=Sum(
                'forecasted_amount',
                filter=Q(status=RollingForecast.Status.DRAFT)
            )
        )
        
        # Monthly breakdown
        monthly_data = queryset.values('month').annotate(
            monthly_forecast=Sum('forecasted_amount'),
            monthly_budget=Sum('budget_amount'),
            monthly_variance=Sum('amount_variance'),
            monthly_count=Count('id')
        ).order_by('month')
        
        summary['monthly_breakdown'] = list(monthly_data)
        
        cache.set(cache_key, summary, 300)  # Cache for 5 minutes
    
    return Response(summary)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def monthly_forecast_view(request):
    """Get detailed monthly forecast data."""
    user = request.user
    year = request.query_params.get('year', timezone.now().year)
    month = request.query_params.get('month', timezone.now().month)
    
    cache_key = f'monthly_forecast_{user.id}_{user.role}_{year}_{month}'
    data = cache.get(cache_key)
    
    if data is None:
        # Base queryset based on permissions
        if user.role == user.Role.SALESPERSON:
            queryset = RollingForecast.objects.filter(
                Q(salesperson=user) | Q(customer__salesperson=user),
                year=year, month=month, is_latest=True
            )
        elif user.role == user.Role.VIEWER:
            queryset = RollingForecast.objects.filter(
                Q(salesperson=user) | Q(customer__salesperson=user),
                year=year, month=month, is_latest=True
            )
        else:
            queryset = RollingForecast.objects.filter(
                year=year, month=month, is_latest=True
            )
        
        # Calculate monthly totals
        monthly_totals = queryset.aggregate(
            total_forecast=Sum('forecasted_amount'),
            total_budget=Sum('budget_amount'),
            total_variance=Sum('amount_variance'),
            avg_confidence=Avg('confidence_level'),
            entry_count=Count('id')
        )
        
        # Calculate variance percentage
        total_budget = monthly_totals['total_budget'] or 0
        total_variance = monthly_totals['total_variance'] or 0
        variance_percentage = (total_variance / total_budget * 100) if total_budget > 0 else 0
        
        month_names = [
            '', 'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ]
        
        data = {
            'month': month,
            'month_name': month_names[int(month)],
            'total_forecast': monthly_totals['total_forecast'] or 0,
            'total_budget': monthly_totals['total_budget'] or 0,
            'variance': monthly_totals['total_variance'] or 0,
            'variance_percentage': round(variance_percentage, 2),
            'confidence_avg': monthly_totals['avg_confidence'] or 0,
            'entry_count': monthly_totals['entry_count'] or 0
        }
        
        cache.set(cache_key, data, 300)  # Cache for 5 minutes
    
    return Response(data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def approve_forecast_entries_view(request):
    """Approve multiple forecast entries."""
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
            {'error': 'You do not have permission to approve forecast entries.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get entries to approve
    queryset = RollingForecast.objects.filter(
        id__in=entry_ids,
        status=RollingForecast.Status.SUBMITTED
    )
    
    # Update entries
    updated_count = queryset.update(
        status=RollingForecast.Status.APPROVED,
        approved_by=user,
        approved_at=timezone.now()
    )
    
    return Response({
        'message': f'Successfully approved {updated_count} forecast entries.',
        'approved_count': updated_count
    })
