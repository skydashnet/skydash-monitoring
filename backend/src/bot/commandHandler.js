const { sendWhatsAppMessage } = require('../services/whatsappService');
const pool = require('../config/database');
const { runCommandForWorkspace } = require('../utils/apiConnection');

async function handleCommand(message, from, user) {
    const text = message.toLowerCase().trim();
    const workspaceId = user.workspace_id;
    const helpMessage = `*Bantuan Bot SkydashNET* 🤖

Berikut adalah daftar perintah yang tersedia:

*Pengecekan & Status*
• \`.ping\` - Cek koneksi bot ke dasbor.
• \`.log <error?>\` - Lihat log MikroTik.

*Manajemen Aset*
• \`.odp total\` - Lihat total & list ODP.
• \`.odc total\` - Lihat total & list ODC.
• \`.jb total\` - Lihat total JoinBox.
• \`.server total\` - Lihat total Server.
• \`.odp <nama-odp>\` - Lihat detail ODP & pengguna terhubung.
• \`.odc <nama-odc>\` - Lihat detail ODC & ODP terhubung.
• \`.lokasi <nama-aset>\` - Dapatkan link Google Maps untuk lokasi aset.
• \`.cek <nama-user-pppoe>\` - Cek lokasi ODP pengguna PPPoE.

*Management PPPOE dan HOTSPOT*
• \`.disable <pppoe|hotspot> <nama>\` - Nonaktifkan user.
• \`.enable <pppoe|hotspot> <nama>\` - Aktifkan user.
• \`.kick <pppoe|hotspot> <nama>\` - Putuskan koneksi user aktif.
• \`.set profile <pppoe|hotspot> <nama> <profil>\` - Ganti profil kecepatan.

*Manajemen Alarm*
• \`.set alarm pppoe <nilai>\` - Atur alarm traffic (dalam Mbps).
• \`.list alarm\` - Lihat semua alarm aktif.
• \`.delete alarm pppoe\` - Hapus alarm traffic PPPoE.

*Utilitas Hotspot*
• \`.gen voucher <jumlah> <profil>\` - Buat voucher hotspot massal.

_Catatan: Perintah tidak case-sensitive, kecuali untuk nama aset/user._`;
    const templates = {
        notFound: "Maaf, perintah tidak dikenali. Ketik `.help` untuk melihat daftar perintah yang tersedia.",
        error: "Terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi.",
        noWorkspace: "Anda harus memiliki workspace dan konfigurasi perangkat untuk menggunakan bot ini.",
        pong: "Pong! 🏓\n\nDasbor SkydashNET Anda aktif dan terhubung!",
    };
    
    if (!workspaceId) {
        return await sendWhatsAppMessage(from, templates.noWorkspace);
    }

    try {
        const lowerCaseText = text.toLowerCase();
        const commandParts = text.split(' ');
        const mainCommand = lowerCaseText.split(' ')[0];
        const commandType = (commandParts[1] || '').toLowerCase();
        const targetName = commandParts.slice(2).join(' ');

        if (mainCommand === '.help') {
            await sendWhatsAppMessage(from, helpMessage);
        } 
        else if (text === '.ping') {
            await sendWhatsAppMessage(from, templates.pong);
        } else if (text === '.odp total') {
            await handleAssetTotal(workspaceId, 'ODP', from);
        } else if (text === '.odc total') {
            await handleAssetTotal(workspaceId, 'ODC', from);
        } else if (text === '.jb total') {
            await handleAssetTotal(workspaceId, 'JoinBox', from);
        } else if (text === '.server total') {
             await handleAssetTotal(workspaceId, 'Server', from);
        } else if (text.startsWith('.odp ')) {
            const assetName = text.substring(5).trim();
            await handleAssetDetail(workspaceId, 'ODP', assetName, from);
        } else if (text.startsWith('.odc ')) {
            const assetName = text.substring(5).trim();
            await handleAssetDetail(workspaceId, 'ODC', assetName, from);
        } else if (text.startsWith('.cek ')) {
            const userName = text.substring(5).trim();
            await handleUserLocationCheck(workspaceId, userName, from);
        } else if (mainCommand === '.set') {
            await handleSetAlarm(workspaceId, commandParts, from);
        } else if (mainCommand === '.list') {
            await handleListAlarms(workspaceId, commandParts, from);
        } else if (mainCommand === '.delete') {
            await handleDeleteAlarm(workspaceId, commandParts, from);
        } else if (mainCommand === '.disable' && commandType === 'pppoe' && targetName) {
            await handleSetPppoeUserStatus(workspaceId, targetName, true, from);
        } else if (mainCommand === '.enable' && commandType === 'pppoe' && targetName) {
            await handleSetPppoeUserStatus(workspaceId, targetName, false, from);
        } else if (mainCommand === '.kick' && commandType === 'pppoe' && targetName) {
            await handleKickPppoeUser(workspaceId, targetName, from);
        } else if (mainCommand === '.disable' && commandType === 'hotspot' && targetName) {
            await handleSetHotspotUserStatus(workspaceId, targetName, true, from);
        } else if (mainCommand === '.enable' && commandType === 'hotspot' && targetName) {
            await handleSetHotspotUserStatus(workspaceId, targetName, false, from);
        } else if (mainCommand === '.kick' && commandType === 'hotspot' && targetName) {
            await handleKickHotspotUser(workspaceId, targetName, from);
        } else if (mainCommand === '.gen' && commandParts[1]?.toLowerCase() === 'voucher') {
            const count = parseInt(commandParts[2], 10);
            const profile = commandParts[3];
            await handleGenerateVouchers(workspaceId, count, profile, from);
        } else if (mainCommand === '.set' && commandAction === 'profile') {
            const userType = (commandParts[2] || '').toLowerCase();
            const userName = commandParts[3];
            const newProfile = commandParts[4];
            await handleSetUserProfile(workspaceId, userType, userName, newProfile, from);
        } else if (mainCommand === '.log') {
            const logTopic = (commandParts[1] || '').toLowerCase();
            await handleGetLogs(workspaceId, logTopic, from);
        } else {
            await sendWhatsAppMessage(from, templates.notFound);
        }
    } catch (error) {
        console.error(`[Bot Command Error] Perintah "${text}" gagal:`, error);
    }
}

