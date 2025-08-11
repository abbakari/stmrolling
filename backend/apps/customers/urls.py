"""
URL configuration for customers app.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Customer endpoints
    path('', views.CustomerListCreateView.as_view(), name='customer-list-create'),
    path('<int:pk>/', views.CustomerDetailView.as_view(), name='customer-detail'),
    path('summary/', views.CustomerSummaryView.as_view(), name='customer-summary'),
    path('stats/', views.customer_stats_view, name='customer-stats'),
    path('top/', views.top_customers_view, name='top-customers'),
    
    # Customer contacts endpoints
    path('<int:customer_id>/contacts/', views.CustomerContactListCreateView.as_view(), name='customer-contacts'),
    path('<int:customer_id>/contacts/<int:pk>/', views.CustomerContactDetailView.as_view(), name='customer-contact-detail'),
]
