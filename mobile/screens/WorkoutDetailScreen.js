import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  SafeAreaView, Alert, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { workoutsAPI } from '../utils/api';
import { COLORS, SIZES, FONTS, SHADOWS } from '../utils/theme';

function ExerciseItem({ exercise, index }) {
  return (
    <View style={styles.exerciseItem}>
      <View style={styles.exerciseNumber}>
        <Text style={styles.exerciseNumberText}>{index + 1}</Text>
      </View>
      <View style={styles.exerciseContent}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <View style={styles.exerciseMeta}>
          <View style={styles.exerciseTag}>
            <Text style={styles.exerciseTagText}>{exercise.sets} sets</Text>
          </View>
          <View style={styles.exerciseTag}>
            <Text style={styles.exerciseTagText}>{exercise.reps} reps</Text>
          </View>
          {exercise.rest > 0 && (
            <View style={[styles.exerciseTag, { borderColor: COLORS.accent }]}>
              <Ionicons name="timer-outline" size={10} color={COLORS.accent} />
              <Text style={[styles.exerciseTagText, { color: COLORS.accent }]}>{exercise.rest}s rest</Text>
            </View>
          )}
        </View>
        {exercise.muscle && (
          <Text style={styles.exerciseMuscle}>{exercise.muscle}</Text>
        )}
      </View>
      <View style={styles.exerciseCalories}>
        <Ionicons name="flame" size={12} color={COLORS.accentOrange} />
        <Text style={styles.exerciseCalText}>{exercise.calories * exercise.sets}</Text>
      </View>
    </View>
  );
}

export default function WorkoutDetailScreen({ route, navigation }) {
  const { workout } = route.params;
  const [logging, setLogging] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Handle both predefined and AI-recommended workouts
  const exercises = workout.exercises || [];
  const name = workout.name || workout.workout_name;
  const duration = workout.duration || workout.estimated_duration || 45;
  const calories = workout.calories || workout.estimated_calories || 200;
  const level = workout.level || workout.fitness_level || 'intermediate';
  const aiTip = workout.ai_tip || null;

  const handleLogWorkout = async () => {
    setLogging(true);
    try {
      await workoutsAPI.logWorkout({
        name,
        type: workout.goal || 'general_fitness',
        duration,
        calories_burned: calories,
        exercises,
        notes: aiTip || '',
      });
      setCompleted(true);
      Alert.alert(
        '🎉 Workout Complete!',
        `Great job! You burned approximately ${calories} calories in ${duration} minutes.`,
        [{ text: 'Awesome!', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      Alert.alert('Error', 'Could not log workout. Try again.');
    } finally {
      setLogging(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient colors={COLORS.cardGradient1} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.heroTitle}>{name}</Text>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroStatText}>{duration} min</Text>
            </View>
            <View style={styles.heroStat}>
              <Ionicons name="flame-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroStatText}>{calories} kcal</Text>
            </View>
            <View style={styles.heroStat}>
              <Ionicons name="trophy-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroStatText}>{level}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* AI Tip */}
          {aiTip && (
            <View style={styles.tipCard}>
              <Ionicons name="sparkles" size={16} color={COLORS.primary} />
              <Text style={styles.tipText}>{aiTip}</Text>
            </View>
          )}

          {/* Exercise List */}
          <Text style={styles.sectionTitle}>
            {exercises.length > 0 ? `${exercises.length} Exercises` : 'Workout Overview'}
          </Text>

          {exercises.length === 0 ? (
            <View style={styles.noExercises}>
              <Text style={styles.noExercisesText}>
                This is a structured workout plan. Start when ready and track your completion!
              </Text>
            </View>
          ) : (
            <View style={styles.exerciseList}>
              {exercises.map((ex, i) => (
                <ExerciseItem key={i} exercise={ex} index={i} />
              ))}
            </View>
          )}

          {/* Tips */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 Training Tips</Text>
            <Text style={styles.tipItem}>• Warm up for 5 minutes before starting</Text>
            <Text style={styles.tipItem}>• Maintain proper form throughout each exercise</Text>
            <Text style={styles.tipItem}>• Stay hydrated — drink water between sets</Text>
            <Text style={styles.tipItem}>• Cool down and stretch for 5 minutes after</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Log Workout Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleLogWorkout}
          disabled={logging || completed}
          activeOpacity={0.85}
          style={{ flex: 1 }}
        >
          <LinearGradient
            colors={completed ? ['#4ADE80', '#22C55E'] : COLORS.cardGradient1}
            style={styles.logBtn}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            {logging ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name={completed ? 'checkmark-circle' : 'checkmark-done'} size={20} color="#fff" />
                <Text style={styles.logBtnText}>{completed ? 'Logged!' : 'Log Workout Complete'}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  hero: { paddingTop: 50, paddingBottom: 28, paddingHorizontal: SIZES.padding.xl },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  heroTitle: { ...FONTS.extraBold, fontSize: SIZES.xxxl, color: '#fff', letterSpacing: -0.5, marginBottom: 14 },
  heroStats: { flexDirection: 'row', gap: 20 },
  heroStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroStatText: { color: 'rgba(255,255,255,0.85)', fontSize: SIZES.base, ...FONTS.medium },
  content: { paddingHorizontal: SIZES.padding.xl, paddingTop: 24 },
  tipCard: { flexDirection: 'row', gap: 10, backgroundColor: 'rgba(108,99,255,0.1)', borderRadius: SIZES.radius.lg, padding: 14, borderWidth: 1, borderColor: 'rgba(108,99,255,0.25)', marginBottom: 24 },
  tipText: { flex: 1, color: COLORS.textSecondary, fontSize: SIZES.sm, lineHeight: 18 },
  sectionTitle: { ...FONTS.bold, fontSize: SIZES.xl, color: COLORS.text, marginBottom: 16 },
  exerciseList: { backgroundColor: COLORS.surface, borderRadius: SIZES.radius.xl, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  exerciseItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 12 },
  exerciseNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(108,99,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  exerciseNumberText: { color: COLORS.primary, ...FONTS.bold, fontSize: SIZES.sm },
  exerciseContent: { flex: 1 },
  exerciseName: { ...FONTS.semiBold, color: COLORS.text, fontSize: SIZES.base, marginBottom: 6 },
  exerciseMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  exerciseTag: { borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.radius.sm, paddingHorizontal: 7, paddingVertical: 2, flexDirection: 'row', alignItems: 'center', gap: 3 },
  exerciseTagText: { color: COLORS.textMuted, fontSize: 11, ...FONTS.medium },
  exerciseMuscle: { color: COLORS.textMuted, fontSize: 11, marginTop: 4 },
  exerciseCalories: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  exerciseCalText: { color: COLORS.accentOrange, fontSize: SIZES.sm, ...FONTS.bold },
  noExercises: { backgroundColor: COLORS.surface, borderRadius: SIZES.radius.xl, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  noExercisesText: { color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  tipsCard: { backgroundColor: COLORS.surface, borderRadius: SIZES.radius.xl, padding: SIZES.padding.xl, borderWidth: 1, borderColor: COLORS.border, marginTop: 20 },
  tipsTitle: { ...FONTS.bold, color: COLORS.text, fontSize: SIZES.lg, marginBottom: 12 },
  tipItem: { color: COLORS.textSecondary, fontSize: SIZES.sm, lineHeight: 24 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.background, paddingHorizontal: SIZES.padding.xl, paddingBottom: 34, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
  logBtn: { borderRadius: SIZES.radius.lg, height: 52, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, ...SHADOWS.card },
  logBtnText: { color: '#fff', ...FONTS.bold, fontSize: SIZES.lg },
});
