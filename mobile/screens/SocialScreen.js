import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
  SafeAreaView, Alert, ActivityIndicator, Modal, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { socialAPI } from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import { COLORS, SIZES, FONTS } from '../utils/theme';

function Avatar({ name, size = 40 }) {
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  const hue = (name || 'x').charCodeAt(0) * 15 % 360;
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: `hsl(${hue}, 60%, 40%)` }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  );
}

function PostCard({ post, onLike, onDelete, currentUserId }) {
  const isOwn = post.author?.email === currentUserId;
  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Avatar name={post.author?.name} />
        <View style={styles.postMeta}>
          <Text style={styles.postAuthor}>{post.author?.name || 'FitTrack User'}</Text>
          <Text style={styles.postTime}>{timeAgo(post.created_at)}</Text>
        </View>
        {isOwn && (
          <TouchableOpacity onPress={() => onDelete(post.id)} style={styles.postDeleteBtn}>
            <Ionicons name="ellipsis-horizontal" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.postContent}>{post.content}</Text>
      <View style={styles.postActions}>
        <TouchableOpacity
          style={[styles.likeBtn, post.user_liked && styles.likeBtnActive]}
          onPress={() => onLike(post.id)}
        >
          <Ionicons
            name={post.user_liked ? 'heart' : 'heart-outline'}
            size={18}
            color={post.user_liked ? COLORS.secondary : COLORS.textMuted}
          />
          <Text style={[styles.likeCount, post.user_liked && { color: COLORS.secondary }]}>
            {post.likes_count}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.commentBtn}>
          <Ionicons name="chatbubble-outline" size={18} color={COLORS.textMuted} />
          <Text style={styles.commentText}>Reply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function SocialScreen() {
  const { userData } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);

  const PROMPT_SUGGESTIONS = [
    '💪 Just crushed my workout! Feeling unstoppable.',
    '🥗 Meal prepped for the week. Staying consistent!',
    '🏆 Hit a new personal record today!',
    '😤 Rest day today, but back at it tomorrow!',
    '🔥 Week 4 of my fitness journey and feeling amazing!',
  ];

  const load = async () => {
    try {
      const { data } = await socialAPI.getFeed();
      setPosts(data);
    } catch (e) {
      // Silently handle if backend is not running
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleLike = async (postId) => {
    try {
      const { data } = await socialAPI.toggleLike(postId);
      setPosts(prev => prev.map(p => p.id === postId
        ? { ...p, likes_count: data.likes_count, user_liked: data.liked }
        : p
      ));
    } catch (e) {}
  };

  const handlePost = async () => {
    if (!newPost.trim()) return;
    setPosting(true);
    try {
      await socialAPI.createPost({ content: newPost.trim() });
      setNewPost('');
      setShowCompose(false);
      await load();
    } catch (e) {
      Alert.alert('Error', 'Could not create post.');
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = (postId) => {
    Alert.alert('Delete Post', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await socialAPI.deletePost(postId);
            setPosts(prev => prev.filter(p => p.id !== postId));
          } catch (e) {}
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={COLORS.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Community</Text>
          <TouchableOpacity style={styles.composeBtn} onPress={() => setShowCompose(true)}>
            <Ionicons name="create-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Compose Mini Card */}
        <TouchableOpacity style={styles.composeCard} onPress={() => setShowCompose(true)}>
          <Avatar name={userData?.name} size={36} />
          <Text style={styles.composePlaceholder}>Share your progress...</Text>
          <Ionicons name="send" size={18} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Stats Banner */}
        <LinearGradient colors={['rgba(108,99,255,0.15)', 'transparent']} style={styles.statsBanner}>
          <View style={styles.bannerStat}>
            <Text style={styles.bannerStatValue}>12K+</Text>
            <Text style={styles.bannerStatLabel}>Members</Text>
          </View>
          <View style={styles.bannerDivider} />
          <View style={styles.bannerStat}>
            <Text style={styles.bannerStatValue}>94%</Text>
            <Text style={styles.bannerStatLabel}>Retention</Text>
          </View>
          <View style={styles.bannerDivider} />
          <View style={styles.bannerStat}>
            <Text style={styles.bannerStatValue}>8.2K</Text>
            <Text style={styles.bannerStatLabel}>Workouts Today</Text>
          </View>
        </LinearGradient>

        {/* Feed */}
        <View style={styles.feed}>
          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : posts.length === 0 ? (
            <View style={styles.emptyFeed}>
              <Ionicons name="people-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Be the first to share!</Text>
              <Text style={styles.emptySubtitle}>Share your fitness journey with the community.</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowCompose(true)}>
                <Text style={styles.emptyBtnText}>Share Progress</Text>
              </TouchableOpacity>
            </View>
          ) : (
            posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onDelete={handleDelete}
                currentUserId={userData?.email}
              />
            ))
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Compose Modal */}
      <Modal visible={showCompose} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.composeModal}>
          <View style={styles.composeModalHeader}>
            <TouchableOpacity onPress={() => setShowCompose(false)}>
              <Text style={styles.cancelBtn}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.composeModalTitle}>New Post</Text>
            <TouchableOpacity onPress={handlePost} disabled={posting || !newPost.trim()}>
              <LinearGradient colors={COLORS.cardGradient1} style={styles.postBtn}>
                {posting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.postBtnText}>Post</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.composeInput}>
            <Avatar name={userData?.name} size={44} />
            <TextInput
              style={styles.textArea}
              placeholder="What's your fitness win today?"
              placeholderTextColor={COLORS.textMuted}
              value={newPost}
              onChangeText={setNewPost}
              multiline
              autoFocus
              maxLength={500}
            />
          </View>

          <Text style={styles.charCount}>{newPost.length}/500</Text>

          <View style={styles.suggestions}>
            <Text style={styles.suggestionsTitle}>Quick shares:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {PROMPT_SUGGESTIONS.map((s, i) => (
                <TouchableOpacity key={i} style={styles.suggestionChip} onPress={() => setNewPost(s)}>
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.padding.xl, paddingTop: SIZES.padding.xl, paddingBottom: 8 },
  title: { ...FONTS.extraBold, fontSize: SIZES.xxxl, color: COLORS.text, letterSpacing: -0.5 },
  composeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  composeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.surface, borderRadius: SIZES.radius.xl, padding: 14, marginHorizontal: SIZES.padding.xl, marginTop: 12, borderWidth: 1, borderColor: COLORS.border },
  composePlaceholder: { flex: 1, color: COLORS.textMuted, fontSize: SIZES.base },
  statsBanner: { flexDirection: 'row', alignItems: 'center', marginHorizontal: SIZES.padding.xl, marginVertical: 16, borderRadius: SIZES.radius.xl, padding: 16, borderWidth: 1, borderColor: 'rgba(108,99,255,0.2)' },
  bannerStat: { flex: 1, alignItems: 'center' },
  bannerStatValue: { ...FONTS.bold, fontSize: SIZES.xl, color: COLORS.text },
  bannerStatLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  bannerDivider: { width: 1, height: 32, backgroundColor: COLORS.border },
  feed: { paddingHorizontal: SIZES.padding.xl },
  postCard: { backgroundColor: COLORS.surface, borderRadius: SIZES.radius.xl, padding: SIZES.padding.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  postMeta: { flex: 1 },
  postAuthor: { ...FONTS.semiBold, color: COLORS.text, fontSize: SIZES.base },
  postTime: { color: COLORS.textMuted, fontSize: SIZES.sm, marginTop: 1 },
  postDeleteBtn: { padding: 4 },
  postContent: { color: COLORS.textSecondary, fontSize: SIZES.base, lineHeight: 22, marginBottom: 14 },
  postActions: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 10, borderRadius: SIZES.radius.full },
  likeBtnActive: { backgroundColor: 'rgba(255,101,132,0.1)' },
  likeCount: { color: COLORS.textMuted, fontSize: SIZES.sm, ...FONTS.medium },
  commentBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  commentText: { color: COLORS.textMuted, fontSize: SIZES.sm },
  avatar: { justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', ...FONTS.bold },
  emptyFeed: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { ...FONTS.bold, fontSize: SIZES.xl, color: COLORS.text },
  emptySubtitle: { color: COLORS.textSecondary, textAlign: 'center', fontSize: SIZES.base },
  emptyBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: SIZES.radius.full, marginTop: 8 },
  emptyBtnText: { color: '#fff', ...FONTS.semiBold },
  composeModal: { flex: 1, backgroundColor: COLORS.background, padding: SIZES.padding.xl },
  composeModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  cancelBtn: { color: COLORS.textSecondary, fontSize: SIZES.base },
  composeModalTitle: { ...FONTS.bold, fontSize: SIZES.lg, color: COLORS.text },
  postBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: SIZES.radius.full },
  postBtnText: { color: '#fff', ...FONTS.semiBold, fontSize: SIZES.sm },
  composeInput: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  textArea: { flex: 1, color: COLORS.text, fontSize: SIZES.base, lineHeight: 22, minHeight: 100 },
  charCount: { color: COLORS.textMuted, fontSize: SIZES.sm, textAlign: 'right', marginBottom: 20 },
  suggestions: { gap: 10 },
  suggestionsTitle: { color: COLORS.textSecondary, fontSize: SIZES.sm, ...FONTS.medium },
  suggestionChip: { backgroundColor: COLORS.surface, borderRadius: SIZES.radius.lg, padding: 10, marginRight: 8, borderWidth: 1, borderColor: COLORS.border, maxWidth: 240 },
  suggestionText: { color: COLORS.textSecondary, fontSize: SIZES.sm },
});
