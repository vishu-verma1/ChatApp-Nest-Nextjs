"use client"
import { useSocket } from '@/app/context/SocketContext';
import React, { useState } from 'react'




interface DeleteMessageComponentProps {
    setIsMessageDeleteModalOpen: (isOpen: boolean) => void;
    messageId: string;
    userId: string;
    receiverId: string;
    isSenderMsg: boolean;
}

const DeleteMesageComponent: React.FC<DeleteMessageComponentProps> = ({ setIsMessageDeleteModalOpen, messageId, userId, receiverId, isSenderMsg, }) => {
    const socket = useSocket();

    const cancelHandle = () => {
        setIsMessageDeleteModalOpen(false);
    };

    const deleteForMeHandle = () => {
        socket?.emit('deleteMessage', { messageId, userId, deleteForEveryone: false });
        setIsMessageDeleteModalOpen(false);
    };

    const deleteForEveryoneHandle = () => {
        socket?.emit('deleteMessage', { messageId, userId, deleteForEveryone: true });
        setIsMessageDeleteModalOpen(false);
    };

    return (
        <div className='deleteMessage p-1 h-40 w-64 bg-gray-100 flex flex-col gap-1 rounded-md shadow-md'>
            <h6
                onClick={deleteForMeHandle}
                className="text-green-400 font-semibold cursor-pointer hover:bg-gray-200 py-2 px-2">
                Delete for me
            </h6>
            {isSenderMsg && (
                <h6
                    onClick={deleteForEveryoneHandle}
                    className="text-green-400 font-semibold cursor-pointer hover:bg-gray-200 py-2 px-2">
                    Delete for everyone
                </h6>
            )}
            <h6
                onClick={cancelHandle}
                className="text-green-400 font-semibold cursor-pointer hover:bg-gray-200 py-2 px-2">
                Cancel
            </h6>
        </div>
    );
};
export default DeleteMesageComponent;



