"""
URL configuration for rolling_forecast app.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Rolling Forecast endpoints
    path('', views.RollingForecastListCreateView.as_view(), name='rolling-forecast-list-create'),
    path('<int:pk>/', views.RollingForecastDetailView.as_view(), name='rolling-forecast-detail'),
    path('bulk-create/', views.bulk_create_forecast_view, name='rolling-forecast-bulk-create'),
    path('variance-analysis/', views.variance_analysis_view, name='forecast-variance-analysis'),
    path('summary/', views.forecast_summary_view, name='rolling-forecast-summary'),
    path('monthly/', views.monthly_forecast_view, name='monthly-forecast'),
    path('approve/', views.approve_forecast_entries_view, name='approve-forecast-entries'),
]
