"""
Items API views with performance optimizations.
"""
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.core.cache import cache
from django.db.models import Q, Sum, Count, Avg
from apps.core.pagination import OptimizedCursorPagination
from .models import Category, Brand, Item
from .serializers import (
    CategorySerializer, BrandSerializer, ItemSerializer,
    ItemCreateSerializer, ItemSummarySerializer,
    CategorySummarySerializer, BrandSummarySerializer
)


# Category Views
class CategoryListCreateView(generics.ListCreateAPIView):
    """List categories and create new categories."""
    
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get categories with filters."""
        queryset = Category.objects.all()
        
        search = self.request.query_params.get('search', None)
        is_active = self.request.query_params.get('is_active', None)
        parent_id = self.request.query_params.get('parent', None)
        
        if search:
            queryset = queryset.filter(
                Q(code__icontains=search) | Q(name__icontains=search)
            )
        
        if is_active is not None:
            is_active_bool = is_active.lower() in ['true', '1', 'yes']
            queryset = queryset.filter(is_active=is_active_bool)
        
        if parent_id:
            queryset = queryset.filter(parent_id=parent_id)
        
        return queryset.order_by('name')


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a category."""
    
    serializer_class = CategorySerializer
    queryset = Category.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_destroy(self, instance):
        """Soft delete category."""
        instance.is_active = False
        instance.save()


class CategorySummaryView(generics.ListAPIView):
    """Get category summary data for dropdowns."""
    
    serializer_class = CategorySummarySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get active categories."""
        return Category.objects.filter(is_active=True).order_by('name')


# Brand Views
class BrandListCreateView(generics.ListCreateAPIView):
    """List brands and create new brands."""
    
    serializer_class = BrandSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get brands with filters."""
        queryset = Brand.objects.all()
        
        search = self.request.query_params.get('search', None)
        is_active = self.request.query_params.get('is_active', None)
        
        if search:
            queryset = queryset.filter(
                Q(code__icontains=search) | Q(name__icontains=search)
            )
        
        if is_active is not None:
            is_active_bool = is_active.lower() in ['true', '1', 'yes']
            queryset = queryset.filter(is_active=is_active_bool)
        
        return queryset.order_by('name')


class BrandDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a brand."""
    
    serializer_class = BrandSerializer
    queryset = Brand.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_destroy(self, instance):
        """Soft delete brand."""
        instance.is_active = False
        instance.save()


class BrandSummaryView(generics.ListAPIView):
    """Get brand summary data for dropdowns."""
    
    serializer_class = BrandSummarySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get active brands."""
        return Brand.objects.filter(is_active=True).order_by('name')


# Item Views
class ItemListCreateView(generics.ListCreateAPIView):
    """List items and create new items."""
    
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = OptimizedCursorPagination
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ItemCreateSerializer
        return ItemSerializer
    
    def get_queryset(self):
        """Get items with filters and optimizations."""
        queryset = Item.objects.select_related('category', 'brand')
        
        # Apply filters
        search = self.request.query_params.get('search', None)
        category_id = self.request.query_params.get('category', None)
        brand_id = self.request.query_params.get('brand', None)
        status_filter = self.request.query_params.get('status', None)
        is_active = self.request.query_params.get('is_active', None)
        low_stock = self.request.query_params.get('low_stock', None)
        
        if search:
            queryset = queryset.filter(
                Q(code__icontains=search) |
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )
        
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        if brand_id:
            queryset = queryset.filter(brand_id=brand_id)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if is_active is not None:
            is_active_bool = is_active.lower() in ['true', '1', 'yes']
            queryset = queryset.filter(is_active=is_active_bool)
        
        if low_stock and low_stock.lower() in ['true', '1', 'yes']:
            queryset = queryset.filter(current_stock__lte=F('minimum_stock'))
        
        return queryset.order_by('-created_at')


class ItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete an item."""
    
    serializer_class = ItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get items with related data."""
        return Item.objects.select_related('category', 'brand')
    
    def perform_destroy(self, instance):
        """Soft delete item."""
        instance.is_active = False
        instance.save()


class ItemSummaryView(generics.ListAPIView):
    """Get item summary data for dropdowns and references."""
    
    serializer_class = ItemSummarySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get active items with basic info."""
        queryset = Item.objects.filter(is_active=True).select_related('category', 'brand')
        
        category_id = self.request.query_params.get('category', None)
        brand_id = self.request.query_params.get('brand', None)
        
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        if brand_id:
            queryset = queryset.filter(brand_id=brand_id)
        
        return queryset.order_by('name')


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def item_stats_view(request):
    """Get item statistics for dashboard."""
    cache_key = 'item_stats'
    stats = cache.get(cache_key)
    
    if stats is None:
        stats = {
            'total_items': Item.objects.filter(is_active=True).count(),
            'active_items': Item.objects.filter(status=Item.Status.ACTIVE).count(),
            'inactive_items': Item.objects.filter(status=Item.Status.INACTIVE).count(),
            'discontinued_items': Item.objects.filter(status=Item.Status.DISCONTINUED).count(),
            'low_stock_items': Item.objects.filter(
                is_active=True,
                current_stock__lte=F('minimum_stock')
            ).count(),
            'out_of_stock_items': Item.objects.filter(
                is_active=True,
                current_stock=0
            ).count(),
            'total_inventory_value': Item.objects.filter(is_active=True).aggregate(
                total=Sum(F('current_stock') * F('unit_price'))
            )['total'] or 0,
            'average_profit_margin': Item.objects.filter(
                is_active=True,
                unit_price__gt=0,
                cost_price__gt=0
            ).aggregate(
                avg_margin=Avg(
                    (F('unit_price') - F('cost_price')) / F('unit_price') * 100
                )
            )['avg_margin'] or 0,
        }
        
        # Category breakdown
        category_stats = Item.objects.filter(is_active=True).values(
            'category__name'
        ).annotate(count=Count('id')).order_by('category__name')
        
        stats['by_category'] = {
            item['category__name']: item['count'] for item in category_stats
        }
        
        # Brand breakdown
        brand_stats = Item.objects.filter(is_active=True).values(
            'brand__name'
        ).annotate(count=Count('id')).order_by('brand__name')
        
        stats['by_brand'] = {
            item['brand__name']: item['count'] for item in brand_stats
        }
        
        cache.set(cache_key, stats, 300)  # Cache for 5 minutes
    
    return Response(stats)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def top_selling_items_view(request):
    """Get top selling items."""
    limit = int(request.query_params.get('limit', 10))
    
    cache_key = f'top_selling_items_{limit}'
    items = cache.get(cache_key)
    
    if items is None:
        items_data = Item.objects.filter(is_active=True).order_by(
            '-total_sales_ytd'
        )[:limit].values(
            'id', 'code', 'name', 'total_sales_ytd', 'total_quantity_sold_ytd',
            'category__name', 'brand__name', 'unit_price'
        )
        
        items = list(items_data)
        cache.set(cache_key, items, 300)  # Cache for 5 minutes
    
    return Response(items)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def low_stock_items_view(request):
    """Get items with low stock levels."""
    cache_key = 'low_stock_items'
    items = cache.get(cache_key)
    
    if items is None:
        items_data = Item.objects.filter(
            is_active=True,
            current_stock__lte=F('minimum_stock')
        ).values(
            'id', 'code', 'name', 'current_stock', 'minimum_stock',
            'category__name', 'brand__name', 'unit_price'
        ).order_by('current_stock')
        
        items = list(items_data)
        cache.set(cache_key, items, 60)  # Cache for 1 minute (frequent updates)
    
    return Response(items)


# Import F for database functions
from django.db.models import F
