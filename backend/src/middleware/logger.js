const logger = (req, res, next) => {
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const device = req.headers['user-agent'];

    console.log(`[${formattedDate}] Request from IP: ${ip}`);
    console.log(`> Device & UA: ${device}`);
    console.log(`> Path: ${req.method} ${req.originalUrl}`);
    next();
};

module.exports = logger;