import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { workoutsAPI } from '../utils/api';
import { COLORS, SIZES, FONTS, SHADOWS } from '../utils/theme';

const CATEGORY_COLORS = {
  'Full Body': COLORS.cardGradient1,
  'Cardio': COLORS.cardGradient4,
  'Strength': COLORS.cardGradient2,
  'Core': COLORS.cardGradient3,
  'HIIT': ['#FF6584', '#FF8C42'],
};

const LEVEL_COLORS = {
  beginner: { bg: 'rgba(74,222,128,0.15)', text: COLORS.success },
  intermediate: { bg: 'rgba(251,191,36,0.15)', text: COLORS.warning },
  advanced: { bg: 'rgba(248,113,113,0.15)', text: COLORS.error },
};

function WorkoutCard({ workout, onPress }) {
  const gradient = CATEGORY_COLORS[workout.category] || COLORS.cardGradient1;
  const levelStyle = LEVEL_COLORS[workout.level] || LEVEL_COLORS.beginner;

  return (
    <TouchableOpacity onPress={() => onPress(workout)} activeOpacity={0.85} style={styles.workoutCard}>
      <LinearGradient colors={gradient} style={styles.workoutCardGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.workoutCardTop}>
          <View style={styles.workoutCardCategory}>
            <Text style={styles.workoutCardCategoryText}>{workout.category}</Text>
          </View>
          <View style={[styles.levelBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Text style={styles.levelBadgeText}>{workout.level}</Text>
          </View>
        </View>
        <Text style={styles.workoutCardName}>{workout.name}</Text>
        <Text style={styles.workoutCardDesc} numberOfLines={2}>{workout.description}</Text>
        <View style={styles.workoutCardStats}>
          <View style={styles.workoutStat}>
            <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={styles.workoutStatText}>{workout.duration} min</Text>
          </View>
          <View style={styles.workoutStat}>
            <Ionicons name="flame-outline" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={styles.workoutStatText}>{workout.calories} kcal</Text>
          </View>
          <View style={styles.workoutStat}>
            <Ionicons name="list-outline" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={styles.workoutStatText}>{workout.exercises_count} exercises</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function AIRecommendationCard({ recommendation, onStart, loading }) {
  if (loading) {
    return (
      <View style={styles.aiCard}>
        <ActivityIndicator color={COLORS.primary} />
        <Text style={styles.aiLoadingText}>AI is crafting your workout...</Text>
      </View>
    );
  }

  if (!recommendation) return null;

  return (
    <LinearGradient colors={['rgba(108,99,255,0.15)', 'rgba(108,99,255,0.05)']}
      style={styles.aiCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <View style={styles.aiHeader}>
        <View style={styles.aiBadge}>
          <Ionicons name="sparkles" size={14} color={COLORS.primary} />
          <Text style={styles.aiBadgeText}>AI Recommendation</Text>
        </View>
        <View style={styles.aiDiffScore}>
          <Text style={styles.aiDiffText}>Difficulty {recommendation.difficulty_score}/10</Text>
        </View>
      </View>
      <Text style={styles.aiWorkoutName}>{recommendation.workout_name}</Text>
      <View style={styles.aiStats}>
        <View style={styles.aiStat}>
          <Text style={styles.aiStatValue}>{recommendation.estimated_duration}</Text>
          <Text style={styles.aiStatLabel}>min</Text>
        </View>
        <View style={styles.aiStatDivider} />
        <View style={styles.aiStat}>
          <Text style={styles.aiStatValue}>{recommendation.estimated_calories}</Text>
          <Text style={styles.aiStatLabel}>kcal</Text>
        </View>
        <View style={styles.aiStatDivider} />
        <View style={styles.aiStat}>
          <Text style={styles.aiStatValue}>{recommendation.exercises?.length || 0}</Text>
          <Text style={styles.aiStatLabel}>exercises</Text>
        </View>
      </View>
      <View style={styles.aiTipBox}>
        <Ionicons name="bulb-outline" size={14} color={COLORS.primary} />
        <Text style={styles.aiTipText}>{recommendation.ai_tip}</Text>
      </View>
      <TouchableOpacity onPress={() => onStart(recommendation)} activeOpacity={0.85}>
        <LinearGradient colors={COLORS.cardGradient1} style={styles.aiStartBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={styles.aiStartBtnText}>Start This Workout</Text>
          <Ionicons name="play-circle" size={20} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
}

export default function WorkoutsScreen({ navigation }) {
  const [predefined, setPredefined] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  const filters = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const load = async () => {
    try {
      const { data } = await workoutsAPI.getPredefined();
      setPredefined(data);
    } catch (e) {
      console.log('Workouts load error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getAIRecommendation = async () => {
    setAiLoading(true);
    try {
      const { data } = await workoutsAPI.getRecommendation({ available_time: 45 });
      setRecommendation(data);
    } catch (e) {
      Alert.alert('Error', 'Could not fetch AI recommendation. Is the backend running?');
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleStartWorkout = (workout) => {
    navigation.navigate('WorkoutDetail', { workout });
  };

  const filtered = activeFilter === 'All'
    ? predefined
    : predefined.filter(w => w.level === activeFilter.toLowerCase());

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={COLORS.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Workouts</Text>
          <Text style={styles.subtitle}>Train smart, recover smart</Text>
        </View>

        {/* AI Recommendation Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI-Powered Plan</Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={getAIRecommendation}>
              <Ionicons name="refresh" size={16} color={COLORS.primary} />
              <Text style={styles.refreshBtnText}>Regenerate</Text>
            </TouchableOpacity>
          </View>

          {!recommendation && !aiLoading ? (
            <TouchableOpacity onPress={getAIRecommendation} activeOpacity={0.85} style={styles.aiPromptCard}>
              <LinearGradient colors={['rgba(108,99,255,0.1)', 'transparent']} style={styles.aiPromptGradient}>
                <Ionicons name="sparkles" size={32} color={COLORS.primary} />
                <Text style={styles.aiPromptTitle}>Get AI Recommendation</Text>
                <Text style={styles.aiPromptText}>Tap to generate a personalized workout based on your goals and fitness level.</Text>
                <View style={styles.aiPromptBtn}>
                  <Text style={styles.aiPromptBtnText}>Generate →</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <AIRecommendationCard
              recommendation={recommendation}
              onStart={handleStartWorkout}
              loading={aiLoading}
            />
          )}
        </View>

        {/* Predefined Workouts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse Workouts</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            {filters.map(f => (
              <TouchableOpacity key={f}
                style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
                onPress={() => setActiveFilter(f)}>
                <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 32 }} />
          ) : (
            filtered.map(w => <WorkoutCard key={w.id} workout={w} onPress={handleStartWorkout} />)
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SIZES.padding.xl, paddingTop: SIZES.padding.xl, paddingBottom: 8 },
  title: { ...FONTS.extraBold, fontSize: SIZES.xxxl, color: COLORS.text, letterSpacing: -0.5 },
  subtitle: { color: COLORS.textSecondary, fontSize: SIZES.base, marginTop: 4 },
  section: { paddingHorizontal: SIZES.padding.xl, marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { ...FONTS.bold, fontSize: SIZES.lg, color: COLORS.text },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  refreshBtnText: { color: COLORS.primary, fontSize: SIZES.sm, ...FONTS.medium },
  aiPromptCard: { borderRadius: SIZES.radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(108,99,255,0.3)', borderStyle: 'dashed' },
  aiPromptGradient: { padding: 28, alignItems: 'center', gap: 10 },
  aiPromptTitle: { ...FONTS.bold, fontSize: SIZES.xl, color: COLORS.text },
  aiPromptText: { color: COLORS.textSecondary, textAlign: 'center', fontSize: SIZES.base, lineHeight: 22 },
  aiPromptBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: SIZES.radius.full, marginTop: 8 },
  aiPromptBtnText: { color: '#fff', ...FONTS.semiBold, fontSize: SIZES.base },
  aiCard: { backgroundColor: COLORS.surface, borderRadius: SIZES.radius.xl, padding: SIZES.padding.xl, borderWidth: 1, borderColor: 'rgba(108,99,255,0.3)', ...SHADOWS.card, alignItems: 'center' },
  aiLoadingText: { color: COLORS.textSecondary, marginTop: 12, fontSize: SIZES.base },
  aiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 10 },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(108,99,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: SIZES.radius.full },
  aiBadgeText: { color: COLORS.primary, fontSize: SIZES.sm, ...FONTS.semiBold },
  aiDiffScore: {},
  aiDiffText: { color: COLORS.textMuted, fontSize: SIZES.sm },
  aiWorkoutName: { ...FONTS.bold, fontSize: SIZES.xxl, color: COLORS.text, width: '100%', marginBottom: 14 },
  aiStats: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 14 },
  aiStat: { flex: 1, alignItems: 'center' },
  aiStatValue: { ...FONTS.bold, fontSize: SIZES.xl, color: COLORS.text },
  aiStatLabel: { color: COLORS.textMuted, fontSize: SIZES.sm },
  aiStatDivider: { width: 1, height: 32, backgroundColor: COLORS.border },
  aiTipBox: { flexDirection: 'row', gap: 8, backgroundColor: COLORS.surfaceElevated, borderRadius: SIZES.radius.md, padding: 12, marginBottom: 16, width: '100%' },
  aiTipText: { flex: 1, color: COLORS.textSecondary, fontSize: SIZES.sm, lineHeight: 18 },
  aiStartBtn: { borderRadius: SIZES.radius.lg, height: 48, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingHorizontal: 24, width: '100%' },
  aiStartBtnText: { color: '#fff', ...FONTS.bold, fontSize: SIZES.base },
  filtersScroll: { marginBottom: 16 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: SIZES.radius.full, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, marginRight: 8 },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { color: COLORS.textMuted, fontSize: SIZES.sm, ...FONTS.medium },
  filterChipTextActive: { color: '#fff' },
  workoutCard: { marginBottom: 12, borderRadius: SIZES.radius.xl, overflow: 'hidden', ...SHADOWS.card },
  workoutCardGradient: { padding: SIZES.padding.xl },
  workoutCardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  workoutCardCategory: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: SIZES.radius.full },
  workoutCardCategoryText: { color: '#fff', fontSize: SIZES.sm, ...FONTS.medium },
  levelBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: SIZES.radius.full },
  levelBadgeText: { color: '#fff', fontSize: SIZES.sm, ...FONTS.medium },
  workoutCardName: { ...FONTS.bold, fontSize: SIZES.xl, color: '#fff', marginBottom: 6 },
  workoutCardDesc: { color: 'rgba(255,255,255,0.75)', fontSize: SIZES.sm, lineHeight: 20, marginBottom: 16 },
  workoutCardStats: { flexDirection: 'row', gap: 16 },
  workoutStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  workoutStatText: { color: 'rgba(255,255,255,0.8)', fontSize: SIZES.sm },
});