async function handleAssetTotal(workspaceId, assetType, from) {
    const [assets] = await pool.query(
        'SELECT name, description FROM network_assets WHERE workspace_id = ? AND type = ? ORDER BY name ASC',
        [workspaceId, assetType]
    );

    let reply = `*Total Aset ${assetType} Ditemukan: ${assets.length}* 📊\n\n`;
    
    if (assets.length > 0) {
        const assetList = assets.map((asset, index) => {
            const assetName = `${index + 1}. \`${asset.name}\``;
            const assetDesc = asset.description ? `\n   └ _${asset.description}_` : '';
            return assetName + assetDesc;
        }).join('\n\n');

        reply += assetList;
    } else {
        reply += `_Tidak ada aset ${assetType} yang terdaftar di workspace ini._`;
    }

    await sendWhatsAppMessage(from, reply);
}

async function handleAssetDetail(workspaceId, assetType, assetName, from) {
    const [assets] = await pool.query(
        'SELECT * FROM network_assets WHERE workspace_id = ? AND type = ? AND name = ?',
        [workspaceId, assetType, assetName]
    );

    if (assets.length === 0) {
        return await sendWhatsAppMessage(from, `Maaf, aset dengan nama \`${assetName}\` tidak ditemukan.`);
    }

    const asset = assets[0];
    let reply = `*Detail Aset: ${asset.name}*\n\n`;
    reply += `*Tipe:* ${asset.type}\n`;
    reply += `*Koordinat:* \`${asset.latitude}, ${asset.longitude}\`\n`;
    if (asset.description) {
        reply += `*Keterangan:* _${asset.description}_\n`;
    }
    if (asset.splitter_count) {
        reply += `*Splitter:* ${asset.splitter_count} port\n`;
    }

    if (assetType === 'ODP') {
        const [connectedUsers] = await pool.query(
            'SELECT pppoe_secret_name FROM odp_user_connections WHERE asset_id = ? AND workspace_id = ?',
            [asset.id, workspaceId]
        );
        reply += `\n*Pengguna Terhubung (${connectedUsers.length}):*\n`;
        if (connectedUsers.length > 0) {
            reply += connectedUsers.map(u => `> \`${u.pppoe_secret_name}\``).join('\n');
        } else {
            reply += `_Tidak ada pengguna yang terhubung._`;
        }
    } else if (assetType === 'ODC') {
        const [connectedOdps] = await pool.query(
            'SELECT name, description FROM network_assets WHERE parent_asset_id = ? AND workspace_id = ?',
            [asset.id, workspaceId]
        );
        reply += `\n*ODP Terhubung (${connectedOdps.length}):*\n`;
        if (connectedOdps.length > 0) {
            reply += connectedOdps.map(o => `> \`${o.name}\`\n   └ _${o.description || 'Tanpa keterangan'}_`).join('\n');
        } else {
            reply += `_Tidak ada ODP yang terhubung._`;
        }
    }

    await sendWhatsAppMessage(from, reply);
}

