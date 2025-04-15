"use client";

import React from 'react';

interface ImageModalProps {
    imageUrl: string;
    onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose }) => {
    return (
        <div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50"
            onClick={onClose}
        >
            <img src={imageUrl} alt="Full view" className="max-h-full max-w-full" />
        </div>
    );
};

export default ImageModal;