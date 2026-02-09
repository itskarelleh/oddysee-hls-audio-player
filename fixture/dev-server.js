#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 8787);
const GENERATED_DIR = process.env.HLS_DIR || path.join(__dirname, 'generated');
const AUDIO_PLAYLIST = process.env.HLS_PLAYLIST || 'audio.m3u8';
const SIGNING_SECRET = process.env.SIGNING_SECRET || 'oddysee-dev-secret';
const SIGN_TTL_SECONDS = Number(process.env.SIGN_TTL_SECONDS || 60);

function base64url(buffer) {
  return buffer.toString('base64url');
}

function signPath(pathname, exp) {
  const payload = `${pathname}|${exp}`;
  return base64url(crypto.createHmac('sha256', SIGNING_SECRET).update(payload).digest());
}

function isValidSignature(pathname, exp, sig) {
  if (!sig || !exp) return false;
  const expected = signPath(pathname, exp);
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

function respond(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Range',
    ...headers,
  });
  res.end(body);
}

function renderMasterPlaylist() {
  return [
    '#EXTM3U',
    '#EXT-X-VERSION:3',
    '#EXT-X-STREAM-INF:BANDWIDTH=128000,CODECS="mp4a.40.2"',
    '/audio.m3u8',
    '',
  ].join('\n');
}

async function renderSignedAudioPlaylist() {
  const playlistPath = path.join(GENERATED_DIR, AUDIO_PLAYLIST);
  const raw = await fsp.readFile(playlistPath, 'utf8');
  const now = Math.floor(Date.now() / 1000);
  const exp = now + SIGN_TTL_SECONDS;

  const lines = raw.split(/\r?\n/);
  const rewritten = lines.map((line) => {
    if (!line || line.startsWith('#')) return line;
    const segmentPath = `/segments/${line}`;
    const sig = signPath(segmentPath, exp);
    return `${segmentPath}?exp=${exp}&sig=${sig}`;
  });

  return rewritten.join('\n');
}

function parseUrl(req) {
  const host = req.headers.host || `localhost:${PORT}`;
  return new URL(req.url || '/', `http://${host}`);
}

const server = http.createServer(async (req, res) => {
  const url = parseUrl(req);
  const { pathname } = url;

  if (req.method === 'OPTIONS') {
    return respond(res, 204, '');
  }

  if (req.method !== 'GET') {
    return respond(res, 405, 'Method Not Allowed');
  }

  if (pathname === '/' || pathname === '/master.m3u8') {
    return respond(res, 200, renderMasterPlaylist(), {
      'Content-Type': 'application/vnd.apple.mpegurl',
    });
  }

  if (pathname === '/audio.m3u8') {
    try {
      const playlist = await renderSignedAudioPlaylist();
      return respond(res, 200, playlist, {
        'Content-Type': 'application/vnd.apple.mpegurl',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return respond(res, 500, `Failed to load playlist: ${message}`);
    }
  }

  if (pathname.startsWith('/segments/')) {
    const exp = Number(url.searchParams.get('exp'));
    const sig = url.searchParams.get('sig');
    const now = Math.floor(Date.now() / 1000);

    if (!exp || now > exp) {
      return respond(res, 403, 'Segment URL expired');
    }

    if (!isValidSignature(pathname, exp, sig)) {
      return respond(res, 403, 'Invalid segment signature');
    }

    const segmentName = pathname.replace('/segments/', '');
    const segmentPath = path.join(GENERATED_DIR, segmentName);
    const resolvedSegmentPath = path.resolve(segmentPath);
    const resolvedGeneratedDir = path.resolve(GENERATED_DIR);

    if (!resolvedSegmentPath.startsWith(resolvedGeneratedDir + path.sep)) {
      return respond(res, 400, 'Invalid segment path');
    }

    if (!fs.existsSync(resolvedSegmentPath)) {
      return respond(res, 404, 'Segment not found');
    }

    res.writeHead(200, {
      'Content-Type': 'video/MP2T',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
    });

    return fs.createReadStream(resolvedSegmentPath).pipe(res);
  }

  return respond(res, 404, 'Not Found');
});

server.listen(PORT, () => {
  if (!fs.existsSync(GENERATED_DIR)) {
    console.warn(`[fixture] HLS dir not found: ${GENERATED_DIR}`);
    console.warn('[fixture] Run fixture/generate-hls.sh to create sample segments.');
  }
  const base = `http://localhost:${PORT}`;
  console.log('[fixture] Signed HLS dev server running');
  console.log(`[fixture] Master playlist: ${base}/master.m3u8`);
  console.log(`[fixture] Audio playlist:  ${base}/audio.m3u8`);
  console.log(`[fixture] Segments TTL:    ${SIGN_TTL_SECONDS}s`);
  console.log(`[fixture] HLS dir:         ${GENERATED_DIR}`);
});
