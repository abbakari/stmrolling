"""
URL configuration for items app.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Category endpoints
    path('categories/', views.CategoryListCreateView.as_view(), name='category-list-create'),
    path('categories/<int:pk>/', views.CategoryDetailView.as_view(), name='category-detail'),
    path('categories/summary/', views.CategorySummaryView.as_view(), name='category-summary'),
    
    # Brand endpoints
    path('brands/', views.BrandListCreateView.as_view(), name='brand-list-create'),
    path('brands/<int:pk>/', views.BrandDetailView.as_view(), name='brand-detail'),
    path('brands/summary/', views.BrandSummaryView.as_view(), name='brand-summary'),
    
    # Item endpoints
    path('', views.ItemListCreateView.as_view(), name='item-list-create'),
    path('<int:pk>/', views.ItemDetailView.as_view(), name='item-detail'),
    path('summary/', views.ItemSummaryView.as_view(), name='item-summary'),
    path('stats/', views.item_stats_view, name='item-stats'),
    path('top-selling/', views.top_selling_items_view, name='top-selling-items'),
    path('low-stock/', views.low_stock_items_view, name='low-stock-items'),
]
