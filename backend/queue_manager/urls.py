from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, ServiceCategoryViewSet,
    ServiceViewSet, QueueViewSet, WindowViewSet, CustomTokenObtainPairView
)
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'service-categories', ServiceCategoryViewSet, basename='servicecategory')
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'queues', QueueViewSet, basename='queue')
router.register(r'windows', WindowViewSet, basename='window')

# User routes are separated for better organization
user_routes = [
    path('register/', UserViewSet.as_view({'post': 'register'}), name='user-register'),
    path('register/provider/', UserViewSet.as_view({'post': 'register_provider'}), name='user-register-provider'),
    path('me/', UserViewSet.as_view({'get': 'me'}), name='user-me'),
    # Standard CRUD operations
    path('', UserViewSet.as_view({'get': 'list'}), name='user-list'),
    path('<int:pk>/', UserViewSet.as_view({'get': 'retrieve','put': 'update','patch': 'partial_update','delete': 'destroy'}), name='user-detail'),
]


urlpatterns = [
    path('', include(router.urls)),
    
    # Auth routes
    path('auth/token/', CustomTokenObtainPairView.as_view(), name='token-obtain-pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/token/verify/', TokenVerifyView.as_view(), name='token-verify'),
    path('queues/stats/', QueueViewSet.as_view({'get': 'stats'}), name='queue-stats'),

    # User routes
    path('users/', include(user_routes)),
    # In urls.py
    path('users/mes/', UserViewSet.as_view({'patch': 'partial_update'}), name='user-me-update'),
    # Service-specific routes
    path('services/<int:pk>/queues/', ServiceViewSet.as_view({'get': 'queues'}), name='service-queues'),
    
    # Window-specific routes
    path('windows/available/', WindowViewSet.as_view({'get': 'available'}), name='window-available'),
    path('windows/<int:pk>/assign/', WindowViewSet.as_view({'patch': 'assign'}), name='window-assign'),
    path('windows/<int:pk>/assign-queue/', WindowViewSet.as_view({'post': 'assign_queue'}), name='window-assign-queue'),
    path('windows/<int:pk>/next/', WindowViewSet.as_view({'patch': 'next_queue'}), name='window-next-queue'),
    path('windows/assign-all/', WindowViewSet.as_view({'get': 'assign_all_queues'}), name='window-assign-all'),
    path('windows/assign-best/', WindowViewSet.as_view({'post': 'assign_to_best_window'}), name='window-assign-best'),
]