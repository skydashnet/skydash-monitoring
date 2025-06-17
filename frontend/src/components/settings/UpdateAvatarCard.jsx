import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { Camera } from 'lucide-react';
import ImageCropperModal from './ImageCropperModal';

const UpdateAvatarCard = () => {
    const { authUser, setAuthUser } = useAuth();
    const [imageToCrop, setImageToCrop] = useState(null);
    const [croppedFile, setCroppedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [message, setMessage] = useState('');
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                setImageToCrop(reader.result);
            };
        }
    };

    const handleCropComplete = (croppedImageBlob) => {
        setCroppedFile(croppedImageBlob);
        setPreview(URL.createObjectURL(croppedImageBlob));
        setImageToCrop(null);
    };

    const handleUpload = async () => {
        if (!croppedFile) return;
        const formData = new FormData();
        formData.append('avatar', croppedFile, 'avatar.jpeg');

        try {
            const response = await fetch('/api/user/avatar', { method: 'POST', body: formData });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            setMessage('Upload berhasil!');
            setAuthUser(data.user);
            setPreview(null);
            setCroppedFile(null);
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        }
    };

    return (
        <>
            {imageToCrop && (
                <ImageCropperModal imageSrc={imageToCrop} onCropComplete={handleCropComplete} onCancel={() => setImageToCrop(null)} />
            )}
            <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-lg p-6 text-center h-full flex flex-col">
                <h2 className="text-xl font-bold mb-4">Foto Profil</h2>
                <div className="flex-grow">
                    <div className="relative w-32 h-32 mx-auto">
                        <img 
                            src={preview || authUser.profile_picture_url} 
                            alt="Avatar" 
                            className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-md"
                        />
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                        <button 
                            onClick={() => fileInputRef.current.click()}
                            className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-md border-2 border-white dark:border-gray-800"
                            aria-label="Ganti foto"
                        >
                            <Camera size={18} />
                        </button>
                    </div>
                </div>
                
                {preview && (
                    <div className="mt-4">
                        <button onClick={handleUpload} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors">
                            Simpan Foto Baru
                        </button>
                    </div>
                )}
                {message && <p className="text-sm mt-2">{message}</p>}
            </div>
        </>
    );
};

export default UpdateAvatarCard;