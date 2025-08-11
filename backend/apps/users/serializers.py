"""
User serializers for API responses.
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User, UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile."""
    
    class Meta:
        model = UserProfile
        fields = [
            'avatar', 'bio', 'default_page_size', 'preferred_view_mode',
            'login_count', 'last_login_ip', 'created_at', 'updated_at'
        ]
        read_only_fields = ['login_count', 'last_login_ip', 'created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user model."""
    
    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.CharField(read_only=True)
    customer_count = serializers.SerializerMethodField()
    sales_budget_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'department', 'phone', 'is_active', 'is_staff', 'is_superuser',
            'date_joined', 'last_login', 'profile', 'customer_count', 'sales_budget_count'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'is_staff', 'is_superuser']
    
    def get_customer_count(self, obj):
        """Get count of customers assigned to this user."""
        if hasattr(obj, 'customers'):
            return obj.customers.filter(is_active=True).count()
        return 0
    
    def get_sales_budget_count(self, obj):
        """Get count of sales budget entries for this user."""
        if hasattr(obj, 'assigned_sales_budget'):
            return obj.assigned_sales_budget.count()
        return 0
    
    def update(self, instance, validated_data):
        """Update user with additional validation."""
        # Handle role changes carefully
        if 'role' in validated_data:
            new_role = validated_data['role']
            request_user = self.context['request'].user
            
            # Only admins can change roles
            if not request_user.is_admin() and instance.id != request_user.id:
                raise serializers.ValidationError("Only admins can change user roles.")
            
            # Users cannot change their own role
            if instance.id == request_user.id and not request_user.is_superuser:
                validated_data.pop('role')
        
        return super().update(instance, validated_data)


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new users."""
    
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'role', 'department', 'phone'
        ]
    
    def validate(self, attrs):
        """Validate password confirmation and strength."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        
        # Validate password strength
        try:
            validate_password(attrs['password'])
        except ValidationError as e:
            raise serializers.ValidationError({'password': e.messages})
        
        # Remove password_confirm from validated data
        attrs.pop('password_confirm')
        return attrs
    
    def validate_email(self, value):
        """Validate email uniqueness."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate_username(self, value):
        """Validate username uniqueness."""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value
    
    def create(self, validated_data):
        """Create user with hashed password."""
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user


class UserSummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for user lists and references."""
    
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'role', 'department', 'is_active']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer with additional user data."""
    
    @classmethod
    def get_token(cls, user):
        """Add custom claims to token."""
        token = super().get_token(user)
        
        # Add custom claims
        token['role'] = user.role
        token['department'] = user.department or ''
        token['full_name'] = user.full_name
        token['is_admin'] = user.is_admin()
        
        return token
    
    def validate(self, attrs):
        """Enhanced validation with user status check."""
        data = super().validate(attrs)
        
        # Check if user is active
        if not self.user.is_active:
            raise serializers.ValidationError("User account is disabled.")
        
        # Add user information to response
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'full_name': self.user.full_name,
            'role': self.user.role,
            'department': self.user.department,
            'is_admin': self.user.is_admin(),
            'preferred_view_mode': getattr(self.user.profile, 'preferred_view_mode', 'customer_item') if hasattr(self.user, 'profile') else 'customer_item'
        }
        
        return data


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for password change."""
    
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    new_password_confirm = serializers.CharField(required=True)
    
    def validate(self, attrs):
        """Validate password change."""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match.")
        
        # Validate password strength
        try:
            validate_password(attrs['new_password'])
        except ValidationError as e:
            raise serializers.ValidationError({'new_password': e.messages})
        
        return attrs
    
    def validate_old_password(self, value):
        """Validate old password."""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value


class UserRoleUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user roles (admin only)."""
    
    class Meta:
        model = User
        fields = ['role']
    
    def validate(self, attrs):
        """Validate role update permissions."""
        request_user = self.context['request'].user
        
        if not request_user.is_admin():
            raise serializers.ValidationError("Only admins can update user roles.")
        
        return attrs
