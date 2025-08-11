"""
User authentication and management views.
"""
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.core.cache import cache
from django.db.models import Q
from .models import User, UserProfile
from .serializers import (
    UserSerializer, UserCreateSerializer, UserProfileSerializer,
    CustomTokenObtainPairSerializer
)


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom login view with enhanced token response."""
    serializer_class = CustomTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Update user's last login IP and count
            username = request.data.get('username')
            try:
                user = User.objects.get(username=username)
                profile, created = UserProfile.objects.get_or_create(user=user)
                
                # Get client IP
                x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
                if x_forwarded_for:
                    ip = x_forwarded_for.split(',')[0]
                else:
                    ip = request.META.get('REMOTE_ADDR')
                
                profile.last_login_ip = ip
                profile.login_count += 1
                profile.save()
                
            except User.DoesNotExist:
                pass
        
        return response


class UserListCreateView(generics.ListCreateAPIView):
    """List users and create new users (admin only)."""
    queryset = User.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserSerializer
    
    def get_queryset(self):
        """Filter queryset based on user permissions."""
        user = self.request.user
        
        # Admin and managers can see all users
        if user.is_admin() or user.role == User.Role.MANAGER:
            return User.objects.select_related('profile').prefetch_related('customers')
        
        # Salespersons can only see themselves and their customers' data
        elif user.role == User.Role.SALESPERSON:
            return User.objects.filter(id=user.id).select_related('profile')
        
        # Viewers can only see themselves
        else:
            return User.objects.filter(id=user.id).select_related('profile')
    
    def perform_create(self, serializer):
        """Create user with permission check."""
        if not self.request.user.can_manage_users():
            raise permissions.PermissionDenied("You don't have permission to create users.")
        
        serializer.save()


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a user."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter queryset based on user permissions."""
        user = self.request.user
        
        if user.is_admin() or user.role == User.Role.MANAGER:
            return User.objects.select_related('profile')
        else:
            # Users can only access their own profile
            return User.objects.filter(id=user.id).select_related('profile')
    
    def perform_update(self, serializer):
        """Update user with permission check."""
        user = self.request.user
        target_user = self.get_object()
        
        # Users can update their own profile
        if user.id == target_user.id:
            # Don't allow role changes for self
            if 'role' in serializer.validated_data and not user.is_admin():
                serializer.validated_data.pop('role')
        
        # Only admins and managers can update other users
        elif not user.can_manage_users():
            raise permissions.PermissionDenied("You don't have permission to update this user.")
        
        serializer.save()
    
    def perform_destroy(self, serializer):
        """Delete user with permission check."""
        if not self.request.user.is_admin():
            raise permissions.PermissionDenied("Only admins can delete users.")


class UserProfileView(generics.RetrieveUpdateAPIView):
    """User profile management."""
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        """Get or create user profile."""
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """Logout user by blacklisting refresh token."""
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        return Response(
            {'message': 'Successfully logged out.'},
            status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response(
            {'error': 'Invalid token.'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_user_view(request):
    """Get current user information."""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password_view(request):
    """Change user password."""
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    
    if not old_password or not new_password:
        return Response(
            {'error': 'Both old and new passwords are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not user.check_password(old_password):
        return Response(
            {'error': 'Old password is incorrect.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if len(new_password) < 8:
        return Response(
            {'error': 'New password must be at least 8 characters long.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user.set_password(new_password)
    user.save()
    
    return Response(
        {'message': 'Password changed successfully.'},
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_stats_view(request):
    """Get user statistics for dashboard."""
    cache_key = f'user_stats_{request.user.id}'
    stats = cache.get(cache_key)
    
    if stats is None:
        user = request.user
        
        # Base stats
        stats = {
            'total_users': User.objects.filter(is_active=True).count(),
            'total_salespersons': User.objects.filter(
                role=User.Role.SALESPERSON,
                is_active=True
            ).count(),
            'my_customers': 0,
            'my_sales_budget_entries': 0,
        }
        
        # Role-specific stats
        if user.role in [User.Role.SALESPERSON, User.Role.MANAGER]:
            from apps.customers.models import Customer
            from apps.sales_budget.models import SalesBudget
            
            stats['my_customers'] = Customer.objects.filter(
                salesperson=user,
                is_active=True
            ).count()
            
            stats['my_sales_budget_entries'] = SalesBudget.objects.filter(
                salesperson=user
            ).count()
        
        # Admin stats
        if user.is_admin():
            stats.update({
                'total_admins': User.objects.filter(
                    role=User.Role.ADMIN,
                    is_active=True
                ).count(),
                'total_managers': User.objects.filter(
                    role=User.Role.MANAGER,
                    is_active=True
                ).count(),
                'inactive_users': User.objects.filter(is_active=False).count(),
            })
        
        cache.set(cache_key, stats, 300)  # Cache for 5 minutes
    
    return Response(stats)


class UserSearchView(generics.ListAPIView):
    """Search users with filters."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Search users based on query parameters."""
        queryset = User.objects.select_related('profile')
        
        # Permission filtering
        user = self.request.user
        if not user.can_manage_users():
            queryset = queryset.filter(id=user.id)
        
        # Search filters
        search = self.request.query_params.get('search', None)
        role = self.request.query_params.get('role', None)
        department = self.request.query_params.get('department', None)
        is_active = self.request.query_params.get('is_active', None)
        
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        if role:
            queryset = queryset.filter(role=role)
        
        if department:
            queryset = queryset.filter(department__icontains=department)
        
        if is_active is not None:
            is_active_bool = is_active.lower() in ['true', '1', 'yes']
            queryset = queryset.filter(is_active=is_active_bool)
        
        return queryset.order_by('-created_at')
