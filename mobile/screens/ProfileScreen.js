import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  SafeAreaView, Alert, ActivityIndicator, Switch
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../utils/AuthContext';
import { progressAPI, workoutsAPI } from '../utils/api';
import { COLORS, SIZES, FONTS, SHADOWS } from '../utils/theme';

const GOAL_LABELS = {
  weight_loss: 'Weight Loss', muscle_gain: 'Muscle Gain',
  general_fitness: 'General Fitness', cardio: 'Cardio / Endurance', strength: 'Strength'
};

const LEVEL_LABELS = {
  beginner: '🌱 Beginner', intermediate: '⚡ Intermediate', advanced: '🔥 Advanced'
};

function StatBadge({ icon, label, value, color }) {
  return (
    <View style={styles.badge}>
      <View style={[styles.badgeIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.badgeValue}>{value}</Text>
      <Text style={styles.badgeLabel}>{label}</Text>
    </View>
  );
}

function MenuRow({ icon, label, value, onPress, danger, toggle, toggleValue, onToggle }) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} disabled={toggle}>
      <View style={[styles.menuIcon, { backgroundColor: danger ? 'rgba(248,113,113,0.1)' : COLORS.surfaceElevated }]}>
        <Ionicons name={icon} size={18} color={danger ? COLORS.error : COLORS.textSecondary} />
      </View>
      <Text style={[styles.menuLabel, danger && { color: COLORS.error }]}>{label}</Text>
      {toggle
        ? <Switch value={toggleValue} onValueChange={onToggle} trackColor={{ true: COLORS.primary }} />
        : <>
          {value && <Text style={styles.menuValue}>{value}</Text>}
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </>
      }
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { userData, signOut } = useAuth();
  const [stats, setStats] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    Promise.allSettled([workoutsAPI.getStats(), progressAPI.getSummary()])
      .then(([statsRes, progressRes]) => {
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
        if (progressRes.status === 'fulfilled') setProgress(progressRes.value.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut }
    ]);
  };

  const initials = userData?.name
    ? userData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const hue = userData?.name ? userData.name.charCodeAt(0) * 15 % 360 : 200;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Header */}
        <LinearGradient colors={['rgba(108,99,255,0.2)', 'transparent']} style={styles.hero}>
          <View style={[styles.avatarLarge, { backgroundColor: `hsl(${hue}, 60%, 40%)` }]}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{userData?.name || 'Athlete'}</Text>
          <Text style={styles.userEmail}>{userData?.email}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>{LEVEL_LABELS[userData?.fitness_level] || '🌱 Beginner'}</Text>
          </View>
        </LinearGradient>

        {/* Stats */}
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.statsRow}>
            <StatBadge icon="barbell" label="Workouts" value={stats?.total_workouts || 0} color={COLORS.primary} />
            <StatBadge icon="flame" label="kcal Burned" value={stats?.total_calories_burned || 0} color={COLORS.accentOrange} />
            <StatBadge icon="time" label="Minutes" value={stats?.total_minutes || 0} color={COLORS.accent} />
          </View>
        )}

        {/* Progress Summary */}
        {progress?.current_weight && (
          <View style={styles.progressCard}>
            <Text style={styles.sectionTitle}>Progress</Text>
            <View style={styles.progressRow}>
              <View style={styles.progressItem}>
                <Text style={styles.progressValue}>{progress.current_weight}kg</Text>
                <Text style={styles.progressLabel}>Current Weight</Text>
              </View>
              {progress.weight_change !== null && (
                <View style={styles.progressItem}>
                  <Text style={[styles.progressValue, { color: progress.weight_change < 0 ? COLORS.success : COLORS.error }]}>
                    {progress.weight_change > 0 ? '+' : ''}{progress.weight_change}kg
                  </Text>
                  <Text style={styles.progressLabel}>Total Change</Text>
                </View>
              )}
              <View style={styles.progressItem}>
                <Text style={styles.progressValue}>{progress.workout_streak || 0}</Text>
                <Text style={styles.progressLabel}>Active Days</Text>
              </View>
            </View>
          </View>
        )}

        {/* Profile Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.menuCard}>
            <MenuRow icon="trophy" label="Goal" value={GOAL_LABELS[userData?.goal] || 'General Fitness'} />
            <View style={styles.menuDivider} />
            <MenuRow icon="body" label="Fitness Level" value={userData?.fitness_level || 'Beginner'} />
            {userData?.weight && (
              <>
                <View style={styles.menuDivider} />
                <MenuRow icon="scale" label="Weight" value={`${userData.weight} kg`} />
              </>
            )}
            {userData?.height && (
              <>
                <View style={styles.menuDivider} />
                <MenuRow icon="resize" label="Height" value={`${userData.height} cm`} />
              </>
            )}
            {userData?.age && (
              <>
                <View style={styles.menuDivider} />
                <MenuRow icon="calendar" label="Age" value={`${userData.age} years`} />
              </>
            )}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.menuCard}>
            <MenuRow
              icon="notifications"
              label="Push Notifications"
              toggle
              toggleValue={notifications}
              onToggle={() => setNotifications(!notifications)}
            />
            <View style={styles.menuDivider} />
            <MenuRow icon="moon" label="Dark Mode" toggle toggleValue={true} onToggle={() => {}} />
            <View style={styles.menuDivider} />
            <MenuRow icon="shield-checkmark" label="Privacy" onPress={() => Alert.alert('Privacy', 'Your data is encrypted and never sold.')} />
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <View style={styles.menuCard}>
            <MenuRow icon="information-circle" label="About FitTrack" onPress={() => Alert.alert('FitTrack v1.0', 'AI-powered fitness tracking.\nBuilt with React Native + FastAPI.')} />
            <View style={styles.menuDivider} />
            <MenuRow icon="help-circle" label="Help & Support" onPress={() => {}} />
            <View style={styles.menuDivider} />
            <MenuRow icon="log-out" label="Sign Out" danger onPress={handleSignOut} />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>FitTrack Mobile v1.0.0</Text>
          <Text style={styles.footerSub}>Built with React Native + FastAPI</Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  hero: { alignItems: 'center', paddingTop: 40, paddingBottom: 28, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  avatarLarge: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center', marginBottom: 14, ...SHADOWS.glow(COLORS.primary) },
  avatarInitials: { color: '#fff', fontSize: 32, ...FONTS.bold },
  userName: { ...FONTS.extraBold, fontSize: SIZES.xxl, color: COLORS.text, letterSpacing: -0.5 },
  userEmail: { color: COLORS.textMuted, fontSize: SIZES.sm, marginTop: 4, marginBottom: 12 },
  levelBadge: { backgroundColor: 'rgba(108,99,255,0.15)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: SIZES.radius.full, borderWidth: 1, borderColor: 'rgba(108,99,255,0.3)' },
  levelBadgeText: { color: COLORS.primary, fontSize: SIZES.sm, ...FONTS.semiBold },
  statsRow: { flexDirection: 'row', paddingHorizontal: SIZES.padding.xl, paddingVertical: 20, gap: 12 },
  badge: { flex: 1, backgroundColor: COLORS.surface, borderRadius: SIZES.radius.lg, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: COLORS.border },
  badgeIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  badgeValue: { ...FONTS.bold, fontSize: SIZES.lg, color: COLORS.text },
  badgeLabel: { color: COLORS.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  progressCard: { marginHorizontal: SIZES.padding.xl, backgroundColor: COLORS.surface, borderRadius: SIZES.radius.xl, padding: SIZES.padding.xl, borderWidth: 1, borderColor: COLORS.border, marginBottom: 24 },
  progressRow: { flexDirection: 'row', marginTop: 12 },
  progressItem: { flex: 1, alignItems: 'center' },
  progressValue: { ...FONTS.bold, fontSize: SIZES.xl, color: COLORS.text },
  progressLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  section: { paddingHorizontal: SIZES.padding.xl, marginBottom: 24 },
  sectionTitle: { ...FONTS.bold, fontSize: SIZES.lg, color: COLORS.text, marginBottom: 12 },
  menuCard: { backgroundColor: COLORS.surface, borderRadius: SIZES.radius.xl, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  menuIcon: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { flex: 1, ...FONTS.medium, color: COLORS.text, fontSize: SIZES.base },
  menuValue: { color: COLORS.textMuted, fontSize: SIZES.sm, marginRight: 4 },
  menuDivider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 14 },
  footer: { alignItems: 'center', paddingVertical: 24 },
  footerText: { color: COLORS.textMuted, fontSize: SIZES.sm },
  footerSub: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
});
