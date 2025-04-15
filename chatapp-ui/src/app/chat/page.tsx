"use client";
import React, { useEffect, useRef, useState } from "react";
import isAuth from "../(auth)/isAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Search, Send, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import axios from "axios";
import { useRouter } from "next/navigation";
import SkeletonLoader from "@/components/loaders/SkeletonLoader";
import socket from "@/utils/socketIO";
import { toast } from "sonner";
import getLastseebDisplay from "@/utils/getLastSeen";
import { useDebounceCallback } from "usehooks-ts";
import ConversationComponent from "@/components/chat-components/ConversationComponent";
import { useSocket } from "../context/SocketContext";

const Chat = () => {
  interface User {
    id: string;
    username: string;
    email: string;
    isActive: boolean;
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
  }
  interface Notification {
    id: string;
    content: string;
    isRead: boolean;
  }

  const socket = useSocket();
  const [showSearch, setShowSearch] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [receiverUser, setReceiverUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [userList, setUserList] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isChatwindowModalOpen, setIsChatwindowModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const response = await axios.get<Notification[]>(
        `${process.env.NEXT_PUBLIC_BASE_API_URL}notification/${user?.id}`
      );
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.isRead);
      const markAsReadPromises = unreadNotifications.map((notification) =>
        axios.patch(
          `${process.env.NEXT_PUBLIC_BASE_API_URL}notification/mark-as-read/${notification.id}`
        )
      );
      // console.log(notifications,"-----=====")

      const v = await Promise.all(markAsReadPromises);

      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true }))
      );

      // console.log(v,'oo');
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const notificationHandler = async () => {
    setIsNotificationModalOpen((prev) => !prev);
    if (!isNotificationModalOpen) {
      await fetchNotifications();
      await markAllAsRead();
    }
  };

  const closeChatHandler = () => {
    // for mobile 
    setIsChatwindowModalOpen(false);
    setReceiverUser(null);
  };

  const userOpenChatHandler = async (clickUser: User) => {
    if (receiverUser?.id === clickUser.id) {
      setIsChatwindowModalOpen((prev) => {
        const newState = !prev;

        if (newState) {
          socket?.emit("openChatWindow", {
            userId: user?.id,
            receiverId: clickUser.id,
          });
        } else {
          socket?.emit("openChatWindow", {
            userId: user?.id,
            receiverId: null,
          });
        }

        return newState;
      });
    } else {
      setIsChatwindowModalOpen(true);
      // setMessages([]);
      setReceiverUser(clickUser);
      socket?.emit("openChatWindow", {
        userId: user?.id,
        receiverId: clickUser.id,
      });
    }

    if (user) {
      await markAllAsRead();
    }
  };
  // console.log( receiverUser,"---")

  useEffect(() => {
    if (
      messages.length > 0 &&
      receiverUser &&
      activeUsers.includes(receiverUser.id) &&
      isChatwindowModalOpen
    ) {
      const lastMessage = messages[messages.length - 1];
      console.log("Checking conditions for seenMessage:", {
        lastMessage,
        receiverUser,
        activeUsers,
        isChatwindowModalOpen,
      });

      if (lastMessage.senderId !== user?.id && !lastMessage.isSeen) {
        const tempId = (lastMessage as any).tempId || `${Date.now()}`;
        console.log("Emitting seenMessage for:", lastMessage);
        socket?.emit("seenMessage", { messageId: lastMessage.id, tempId });
      }
      // console.log(lastMessage.senderId, "first", user?.id )
    }
  }, [receiverUser, activeUsers, isChatwindowModalOpen]);

  useEffect(() => {
    const interval = setInterval(async () => {
      await fetchNotifications();
      socket?.emit("getActiveUsers");
    }, 10000);

    return () => clearInterval(interval);
  });

  useEffect(() => {
    if (socket && user) {
      socket.on("newNotification", (notification: Notification) => {
        if (!notification.isRead) {
          toast(notification.content);
        }

        setNotifications((prev) => [notification, ...prev]);
      });
      return () => {
        socket.off("newNotification");
      };
    }
  }, [socket, user]);

  useEffect(() => {
    if (socket && user && receiverUser) {
      console.log("refreshed");
      socket.on("activeUsers", (activeUsers) => {
        setActiveUsers(activeUsers);
        console.log(activeUsers, "active");
      });

      socket.on("notificationRead", ({ notificationId }) => {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        // console.log(notifications, 'llll')
      });

      return () => {
        socket!.off("activeUsers");
        socket!.off("newNotification");
      };
    }
  }, [socket, user, receiverUser, isChatwindowModalOpen]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        setToken(storedToken);
      } else {
        router.push("/sign-in");
      }
    }
  }, [router]);

  useEffect(() => {
    async function getingUser() {
      if (token) {
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_BASE_API_URL}user/profile`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const listResponse1 = await axios.get(
            `${process.env.NEXT_PUBLIC_BASE_API_URL}user/users-list`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.status === 200 && listResponse1.status === 200) {
            setUser(response.data);
            setUserList(listResponse1.data.users);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          router.push("/sign-in");
        }
      }
    }
    getingUser();
  }, [token, router]);

  // console.log(user, "ppp")

  // for screen size count

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!user) {
    return (
      <div>
        <SkeletonLoader />
      </div>
    );
  }

  const registerUsers = user
    ? userList.filter((User) => User.id !== user.id)
    : [];
  const filteredUsers = registerUsers.filter((u) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="bg-white w-screen h-screen flex relative overflow-hidden">
      <div
        className={`chatboard 
      ${isMobile && isChatwindowModalOpen ? "hidden" : "block"}
      w-full md:w-4/12 h-full z-10`}
      >
        <div className="userbar w-full">
          {/* userName Bar */}
          <header className="flex justify-between h-12 bg-[#6581b9]">
            <div className="flex items-center px-3 gap-2">
              <Avatar>
                <AvatarImage
                  className="h-10 w-10 md:h-8 md:w-8"
                  src="https://github.com/shadcn.png"
                  alt="@shadcn"
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <h3 className="text-xs md:text-sm font-semibold">
                {user.username}
              </h3>
            </div>

            <div className="flex items-center px-3 gap-1 md:gap-2">
              <span className="flex items-center gap-1">
                <Input
                  placeholder="Search User"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`bg-gray-200 transition-all duration-300 ${showSearch
                    ? "w-24 h-6 md:h-7 lg:w-32 opacity-100"
                    : "w-0 opacity-0"
                    }`}
                />
                <Search
                  onClick={() => setShowSearch(!showSearch)}
                  className="w-4 h-4 md:w-5 md:h-5 lg:w-7 lg:h-7 cursor-pointer"
                />
              </span>
              <div>
                <div className="relative">
                  <Bell
                    className="cursor-pointer  h-4 w-4 md:w-5 md:h-5 lg:w-7 lg:h-7"
                    onClick={notificationHandler}
                  />
                </div>

                {notifications.some((notification) => !notification.isRead) && (
                  <span className="h-2 w-2 text-xs absolute top-3 left-[23.5%]  rounded-full  bg-green-500 flex justify-center items-center items"></span>
                )}
                <div
                  className={`
                    notification-modal z-50 shadow-md bg-white rounded overflow-auto absolute
                    top-10 right-0 md:left-1/4
                    transition-all duration-300 ease-in-out
                    ${isNotificationModalOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'}
                  `}
                  style={{
                    transformOrigin: 'top',
                    width: '16rem', // default width (64)
                    maxWidth: '90vw', // to avoid overflow on small screens
                    maxHeight: '70vh', // limit height
                  }}
                >
                  {notifications.length > 0 ? (
                    notifications.map((notification: Notification) => (
                      <div
                        key={notification.id}
                        className="p-2 border-gray-200 border-b flex justify-between items-center"
                      >
                        <p>{notification.content}</p>
                        {!notification.isRead && (
                          <span className="h-2 w-2 rounded-full bg-green-500"></span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="p-2">No notifications</p>
                  )}
                </div>
              </div>
            </div>
          </header>
        </div>

        <div className="userlist p-4 w-full h-[calc(100%-48px)] bg-gray-300">
          {/* List Of Users */}
          {filteredUsers?.map((user) => {
            return (
              <div
                onClick={() => userOpenChatHandler(user)}
                key={user.id}
                className="flex items-center cursor-pointer justify-between p-2 border-b mb-2 border-gray-50"
              >
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage
                      className="h-10 w-10"
                      src="https://github.com/shadcn.png"
                      alt={user.username}
                    />
                    <AvatarFallback>{user.username}</AvatarFallback>
                  </Avatar>
                  <h3 className="text-sm font-semibold">{user.username}</h3>
                </div>

                {!activeUsers.includes(user.id) && (
                  <p className="text-xs text-gray-500">
                    {getLastseebDisplay(user.lastseen)}
                  </p>
                )}

                {activeUsers.includes(user?.id) && (
                  <div
                    className="h-2 w-2 bg-green-500 rounded-full"
                    title="Active"
                  ></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* chatwindow  */}
      <div
        className={`chat-window bg-slate-100 h-full w-full transition-all duration-500 ease-in-out
          ${isMobile ? isChatwindowModalOpen ? 'absolute top-0 left-0 z-20 translate-x-0 opacity-100' : 'hidden'
            : isChatwindowModalOpen
              ? 'translate-x-0 opacity-100 w-8/12'
              : '-translate-x-full opacity-0 w-8/12'
          }
        `}
      >
        <header className="flex relative justify-center h-12 bg-slate-200">
          <div className="flex items-center px-3 gap-2">
            <Avatar>
              <AvatarImage
                className="h-10 w-10"
                src="https://github.com/shadcn.png"
                alt={receiverUser?.username}
              />
              <AvatarFallback>{receiverUser?.username}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-sm font-semibold">
                {receiverUser?.username}
              </h3>
            </div>
          </div>

          <div className="absolute left-1/2 top-12 transform -translate-x-1/2  bg-gray-100 px-2 rounded-b shadow">
            {receiverUser && activeUsers.includes(receiverUser.id) ? (
              <p className="text-xs text-green-500">Active</p>
            ) : (
              <p className="text-xs text-blue-500">
                {getLastseebDisplay(receiverUser?.lastseen)}
              </p>
            )}
          </div>
          {isMobile && (
            <X
              className="absolute right-4 top-3 w-5 h-5 cursor-pointer"
              onClick={closeChatHandler}
            />
          )}
        </header>

        {user && receiverUser && (
          <ConversationComponent
            user={user}
            receiverUser={receiverUser}
            activeUsers={activeUsers}
            messages={messages}
            setMessages={setMessages}
            isChatwindowModalOpen={isChatwindowModalOpen}
          />
        )}
      </div>
    </main>
  );
};

export default isAuth(Chat);
