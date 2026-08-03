/**
 * HentaiZ Frontend - Watch Page Handler
 */

export async function initWatchPage() {
  const main = document.getElementById('app-main');
  if (!main) return;

  // 1. Bóc tách slug từ pathname (Ví dụ: /watch/love-me-kaede-to-suzu-the-animation-2)
  const pathname = window.location.pathname;
  const parts = pathname.split('/').filter(Boolean);
  const slug = parts[1]; // lấy phần đằng sau /watch/

  if (!slug) {
    renderNotFound(main, 'Missing anime slug in URL');
    return;
  }

  // 2. Render Loading Skeleton
  renderSkeleton(main, slug);

  try {
    // 3. Gọi Backend Proxy
    const API_URL = `https://cdn.elyriax.com/api/v1/hentai/watch?data=${encodeURIComponent(slug)}`;
    const res = await fetch(API_URL);

    if (res.status === 404) {
      renderNotFound(main, 'Phim không tồn tại hoặc đã bị xóa!');
      return;
    }

    if (!res.ok) {
      throw new Error(`Server status: ${res.status}`);
    }

    const text = await res.text();
    const lines = text.split('\n').filter(l => l.trim());
    const objects = lines.map(l => JSON.parse(l)).filter(Boolean);

    // 4. Render thử JSON kết quả ra màn hình (Debug Phase)
    renderDebugJSON(main, slug, objects);

  } catch (err) {
    console.error('[Watch Fetch Error]:', err);
    renderNotFound(main, `Lỗi tải dữ liệu: ${err.message}`);
  }
}

// Sub-render: Skeleton Loading
function renderSkeleton(container, slug) {
  container.innerHTML = `
    <div style="padding: 40px 20px; max-width: 1200px; margin: 0 auto; text-align: center;">
      <div style="font-size: 24px; font-weight: 700; margin-bottom: 12px; color: #ff2d7d;">
        ⏳ Đang tải thông tin phim...
      </div>
      <p style="color: #9ca3af; font-size: 14px;">Slug: <code>${slug}</code></p>
      <div style="margin-top: 20px; height: 300px; background: #111118; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; color: #52525b;">
        Skeleton Player Loading...
      </div>
    </div>
  `;
}

// Sub-render: 404 Not Found Page
function renderNotFound(container, message) {
  container.innerHTML = `
    <div style="padding: 80px 20px; max-width: 600px; margin: 0 auto; text-align: center;">
      <div style="font-size: 64px; font-weight: 900; color: #ff2d7d;">404</div>
      <h1 style="font-size: 20px; font-weight: 700; margin: 16px 0 8px;">Không tìm thấy trang</h1>
      <p style="color: #9ca3af; font-size: 14px; margin-bottom: 24px;">${message}</p>
      <a href="/" style="display: inline-block; padding: 10px 24px; background: #ff2d7d; color: #fff; font-weight: 700; border-radius: 12px; text-decoration: none;">
        ← Về Trang Chủ
      </a>
    </div>
  `;
}

// Sub-render: In JSON dạng cây đẹp mắt để test
function renderDebugJSON(container, slug, data) {
  container.innerHTML = `
    <div style="padding: 24px; max-width: 1400px; margin: 0 auto;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
        <h1 style="font-size: 20px; font-weight: 700; color: #ff2d7d; margin: 0;">
          🎬 Watch Data Raw JSON Test
        </h1>
        <a href="/" style="padding: 6px 16px; background: #18181f; border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 8px; font-size: 13px; text-decoration: none;">
          ← Trang chủ
        </a>
      </div>
      <p style="color: #9ca3af; font-size: 13px; margin-top: 0;">Slug: <code style="color: #a855f7;">${slug}</code></p>
      
      <pre style="background: #111118; border: 1px solid rgba(255,255,255,0.08); padding: 20px; border-radius: 12px; overflow-x: auto; color: #38ef7d; font-family: monospace; font-size: 12px; max-height: 70vh;">${JSON.stringify(data, null, 2)}</pre>
    </div>
  `;
}
