/**
 * BlackRoad OS – Sites Cloudflare Worker
 *
 * Serves as the edge runtime for blackroad.io sites:
 *  - Static asset routing
 *  - Long-running background task dispatch via /api/tasks
 *  - Health check via /health
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/health') {
      return Response.json({
        status: 'ok',
        worker: 'sites.blackroad-os.workers.dev',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      });
    }

    // Task dispatcher (POST /api/tasks)
    if (url.pathname === '/api/tasks' && request.method === 'POST') {
      // Verify bearer token using constant-time comparison to prevent timing attacks
      const auth = request.headers.get('Authorization') ?? '';
      const token = auth.replace('Bearer ', '').trim();
      if (!env.WORKER_SECRET || !(await timingSafeEqual(token, env.WORKER_SECRET))) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
      }

      const { task, target, triggered_by, run_id } = body;

      // Use ctx.waitUntil so the response is returned immediately
      // while the long-running task continues in the background.
      ctx.waitUntil(runTask(task, target, env));

      return Response.json({
        status: 'accepted',
        task,
        run_id,
        triggered_by,
        message: `Task "${task}" dispatched to background`,
      }, { status: 202 });
    }

    // Default: forward to origin or return a basic page
    return new Response(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BlackRoad OS – Sites</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0a0a0a; color: #e2e2e2; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { text-align: center; padding: 2rem; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    p { color: #888; }
    a { color: #7c3aed; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🔱 BlackRoad OS</h1>
    <p>Sites edge worker is running.</p>
    <p><a href="/health">/health</a></p>
  </div>
</body>
</html>`,
      {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' },
      },
    );
  },
};

/**
 * Constant-time string comparison to prevent timing attacks on bearer tokens.
 */
async function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  // Lengths must match for constant-time comparison
  if (aBytes.byteLength !== bBytes.byteLength) return false;
  const aKey = await crypto.subtle.importKey('raw', aBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', aKey, bBytes);
  // Compare against the expected re-derived HMAC to keep time constant
  const bKey = await crypto.subtle.importKey('raw', bBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sigB = await crypto.subtle.sign('HMAC', bKey, aBytes);
  const av = new Uint8Array(sig);
  const bv = new Uint8Array(sigB);
  let diff = 0;
  for (let i = 0; i < av.length; i++) diff |= av[i] ^ bv[i];
  return diff === 0;
}

/**
 * Background task runner – called via ctx.waitUntil so it doesn't block the response.
 */
async function runTask(task, target, env) {
  switch (task) {
    case 'health-check': {
      const sites = [
        'https://blackroad.io',
        target || null,
      ].filter(Boolean);

      for (const site of sites) {
        try {
          const res = await fetch(site, { method: 'HEAD', signal: AbortSignal.timeout(10_000) });
          console.log(`[health-check] ${site} → ${res.status}`);
        } catch (err) {
          if (err.name === 'TimeoutError') {
            console.error(`[health-check] ${site} → TIMEOUT after 10s`);
          } else {
            console.error(`[health-check] ${site} → ERROR: ${err.message}`);
          }
        }
      }
      break;
    }

    case 'cache-warm': {
      const urls = target ? [target] : ['https://blackroad.io'];
      for (const u of urls) {
        try {
          await fetch(u, { signal: AbortSignal.timeout(30_000) });
          console.log(`[cache-warm] warmed ${u}`);
        } catch (err) {
          if (err.name === 'TimeoutError') {
            console.error(`[cache-warm] ${u} → TIMEOUT after 30s`);
          } else {
            console.error(`[cache-warm] ${u} → ERROR: ${err.message}`);
          }
        }
      }
      break;
    }

    case 'index-sites': {
      console.log('[index-sites] site indexing task dispatched');
      // Future: walk sitemap and index pages into KV / D1
      break;
    }

    default:
      console.warn(`[runTask] Unknown task: ${task}`);
  }
}
