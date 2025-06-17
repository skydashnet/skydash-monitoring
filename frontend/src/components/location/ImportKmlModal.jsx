import React, { useState, useEffect, useRef } from 'react';
import { X, FileUp, Loader2 } from 'lucide-react';

const ImportKmlModal = ({ isOpen, onClose, onSuccess }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');
    const fileInputRef = useRef(null);
    useEffect(() => {
        if (isOpen) {
            setSelectedFile(null);
            setMessage('');
            setIsLoading(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.name.endsWith('.kml')) {
            setSelectedFile(file);
            setMessage('');
        } else {
            setSelectedFile(null);
            setMessageType('error');
            setMessage('File tidak valid. Harap pilih file dengan ekstensi .kml');
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setIsLoading(true);
        setMessage('');
        const formData = new FormData();
        formData.append('kmlFile', selectedFile);

        try {
            const response = await fetch('/api/import/kml', {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Gagal mengimpor file');
            
            setMessageType('success');
            setMessage(data.message);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);

        } catch (err) {
            setMessageType('error');
            setMessage(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const messageColor = {
        success: 'text-green-600 dark:text-green-400',
        error: 'text-red-600 dark:text-red-400',
        info: 'text-gray-600 dark:text-gray-400',
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-lg">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold">Import Aset dari File KML</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><X size={20} /></button>
                </div>
                <div className="p-6">
                    <div className="text-xs p-3 mb-4 bg-blue-50 dark:bg-blue-900/50 border-l-4 border-blue-500 text-blue-800 dark:text-blue-200 rounded-r-lg">
                        <p className="font-bold">PENTING:</p>
                        <p>Pastikan file KML Anda memiliki struktur folder dengan nama `ODC`, `ODP`, `JoinBox`, atau `Server` untuk penentuan tipe aset otomatis.</p>
                    </div>

                    <div 
                        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        onClick={() => fileInputRef.current.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".kml"
                            onChange={handleFileChange}
                        />
                        <FileUp className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            {selectedFile ? `File terpilih: ${selectedFile.name}` : 'Klik atau seret file KML ke sini'}
                        </p>
                    </div>

                    {message && <p className={`text-sm mt-4 text-center font-semibold ${messageColor[messageType]}`}>{message}</p>}
                </div>
                <div className="flex justify-end gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600">Batal</button>
                    <button 
                        onClick={handleUpload}
                        disabled={!selectedFile || isLoading}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading && <Loader2 size={16} className="animate-spin" />}
                        {isLoading ? 'Memproses...' : 'Upload & Proses'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportKmlModal;