export default async function handler(req, res) {
  // Target API
  const TARGET_URL = 'https://hentaiz1.com/__data.json?x-sveltekit-trailing-slash=1&x-sveltekit-invalidated=011';

  try {
    const response = await fetch(TARGET_URL, {
      method: 'GET',
      headers: {
        // Giả lập Header của Trình duyệt Desktop thật để bypass Cloudflare Basic WAF
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Target server responded with status: ${response.status}` 
      });
    }

    const data = await response.text();

    // Mở CORS cho domain ihentaiiz.top của bạn
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    
    return res.status(200).send(data);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
