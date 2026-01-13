(function () {
  const config = window.TOURING_COST_CONFIG && window.TOURING_COST_CONFIG.ads;
  if (!config || !config.enabled || !config.client) {
    return;
  }

  const meta = document.querySelector('meta[name="ads"]');
  if (!meta || meta.content !== 'on') {
    return;
  }

  const slots = document.querySelectorAll('[data-ad-slot]');
  if (!slots.length) {
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src =
    'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' +
    encodeURIComponent(config.client);
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);

  slots.forEach(function (container) {
    const slotKey = container.getAttribute('data-ad-slot');
    const slotId = config.slots && config.slots[slotKey];
    if (!slotId) {
      return;
    }

    const label = document.createElement('div');
    label.className = 'ad-label';
    label.textContent = '広告';

    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', config.client);
    ins.setAttribute('data-ad-slot', slotId);
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');

    container.appendChild(label);
    container.appendChild(ins);

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      // Keep failure silent to avoid breaking the page.
    }
  });
})();
