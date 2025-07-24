import React, { useState, useEffect, useRef } from "react";
import { User } from "@/api/entities";
import { Rental } from "@/api/entities";
import { GearItem } from "@/api/entities";
import { Message } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, User as UserIcon, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function Messages() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const [rentals, gearItems, users, allMessages] = await Promise.all([
        Rental.filter({
          $or: [
            { renter_email: currentUser.email },
            { owner_email: currentUser.email }
          ]
        }, "-created_date"),
        GearItem.list(),
        User.list(),
        Message.filter({
           $or: [
            { sender_email: currentUser.email },
            { receiver_email: currentUser.email }
          ]
        }, "created_date")
      ]);

      const gearMap = new Map(gearItems.map(item => [item.id, item]));
      const userMap = new Map(users.map(u => [u.email, u]));

      const populatedConversations = rentals.map(rental => {
        const gear = gearMap.get(rental.gear_item_id);
        const otherUserEmail = rental.owner_email === currentUser.email ? rental.renter_email : rental.owner_email;
        const otherUser = userMap.get(otherUserEmail);
        return { ...rental, gear, otherUser };
      });
      
      setConversations(populatedConversations);
      setMessages(allMessages);

      if (populatedConversations.length > 0) {
        setSelectedConversation(populatedConversations[0]);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      User.login();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setIsSending(true);
    try {
      const newMessageData = {
        rental_id: selectedConversation.id,
        sender_email: user.email,
        receiver_email: selectedConversation.otherUser.email,
        content: newMessage.trim(),
        is_read: false,
      };

      const createdMessage = await Message.create(newMessageData);
      setMessages(prev => [...prev, createdMessage]);
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const currentMessages = messages.filter(
    (msg) => msg.rental_id === selectedConversation?.id
  );

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-green-50">
        <div className="w-1/3 border-r p-4 space-y-3">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="w-2/3 flex flex-col p-4">
          <Skeleton className="h-16 w-full mb-4" />
          <div className="flex-grow space-y-4">
            <Skeleton className="h-12 w-3/4 self-end" />
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-12 w-3/4 self-end" />
          </div>
          <Skeleton className="h-12 w-full mt-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 font-sans">
      {/* Conversations List */}
      <div className="w-full md:w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Conversations</h2>
        </div>
        <div className="flex-grow overflow-y-auto">
          {conversations.map(convo => (
            <div
              key={convo.id}
              className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 ${
                selectedConversation?.id === convo.id
                  ? "bg-emerald-50 border-l-4 border-emerald-500"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => setSelectedConversation(convo)}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                  <UserIcon className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-grow overflow-hidden">
                  <p className="font-semibold text-gray-800 truncate">{convo.otherUser?.full_name}</p>
                  <p className="text-sm text-gray-600 font-medium truncate">{convo.gear?.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="hidden md:flex w-2/3 flex-col">
        {selectedConversation ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm">
              <p className="font-bold text-lg text-gray-900">{selectedConversation.otherUser.full_name}</p>
              <p className="text-sm text-gray-500">{selectedConversation.gear.title}</p>
            </div>
            
            <div className="flex-grow p-6 overflow-y-auto">
              <AnimatePresence>
                <div className="space-y-4">
                  {currentMessages.map(msg => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-end gap-2 ${
                        msg.sender_email === user.email ? "justify-end" : "justify-start"
                      }`}
                    >
                      {msg.sender_email !== user.email && (
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
                          <UserIcon className="w-4 h-4 text-gray-600" />
                        </div>
                      )}
                      <div>
                        <div
                          className={`max-w-md p-3 rounded-2xl ${
                            msg.sender_email === user.email
                              ? "bg-emerald-600 text-white rounded-br-none"
                              : "bg-white text-gray-800 rounded-bl-none border border-gray-200"
                          }`}
                        >
                          <p>{msg.content}</p>
                        </div>
                         <p className={`text-xs text-gray-400 mt-1 ${
                            msg.sender_email === user.email ? "text-right" : "text-left"
                          }`}>
                          {formatDistanceToNow(new Date(msg.created_date), { addSuffix: true })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </AnimatePresence>
            </div>
            
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-center gap-3">
                <Input
                  placeholder="Type your message..."
                  className="h-12 text-base"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && !isSending && handleSendMessage()}
                  disabled={isSending}
                />
                <Button 
                  size="icon" 
                  className="h-12 w-12 bg-emerald-600 hover:bg-emerald-700 shrink-0"
                  onClick={handleSendMessage}
                  disabled={isSending || !newMessage.trim()}
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-500">
            <MessageSquare className="w-16 h-16 mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold">Select a conversation</h3>
            <p>Choose a rental from the list to view messages.</p>
          </div>
        )}
      </div>
    </div>
  );
}