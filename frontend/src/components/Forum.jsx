import React, { useState, useEffect, useRef } from 'react';
import { Send, UserCircle2, MessageSquare, MessageCircle, AlertTriangle, Image as ImageIcon, Video, X, Trash2, Ban } from 'lucide-react';
import { API_BASE_URL } from '../config';

const Forum = ({ user, lang }) => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [showWelcomeToast, setShowWelcomeToast] = useState(true);
  const [profanityWarning, setProfanityWarning] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const t = {
    title: lang === 'zh' ? '討論區' : lang === 'vi' ? 'Diễn đàn' : 'Forum',
    writePost: lang === 'zh' ? '留言...' : lang === 'vi' ? 'Viết bình luận...' : 'Message...',
    teacher: lang === 'zh' ? '教師' : lang === 'vi' ? 'Giáo viên' : 'Teacher',
    student: lang === 'zh' ? '學生' : lang === 'vi' ? 'Học sinh' : 'Student',
    reply: lang === 'zh' ? '回覆' : lang === 'vi' ? 'Trả lời' : 'Reply',
    rulesTitle: lang === 'zh' ? '討論區公約' : lang === 'vi' ? 'Quy định diễn đàn' : 'Forum Rules',
    rulesText: lang === 'zh' ? '請大家保持禮貌，禁止使用不雅詞彙、髒話或人身攻擊。若偵測到不當發言，系統將會攔截並警告。影片與網站連結可以直接貼上喔！' : lang === 'vi' ? 'Các bạn tham gia diễn đàn, vui lòng giữ lịch sự, không sử dụng những từ ngữ thô tục xúc phạm hay tổn thương người khác. Hệ thống sẽ tự động chặn các bình luận vi phạm. Xin cảm ơn sự hợp tác của mọi người!' : 'Please be polite. Profanity is prohibited. Video and website links are allowed.',
    welcomeToast: lang === 'zh' ? '歡迎來到討論區。讓我們共同營造一個文明的聊天空間！請保持尊重與和氣的交流。含有不當詞彙的留言將會被系統自動隱藏。感謝您的配合！' : lang === 'vi' ? 'Chào mừng bạn đến với không gian thảo luận của chúng ta! Để diễn đàn luôn là nơi giao lưu tích cực, bạn vui lòng sử dụng ngôn từ lịch sự và tử tế. Để bảo vệ không gian chung, hệ thống sẽ tự động giới hạn các phát ngôn chưa phù hợp. Cảm ơn sự đồng hành và hợp tác của bạn!' : 'Welcome to the forum. Let\'s create a civilized chat space together! Please communicate respectfully. Inappropriate comments will be hidden. Thank you!',
  };

  const currentUserId = user?.userId || 'anonymous';
  const currentUserName = user?.name || user?.userId || t.student;
  const isTeacherUser = user?.role === 'teacher';

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/forum/posts?user_id=${currentUserId}`);
      const data = await res.json();
      if (data.status === 'banned') {
        setIsBanned(true);
        return;
      }
      if (data.status === 'success') {
        setPosts(data.posts.reverse());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPosts();
    
    // Auto-hide the welcome toast after 7 seconds
    const timer = setTimeout(() => {
      setShowWelcomeToast(false);
    }, 7000);
    return () => clearTimeout(timer);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [posts]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePost = async () => {
    if (!newPost.trim() && !mediaFile) return;
    setIsLoading(true);
    setProfanityWarning('');
    
    try {
      let mediaUrl = null;
      let mediaType = null;

      // Upload media if exists
      if (mediaFile) {
        const mediaFormData = new FormData();
        mediaFormData.append('file', mediaFile);
        const uploadRes = await fetch(`${API_BASE_URL}/api/forum/media`, {
          method: 'POST',
          body: mediaFormData
        });
        const uploadData = await uploadRes.json();
        if (uploadData.status === 'success') {
          mediaUrl = uploadData.url;
          mediaType = mediaFile.type.startsWith('video/') ? 'video' : 'image';
        }
      }

      const formData = new FormData();
      formData.append('user_id', currentUserId);
      formData.append('name', currentUserName);
      formData.append('role', user?.role || 'student');
      formData.append('content', newPost);
      if (mediaUrl) formData.append('media_url', mediaUrl);
      if (mediaType) formData.append('media_type', mediaType);

      const res = await fetch(`${API_BASE_URL}/api/forum/posts`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      
      if (data.status === 'banned') {
        setIsBanned(true);
        return;
      }
      
      if (data.status === 'error' && data.message === 'Profanity detected') {
        setProfanityWarning(lang === 'zh' ? '⚠️ 系統偵測到不當詞彙，您的發言已被攔截！請注意用詞。' : lang === 'vi' ? '⚠️ Hệ thống phát hiện từ ngữ không phù hợp! Bình luận đã bị chặn.' : '⚠️ Profanity detected! Your message was blocked.');
      } else {
        setNewPost('');
        removeMedia();
        fetchPosts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReaction = async (postId, type) => {
    try {
      await fetch(`${API_BASE_URL}/api/forum/reactions`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          user_id: currentUserId,
          name: currentUserName,
          reaction_type: type
        })
      });
      fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReply = (name) => {
    setNewPost((prev) => prev ? `${prev} @${name} ` : `@${name} `);
  };

  const handleDeletePost = async (postId) => {
    const confirmMsg = lang === 'zh' ? '確定要收回這則訊息嗎？' : lang === 'vi' ? 'Bạn có chắc chắn muốn thu hồi tin nhắn này không?' : 'Are you sure you want to unsend this message?';
    if (!window.confirm(confirmMsg)) return;
    
    try {
      await fetch(`${API_BASE_URL}/api/forum/posts/${postId}`, {
        method: 'DELETE'
      });
      fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBanUser = async (userIdToBan) => {
    const confirmMsg = lang === 'zh' ? '確定要永久封鎖此使用者嗎？封鎖後該帳號將無法再進入討論區。' : lang === 'vi' ? 'Bạn có chắc chắn muốn cấm vĩnh viễn người dùng này không? Sau khi bị cấm, tài khoản này sẽ không thể vào diễn đàn nữa.' : 'Are you sure you want to permanently ban this user?';
    if (!window.confirm(confirmMsg)) return;
    
    try {
      await fetch(`${API_BASE_URL}/api/forum/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userIdToBan,
          banned_by: currentUserId
        })
      });
      fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const renderContent = (content) => {
    if (!content) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(/(@\S+|https?:\/\/[^\s]+)/g);
    
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return <span key={i} className="text-cyan-300 font-bold px-1">{part}</span>;
      }
      if (part.match(urlRegex)) {
        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300 break-all">{part}</a>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const EMOJIS = ['❤️', '👏', '🙌'];

  const renderReactions = (post) => {
    const reactions = post.reactions || [];
    const grouped = EMOJIS.reduce((acc, emoji) => {
      acc[emoji] = reactions.filter(r => r.reaction_type === emoji);
      return acc;
    }, {});

    return (
      <div className="flex flex-wrap gap-1 mt-1.5">
        {EMOJIS.map(emoji => {
          const count = grouped[emoji].length;
          const hasReacted = grouped[emoji].some(r => r.user_id === currentUserId);
          return (
            <button
              key={emoji}
              onClick={() => handleReaction(post.id, emoji)}
              className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition-all ${hasReacted ? 'bg-cyan-900/50 border-cyan-500/50 text-cyan-300' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
            >
              <span>{emoji}</span>
              {count > 0 && <span>{count}</span>}
            </button>
          );
        })}
        <button 
          onClick={() => handleReply(post.name)}
          className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-700 transition-all ml-1"
        >
          <MessageCircle className="w-3 h-3" />
          {t.reply}
        </button>
        
        {(post.user_id === currentUserId || isTeacherUser) && (
          <button 
            onClick={() => handleDeletePost(post.id)}
            className="flex items-center justify-center text-slate-500 hover:text-red-400 p-1 ml-auto transition-colors"
            title={lang === 'zh' ? '收回訊息' : lang === 'vi' ? 'Thu hồi tin nhắn' : 'Unsend message'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
        {isTeacherUser && post.user_id !== currentUserId && (
          <button 
            onClick={() => handleBanUser(post.user_id)}
            className="flex items-center justify-center text-rose-500 hover:text-rose-400 p-1 transition-colors"
            title={lang === 'zh' ? '永久封鎖' : lang === 'vi' ? 'Cấm vĩnh viễn' : 'Ban permanently'}
          >
            <Ban className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  };

  if (isBanned) {
    return (
      <div className="w-full h-full min-h-[90vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-rose-950 border-[2px] border-rose-900 rounded-2xl p-8 flex flex-col items-center text-center shadow-2xl animate-in fade-in zoom-in">
          <Ban className="w-16 h-16 text-rose-500 mb-4" />
          <h2 className="text-xl font-bold text-rose-400 mb-2">
            {lang === 'zh' ? '⛔ 存取被拒' : lang === 'vi' ? '⛔ Truy cập bị từ chối' : '⛔ Access Denied'}
          </h2>
          <p className="text-rose-200/80 leading-relaxed text-sm">
            {lang === 'zh' ? '您因為違反討論區規範，已被管理員永久封鎖，無法再使用此功能。' : lang === 'vi' ? 'Bạn đã bị quản trị viên cấm vĩnh viễn do vi phạm quy định của diễn đàn. Bạn không thể sử dụng tính năng này nữa.' : 'You have been permanently banned by the administrator for violating forum rules.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[90vh] flex items-center justify-center p-4">
      {/* Mobile Frame Container */}
      <div className="w-full max-w-md h-[80vh] bg-slate-950 border-[6px] border-slate-800 rounded-[2.5rem] shadow-2xl relative flex flex-col overflow-hidden animate-in fade-in zoom-in duration-500">
        
        {/* Top Header / Notch Area */}
        <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 rounded-b-xl mx-auto w-32 z-30"></div>
        <div className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-4 pt-8 sticky top-0 z-20 flex items-center justify-between shadow-sm">
          <h2 className="text-lg font-bold text-cyan-400 flex items-center gap-2 mx-auto">
            <MessageSquare className="w-5 h-5" />
            {t.title}
          </h2>
        </div>

        {/* Welcome Toast Popup */}
        <div className={`absolute top-20 left-4 right-4 z-40 transition-all duration-1000 ${showWelcomeToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
          <div className="bg-slate-800/95 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-4 shadow-2xl">
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-cyan-400 font-bold text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {lang === 'zh' ? '系統提示' : lang === 'vi' ? 'Thông báo hệ thống' : 'System Notice'}
              </h4>
              <button onClick={() => setShowWelcomeToast(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[13px] text-slate-300 leading-relaxed">
              {t.welcomeToast}
            </p>
          </div>
        </div>

        {/* Scrollable Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 relative custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-950/50 bg-blend-overlay">
          

          {/* Teacher Welcome Message */}
          <div className="flex flex-col items-center justify-center mb-6 mt-2">
            <div className="relative mb-2">
              <div className="absolute inset-0 bg-cyan-400 blur-md opacity-30 rounded-full animate-pulse"></div>
              <img 
                src="https://i.ibb.co/vxgG8XFW/Q2.png" 
                alt="Teacher Xinyu" 
                className="relative w-20 h-20 rounded-full border-2 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)] object-cover" 
              />
            </div>
            <h3 className="text-sm font-bold text-cyan-300 tracking-wider">欣妤老師</h3>
            <div className="bg-slate-800/90 rounded-2xl p-4 mt-3 text-[13px] text-slate-300 max-w-[90%] text-center border border-slate-700 shadow-sm leading-relaxed relative">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-800/90 border-t border-l border-slate-700 rotate-45"></div>
              {lang === 'zh' ? '歡迎來到討論區！學習上有任何問題，都可以在這裡發問喔！' : lang === 'vi' ? 'Chào mừng thầy cô và các bạn đến với diễn đàn! Nếu thầy cô và các bạn có bất kỳ câu hỏi nào trong quá trình giảng dạy và học tập phát âm tiếng Trung, xin vui lòng để lại ở dưới bình luận để chúng ta cùng nhau trao đổi nhé! Xin cảm ơn!' : 'Welcome to the forum! Feel free to ask any questions you have about your learning here!'}
            </div>
          </div>

          {/* Posts List */}
          {posts.map((post) => {
            const isMine = post.user_id === currentUserId;
            const isTeacher = post.role === 'teacher';
            
            return (
              <div key={post.id} className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[85%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className="flex-shrink-0 mt-1">
                    {isTeacher ? (
                      <img src="https://i.ibb.co/vxgG8XFW/Q2.png" alt="Teacher" className="w-8 h-8 rounded-full border border-purple-500 shadow-sm object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                        <UserCircle2 className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Message Bubble */}
                  <div className={`flex flex-col max-w-full ${isMine ? 'items-end' : 'items-start'}`}>
                    <div className={`flex items-baseline gap-2 mb-1 ${isMine ? 'mr-1' : 'ml-1'}`}>
                      <span className="text-[11px] text-slate-400 font-medium">{post.name}</span>
                      <span className="text-[10px] text-slate-500">{new Date(post.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    
                    <div className={`px-4 py-2.5 text-[14px] leading-relaxed shadow-sm break-words max-w-full
                      ${isMine ? 'bg-cyan-600 text-white rounded-2xl rounded-tr-sm' : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-2xl rounded-tl-sm'}
                    `}>
                      {renderContent(post.content)}
                      
                      {/* Media Rendering */}
                      {post.media_url && post.media_type === 'image' && (
                        <img src={`${API_BASE_URL}${post.media_url}`} alt="Attached media" className="max-w-full rounded-lg mt-2 border border-white/10" />
                      )}
                      {post.media_url && post.media_type === 'video' && (
                        <video src={`${API_BASE_URL}${post.media_url}`} controls className="max-w-full rounded-lg mt-2 border border-white/10" />
                      )}
                    </div>
                    
                    {/* Reactions & Reply Row */}
                    {renderReactions(post)}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Profanity Warning Alert */}
        {profanityWarning && (
          <div className="bg-rose-950/90 text-rose-300 text-xs py-2 px-4 flex items-center justify-between border-t border-rose-900/50 shadow-lg">
            <span>{profanityWarning}</span>
            <button onClick={() => setProfanityWarning('')}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Media Preview Area */}
        {mediaPreview && (
          <div className="bg-slate-900 border-t border-slate-800 p-3 relative">
            <button 
              onClick={removeMedia}
              className="absolute top-1 right-1 bg-slate-800 rounded-full p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            {mediaFile?.type.startsWith('video/') ? (
              <video src={mediaPreview} className="h-20 rounded border border-slate-700" />
            ) : (
              <img src={mediaPreview} className="h-20 rounded border border-slate-700 object-cover" alt="Preview" />
            )}
          </div>
        )}

        {/* Input Area */}
        <div className="bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-3 flex gap-2 items-end">
          
          {/* Teacher Upload Buttons */}
          {isTeacherUser && (
            <div className="flex gap-1 pb-1">
              <input 
                type="file" 
                accept="image/*,video/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-full transition-colors"
                title="上傳圖片或影片"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            </div>
          )}

          <textarea
            className="flex-1 bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none max-h-32 min-h-[44px]"
            placeholder={t.writePost}
            value={newPost}
            onChange={(e) => {
              setNewPost(e.target.value);
              if (profanityWarning) setProfanityWarning('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handlePost();
              }
            }}
            rows={1}
            style={{
              height: "auto",
              minHeight: "44px"
            }}
          />
          <button 
            onClick={handlePost}
            disabled={isLoading || (!newPost.trim() && !mediaFile)}
            className="w-11 h-11 flex-shrink-0 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:hover:bg-cyan-600 text-white rounded-full flex items-center justify-center transition-colors shadow-md"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(51, 65, 85, 0.5);
          border-radius: 20px;
        }
      `}} />
    </div>
  );
};

export default Forum;
