from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        """
        Creates and saves a regular User with the given email and password.
        """
        if not email:
            raise ValueError('Users must have an email address')
        
        email = self.normalize_email(email)
        user = self.model(
            username=username,
            email=email,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_service_provider(self, username, email, password=None, **extra_fields):
        """
        Creates and saves a service provider User with the given email and password.
        """
        extra_fields.setdefault('is_service_provider', True)
        
        if extra_fields.get('is_service_provider') is not True:
            raise ValueError('Service provider must have is_service_provider=True.')
            
        return self.create_user(username, email, password, **extra_fields)

    def create_superuser(self, username, email, password=None, **extra_fields):
        """
        Creates and saves a superuser with the given email and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(username, email, password, **extra_fields)


class User(AbstractUser):
    USER_TYPE_CHOICES = (
        ('customer', 'Customer'),
        ('provider', 'Service Provider'),
        ('admin', 'Administrator'),
    )

    email = models.EmailField(unique=True)
    phone_number = models.CharField(
        max_length=15, 
        blank=True, 
        null=True,
    )
    
    # Type fields
    user_type = models.CharField(
        max_length=50, 
        choices=USER_TYPE_CHOICES, 
        default='customer'
    )
    is_service_provider = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    
    # Timestamps
    date_joined = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'username'  # or 'email' if you want email login
    REQUIRED_FIELDS = ['email']  # add any required fields
    

    objects = UserManager()

    # Related names to avoid clashes
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        related_name="queue_manager_user_groups",
        related_query_name="queue_manager_user",
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        related_name="queue_manager_user_permissions",
        related_query_name="queue_manager_user",
    )

    def __str__(self):
        return f"{self.username} ({self.get_user_type_display()})"

    class Meta:
        ordering = ['-date_joined']
        verbose_name = 'User'
        verbose_name_plural = 'Users'


class ServiceCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = 'Service Categories'


class Service(models.Model):
    SERVICE_STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('maintenance', 'Under Maintenance'),
    ]

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    category = models.ForeignKey(
        ServiceCategory, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='services'
    )
    provider = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='services_provided'
    )
    status = models.CharField(
        max_length=12, 
        choices=SERVICE_STATUS_CHOICES, 
        default='active'
    )
    average_service_time = models.PositiveIntegerField(
        default=15, 
        help_text="Average service time in minutes"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.provider.username}"

    class Meta:
        ordering = ['name']
        unique_together = ['name', 'provider']


class Queue(models.Model):
    QUEUE_STATUS_CHOICES = [
        ('waiting', 'Waiting'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='queues_joined'
    )
    service = models.ForeignKey(
        Service, 
        on_delete=models.CASCADE, 
        related_name='queues'
    )
    join_time = models.DateTimeField(auto_now_add=True)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=10, 
        choices=QUEUE_STATUS_CHOICES, 
        default='waiting'
    )
    position = models.PositiveIntegerField(default=1)
    priority = models.BooleanField(
    default=False,
    help_text="Check for high priority"
    )
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Queue #{self.id} - {self.user.username} for {self.service.name}"
    
    def assign_to_available_window(self):
        """Attempt to assign this queue to an available window"""
        if self.status != 'waiting':
            return False
            
        available_window = Window.objects.filter(
            services=self.service,
            status='available'
        ).first()
        
        if available_window:
            self.status = 'processing'
            self.start_time = timezone.now()
            self.save()
            
            available_window.current_queue = self
            available_window.status = 'busy'
            available_window.save()
            return True
        return False

    class Meta:
        ordering = ['-priority', 'position']
        indexes = [
            models.Index(fields=['service', 'status']),
            models.Index(fields=['user']),
        ]

    def save(self, *args, **kwargs):
        if not self.pk:  # Only for new instances
            last_position = Queue.objects.filter(
                service=self.service,
                status__in=['waiting', 'processing']
            ).count()
            self.position = last_position + 1
        super().save(*args, **kwargs)

    def get_wait_time(self):
        if self.status == 'completed':
            return None
        return timezone.now() - self.join_time


class Window(models.Model):
    WINDOW_STATUS_CHOICES = [
        ('available', 'Available'),
        ('busy', 'Busy'),
        ('closed', 'Closed'),
        ('break', 'On Break'),
    ]

    name = models.CharField(max_length=50, unique=True)
    status = models.CharField(
        max_length=10, 
        choices=WINDOW_STATUS_CHOICES, 
        default='available'
    )
    service_provider = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='windows'
    )
    current_queue = models.ForeignKey(
        Queue,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='active_window'
    )
    services = models.ManyToManyField(
        Service,
        related_name='windows_available',
        blank=True
    )
    location = models.CharField(max_length=100, blank=True, null=True)
    last_active = models.DateTimeField(auto_now=True)

    def assign_next_queue(self):
        """Automatically assign the next appropriate queue to this window"""
        if self.status != 'available':
            return False
            
        next_queue = Queue.objects.filter(
            service__in=self.services.all(),
            status='waiting'
        ).order_by('-priority', 'position').first()
        
        if next_queue:
            next_queue.status = 'processing'
            next_queue.start_time = timezone.now()
            next_queue.save()
            
            self.current_queue = next_queue
            self.status = 'busy'
            self.save()
            return True
        return False

    def __str__(self):
        status = f" - {self.get_status_display()}"
        if self.service_provider:
            return f"Window {self.name} ({self.service_provider.username}){status}"
        return f"Window {self.name}{status}"

    class Meta:
        ordering = ['name']
        verbose_name = 'Service Window'
        verbose_name_plural = 'Service Windows'

