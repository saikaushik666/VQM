from django.urls import re_path
from .consumers import QueueConsumer

websocket_urlpatterns = [
    re_path(r'ws/queue/$', QueueConsumer.as_asgi()),  # Match the WebSocket URL
]