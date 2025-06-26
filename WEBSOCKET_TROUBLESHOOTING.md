# WebSocket Troubleshooting Guide

## Common WebSocket Issues and Solutions

### Issue: `WebSocket connection to 'ws://localhost:3000/?token=...' failed`

This is a common issue with Vite's HMR (Hot Module Replacement) WebSocket connections, especially in Chrome and other Chromium-based browsers.

## Root Causes

1. **Host Configuration Issues**
   - Using `host: '0.0.0.0'` can cause WebSocket connection failures
   - Browser security policies blocking mixed localhost/network connections

2. **Port Conflicts**
   - Multiple services trying to use the same WebSocket port
   - HMR trying to connect to wrong port

3. **Browser Security Policies**
   - Chrome's strict WebSocket security policies
   - Mixed content security issues

4. **Network Configuration**
   - Firewall blocking WebSocket connections
   - Proxy servers interfering with WebSocket upgrades

## Solutions Applied

### 1. Fixed Host Configuration
```typescript
// vite.config.ts
server: {
  host: 'localhost', // Changed from '0.0.0.0'
  hmr: {
    host: 'localhost',
    clientPort: 3000
  }
}
```

### 2. Explicit WebSocket Configuration
```typescript
server: {
  ws: true, // Explicitly enable WebSocket support
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
  }
}
```

### 3. Alternative Network Configuration
- Created `vite.config.network.ts` for network access when needed
- Added `npm run dev:network` script for network development

## Browser Compatibility

### Chrome/Chromium
- **Issue**: Strict WebSocket security policies
- **Solution**: Use `localhost` instead of `0.0.0.0`
- **Fallback**: Disable service worker in development

### Firefox
- **Generally Compatible**: Less strict WebSocket policies
- **Solution**: Same configuration works

### Safari
- **WebSocket Support**: Good
- **Solution**: Standard configuration works

### Edge
- **Chromium-based**: Same issues as Chrome
- **Solution**: Same fixes apply

## Testing Tools

### 1. WebSocket Debug Tool
Visit: `http://localhost:3000/ws-debug.html`
- Tests WebSocket connections
- Checks browser support
- Diagnoses connection issues

### 2. Service Worker Debug Tool
Visit: `http://localhost:3000/sw-debug.html`
- Monitors service worker status
- Clears caches
- Unregisters problematic workers

## Development Scripts

### Standard Development (Recommended)
```bash
npm run dev
# or
./start-dev.sh
```
- Uses `localhost` for better WebSocket compatibility
- Service worker disabled in development

### Network Development
```bash
npm run dev:network
# or
./start-dev-network.sh
```
- Uses `0.0.0.0` for network access
- May have WebSocket issues in some browsers

### Debug Mode
```bash
npm run dev:debug
```
- Additional debugging information
- Verbose WebSocket logging

## Environment Variables

### Disable Service Worker in Development
```bash
VITE_DISABLE_SW_IN_DEV=true npm run dev
```

### Force Network Mode
```bash
npm run dev -- --host 0.0.0.0
```

## Troubleshooting Steps

### 1. Check Browser Console
Look for WebSocket connection errors:
```
WebSocket connection to 'ws://localhost:3000/?token=...' failed
```

### 2. Test WebSocket Connectivity
1. Open `http://localhost:3000/ws-debug.html`
2. Click "Test WebSocket Connection"
3. Check results for different URLs

### 3. Clear Browser Data
- Clear browser cache
- Disable browser extensions
- Try incognito/private mode

### 4. Check Network Configuration
- Disable VPN if active
- Check firewall settings
- Test on different network

### 5. Alternative Solutions
- Use different browser
- Use network mode: `npm run dev:network`
- Disable HMR: Add `hmr: false` to vite config

## Advanced Solutions

### 1. Custom WebSocket Configuration
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    hmr: {
      port: 3001, // Use different port for HMR
      host: 'localhost'
    }
  }
});
```

### 2. Proxy Configuration
```typescript
// For complex network setups
server: {
  proxy: {
    '/ws': {
      target: 'ws://localhost:3001',
      ws: true
    }
  }
}
```

### 3. Fallback to Polling
```typescript
// Last resort - disable WebSocket, use polling
server: {
  hmr: {
    overlay: false,
    // This will fall back to polling
    clientPort: false
  }
}
```

## Prevention

1. **Always use `localhost`** for development unless network access is specifically needed
2. **Test WebSocket connectivity** before deploying
3. **Use debug tools** to monitor connection health
4. **Keep browser updated** for latest WebSocket support

## Support

If WebSocket issues persist:
1. Check browser compatibility
2. Test with different browsers
3. Use network mode as fallback
4. Consider disabling HMR for stable development
