import { u as push, O as head, I as store_get, K as unsubscribe_stores, w as pop, Q as fallback, P as ensure_array_like, T as attr_class, M as stringify, J as attr, G as escape_html, S as bind_props } from './index-B8_Tn3qy.js';
import '@sveltejs/kit/internal';
import './exports-Cv9LZeD1.js';
import 'clsx';
import './state.svelte-CrBACqEv.js';
import { u as user, i as isAuthenticated } from './auth-CnzIXXbE.js';
import './index2-D8-jKE2y.js';
import './base44Client-DiUgpmgT.js';

function ConversationList($$payload, $$props) {
  push();
  var $$store_subs;
  let selectedConversationId = fallback($$props["selectedConversationId"], null);
  let conversations = [];
  let loading = false;
  function formatDate(dateString) {
    const date = new Date(dateString);
    const now = /* @__PURE__ */ new Date();
    const diffInHours = (now - date) / (1e3 * 60 * 60);
    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  }
  function getImageUrl(images) {
    if (!images) return "/placeholder-gear.jpg";
    const imageArray = Array.isArray(images) ? images : JSON.parse(images || "[]");
    return imageArray.length > 0 ? imageArray[0] : "/placeholder-gear.jpg";
  }
  function truncateMessage(message, maxLength = 50) {
    if (!message) return "";
    return message.length > maxLength ? message.substring(0, maxLength) + "..." : message;
  }
  $$payload.out.push(`<div class="bg-white rounded-lg shadow-md h-full flex flex-col"><div class="p-4 border-b border-gray-200"><h2 class="text-lg font-semibold text-gray-900">Messages</h2></div> <div class="flex-1 overflow-y-auto">`);
  {
    $$payload.out.push("<!--[!-->");
    {
      $$payload.out.push("<!--[!-->");
      if (conversations.length === 0) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<div class="p-4 text-center"><svg class="h-8 w-8 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg> <p class="text-sm text-gray-500 mt-2">No conversations yet</p> <p class="text-xs text-gray-400 mt-1">Start a conversation by booking gear or contacting an owner</p></div>`);
      } else {
        $$payload.out.push("<!--[!-->");
        const each_array = ensure_array_like(conversations);
        $$payload.out.push(`<div class="divide-y divide-gray-200"><!--[-->`);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let conversation = each_array[$$index];
          $$payload.out.push(`<button type="button"${attr_class(`w-full p-4 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors ${stringify(selectedConversationId === conversation.id ? "bg-green-50 border-r-2 border-green-500" : "")}`)}><div class="flex items-start space-x-3"><div class="flex-shrink-0">`);
          if (conversation.other_participant_photo) {
            $$payload.out.push("<!--[-->");
            $$payload.out.push(`<img${attr("src", conversation.other_participant_photo)}${attr("alt", conversation.other_participant_name)} class="h-10 w-10 rounded-full object-cover"/>`);
          } else {
            $$payload.out.push("<!--[!-->");
            $$payload.out.push(`<div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center"><svg class="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>`);
          }
          $$payload.out.push(`<!--]--></div> <div class="flex-1 min-w-0"><div class="flex items-center justify-between"><p class="text-sm font-medium text-gray-900 truncate">${escape_html(conversation.other_participant_name)}</p> <div class="flex items-center space-x-2">`);
          if (conversation.unread_count > 0) {
            $$payload.out.push("<!--[-->");
            $$payload.out.push(`<span class="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">${escape_html(conversation.unread_count)}</span>`);
          } else {
            $$payload.out.push("<!--[!-->");
          }
          $$payload.out.push(`<!--]--> `);
          if (conversation.last_message_at) {
            $$payload.out.push("<!--[-->");
            $$payload.out.push(`<p class="text-xs text-gray-500">${escape_html(formatDate(conversation.last_message_at))}</p>`);
          } else {
            $$payload.out.push("<!--[!-->");
          }
          $$payload.out.push(`<!--]--></div></div> `);
          if (conversation.gear_title) {
            $$payload.out.push("<!--[-->");
            $$payload.out.push(`<div class="flex items-center mt-1">`);
            if (conversation.gear_images) {
              $$payload.out.push("<!--[-->");
              $$payload.out.push(`<img${attr("src", getImageUrl(conversation.gear_images))}${attr("alt", conversation.gear_title)} class="h-4 w-4 rounded object-cover mr-2"/>`);
            } else {
              $$payload.out.push("<!--[!-->");
            }
            $$payload.out.push(`<!--]--> <p class="text-xs text-gray-600 truncate">${escape_html(conversation.gear_title)}</p> `);
            if (conversation.rental_status) {
              $$payload.out.push("<!--[-->");
              $$payload.out.push(`<span${attr_class(`ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${stringify(conversation.rental_status === "confirmed" ? "bg-green-100 text-green-800" : conversation.rental_status === "pending" ? "bg-yellow-100 text-yellow-800" : conversation.rental_status === "active" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800")}`)}>${escape_html(conversation.rental_status)}</span>`);
            } else {
              $$payload.out.push("<!--[!-->");
            }
            $$payload.out.push(`<!--]--></div>`);
          } else {
            $$payload.out.push("<!--[!-->");
          }
          $$payload.out.push(`<!--]--> `);
          if (conversation.last_message_content) {
            $$payload.out.push("<!--[-->");
            $$payload.out.push(`<p class="text-sm text-gray-600 mt-1">`);
            if (conversation.last_message_sender_id === store_get($$store_subs ??= {}, "$user", user)?.id) {
              $$payload.out.push("<!--[-->");
              $$payload.out.push(`<span class="text-gray-500">You:</span>`);
            } else {
              $$payload.out.push("<!--[!-->");
            }
            $$payload.out.push(`<!--]--> ${escape_html(truncateMessage(conversation.last_message_content))}</p>`);
          } else {
            $$payload.out.push("<!--[!-->");
            $$payload.out.push(`<p class="text-sm text-gray-400 mt-1 italic">No messages yet</p>`);
          }
          $$payload.out.push(`<!--]--></div></div></button>`);
        }
        $$payload.out.push(`<!--]--></div>`);
      }
      $$payload.out.push(`<!--]-->`);
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--></div> <div class="p-4 border-t border-gray-200"><button${attr("disabled", loading, true)} class="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50">${escape_html("Refresh")}</button></div></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  bind_props($$props, { selectedConversationId });
  pop();
}
function ChatInterface($$payload, $$props) {
  push();
  var $$store_subs;
  let conversation = fallback($$props["conversation"], null);
  let messages = [];
  let loading = false;
  let error = null;
  let newMessage = "";
  let sending = false;
  async function loadMessages() {
    if (!conversation) return;
    loading = true;
    error = null;
    try {
      const response = await fetch(`/api/messages/conversations/${conversation.id}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
        }
      });
      if (!response.ok) {
        throw new Error("Failed to load messages");
      }
      const data = await response.json();
      messages = data.messages || [];
    } catch (err) {
      console.error("Failed to load messages:", err);
      error = err.message;
    } finally {
      loading = false;
    }
  }
  function formatMessageTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  }
  function formatMessageDate(dateString) {
    const date = new Date(dateString);
    const today = /* @__PURE__ */ new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
    }
  }
  function shouldShowDateSeparator(currentMessage, previousMessage) {
    if (!previousMessage) return true;
    const currentDate = new Date(currentMessage.created_at).toDateString();
    const previousDate = new Date(previousMessage.created_at).toDateString();
    return currentDate !== previousDate;
  }
  function isConsecutiveMessage(currentMessage, previousMessage) {
    if (!previousMessage) return false;
    const timeDiff = new Date(currentMessage.created_at) - new Date(previousMessage.created_at);
    const fiveMinutes = 5 * 60 * 1e3;
    return currentMessage.sender_id === previousMessage.sender_id && timeDiff < fiveMinutes;
  }
  if (conversation) {
    loadMessages();
  }
  $$payload.out.push(`<div class="bg-white rounded-lg shadow-md h-full flex flex-col">`);
  if (
    // Scroll to bottom when new messages are added
    // Add the new message to the list
    // Notify parent component
    // Restore the message content if sending failed
    !conversation
  ) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="flex-1 flex items-center justify-center"><div class="text-center"><svg class="h-12 w-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg> <p class="text-lg text-gray-500 mt-4">Select a conversation to start messaging</p></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<div class="p-4 border-b border-gray-200"><div class="flex items-center space-x-3">`);
    if (conversation.other_participant_photo) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<img${attr("src", conversation.other_participant_photo)}${attr("alt", conversation.other_participant_name)} class="h-10 w-10 rounded-full object-cover"/>`);
    } else {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(`<div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center"><svg class="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>`);
    }
    $$payload.out.push(`<!--]--> <div><h3 class="text-lg font-semibold text-gray-900">${escape_html(conversation.other_participant_name)}</h3> `);
    if (conversation.gear_title) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<p class="text-sm text-gray-600">About: ${escape_html(conversation.gear_title)}</p>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div></div></div> <div class="flex-1 overflow-y-auto p-4 space-y-4">`);
    if (loading) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="text-center py-8"><svg class="animate-spin h-6 w-6 text-gray-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> <p class="text-sm text-gray-500 mt-2">Loading messages...</p></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
      if (error) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<div class="text-center py-8"><svg class="h-8 w-8 text-red-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg> <p class="text-sm text-red-600 mt-2">${escape_html(error)}</p> <button class="mt-2 text-sm text-blue-600 hover:text-blue-800">Try Again</button></div>`);
      } else {
        $$payload.out.push("<!--[!-->");
        if (messages.length === 0) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`<div class="text-center py-8"><svg class="h-8 w-8 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg> <p class="text-sm text-gray-500 mt-2">No messages yet</p> <p class="text-xs text-gray-400 mt-1">Start the conversation by sending a message below</p></div>`);
        } else {
          $$payload.out.push("<!--[!-->");
          const each_array = ensure_array_like(messages);
          $$payload.out.push(`<!--[-->`);
          for (let index = 0, $$length = each_array.length; index < $$length; index++) {
            let message = each_array[index];
            if (shouldShowDateSeparator(message, messages[index - 1])) {
              $$payload.out.push("<!--[-->");
              $$payload.out.push(`<div class="flex justify-center"><span class="px-3 py-1 text-xs text-gray-500 bg-gray-100 rounded-full">${escape_html(formatMessageDate(message.created_at))}</span></div>`);
            } else {
              $$payload.out.push("<!--[!-->");
            }
            $$payload.out.push(`<!--]--> <div${attr_class(`flex ${stringify(message.sender_id === store_get($$store_subs ??= {}, "$user", user)?.id ? "justify-end" : "justify-start")}`)}><div class="max-w-xs lg:max-w-md">`);
            if (!isConsecutiveMessage(message, messages[index - 1])) {
              $$payload.out.push("<!--[-->");
              $$payload.out.push(`<div${attr_class(`flex items-center space-x-2 mb-1 ${stringify(message.sender_id === store_get($$store_subs ??= {}, "$user", user)?.id ? "justify-end" : "justify-start")}`)}>`);
              if (message.sender_id !== store_get($$store_subs ??= {}, "$user", user)?.id) {
                $$payload.out.push("<!--[-->");
                if (message.sender_photo) {
                  $$payload.out.push("<!--[-->");
                  $$payload.out.push(`<img${attr("src", message.sender_photo)}${attr("alt", message.sender_name)} class="h-6 w-6 rounded-full object-cover"/>`);
                } else {
                  $$payload.out.push("<!--[!-->");
                  $$payload.out.push(`<div class="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center"><svg class="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>`);
                }
                $$payload.out.push(`<!--]-->`);
              } else {
                $$payload.out.push("<!--[!-->");
              }
              $$payload.out.push(`<!--]--> <span class="text-xs text-gray-500">${escape_html(message.sender_id === store_get($$store_subs ??= {}, "$user", user)?.id ? "You" : message.sender_name)}</span> <span class="text-xs text-gray-400">${escape_html(formatMessageTime(message.created_at))}</span></div>`);
            } else {
              $$payload.out.push("<!--[!-->");
            }
            $$payload.out.push(`<!--]--> <div${attr_class(`px-4 py-2 rounded-lg ${stringify(message.sender_id === store_get($$store_subs ??= {}, "$user", user)?.id ? "bg-green-600 text-white" : "bg-gray-100 text-gray-900")}`)}><p class="text-sm whitespace-pre-wrap">${escape_html(message.content)}</p></div></div></div>`);
          }
          $$payload.out.push(`<!--]-->`);
        }
        $$payload.out.push(`<!--]-->`);
      }
      $$payload.out.push(`<!--]-->`);
    }
    $$payload.out.push(`<!--]--></div> <div class="p-4 border-t border-gray-200">`);
    if (error) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">${escape_html(error)}</div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> <div class="flex space-x-2"><textarea placeholder="Type your message..." rows="1" class="flex-1 px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"${attr("disabled", sending, true)}>`);
    const $$body = escape_html(newMessage);
    if ($$body) {
      $$payload.out.push(`${$$body}`);
    }
    $$payload.out.push(`</textarea> <button${attr("disabled", !newMessage.trim() || sending, true)} class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed">`);
    {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(`<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>`);
    }
    $$payload.out.push(`<!--]--></button></div></div>`);
  }
  $$payload.out.push(`<!--]--></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  bind_props($$props, { conversation });
  pop();
}
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let selectedConversation = null;
  let selectedConversationId = null;
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Messages - GearGrab</title>`;
    $$payload2.out.push(`<meta name="description" content="Chat with gear owners and renters"/>`);
  });
  $$payload.out.push(`<div class="min-h-screen bg-gray-50"><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><div class="mb-8"><h1 class="text-3xl font-bold text-gray-900">Messages</h1> <p class="mt-2 text-gray-600">Chat with gear owners and renters about your bookings</p></div> `);
  if (!store_get($$store_subs ??= {}, "$isAuthenticated", isAuthenticated)) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="bg-white rounded-lg shadow-md p-8 text-center"><svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> <h3 class="mt-2 text-lg font-medium text-gray-900">Sign In Required</h3> <p class="mt-1 text-gray-600">You need to be signed in to view your messages</p> <div class="mt-4"><button class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">Sign In</button></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<div class="hidden md:block"><div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]"><div class="lg:col-span-1">`);
    ConversationList($$payload, { selectedConversationId });
    $$payload.out.push(`<!----></div> <div class="lg:col-span-2">`);
    ChatInterface($$payload, { conversation: selectedConversation });
    $$payload.out.push(`<!----></div></div></div> <div class="md:hidden">`);
    {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="h-[600px]">`);
      ConversationList($$payload, { selectedConversationId });
      $$payload.out.push(`<!----></div>`);
    }
    $$payload.out.push(`<!--]--></div> <div class="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4"><div class="flex"><svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg> <div class="ml-3"><h3 class="text-sm font-medium text-blue-800">How messaging works</h3> <div class="mt-2 text-sm text-blue-700"><ul class="list-disc list-inside space-y-1"><li>Conversations are automatically created when you book gear or receive a booking request</li> <li>You can message gear owners before booking to ask questions</li> <li>All messages are private and secure</li> <li>Be respectful and follow our community guidelines</li></ul></div></div></div></div>`);
  }
  $$payload.out.push(`<!--]--></div></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-aTMuXE0H.js.map
