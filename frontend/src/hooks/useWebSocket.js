import { useEffect } from 'react';

const useWebSocket = ({ url, onMessage, onError }) => {
  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      onMessage && onMessage(event);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      onError && onError(error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, [url, onMessage, onError]);
};

export default useWebSocket;