async function handleUserLocationCheck(workspaceId, userName, from) {
    const [connections] = await pool.query(
        `SELECT na.name 
         FROM odp_user_connections ouc
         JOIN network_assets na ON ouc.asset_id = na.id
         WHERE ouc.workspace_id = ? AND ouc.pppoe_secret_name = ?`,
        [workspaceId, userName]
    );

    let reply;
    if (connections.length > 0) {
        const odpName = connections[0].name;
        reply = `✅ *Hasil Pengecekan*\n\nPengguna \`${userName}\` ditemukan terhubung ke ODP:\n\n*${odpName}*`;
    } else {
        reply = `❌ *Hasil Pengecekan*\n\nPengguna \`${userName}\` tidak ditemukan terhubung di ODP manapun.`;
    }

    await sendWhatsAppMessage(from, reply);
}

async function handleSetAlarm(workspaceId, args, from) {
    if (args.length !== 4 || args[1] !== 'alarm') {
        return await sendWhatsAppMessage(from, "Format salah. Gunakan: `.set alarm <tipe> <nilai>`\nContoh: `.set alarm pppoe 50`");
    }
    const type = `PPPOE_TRAFFIC`;
    const threshold = parseInt(args[3], 10);

    if (isNaN(threshold)) {
        return await sendWhatsAppMessage(from, "Nilai ambang batas harus berupa angka (Mbps).");
    }
    await pool.query(
        `INSERT INTO alarms (workspace_id, type, threshold_mbps) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE threshold_mbps=VALUES(threshold_mbps)`,
        [workspaceId, type, threshold]
    );

    const reply = `✅ *Alarm Berhasil Diatur*\n\nBot akan memberitahu Anda jika ada traffic PPPoE yang melebihi *${threshold} Mbps*.`;
    await sendWhatsAppMessage(from, reply);
}

async function handleListAlarms(workspaceId, args, from) {
    if (args.length !== 2 || args[1] !== 'alarm') {
        return await sendWhatsAppMessage(from, "Format salah. Gunakan: `.list alarm`");
    }
    
    const [alarms] = await pool.query('SELECT * FROM alarms WHERE workspace_id = ?', [workspaceId]);

    if (alarms.length === 0) {
        return await sendWhatsAppMessage(from, "Tidak ada alarm yang aktif saat ini.");
    }

    let reply = "*Daftar Alarm Aktif* 🔔\n\n";
    const alarmList = alarms.map(alarm => {
        const readableType = alarm.type.replace('_', ' ').toLowerCase();
        return `> *${readableType}* diatur pada *${alarm.threshold_mbps} Mbps*`;
    }).join('\n');

    reply += alarmList;
    await sendWhatsAppMessage(from, reply);
}

async function handleDeleteAlarm(workspaceId, args, from) {
    if (args.length !== 3 || args[1] !== 'alarm') {
        return await sendWhatsAppMessage(from, "Format salah. Gunakan: `.delete alarm <tipe>`\nContoh: `.delete alarm pppoe`");
    }
    const type = `PPPOE_TRAFFIC`;

    const [result] = await pool.query(
        'DELETE FROM alarms WHERE workspace_id = ? AND type = ?',
        [workspaceId, type]
    );

    let reply;
    if (result.affectedRows > 0) {
        reply = `✅ Alarm untuk *PPPoE Traffic* berhasil dihapus.`;
    } else {
        reply = `ℹ️ Tidak ditemukan alarm untuk *PPPoE Traffic* yang bisa dihapus.`;
    }
    await sendWhatsAppMessage(from, reply);
}

