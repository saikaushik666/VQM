from django.db import models
from django.db.models import Q, Count, Case, When, Value, IntegerField, Avg
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.db.models import F, Q, Count, Avg
from django.db.models.functions import Extract
from django.db import connection
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone


from .models import User, ServiceCategory, Service, Queue, Window
from .serializers import (
    UserRegistrationSerializer, UserDetailSerializer,
    ServiceCategorySerializer, ServiceSerializer,
    QueueSerializer, WindowSerializer, CustomTokenObtainPairSerializer
)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserRegistrationSerializer
        return UserDetailSerializer

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def register(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def register_provider(self, request):
        data = request.data.copy()
        data['is_service_provider'] = True
        data['user_type'] = 'provider'
        serializer = UserRegistrationSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    # In views.py
    def partial_update(self, request, *args, **kwargs):
        user = request.user
        serializer = UserDetailSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        # Handle password change if provided
        if 'current_password' in request.data and 'new_password' in request.data:
            if not user.check_password(request.data['current_password']):
                return Response(
                    {'error': 'Current password is incorrect'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.set_password(request.data['new_password'])
        
        serializer.save()
        return Response(serializer.data)


class ServiceCategoryViewSet(viewsets.ModelViewSet):
    queryset = ServiceCategory.objects.all()
    serializer_class = ServiceCategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.select_related('provider', 'category')
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(provider=self.request.user)

    @action(detail=True, methods=['get'])
    def queues(self, request, pk=None):
        service = self.get_object()
        queues = service.queues.filter(status__in=['waiting', 'processing'])
        serializer = QueueSerializer(queues, many=True)
        return Response(serializer.data)


class QueueViewSet(viewsets.ModelViewSet):
    serializer_class = QueueSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return only the queues belonging to the current user"""
        return Queue.objects.filter(user=self.request.user).select_related(
            'user', 
            'service',
            'service__provider',
            'service__category'
        ).prefetch_related('active_window')

    def list(self, request, *args, **kwargs):
        """Custom list response with user-specific messaging"""
        queryset = self.filter_queryset(self.get_queryset())
        
        if not queryset.exists():
            return Response(
                {'message': 'You currently have no active queues.'},
                status=status.HTTP_200_OK
            )
        
        active_queues = queryset.exclude(status='completed')
        
        if not active_queues.exists():
            return Response(
                {
                    'message': 'You have no active queues at the moment.',
                    'completed_queues': self.get_serializer(queryset, many=True).data
                },
                status=status.HTTP_200_OK
            )
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """Ensure users can only retrieve their own queues"""
        instance = self.get_object()
        if instance.user != request.user:
            return Response(
                {'error': 'You can only view your own queues.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().retrieve(request, *args, **kwargs)

    def perform_create(self, serializer):
        """Automatically assign the current user to new queues"""
        instance = serializer.save(user=self.request.user)
        instance.assign_to_available_window()

    @action(detail=True, methods=['patch'])
    def start(self, request, pk=None):
        """Start processing a queue - only if it belongs to the user"""
        queue = self.get_object()
        if queue.user != request.user:
            return Response(
                {'error': 'You can only start your own queues.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        queue.status = 'processing'
        queue.start_time = timezone.now()
        queue.save()
        return Response(QueueSerializer(queue).data)

    @action(detail=True, methods=['patch'])
    def complete(self, request, pk=None):
        """Complete a queue - only if it belongs to the user"""
        queue = self.get_object()
        if queue.user != request.user:
            return Response(
                {'error': 'You can only complete your own queues.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        queue.status = 'completed'
        queue.end_time = timezone.now()
        queue.save()
        
        # Update positions of remaining queues in the same service
        Queue.objects.filter(
            service=queue.service,
            status='waiting',
            position__gt=queue.position
        ).update(position=models.F('position') - 1)
        
        return Response(QueueSerializer(queue).data)

    @action(detail=False, methods=['get'])
    def my_queues(self, request):
        """Get all queues for the current user with status information"""
        queryset = self.get_queryset()
        
        waiting = queryset.filter(status='waiting')
        processing = queryset.filter(status='processing')
        completed = queryset.filter(status='completed')
        
        response_data = {
            'message': 'Your queue status',
            'waiting': self.get_serializer(waiting, many=True).data,
            'processing': self.get_serializer(processing, many=True).data,
            'completed': self.get_serializer(completed, many=True).data,
            'has_active_queues': waiting.exists() or processing.exists()
        }
        
        if not response_data['has_active_queues']:
            response_data['message'] = 'You currently have no active queues'
        
        return Response(response_data)
    # In QueueViewSet class
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get comprehensive queue statistics for the current user"""
        today = timezone.now().date()
        
        # Get user's queues for today
        user_queues = Queue.objects.filter(
            user=request.user,
            join_time__date=today
        )
        
        # Get completed queues
        completed_queues = user_queues.filter(status='completed')
        
        # Calculate average wait time (time between join and start)
        if connection.vendor == 'postgresql':
            # PostgreSQL-specific calculation using Extract
            avg_wait_seconds = completed_queues.annotate(
                wait_seconds=Extract(F('start_time') - F('join_time'), 'epoch')
            ).aggregate(
                avg_wait=Avg('wait_seconds')
            )['avg_wait'] or 0
            
            # Calculate average processing time (time between start and end)
            avg_processing_seconds = completed_queues.annotate(
                processing_seconds=Extract(F('end_time') - F('start_time'), 'epoch')
            ).aggregate(
                avg_processing=Avg('processing_seconds')
            )['avg_processing'] or 0
        else:
            # Fallback for other databases
            wait_times = []
            processing_times = []
            
            for q in completed_queues:
                if q.start_time and q.join_time:
                    wait_times.append((q.start_time - q.join_time).total_seconds())
                if q.end_time and q.start_time:
                    processing_times.append((q.end_time - q.start_time).total_seconds())
            
            avg_wait_seconds = sum(wait_times) / len(wait_times) if wait_times else 0
            avg_processing_seconds = sum(processing_times) / len(processing_times) if processing_times else 0
        
        # Calculate statistics
        stats = {
            'queues_joined': user_queues.count(),
            'waiting': user_queues.filter(status='waiting').count(),
            'processing': user_queues.filter(status='processing').count(),
            'served': completed_queues.count(),
            'cancelled': user_queues.filter(status='cancelled').count(),
            'priority_queues': user_queues.filter(priority=True).count(),
            'avg_wait_time_minutes': round(avg_wait_seconds / 60, 1),  # Convert to minutes, round to 1 decimal
            'avg_processing_time_minutes': round(avg_processing_seconds / 60, 1),  # Convert to minutes
            'total_active_queues': user_queues.filter(status__in=['waiting', 'processing']).count()
        }
        
        return Response(stats)

class WindowViewSet(viewsets.ModelViewSet):
    queryset = Window.objects.select_related('service_provider', 'current_queue')
    serializer_class = WindowSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Optimize queryset based on action"""
        queryset = super().get_queryset()
        if self.action in ['available', 'assign_to_best_window']:
            queryset = queryset.prefetch_related('services', 'service_provider__services_provided')
        return queryset

    @action(detail=True, methods=['patch'])
    def assign(self, request, pk=None):
        """Assign a service provider to this window"""
        window = self.get_object()
        provider_id = request.data.get('provider_id')
        if not provider_id:
            return Response(
                {'error': 'provider_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        provider = get_object_or_404(User, id=provider_id, is_service_provider=True)
        window.service_provider = provider
        window.save()
        return Response(self.get_serializer(window).data)

    @action(detail=True, methods=['patch'])
    def next_queue(self, request, pk=None):
        """Process the next queue for this window"""
        window = self.get_object()
        
        if not window.service_provider:
            return Response(
                {'error': 'No service provider assigned to this window'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Complete current queue if exists
        if window.current_queue:
            window.current_queue.status = 'completed'
            window.current_queue.end_time = timezone.now()
            window.current_queue.save()
        
        # Get next queue with proper service matching
        next_queue = Queue.objects.filter(
            Q(service__in=window.services.all()) |
            Q(service__provider=window.service_provider),
            status='waiting'
        ).order_by('-priority', 'position').first()
        
        if next_queue:
            next_queue.status = 'processing'
            next_queue.start_time = timezone.now()
            next_queue.save()
            window.current_queue = next_queue
            window.status = 'busy'
        else:
            window.current_queue = None
            window.status = 'available'
        
        window.last_active = timezone.now()
        window.save()
        return Response(self.get_serializer(window).data)

    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get all available windows that can take new queues"""
        windows = self.get_queryset().filter(status='available')
        serializer = self.get_serializer(windows, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def assign_queue(self, request, pk=None):
        """Assign a specific queue to this window"""
        window = self.get_object()
        queue_id = request.data.get('queue_id')
        
        if not queue_id:
            return Response(
                {'error': 'queue_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if window.status != 'available':
            return Response(
                {'error': 'Window is not available for new assignments'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            queue = Queue.objects.get(id=queue_id, status='waiting')
        except Queue.DoesNotExist:
            return Response(
                {'error': 'Queue not found or not waiting'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if window can handle this queue's service
        if not (window.services.filter(id=queue.service.id).exists() or 
               (window.service_provider and 
                window.service_provider.services_provided.filter(id=queue.service.id).exists())):
            return Response(
                {'error': 'Window cannot handle this service'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Perform assignment
        queue.status = 'processing'
        queue.start_time = timezone.now()
        queue.save()
        
        window.current_queue = queue
        window.status = 'busy'
        window.last_active = timezone.now()
        window.save()
        
        return Response({
            'window': self.get_serializer(window).data,
            'queue': QueueSerializer(queue).data
        })

    @action(detail=False, methods=['post'], url_path='assign-best')
    def assign_to_best_window(self, request):
        """
        Assigns to best available window
        Payload: { "queue_id": <number> }
        """
        try:
            # Handle different payload structures
            queue_id = None
            
            # Case 1: Normal payload {queue_id: 17}
            if isinstance(request.data.get('queue_id'), int):
                queue_id = request.data['queue_id']
            # Case 2: Nested payload {queue_id: {queue_id: 17}}
            elif isinstance(request.data.get('queue_id'), dict):
                nested_data = request.data['queue_id']
                if isinstance(nested_data.get('queue_id'), int):
                    queue_id = nested_data['queue_id']
            
            if queue_id is None:
                return Response(
                    {'error': 'Payload must be {"queue_id": number} or {"queue_id": {"queue_id": number}}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            queue = Queue.objects.get(id=queue_id, status='waiting')
            suitable_windows = self.get_queryset().filter(
                status='available'
            ).filter(
                Q(services=queue.service) | 
                Q(service_provider__services_provided=queue.service)
            ).annotate(
                current_load=Count('current_queue', filter=Q(current_queue__isnull=False)),
                is_specialized=Case(
                    When(services=queue.service, then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField()
                )
            ).order_by('current_load', '-is_specialized', 'last_active')
            
            if not suitable_windows.exists():
                return Response(
                    {'error': 'No available windows for this service'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            selected_window = suitable_windows.first()
            
            # Perform assignment
            queue.status = 'processing'
            queue.start_time = timezone.now()
            queue.save()
            
            selected_window.current_queue = queue
            selected_window.status = 'busy'
            selected_window.last_active = timezone.now()
            selected_window.save()
            
            return Response({
                'message': f'Queue {queue.id} assigned to window {selected_window.name}',
                'window': self.get_serializer(selected_window).data,
                'queue': QueueSerializer(queue).data
            })

        except Queue.DoesNotExist:
            return Response(
                {'error': 'Queue not found or not waiting'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get window statistics"""
        stats = {
            'total_windows': self.get_queryset().count(),
            'available_windows': self.get_queryset().filter(status='available').count(),
            'busy_windows': self.get_queryset().filter(status='busy').count(),
            'average_wait_time': self.get_queryset().aggregate(
                avg_wait=Avg('current_queue__wait_time')
            )['avg_wait'] or 0
        }
        return Response(stats)