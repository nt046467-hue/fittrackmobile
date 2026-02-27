import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  SafeAreaView, ActivityIndicator, RefreshControl, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useAuth } from '../utils/AuthContext';
import { workoutsAPI, nutritionAPI, progressAPI } from '../utils/api';
import { COLORS, SIZES, FONTS, SHADOWS } from '../utils/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function StatCard({ icon, label, value, unit, gradient, onPress }) {
  return (
    <TouchableOpacity style={styles.statCardWrapper} onPress={onPress} activeOpacity={0.85}>
      <LinearGradient colors={gradient} style={styles.statCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.statCardIcon}>
          <Ionicons name={icon} size={20} color="rgba(255,255,255,0.9)" />
        </View>
        <Text style={styles.statCardValue}>{value}<Text style={styles.statCardUnit}> {unit}</Text></Text>
        <Text style={styles.statCardLabel}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function WorkoutHistoryItem({ workout }) {
  const typeColors = {
    strength: COLORS.primary, cardio: COLORS.accentOrange,
    weight_loss: COLORS.secondary, general_fitness: COLORS.accent
  };
  const color = typeColors[workout.type] || COLORS.primary;
  return (
    <View style={styles.historyItem}>
      <View style={[styles.historyDot, { backgroundColor: color }]} />
      <View style={styles.historyContent}>
        <Text style={styles.historyName}>{workout.name}</Text>
        <Text style={styles.historyMeta}>{workout.duration} min · {workout.calories_burned} kcal</Text>
      </View>
      <Text style={styles.historyDate}>
        {new Date(workout.completed_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
      </Text>
    </View>
  );
}

export default function DashboardScreen({ navigation }) {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [nutrition, setNutrition] = useState(null);
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [progressSummary, setProgressSummary] = useState(null);

  const load = useCallback(async () => {
    try {
      const [statsRes, nutritionRes, workoutsRes, progressRes] = await Promise.allSettled([
        workoutsAPI.getStats(),
        nutritionAPI.getToday(),
        workoutsAPI.getHistory(5),
        progressAPI.getSummary(),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (nutritionRes.status === 'fulfilled') setNutrition(nutritionRes.value.data);
      if (workoutsRes.status === 'fulfilled') setRecentWorkouts(workoutsRes.value.data);
      if (progressRes.status === 'fulfilled') setProgressSummary(progressRes.value.data);
    } catch (e) {
      console.log('Dashboard load error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const calPercent = nutrition
    ? Math.min(100, Math.round((nutrition.totals.calories / nutrition.calorie_goal) * 100))
    : 0;

  // Mock chart data (in production, derive from weekly workouts)
  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{ data: [320, 450, 0, 380, 520, 290, 410], strokeWidth: 2 }],
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greet}>{greet()},</Text>
            <Text style={styles.userName}>{userData?.name?.split(' ')[0] || 'Athlete'} 👋</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
            <View style={styles.notifBadge} />
          </TouchableOpacity>
        </View>

        {/* Streak Banner */}
        {progressSummary?.workout_streak > 0 && (
          <LinearGradient colors={['rgba(108,99,255,0.2)', 'rgba(108,99,255,0.05)']}
            style={styles.streakBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="flame" size={20} color={COLORS.accentOrange} />
            <Text style={styles.streakText}>
              <Text style={{ color: COLORS.accentOrange, fontWeight: '700' }}>
                {progressSummary.workout_streak} day streak
              </Text>
              {'  '}Keep it up! 🔥
            </Text>
          </LinearGradient>
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="flame-outline" label="Calories Burned"
            value={stats?.total_calories_burned || 0} unit="kcal"
            gradient={COLORS.cardGradient4}
          />
          <StatCard
            icon="barbell-outline" label="Total Workouts"
            value={stats?.total_workouts || 0} unit="done"
            gradient={COLORS.cardGradient1}
          />
          <StatCard
            icon="time-outline" label="Minutes Trained"
            value={stats?.total_minutes || 0} unit="min"
            gradient={COLORS.cardGradient3}
          />
          <StatCard
            icon="calendar-outline" label="This Week"
            value={stats?.workouts_this_week || 0} unit="sessions"
            gradient={COLORS.cardGradient5}
          />
        </View>

        {/* Nutrition Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Nutrition</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Nutrition')}>
              <Text style={styles.seeAll}>Track →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.nutritionCard}>
            <View style={styles.nutritionRow}>
              <View>
                <Text style={styles.nutritionCalories}>{nutrition?.totals?.calories || 0}</Text>
                <Text style={styles.nutritionGoal}>of {nutrition?.calorie_goal || 2200} kcal</Text>
              </View>
              <View style={styles.macrosPill}>
                <Text style={styles.macroText}>P: {nutrition?.totals?.protein || 0}g</Text>
                <View style={styles.macroDot} />
                <Text style={styles.macroText}>C: {nutrition?.totals?.carbs || 0}g</Text>
                <View style={styles.macroDot} />
                <Text style={styles.macroText}>F: {nutrition?.totals?.fat || 0}g</Text>
              </View>
            </View>
            <View style={styles.progressBarBg}>
              <LinearGradient
                colors={calPercent > 90 ? COLORS.cardGradient2 : COLORS.cardGradient3}
                style={[styles.progressBarFill, { width: `${calPercent}%` }]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              />
            </View>
            <Text style={styles.nutritionRemaining}>{nutrition?.remaining || nutrition?.calorie_goal || 2200} kcal remaining</Text>
          </View>
        </View>

        {/* Weekly Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Calories Burned</Text>
          <View style={styles.chartCard}>
            <LineChart
              data={chartData}
              width={SCREEN_WIDTH - 64}
              height={160}
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: COLORS.surfaceElevated,
                backgroundGradientTo: COLORS.surfaceElevated,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(108, 99, 255, ${opacity})`,
                labelColor: () => COLORS.textMuted,
                propsForDots: { r: '4', strokeWidth: '2', stroke: COLORS.primary },
                propsForBackgroundLines: { stroke: COLORS.border },
              }}
              bezier
              style={{ borderRadius: 12 }}
              withInnerLines={true}
              withOuterLines={false}
            />
          </View>
        </View>

        {/* Recent Workouts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Workouts</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Workouts')}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          {recentWorkouts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="barbell-outline" size={32} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No workouts yet. Start your first one!</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Workouts')} style={styles.emptyBtn}>
                <Text style={styles.emptyBtnText}>Browse Workouts</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.historyCard}>
              {recentWorkouts.map((w, i) => (
                <React.Fragment key={w.id}>
                  <WorkoutHistoryItem workout={w} />
                  {i < recentWorkouts.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: SIZES.padding.xl, paddingTop: SIZES.padding.xl, paddingBottom: 8 },
  greet: { color: COLORS.textSecondary, fontSize: SIZES.base },
  userName: { ...FONTS.extraBold, fontSize: SIZES.xxl, color: COLORS.text, letterSpacing: -0.5 },
  notifBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  notifBadge: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  streakBanner: { marginHorizontal: SIZES.padding.xl, marginVertical: 12, borderRadius: SIZES.radius.lg, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: 'rgba(108,99,255,0.3)' },
  streakText: { color: COLORS.text, fontSize: SIZES.base },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SIZES.padding.xl, gap: 12, marginTop: 8 },
  statCardWrapper: { width: (SCREEN_WIDTH - SIZES.padding.xl * 2 - 12) / 2 },
  statCard: { borderRadius: SIZES.radius.lg, padding: 16, ...SHADOWS.card },
  statCardIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statCardValue: { ...FONTS.bold, fontSize: SIZES.xxl, color: '#fff' },
  statCardUnit: { fontSize: SIZES.sm, fontWeight: '400' },
  statCardLabel: { color: 'rgba(255,255,255,0.7)', fontSize: SIZES.sm, marginTop: 2 },
  section: { paddingHorizontal: SIZES.padding.xl, marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { ...FONTS.bold, fontSize: SIZES.lg, color: COLORS.text },
  seeAll: { color: COLORS.primary, fontSize: SIZES.sm, ...FONTS.medium },
  nutritionCard: { backgroundColor: COLORS.surface, borderRadius: SIZES.radius.lg, padding: SIZES.padding.lg, borderWidth: 1, borderColor: COLORS.border },
  nutritionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  nutritionCalories: { ...FONTS.extraBold, fontSize: SIZES.xxxl, color: COLORS.text, letterSpacing: -1 },
  nutritionGoal: { color: COLORS.textMuted, fontSize: SIZES.sm },
  macrosPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.surfaceElevated, borderRadius: SIZES.radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  macroText: { color: COLORS.textSecondary, fontSize: SIZES.sm, ...FONTS.medium },
  macroDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: COLORS.border },
  progressBarBg: { height: 8, backgroundColor: COLORS.surfaceElevated, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressBarFill: { height: '100%', borderRadius: 4 },
  nutritionRemaining: { color: COLORS.textMuted, fontSize: SIZES.sm },
  chartCard: { backgroundColor: COLORS.surface, borderRadius: SIZES.radius.lg, padding: 16, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  historyCard: { backgroundColor: COLORS.surface, borderRadius: SIZES.radius.lg, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  historyItem: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  historyDot: { width: 10, height: 10, borderRadius: 5 },
  historyContent: { flex: 1 },
  historyName: { ...FONTS.semiBold, color: COLORS.text, fontSize: SIZES.base },
  historyMeta: { color: COLORS.textMuted, fontSize: SIZES.sm, marginTop: 2 },
  historyDate: { color: COLORS.textMuted, fontSize: SIZES.sm },
  divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 14 },
  emptyCard: { backgroundColor: COLORS.surface, borderRadius: SIZES.radius.lg, padding: 32, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: COLORS.border },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', fontSize: SIZES.base },
  emptyBtn: { backgroundColor: COLORS.surfaceElevated, paddingHorizontal: 20, paddingVertical: 10, borderRadius: SIZES.radius.full, borderWidth: 1, borderColor: COLORS.primary },
  emptyBtnText: { color: COLORS.primary, ...FONTS.semiBold, fontSize: SIZES.sm },
});
