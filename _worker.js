export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. 微信登录接口代理 (/api/weixin)
    if (url.pathname.startsWith('/api/weixin')) {
      const targetUrl = 'https://open.weixin.qq.com' + url.pathname.replace(/^\/api\/weixin/, '') + url.search;
      const newRequest = new Request(targetUrl, request);
      newRequest.headers.set('User-Agent', 'Mozilla/5.0 (Linux; Android 7.0; Mi-4c Build/NRD90M; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/53.0.2785.49 Mobile MQQBrowser/6.2 TBS/043632 Safari/537.36 MicroMessenger/6.6.1.1220(0x26060135) NetType/WIFI Language/zh_CN');
      newRequest.headers.set('Referer', 'https://open.weixin.qq.com/');
      newRequest.headers.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8');
      return fetch(newRequest);
    }

    // 2. 微信扫码状态轮询代理 (/api/weixin-long)
    if (url.pathname.startsWith('/api/weixin-long')) {
      const targetUrl = 'https://long.open.weixin.qq.com' + url.pathname.replace(/^\/api\/weixin-long/, '') + url.search;
      const newRequest = new Request(targetUrl, request);
      newRequest.headers.set('User-Agent', 'Mozilla/5.0 (Linux; Android 7.0; Mi-4c Build/NRD90M; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/53.0.2785.49 Mobile MQQBrowser/6.2 TBS/043632 Safari/537.36 MicroMessenger/6.6.1.1220(0x26060135) NetType/WIFI Language/zh_CN');
      newRequest.headers.set('Referer', 'https://open.weixin.qq.com/');
      return fetch(newRequest);
    }

    // 3. Hortor 登录接口代理 (/api/hortor)
    if (url.pathname.startsWith('/api/hortor')) {
      const targetUrl = 'https://comb-platform.hortorgames.com' + url.pathname.replace(/^\/api\/hortor/, '') + url.search;
      const newRequest = new Request(targetUrl, request);
      newRequest.headers.set('User-Agent', 'Mozilla/5.0 (Linux; Android 12; 23117RK66C Build/V417IR; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/95.0.4638.74 Mobile Safari/537.36');
      newRequest.headers.set('Host', 'comb-platform.hortorgames.com');
      newRequest.headers.set('Origin', 'https://open.weixin.qq.com');
      newRequest.headers.set('Referer', 'https://open.weixin.qq.com/');
      newRequest.headers.set('Connection', 'keep-alive');
      newRequest.headers.set('Content-Type', 'text/plain; charset=utf-8');
      return fetch(newRequest);
    }

    // 处理单页应用 (SPA) 路由，防止刷新页面 404
    const response = await env.ASSETS.fetch(request);
    if (response.status === 404 && !url.pathname.includes('.')) {
      return env.ASSETS.fetch(new URL('/index.html', request.url));
    }

    return response;
  },
};