async function handleSetPppoeUserStatus(workspaceId, userName, shouldDisable, from) {
    try {
        const secrets = await runCommandForWorkspace(workspaceId, '/ppp/secret/print', [`?name=${userName}`]);
        if (secrets.length === 0) {
            return await sendWhatsAppMessage(from, `❌ Gagal: Pengguna PPPoE dengan nama \`${userName}\` tidak ditemukan.`);
        }
        const secretId = secrets[0]['.id'];
        const response = await fetch(`http://localhost:3001/api/pppoe/secrets/${secretId}/status`, {
             method: 'PUT',
             headers: { 'Content-Type': 'application/json',},
             body: JSON.stringify({ disabled: shouldDisable.toString() })
        });
        await runCommandForWorkspace(workspaceId, '/ppp/secret/set', [
            `=.id=${secretId}`,
            `=disabled=${shouldDisable ? 'yes' : 'no'}`
        ]);

        const actionText = shouldDisable ? 'dinonaktifkan' : 'diaktifkan';
        const reply = `✅ Berhasil! Pengguna \`${userName}\` telah *${actionText}*.`;
        await sendWhatsAppMessage(from, reply);
    } catch (error) {
        await sendWhatsAppMessage(from, `❌ Terjadi kesalahan: ${error.message}`);
    }
}

async function handleKickPppoeUser(workspaceId, userName, from) {
    try {
        const activeUsers = await runCommandForWorkspace(workspaceId, '/ppp/active/print', [`?name=${userName}`]);
        if (activeUsers.length === 0) {
            return await sendWhatsAppMessage(from, `ℹ️ Info: Pengguna \`${userName}\` sedang tidak aktif, tidak perlu di-kick.`);
        }
        const activeId = activeUsers[0]['.id'];
        
        await runCommandForWorkspace(workspaceId, '/ppp/active/remove', [`=.id=${activeId}`]);

        const reply = `✅ Berhasil! Koneksi pengguna \`${userName}\` telah diputuskan.`;
        await sendWhatsAppMessage(from, reply);
    } catch (error) {
        await sendWhatsAppMessage(from, `❌ Terjadi kesalahan: ${error.message}`);
    }
}

async function handleSetHotspotUserStatus(workspaceId, userName, shouldDisable, from) {
    try {
        const users = await runCommandForWorkspace(workspaceId, '/ip/hotspot/user/print', [`?name=${userName}`]);
        if (users.length === 0) {
            return await sendWhatsAppMessage(from, `❌ Gagal: User hotspot dengan nama \`${userName}\` tidak ditemukan.`);
        }
        const userId = users[0]['.id'];
        
        await runCommandForWorkspace(workspaceId, '/ip/hotspot/user/set', [
            `=.id=${userId}`,
            `=disabled=${shouldDisable ? 'yes' : 'no'}`
        ]);

        const actionText = shouldDisable ? 'dinonaktifkan' : 'diaktifkan';
        const reply = `✅ Berhasil! User hotspot \`${userName}\` telah *${actionText}*.`;
        await sendWhatsAppMessage(from, reply);
    } catch (error) {
        await sendWhatsAppMessage(from, `❌ Terjadi kesalahan: ${error.message}`);
    }
}

async function handleKickHotspotUser(workspaceId, userName, from) {
    try {
        const activeUsers = await runCommandForWorkspace(workspaceId, '/ip/hotspot/active/print', [`?user=${userName}`]);
        if (activeUsers.length === 0) {
            return await sendWhatsAppMessage(from, `ℹ️ Info: User \`${userName}\` sedang tidak aktif, tidak perlu di-kick.`);
        }
        const activeId = activeUsers[0]['.id'];
        
        await runCommandForWorkspace(workspaceId, '/ip/hotspot/active/remove', [`=.id=${activeId}`]);

        const reply = `✅ Berhasil! Koneksi user hotspot \`${userName}\` telah diputuskan.`;
        await sendWhatsAppMessage(from, reply);
    } catch (error) {
        await sendWhatsAppMessage(from, `❌ Terjadi kesalahan: ${error.message}`);
    }
}

