import { supabase } from '../lib/supabase'; // You need to set up supabase client separately
import { User, MiniBlogPost, Message, Conversation, Comment } from '../types';

/**
 * DATABASE SERVICE using Supabase
 * This replaces the previous localStorage mock.
 * Make sure to set up your Supabase client and tables accordingly.
 */

export const dbService = {
  // --- USER OPERATIONS ---
  async getUser(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as User;
  },

  async getUserByHandle(handle: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('handle', handle)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data as User | null;
  },

  async saveUser(user: User): Promise<void> {
    const { error } = await supabase
      .from('users')
      .upsert(user, { onConflict: 'id' });
    if (error) throw error;
  },

  // --- POST OPERATIONS ---
  async getPosts(): Promise<MiniBlogPost[]> {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('timestamp', { ascending: false });
    if (error) throw error;
    return data as MiniBlogPost[];
  },

  async createPost(post: Omit<MiniBlogPost, 'id' | 'timestamp' | 'likes' | 'replies' | 'reposts' | 'views'>): Promise<void> {
    const newPost = {
      ...post,
      id: undefined, // let Supabase generate
      timestamp: new Date().toISOString(),
      likes: 0,
      replies: 0,
      reposts: 0,
      views: 0,
    };
    const { error } = await supabase.from('posts').insert([newPost]);
    if (error) throw error;
  },

  async deletePost(postId: string): Promise<void> {
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) throw error;
  },

  // --- COMMENT OPERATIONS ---
  async getComments(articleId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('article_id', articleId)
      .order('timestamp_raw', { ascending: false });
    if (error) throw error;
    return data as Comment[];
  },

  async addComment(comment: Comment): Promise<void> {
    const { error } = await supabase.from('comments').insert([comment]);
    if (error) throw error;
  },

  // --- FOLLOW OPERATIONS ---
  async followUser(followerId: string, targetId: string): Promise<void> {
    // Insert follow relation
    const { error: insertError } = await supabase
      .from('follows')
      .insert([{ follower_id: followerId, following_id: targetId, timestamp: Date.now() }]);
    if (insertError) throw insertError;

    // Increment counts
    await supabase.rpc('increment_follow_count', { user_id: followerId, field: 'following', delta: 1 });
    await supabase.rpc('increment_follow_count', { user_id: targetId, field: 'followers', delta: 1 });
  },

  async unfollowUser(followerId: string, targetId: string): Promise<void> {
    // Delete follow relation
    const { error: deleteError } = await supabase
      .from('follows')
      .delete()
      .match({ follower_id: followerId, following_id: targetId });
    if (deleteError) throw deleteError;

    // Decrement counts
    await supabase.rpc('increment_follow_count', { user_id: followerId, field: 'following', delta: -1 });
    await supabase.rpc('increment_follow_count', { user_id: targetId, field: 'followers', delta: -1 });
  },

  async isFollowing(followerId: string, targetId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', followerId)
      .eq('following_id', targetId);
    if (error) throw error;
    return (count ?? 0) > 0;
  },

  async getFollowers(userId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('following_id', userId);
    if (error) throw error;

    const followerIds = data.map((f: any) => f.follower_id);
    if (followerIds.length === 0) return [];

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .in('id', followerIds);
    if (usersError) throw usersError;
    return users as User[];
  },

  async getFollowing(userId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);
    if (error) throw error;

    const followingIds = data.map((f: any) => f.following_id);
    if (followingIds.length === 0) return [];

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .in('id', followingIds);
    if (usersError) throw usersError;
    return users as User[];
  },

  async updateUserCount(userId: string, field: 'followers' | 'following', delta: number): Promise<void> {
    // This is handled by the RPC above; kept for compatibility.
    const { error } = await supabase.rpc('increment_follow_count', { user_id: userId, field, delta });
    if (error) throw error;
  },

  // --- CHAT OPERATIONS ---
  async getMessages(user1: string, user2: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user1},receiver_id.eq.${user2}),and(sender_id.eq.${user2},receiver_id.eq.${user1})`)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data as Message[];
  },

  async sendMessage(msg: Message): Promise<void> {
    const { error } = await supabase.from('messages').insert([msg]);
    if (error) throw error;
  },

  async deleteMessages(messageIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .in('id', messageIds);
    if (error) throw error;
  },

  async deleteConversation(userId: string, partnerId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`);
    if (error) throw error;
  },

  async getConversations(userId: string): Promise<Conversation[]> {
    // First get all distinct users that have exchanged messages with the current user
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('sender_id, receiver_id, created_at, text, media_url')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (msgError) throw msgError;

    const partners = new Set<string>();
    messages.forEach((msg: any) => {
      if (msg.sender_id === userId) partners.add(msg.receiver_id);
      if (msg.receiver_id === userId) partners.add(msg.sender_id);
    });

    if (partners.size === 0) return [];

    // Fetch user details for all partners
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, name, avatar, handle, is_verified')
      .in('id', Array.from(partners));
    if (userError) throw userError;

    // Build conversation list with last message info
    const conversations: Conversation[] = [];
    for (const partnerId of partners) {
      const partner = users.find((u: any) => u.id === partnerId);
      if (!partner) continue;

      // Get the last message between the two
      const lastMsg = messages.find(
        (msg: any) =>
          (msg.sender_id === userId && msg.receiver_id === partnerId) ||
          (msg.sender_id === partnerId && msg.receiver_id === userId)
      );

      conversations.push({
        id: partnerId,
        name: partner.name,
        avatar: partner.avatar,
        handle: partner.handle,
        lastMessage: lastMsg?.text || (lastMsg?.media_url ? 'Sent an attachment' : ''),
        time: lastMsg?.created_at ? new Date(lastMsg.created_at).toLocaleTimeString() : '',
        isVerified: partner.is_verified,
      });
    }

    // Sort by most recent message (we already fetched messages descending, so partners order is roughly correct)
    // But we need stable sorting: by last message time.
    return conversations.sort((a, b) => {
      const aTime = messages.find(
        (m: any) => m.sender_id === a.id || m.receiver_id === a.id
      )?.created_at || 0;
      const bTime = messages.find(
        (m: any) => m.sender_id === b.id || m.receiver_id === b.id
      )?.created_at || 0;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  },
};