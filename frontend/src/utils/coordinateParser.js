function dmsToDd(degrees, minutes, seconds, direction) {
    let dd = degrees + minutes / 60 + seconds / 3600;
    if (direction === 'S' || direction === 'W') {
        dd = dd * -1;
    }
    return dd;
}

export function parseCoordinates(coordString) {
    coordString = coordString.trim();
    if (coordString.includes('°')) {
        const regex = /(\d+)[°|º]\s*(\d+)[’|']\s*(\d+(?:\.\d+)?)(?:"|”|''|´´)\s*([NSEW])/gi;
        const matches = [...coordString.matchAll(regex)];

        if (matches.length !== 2) {
            throw new Error("Format koordinat D-M-S tidak valid. Pastikan ada dua bagian (Latitude dan Longitude).");
        }

        const [latParts, lonParts] = matches;
        
        const latitude = dmsToDd(
            parseFloat(latParts[1]), 
            parseFloat(latParts[2]), 
            parseFloat(latParts[3]), 
            latParts[4].toUpperCase()
        );

        const longitude = dmsToDd(
            parseFloat(lonParts[1]), 
            parseFloat(lonParts[2]), 
            parseFloat(lonParts[3]), 
            lonParts[4].toUpperCase()
        );

        return { latitude, longitude };

    } 
    else {
        const parts = coordString.split(',').map(s => s.trim());
        if (parts.length !== 2) {
            throw new Error("Format koordinat salah. Gunakan format 'latitude, longitude'.");
        }
        
        const latitude = parseFloat(parts[0]);
        const longitude = parseFloat(parts[1]);

        if (isNaN(latitude) || isNaN(longitude)) {
            throw new Error("Koordinat mengandung nilai yang bukan angka.");
        }

        return { latitude, longitude };
    }
}