"""
URL configuration for sales_budget app.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Sales Budget endpoints
    path('', views.SalesBudgetListCreateView.as_view(), name='sales-budget-list-create'),
    path('<int:pk>/', views.SalesBudgetDetailView.as_view(), name='sales-budget-detail'),
    path('bulk-create/', views.bulk_create_budget_view, name='sales-budget-bulk-create'),
    path('summary/', views.budget_summary_view, name='sales-budget-summary'),
    path('monthly/', views.monthly_budget_view, name='monthly-budget'),
    path('approve/', views.approve_budget_entries_view, name='approve-budget-entries'),
    
    # Template endpoints
    path('templates/', views.SalesBudgetTemplateListCreateView.as_view(), name='budget-template-list-create'),
    path('templates/<int:pk>/', views.SalesBudgetTemplateDetailView.as_view(), name='budget-template-detail'),
]
