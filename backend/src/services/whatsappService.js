const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');

let sock = null;
let isReady = false;
const pendingQueue = [];

async function startWhatsApp() {
  console.log('[WhatsApp] Memulai koneksi...');
  const { state, saveCreds } = await useMultiFileAuthState('whatsapp_auth_info');

  sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log('[WhatsApp] Silakan pindai QR Code berikut:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      isReady = true;
      console.log('[WhatsApp] Koneksi berhasil terbuka!');
      _flushPending();
    }

    else if (connection === 'close') {
      isReady = false;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect =
        statusCode !== DisconnectReason.loggedOut &&
        [DisconnectReason.connectionClosed, 515].includes(statusCode);

      console.log(
        '[WhatsApp] Koneksi ditutup karena:',
        lastDisconnect?.error?.message || lastDisconnect?.error,
        ', reconnect?',
        shouldReconnect
      );

      if (shouldReconnect) {
        setTimeout(startWhatsApp, 5000);
      }
    }
  });
}

async function _doSend(number, message) {
  const jid = `${number.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
  await sock.sendMessage(jid, { text: message });
  console.log(`[WhatsApp] Pesan terkirim ke ${number}`);
}

function _flushPending() {
  while (isReady && pendingQueue.length) {
    const { number, message, resolve, reject } = pendingQueue.shift();
    _doSend(number, message).then(resolve).catch(reject);
  }
}

function sendWhatsAppMessage(number, message) {
  return new Promise((resolve, reject) => {
    if (isReady) {
      _doSend(number, message).then(resolve).catch(reject);
    } else {
      console.log('[WhatsApp] Koneksi belum siap, enqueue pesan ke', number);
      pendingQueue.push({ number, message, resolve, reject });
    }
  });
}

module.exports = { startWhatsApp, sendWhatsAppMessage };
