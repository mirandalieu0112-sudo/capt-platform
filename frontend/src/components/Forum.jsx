import React, { useState, useEffect } from 'react';
import { Send, UserCircle2, MessageSquare } from 'lucide-react';
import { API_BASE_URL } from '../config';

const Forum = ({ user, lang }) => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const t = {
    title: lang === 'zh' ? '討論區' : lang === 'vi' ? 'Diễn đàn' : 'Forum',
    writePost: lang === 'zh' ? '發表新討論...' : lang === 'vi' ? 'Viết bài mới...' : 'Write a new post...',
    postBtn: lang === 'zh' ? '發布' : lang === 'vi' ? 'Đăng' : 'Post',
    teacher: lang === 'zh' ? '教師' : lang === 'vi' ? 'Giáo viên' : 'Teacher',
    student: lang === 'zh' ? '學生' : lang === 'vi' ? 'Học sinh' : 'Student',
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/forum/posts`);
      const data = await res.json();
      if (data.status === 'success') {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePost = async () => {
    if (!newPost.trim()) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('user_id', user.userId);
      formData.append('name', user.name || user.userId);
      formData.append('role', user.role || 'student');
      formData.append('content', newPost);

      await fetch(`${API_BASE_URL}/api/forum/posts`, {
        method: "POST",
        body: formData
      });
      setNewPost('');
      fetchPosts();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in zoom-in duration-500 pb-20">
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-lg backdrop-blur-md">
        <h2 className="text-2xl font-bold text-cyan-400 flex items-center gap-3 mb-6">
          <MessageSquare className="w-6 h-6" />
          {t.title}
        </h2>

        {/* Teacher Welcome Card */}
        <div className="flex flex-col items-center justify-center mb-8 p-6 bg-gradient-to-b from-cyan-900/20 to-transparent rounded-2xl border border-cyan-500/20">
          <div className="relative mb-3">
            <div className="absolute inset-0 bg-cyan-400 blur-md opacity-30 rounded-full animate-pulse"></div>
            <img 
              src="https://i.ibb.co/vxgG8XFW/Q2.png" 
              alt="Teacher Xinyu" 
              className="relative w-24 h-24 rounded-full border-2 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)] object-cover" 
            />
          </div>
          <h3 className="text-xl font-bold text-cyan-300 tracking-wider">欣妤老師</h3>
          <p className="text-sm text-cyan-100/70 mt-2 text-center max-w-md">
            {lang === 'zh' ? '歡迎來到討論區！學習上有任何問題，都可以在這裡發問喔！' : lang === 'vi' ? 'Chào mừng thầy cô và các bạn đến với diễn đàn! Nếu thầy cô và các bạn có bất kỳ câu hỏi nào trong quá trình học, xin vui lòng để lại ở dưới bình luận nhé! Xin cảm ơn!' : 'Welcome to the forum! Feel free to ask any questions you have about your learning here!'}
          </p>
        </div>

        {/* Post Input */}
        <div className="flex gap-4 mb-8">
          <div className="flex flex-col items-center gap-2 min-w-[60px]">
            {user?.role === 'teacher' ? (
              <img src="https://i.ibb.co/vxgG8XFW/Q2.png" alt="Teacher" className="w-12 h-12 rounded-full border border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shadow-md">
                <UserCircle2 className="w-7 h-7 text-slate-400" />
              </div>
            )}
            <span className={`text-xs font-medium whitespace-nowrap ${user?.role === 'teacher' ? 'text-purple-400' : 'text-slate-400'}`}>
              {user?.role === 'teacher' ? '欣妤老師' : (user?.name || t.student)}
            </span>
          </div>
          <div className="flex-1 flex flex-col gap-3">
            <textarea
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none min-h-[100px]"
              placeholder={t.writePost}
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
            />
            <div className="flex justify-end">
              <button 
                onClick={handlePost}
                disabled={isLoading || !newPost.trim()}
                className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:hover:bg-cyan-600 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Send className="w-4 h-4" />
                {t.postBtn}
              </button>
            </div>
          </div>
        </div>

        {/* Posts List */}
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 flex gap-4">
              {post.role === 'teacher' ? (
                <img src="https://i.ibb.co/vxgG8XFW/Q2.png" alt="Teacher" className="w-10 h-10 rounded-full border border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                  <UserCircle2 className="w-6 h-6 text-slate-400" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className={`font-semibold ${post.role === 'teacher' ? 'text-purple-400' : 'text-cyan-400'}`}>
                    {post.name}
                  </span>
                  <span className="text-xs text-slate-500 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                    {post.role === 'teacher' ? t.teacher : t.student}
                  </span>
                  <span className="text-xs text-slate-500 ml-auto">
                    {new Date(post.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-300 whitespace-pre-wrap">{post.content}</p>
              </div>
            </div>
          ))}
          {posts.length === 0 && (
            <div className="text-center text-slate-500 py-10">
              No posts yet. Be the first to start a discussion!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Forum;
