from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import AnonymousUser
from .models import User, ServiceCategory, Service, Queue, Window

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        refresh = self.get_token(self.user)
        
        data.update({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': self.user.id,
                'username': self.user.username,
                'is_service_provider': self.user.is_service_provider
            }
        })
        return data

from django.core.validators import MinLengthValidator, RegexValidator

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[MinLengthValidator(8)]
    )
    confirm_password = serializers.CharField(write_only=True, required=True)
    phone_number = serializers.CharField(
        required=False,
        allow_blank=True,
        validators=[
            RegexValidator(
                regex=r'^\+?1?\d{9,15}$',
                message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
            )
        ]
    )

    class Meta:
        model = User
        fields = ['username', 'email', 'phone_number', 'password', 'confirm_password']
        extra_kwargs = {
            'email': {'required': False},
        }

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data.get('email', ''),
            phone_number=validated_data.get('phone_number', ''),
            user_type='customer',
            is_service_provider=False,
            is_verified=False
        )
        return user

class UserDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'phone_number', 
            'user_type', 'is_service_provider',
            'date_joined', 'is_verified'
        ]
        read_only_fields = ['date_joined', 'is_verified']

    def to_representation(self, instance):
        if isinstance(instance, AnonymousUser):
            return {'detail': 'No authenticated user'}
        return super().to_representation(instance)

# Service Serializers
class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = ['id', 'name', 'description', 'icon']

class ServiceSerializer(serializers.ModelSerializer):
    category = ServiceCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=ServiceCategory.objects.all(), 
        source='category', 
        write_only=True
    )
    provider = UserDetailSerializer(read_only=True)

    class Meta:
        model = Service
        fields = [
            'id', 'name', 'description', 'category', 'category_id',
            'provider', 'status', 'average_service_time',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

# Queue Serializers
class QueueSerializer(serializers.ModelSerializer):
    user = UserDetailSerializer(read_only=True)
    service = ServiceSerializer(read_only=True)
    service_id = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(), 
        source='service', 
        write_only=True
    )
    wait_time = serializers.SerializerMethodField()

    class Meta:
        model = Queue
        fields = [
            'id', 'user', 'service', 'service_id', 'join_time',
            'start_time', 'end_time', 'status', 'position',
            'priority', 'notes', 'wait_time'
        ]
        read_only_fields = ['join_time', 'start_time', 'end_time', 'position']

    def get_wait_time(self, obj):
        return obj.get_wait_time()

# Window Serializers
class WindowSerializer(serializers.ModelSerializer):
    service_provider = UserDetailSerializer(read_only=True)
    current_queue = QueueSerializer(read_only=True)
    services = ServiceSerializer(many=True, read_only=True)
    service_ids = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(),
        source='services',
        many=True,
        write_only=True
    )

    class Meta:
        model = Window
        fields = [
            'id', 'name', 'status', 'service_provider',
            'current_queue', 'services', 'service_ids',
            'location', 'last_active'
        ]
        read_only_fields = ['last_active']