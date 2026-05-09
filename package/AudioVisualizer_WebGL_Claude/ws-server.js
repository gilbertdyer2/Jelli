import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8765 });
wss.on('connection', ws => {
  ws.on('message', (data, isBinary) => {
    const msg = isBinary ? data : data.toString();
    wss.clients.forEach(c => {
      if (c !== ws && c.readyState === 1) c.send(msg, { binary: isBinary });
    });
  });
});
console.log('WS relay listening on :8765');
