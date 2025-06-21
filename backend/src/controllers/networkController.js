const { runCommandForWorkspace } = require('../utils/apiConnection');

exports.getArpTable = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    if (!workspaceId) {
        return res.status(400).json({ message: 'Workspace tidak valid.' });
    }
    try {
        const arpTable = await runCommandForWorkspace(workspaceId, '/ip/arp/print');
        res.json(arpTable);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil ARP table.', error: error.message });
    }
};