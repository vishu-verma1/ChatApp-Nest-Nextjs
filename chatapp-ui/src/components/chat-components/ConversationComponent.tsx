"use client"
import { useSocket } from '@/app/context/SocketContext';
import { Check, CheckCheck, FileUp, Send } from 'lucide-react';
import { listeners } from 'process';
import React, { useEffect, useRef, useState } from 'react'
import { useDebounceCallback } from 'usehooks-ts';
import { boolean } from 'zod';
import DeleteMesageComponent from './DeleteMesageComponent';
import axios from 'axios';
import ImageModal from './ImageModal';



interface User {
    id: string;
    username: string;
    email: string;
    isActive: boolean,
    lastseen: string | Date;
    // lastseen: "2025-03-21T13:20:13.000Z"

}

interface Message {
    id: string;
    content: string;
    senderId: string;
    receiverId: string;
    iv?: string;
    isDeleted?: boolean;
    isSeen?: boolean;
    isDelivered?: boolean;
    createdAt?: string;
    updatedAt?: string;
    imageUrl?: string
    deletedForSender?: boolean;
    deletedForEveryone?: boolean;
    deletedForReceiver?: boolean;
}

const ConversationComponent = ({ user, receiverUser, activeUsers, messages, setMessages, isChatwindowModalOpen }: { user: User; receiverUser: User; activeUsers: string[]; messages: Message[]; setMessages: React.Dispatch<React.SetStateAction<Message[]>>; isChatwindowModalOpen: boolean }) => {






    const socket = useSocket();
    const [message, setMessage] = useState<string>('');
    const [updateMessageStatus, setUpdateMessageStatus] = useState(false);
    const [isMessageDeleteModalOpen, setIsMessageDeleteModalOpen] = useState<boolean>(false);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
    const [selectedMessageIsSender, setSelectedMessageIsSender] = useState<boolean>(false);
    const [fullImage, setFullImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)



    const uploadFile = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BASE_API_URL}messages/upload`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } })
            const imageUrl = response.data.url;
            const tempId = `${Date.now()}`;

            socket?.emit('sendMessage', {
                senderId: user.id,
                receiverId: receiverUser.id,
                content: message,
                imageUrl,
                tempId
            })


            setMessages((prev) => [...prev, {
                id: tempId,
                senderId: user.id,
                receiverId: receiverUser.id,
                content: message,
                imageUrl,
            }]);
            setMessage('');
        } catch (error) {
            console.error('File upload error:', error);
        }
    }


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            uploadFile(e.target.files[0])
        }
    }



    const messageDeleteHandle = (messageId: string, isSender: boolean) => {
        setIsMessageDeleteModalOpen(true);
        setSelectedMessageId(messageId);
        setSelectedMessageIsSender(isSender);
    }


    const handleTyping = () => {
        if (socket && receiverUser?.id && user?.id) {
            // console.log("user Typing");
            socket.emit('typing', {
                receiverId: receiverUser.id,
                senderId: user.id,
            });
        }
    };
    const debounceTyping = useDebounceCallback(handleTyping, 300)

    const sendMessageHandle = () => {
        if (message.trim() && user && receiverUser) {
            const tempId = `${Date.now()}`;
            const newMessage = {
                id: tempId,
                senderId: user.id,
                receiverId: receiverUser.id,
                content: message,
                isDelivered: false,
                isSeen: false,
            };


            setMessages((prev) => [...prev, newMessage]);

            console.log(newMessage, "----")
            socket?.emit('sendMessage', {
                senderId: user.id,
                receiverId: receiverUser.id,
                content: message,
                tempId,
            });

            setMessage('');
        }
    };

    const handleTypingEvent = (data: { senderId: string }) => {
        // console.log('Typing event received:', data);
        if (data.senderId === user?.id) return;

        setTypingUsers((prev) => {
            const newSet = new Set(prev);
            newSet.add(data.senderId);
            return newSet;
        });

        setTimeout(() => {
            setTypingUsers((prev) => {
                const newSet = new Set(prev);
                newSet.delete(data.senderId);
                return newSet;
            });
        }, 3000);
    };




    useEffect(() => {
        if (!socket) return;

        const handleMessageDeleted = (data: { messageId: string; deleteForEveryone: boolean }) => {
            setMessages((prevMessages) =>
                prevMessages.reduce((acc: Message[], msg) => {
                    if (msg.id === data.messageId) {
                        if (data.deleteForEveryone) {
                            // will update message for both sender and receiver
                            acc.push({
                                ...msg,
                                content: 'This message was deleted',
                                isDeleted: true,
                                deletedForEveryone: true,
                                deletedForSender: true,
                            });
                        } else {


                            if (msg.senderId === user.id) { // for delete-for-me, if current user is sender, update message, if current user is receiver, remove it.
                                acc.push({
                                    ...msg,
                                    content: 'This message was deleted',
                                    isDeleted: true,
                                    deletedForSender: true,
                                });
                            }
                            // for receiver deletion, do not include the message
                        }
                    } else {
                        acc.push(msg);
                    }
                    return acc;
                }, [])
            );
        };

        socket.on('messageDeleted', handleMessageDeleted);
        return () => {
            socket.off('messageDeleted', handleMessageDeleted);
        };
    }, [socket, user, setMessages]);


    useEffect(() => {
        if (!socket || !user || !receiverUser) return;
        // console.log( socket, "socket--------")

        const handleChatHistory = (chatHistory: Message[]) => {
            const filteredMessages = chatHistory.filter((msg: Message) =>
                (msg.senderId === user.id && msg.receiverId === receiverUser.id) ||
                (msg.senderId === receiverUser.id && msg.receiverId === user.id)
            );
            // console.log(filteredMessages, '------');
            setMessages(filteredMessages);
        };

        // console.log("Registering chatHistory listener");
        socket.on("chatHistory", handleChatHistory);

        return () => {
            // console.log("Cleaning up chatHistory listener");
            socket.off("chatHistory", handleChatHistory);
        };
    }, [socket, user?.id, receiverUser?.id, isChatwindowModalOpen,]);

    useEffect(() => {  //geting history of chat 
        if (socket && user && receiverUser ) {
            // console.log('Fetching chat history for:', { senderId: user.id, receiverId: receiverUser.id });
            socket.emit('getChatHistory', { senderId: user.id, receiverId: receiverUser.id });
            console.log("first", socket) 
            setMessages([]);
        }
    }, [receiverUser?.id, isChatwindowModalOpen]);




    useEffect(() => {
        // console.log('Registering userTyping listener');
        socket?.on('userTyping', handleTypingEvent);

        return () => {
            // console.log('Removing userTyping listener');
            socket?.off('userTyping', handleTypingEvent);
        };
    }, [socket, user?.id, receiverUser?.id]);






    // listeners for websocket
    useEffect(() => {
        if (socket && user && receiverUser) {
            socket.on('receiveMessage', (newMessage) => {
                if (
                    (newMessage.senderId === user?.id && newMessage.receiverId === receiverUser?.id) ||
                    (newMessage.senderId === receiverUser?.id && newMessage.receiverId === user?.id)
                ) {
                    setMessages((prev) => {

                        const tempMessageIndex = prev.findIndex(
                            (msg) => msg.id === newMessage.tempId
                        );

                        if (tempMessageIndex !== -1) {

                            const updatedMessages = [...prev];
                            updatedMessages[tempMessageIndex] = {
                                ...prev[tempMessageIndex],
                                ...newMessage,
                                id: newMessage.id,
                            };
                            return updatedMessages;
                        }
                        return [...prev, newMessage];
                    });
                }
            });

            return () => {
                socket.off('receiveMessage');
            };
        }
    }, [user, receiverUser, socket, activeUsers, isChatwindowModalOpen])





    // console.log(isChatwindowModalOpen, "------")

    useEffect(() => {
        if (socket && user) {
            socket?.on('messageStatusUpdated', (updatedMessage) => {
                // console.log('Received updated message:', updatedMessage);

                setMessages((prev) => {
                    const updatedMessages = prev.map((msg) => {
                        // console.log(msg.isSeen, "msgId--")
                        return (msg.id === updatedMessage.tempId || msg.id === updatedMessage.id
                            ? { ...msg, ...updatedMessage, id: updatedMessage.id }
                            : msg)
                    });

                    if (!updatedMessages.find((msg) => msg.id === updatedMessage.id)) {
                        updatedMessages.push(updatedMessage);
                    }

                    // console.log('Updated messages array:', updatedMessages);
                    return updatedMessages;
                });



            });

            return () => {
                socket!.off('messageStatusUpdated');
            };
        }
    }, [socket, user,]);



    //for scrolling 

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', })
        }
    }, [messages, typingUsers, isChatwindowModalOpen])



    return <>
        <div className="conversation-area  flex flex-col justify-between h-[calc(100%-48px)]">
            {messages.length > 0 ? (
                <div className="message-box h-full flex flex-col gap-2 p-2  overflow-auto">
                    {messages.map((msg: Message, index: number) => {
                        const isSenderMsg = msg.senderId === user?.id;
                        // console.log(msg, "sender")
                        // console.log(user.id, "sender")
                        // console.log(msg.isSeen, msg.content, "///////////")
                        return <div
                            onDoubleClick={() => messageDeleteHandle(msg.id, isSenderMsg)}
                            key={msg.id}
                            className={`p-2 max-w-[60%] cursor-pointer w-fit rounded-lg shadow-md ${isSenderMsg
                                ? 'ml-auto bg-blue-300 text-white'
                                : 'mr-auto bg-gray-300 text-black'
                                }`}
                        >
                            {msg.imageUrl ? (
                                <>
                                    {msg.deletedForEveryone || (msg.deletedForSender && isSenderMsg) ? (
                                        <p className="mt-1">This message was deleted</p>
                                    ) : (
                                        <> <img src={msg.imageUrl} alt="sent file" className="max-w-full h-64 rounded"
                                            onClick={() => setFullImage(msg.imageUrl ?? null)}
                                            onLoad={() => {
                                                if (!msg.isSeen && msg.receiverId === user.id) {
                                                    socket?.emit('seenMessage', { messageId: msg.id });
                                                }
                                            }}
                                        />
                                            {msg.content && <p className="mt-1">{msg.content}</p>}
                                        </>
                                    )}
                                </>
                            ) : (
                                <p>
                                    {isSenderMsg
                                        ? (msg.deletedForSender || msg.deletedForEveryone)
                                            ? 'This message was deleted'
                                            : msg.content
                                        : msg.deletedForEveryone
                                            ? 'This message was deleted'
                                            : msg.content}
                                </p>
                            )}
                            {isSenderMsg && !msg.isDeleted && (
                                <p className="text-xs text-gray-500">
                                    {msg.isSeen ? (
                                        <CheckCheck className="text-green-600" />
                                    ) : msg.isDelivered ? (
                                        <CheckCheck />
                                    ) : (
                                        <Check />
                                    )}
                                </p>
                            )}
                        </div>
                    })}
                    <div ref={messagesEndRef} />
                    {typingUsers.size > 0 && (
                        <div
                            className={`flex items-center gap-2 p-2 transition-opacity duration-300 ${typingUsers.size > 0 ? 'opacity-100' : 'opacity-0'
                                }`}
                        >
                            {[...typingUsers].map((uid) => (
                                <div key={uid} className="flex items-center gap-2">
                                    <p className="text-sm text-gray-500">typing</p>
                                    <div className="flex items-center gap-1">
                                        <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></span>
                                        <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce delay-200"></span>
                                        <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce delay-400"></span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            ) : (
                <div className="message-box h-full flex flex-col gap-2 p-2  overflow-auto">
                    {[...typingUsers].map((uid) => (
                        <div key={uid} className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <p className="text-sm text-gray-500">typing</p>
                                <span className="h-1 w-1 bg-gray-500 rounded-full animate-bounce"></span>
                                <span className="h-1 w-1 bg-gray-500 rounded-full animate-bounce delay-200"></span>
                                <span className="h-1 w-1 bg-gray-500 rounded-full animate-bounce delay-400"></span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="input-field p-2 bg-slate-200 w-full flex items-center gap-1  ">
                <input
                    value={message}
                    onChange={(e) => {
                        setMessage(e.target.value)
                        debounceTyping();
                    }}
                    className='p-2 px-4 flex-grow rounded border-none outline-none bg-slate-100' type="text" placeholder='Type message here ' />
                <input
                    type="file"
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className='shadow-md px-2 py-1 md:p-1 md:px-6 bg-slate-900 text-white rounded-md '> <FileUp /> </button>
                <button
                    onClick={sendMessageHandle}
                    className='shadow-md px-2 py-1 md:p-1 md:px-6 bg-slate-900 text-white rounded-md '> <Send /> </button>
            </div>

            <div className={` h-[94%] w-full flex justify-center items-center absolute bg-[#0000002c] ${isMessageDeleteModalOpen ? "opacity-100 scale-100" : "opacity-0 scale-0"}`}>
                <DeleteMesageComponent setIsMessageDeleteModalOpen={setIsMessageDeleteModalOpen} messageId={selectedMessageId!} userId={user.id} receiverId={receiverUser.id} isSenderMsg={selectedMessageIsSender} />
            </div>

        </div>

        {fullImage && <ImageModal imageUrl={fullImage} onClose={() => setFullImage(null)} />}
    </>
}

export default ConversationComponent