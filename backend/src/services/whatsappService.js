const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const pool = require('../config/database');

let sock = null;
let isReady = false;

async function startWhatsApp(onMessageCallback) {
  console.log('[WhatsApp] Memulai koneksi...');
  const { state, saveCreds } = await useMultiFileAuthState('whatsapp_auth_info');

  sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
  });
  sock.ev.on('messages.upsert', async (m) => {
        const msgInfo = m.messages[0];
        if (msgInfo.key.fromMe || !msgInfo.message) return;

        const from = msgInfo.key.remoteJid.split('@')[0];
        const messageText = msgInfo.message.conversation || msgInfo.message.extendedTextMessage?.text || '';

        if (onMessageCallback && messageText) {
            try {
                const [users] = await pool.query('SELECT * FROM users WHERE whatsapp_number = ?', [from]);
                
                if (users.length > 0) {
                    const user = users[0];
                    if (user.workspace_id) {
                        const [workspaces] = await pool.query('SELECT whatsapp_bot_enabled FROM workspaces WHERE id = ?', [user.workspace_id]);
                        if (workspaces.length > 0 && workspaces[0].whatsapp_bot_enabled) {
                            onMessageCallback(messageText, from, user);
                        }
                    }
                }
            } catch (error) {
                console.error("[Bot] Gagal memproses pesan masuk:", error);
            }
        }
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
    } else if (connection === 'close') {
      isReady = false;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log('[WhatsApp] Koneksi ditutup karena:', lastDisconnect?.error, ', mencoba menghubungkan kembali:', shouldReconnect);
      if (shouldReconnect) {
        setTimeout(() => startWhatsApp(onMessageCallback), 5000);
      }
    }
  });
}

async function sendWhatsAppMessage(number, message) {
  if (!sock || !isReady) {
    throw new Error('Koneksi WhatsApp belum siap untuk mengirim pesan.');
  }
  const jid = `${number.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
  try {
    await sock.sendMessage(jid, { text: message });
    console.log(`[WhatsApp] Pesan terkirim ke ${number}`);
  } catch(error) {
    console.error(`[WhatsApp] Gagal mengirim pesan ke ${number}: `, error)
  }
}

module.exports = { startWhatsApp, sendWhatsAppMessage };