import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

const MapController = ({ position, zoom, bounds }) => {
    const map = useMap();

    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds);
        }
    }, [map, bounds]);

    useEffect(() => {
        if (position) {
            map.flyTo(position, zoom, {
                animate: true,
                duration: 1.5,
            });
        }
    }, [position, zoom, map]);

    return null;
};

const createCustomIcon = (type) => {
    const colors = {
        ODC: '#f59e0b', ODP: '#10b981', JoinBox: '#3b82f6', Server: '#ef4444',
    };
    const color = colors[type] || '#6b7280';
    const markerHtml = `
    <div style="background-color: ${color}; width: 2rem; height: 2rem; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; justify-content: center; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
      <div style="transform: rotate(45deg); color: white; font-size: 10px; font-weight: bold;">
        ${type.slice(0, 3)}
      </div>
    </div>`;
    return new L.DivIcon({
        html: markerHtml, className: 'custom-leaflet-icon',
        iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32],
    });
};

const MapDisplay = ({ assets, focusedPosition, onMarkerClick }) => {
    const mapBounds = [
        [-7.828, 112.010],
        [-7.814, 112.023],
    ];
    const mapCenter = [-7.821, 112.016];
    return (
        <MapContainer center={mapCenter} zoom={16} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController position={focusedPosition} zoom={18} bounds={mapBounds} />
            {assets.map(asset => (
                <Marker 
                    key={asset.id} 
                    position={[parseFloat(asset.latitude), parseFloat(asset.longitude)]}
                    icon={createCustomIcon(asset.type)}
                    eventHandlers={{
                        click: () => {
                            onMarkerClick(asset);
                        },
                    }}
                >
                </Marker>
            ))}
        </MapContainer>
    );
};

export default MapDisplay;