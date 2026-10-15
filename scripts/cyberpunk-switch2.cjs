// Builds a Switch 2 style Cyberpunk 2077 case from the PS5 scans (kept in capas/antigas), using real Switch 2 scans for the red band.
// Run: node scripts/cyberpunk-switch2.cjs src/assets/capas src/assets/capas
const sharp = require('sharp');
const [, , dir, out] = process.argv;
const PS5_FRONT = `${dir}/antigas/20579923-cyberpunk-2077-phantom-liberty-bundle-playstation-5-front-cover.jpg`;
const PS5_SPINE = `${dir}/antigas/40576895-cyberpunk-2077-phantom-liberty-bundle-playstation-5-spinesides.jpg`;
const SW2_FRONT = `${dir}/39036439-monster-hunter-stories-3-twisted-reflection-nintendo-switch-2-fr.jpg`;
const SW2_SPINE = `${dir}/39913897-persona-3-reload-nintendo-switch-2-spinesides.jpg`;
(async () => {
  // --- front ---
  const W = 600, H = Math.round(W / 0.62), BAND = Math.round(H * 0.1225);
  const band = await sharp(SW2_FRONT).extract({ left: 0, top: 0, width: 492, height: 98 }).resize(W, BAND, { fit: 'fill' }).toBuffer();
  // PS5 art below its white header, trimmed to keep the whole Cyberpunk logo.
  const artTop = 87, artH = 800 - artTop;
  // Hide the PSN-only line inside the Ultimate Edition badge ("includes PSN voucher code for").
  const patch = Buffer.from(`<svg width="648" height="800"><rect x="443" y="${116}" width="160" height="15" fill="#0b0b0b"/></svg>`);
  const ps5 = await sharp(PS5_FRONT).resize(648, 800, { fit: 'fill' }).composite([{ input: patch }]).toBuffer();
  const art = await sharp(ps5).extract({ left: 24, top: artTop, width: W, height: artH }).toBuffer();
  const ext = H - BAND - artH;
  // Taller Switch case: continue the background upwards as a smooth left→right gradient of the art's top edge
  // (yellow wall on the left, red neon on the right), then blend it into the art.
  const avg = async (left, width) => {
    const st = await sharp(await sharp(art).extract({ left, top: 0, width, height: 12 }).toBuffer()).stats();
    return '#' + st.channels.slice(0, 3).map((c) => Math.round(c.mean).toString(16).padStart(2, '0')).join('');
  };
  const [cl, cr] = [await avg(0, 120), await avg(W - 90, 90)];
  const grow = await sharp(Buffer.from(`<svg width="${W}" height="${ext + 60}"><defs><linearGradient id="h"><stop offset="0.25" stop-color="${cl}"/><stop offset="0.85" stop-color="${cr}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#h)"/></svg>`)).png().toBuffer();
  await sharp({ create: { width: W, height: H, channels: 3, background: '#000' } })
    .composite([
      { input: grow, left: 0, top: BAND },
      { input: art, left: 0, top: H - artH },
      { input: await sharp(grow).extract({ left: 0, top: ext, width: W, height: 60 }).composite([{ input: Buffer.from(`<svg width="${W}" height="60"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`), blend: 'dest-in' }]).png().toBuffer(), left: 0, top: H - artH },
      { input: band, left: 0, top: 0 },
    ])
    .jpeg({ quality: 92 })
    .toFile(`${out}/cyberpunk-2077-switch2-montada-nintendo-switch-front-cover.jpg`);

  // --- spine ---
  const SW = 68, SH = 800;
  const sband = await sharp(SW2_SPINE).extract({ left: 0, top: 0, width: 49, height: 99 }).resize(SW, 137, { fit: 'fill' }).toBuffer();
  const body = await sharp(PS5_SPINE).extract({ left: 0, top: 185, width: 68, height: 615 }).toBuffer();
  await sharp({ create: { width: SW, height: SH, channels: 3, background: '#000' } })
    // The PS5 product code at the foot of the spine ("PPSA 04027") is painted over with the spine's yellow.
    .composite([
      { input: await sharp(body).extend({ top: SH - 137 - 615, extendWith: 'copy' }).toBuffer(), left: 0, top: 137 },
      { input: Buffer.from(`<svg width="${SW}" height="80"><rect width="100%" height="100%" fill="rgb(230,222,61)"/></svg>`), left: 0, top: SH - 80 },
      { input: sband, left: 0, top: 0 },
    ])
    .jpeg({ quality: 92 })
    .toFile(`${out}/cyberpunk-2077-switch2-montada-nintendo-switch-spinesides.jpg`);
})();

// --- back: the PS5 back fits the Switch case width; the extra height goes on top as more of the dark night sky.
(async () => {
  const PS5_BACK = `${dir}/antigas/20579927-cyberpunk-2077-phantom-liberty-bundle-playstation-5-back-cover.jpg`;
  const m = await sharp(PS5_BACK).metadata();
  const W = m.width, H = Math.round(W / 0.62), ext = H - m.height;
  const top = await sharp(await sharp(PS5_BACK).extract({ left: 0, top: 40, width: W, height: 20 }).toBuffer()).stats();
  const hex = '#' + top.channels.slice(0, 3).map((c) => Math.round(c.mean).toString(16).padStart(2, '0')).join('');
  const sky = Buffer.from(`<svg width="${W}" height="${ext + 40}"><defs><linearGradient id="v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050608"/><stop offset="1" stop-color="${hex}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#v)"/></svg>`);
  // Paint over the PS5-only line in the top-left corner ("Includes PSN Voucher code for Phantom Liberty...").
  const psnLine = Buffer.from(`<svg width="${W}" height="40"><rect width="100%" height="100%" fill="${hex}"/></svg>`);
  await sharp({ create: { width: W, height: H, channels: 3, background: '#000' } })
    .composite([
      { input: await sharp(sky).png().toBuffer(), left: 0, top: 0 },
      { input: PS5_BACK, left: 0, top: ext },
      { input: psnLine, left: 0, top: ext },
    ])
    .jpeg({ quality: 90 })
    .toFile(`${out}/cyberpunk-2077-switch2-montada-nintendo-switch-back-cover.jpg`);
})();
