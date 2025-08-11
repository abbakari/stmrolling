"""
URL configuration for users app.
"""
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Authentication endpoints
    path('login/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', views.logout_view, name='logout'),
    
    # User management endpoints
    path('users/', views.UserListCreateView.as_view(), name='user-list-create'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    path('users/search/', views.UserSearchView.as_view(), name='user-search'),
    
    # Current user endpoints
    path('me/', views.current_user_view, name='current-user'),
    path('me/profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('me/change-password/', views.change_password_view, name='change-password'),
    path('me/stats/', views.user_stats_view, name='user-stats'),
]
