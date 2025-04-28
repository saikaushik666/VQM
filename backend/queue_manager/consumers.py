import json
from channels.generic.websocket import AsyncWebsocketConsumer

class QueueConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        await self.send(text_data=json.dumps({
            "type": "connection_established",
            "message": "You are now connected!"
        }))

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message = data.get("message", "No message received")  # Avoid KeyError
            wait_time = data.get("wait_time", 0)  # Ensure wait_time exists

            # Send a response back to the frontend
            await self.send(text_data=json.dumps({
                "type": "queue_update",
                "message": message,
                "wait_time": wait_time
            }))
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": "Invalid JSON format received"
            }))

    async def disconnect(self, close_code):
        print(f"WebSocket disconnected with code {close_code}")