async function handleGenerateVouchers(workspaceId, count, profile, from) {
    if (!count || !profile || isNaN(count)) {
        return await sendWhatsAppMessage(from, "Format salah. Gunakan: `.gen voucher <jumlah> <nama-profil>`\nContoh: `.gen voucher 10 1hari`");
    }
    if (count > 100) {
        return await sendWhatsAppMessage(from, "Jumlah maksimal voucher yang bisa dibuat sekali jalan adalah 100.");
    }

    try {
        const generatedUsers = [];
        await sendWhatsAppMessage(from, `⏳ Sedang membuat *${count} voucher* untuk profil *${profile}*... Mohon tunggu.`);

        for (let i = 0; i < count; i++) {
            const randomChars = Math.random().toString(36).substring(2, 6);
            const username = `vc${randomChars}`;
            const password = username;
            
            await runCommandForWorkspace(workspaceId, '/ip/hotspot/user/add', [
                `=name=${username}`,
                `=password=${password}`,
                `=profile=${profile}`,
            ]);
            generatedUsers.push({ username, password });
        }

        let reply = `✅ *Berhasil Membuat ${generatedUsers.length} Voucher!*\n\nProfil: *${profile}*\n\n`;
        const voucherList = generatedUsers.map(u => `Username: \`${u.username}\`\nPassword: \`${u.password}\``).join('\n------------------\n');
        reply += voucherList;

        await sendWhatsAppMessage(from, reply);

    } catch (error) {
        await sendWhatsAppMessage(from, `❌ Gagal membuat voucher: ${error.message}`);
    }
}

async function handleSetUserProfile(workspaceId, userType, userName, newProfile, from) {
    if (!['pppoe', 'hotspot'].includes(userType) || !userName || !newProfile) {
        return await sendWhatsAppMessage(from, "Format salah. Gunakan: `.set profile <pppoe|hotspot> <namauser> <profilbaru>`");
    }

    try {
        const profilePrintCommand = userType === 'pppoe' ? '/ppp/profile/print' : '/ip/hotspot/user/profile/print';
        const availableProfiles = await runCommandForWorkspace(workspaceId, profilePrintCommand, [`?name=${newProfile}`]);
        
        if (availableProfiles.length === 0) {
            return await sendWhatsAppMessage(from, `❌ Gagal: Profil dengan nama \`${newProfile}\` tidak ditemukan di perangkat.`);
        }
        const userPrintCommand = userType === 'pppoe' ? '/ppp/secret/print' : '/ip/hotspot/user/print';
        const users = await runCommandForWorkspace(workspaceId, userPrintCommand, [`?name=${userName}`]);
        if (users.length === 0) {
            return await sendWhatsAppMessage(from, `❌ Gagal: Pengguna ${userType} dengan nama \`${userName}\` tidak ditemukan.`);
        }
        const userId = users[0]['.id'];
        const userSetCommand = userType === 'pppoe' ? '/ppp/secret/set' : '/ip/hotspot/user/set';
        await runCommandForWorkspace(workspaceId, userSetCommand, [
            `=.id=${userId}`,
            `=profile=${newProfile}`
        ]);
        const reply = `✅ *Profil Berhasil Diubah*\n\nProfil pengguna ${userType} \`${userName}\` sekarang telah diubah menjadi *${newProfile}*.`;
        await sendWhatsAppMessage(from, reply);
    } catch (error) {
        await sendWhatsAppMessage(from, `❌ Terjadi kesalahan saat mengubah profil: ${error.message}`);
    }
}

async function handleGetLogs(workspaceId, topic, from) {
    try {
        const params = [];
        if (topic) {
            params.push(`?topics=${topic},!script`);
        }
        const logs = await runCommandForWorkspace(workspaceId, '/log/print', params);
        const recentLogs = logs.slice(-10);

        if (recentLogs.length === 0) {
            return await sendWhatsAppMessage(from, `ℹ️ Tidak ditemukan log untuk topik "${topic || 'semua'}".`);
        }

        let reply = `*Log Terbaru dari MikroTik* 📝\n`;
        if(topic) reply += `_Hanya menampilkan topik: ${topic}_\n\n`;

        const logList = recentLogs.map(log => {
            const time = log.time;
            const topics = log.topics.split(',').join(', ');
            const message = log.message;
            let icon = '💬';
            if (topics.includes('error')) icon = '❗️';
            else if (topics.includes('warning')) icon = '⚠️';
            else if (topics.includes('info')) icon = 'ℹ️';

            return `${icon} *[${time}]*\n*Topik:* ${topics}\n*Pesan:* _${message}_`;
        }).join('\n------------------\n');

        reply += logList;
        await sendWhatsAppMessage(from, reply);

    } catch (error) {
        await sendWhatsAppMessage(from, `❌ Terjadi kesalahan saat mengambil log: ${error.message}`);
    }
}

module.exports = { handleCommand };