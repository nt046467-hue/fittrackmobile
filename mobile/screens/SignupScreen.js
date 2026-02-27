import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../utils/AuthContext';
import { authAPI } from '../utils/api';
import { COLORS, SIZES, FONTS } from '../utils/theme';

const GOALS = [
  { key: 'weight_loss', label: 'Lose Weight', icon: 'flame' },
  { key: 'muscle_gain', label: 'Build Muscle', icon: 'barbell' },
  { key: 'general_fitness', label: 'Stay Fit', icon: 'heart' },
  { key: 'cardio', label: 'Cardio', icon: 'bicycle' },
];

const LEVELS = [
  { key: 'beginner', label: 'Beginner', desc: '< 6 months' },
  { key: 'intermediate', label: 'Intermediate', desc: '6mo–2yr' },
  { key: 'advanced', label: 'Advanced', desc: '2+ years' },
];

export default function SignupScreen({ navigation }) {
  const { signIn } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    goal: 'general_fitness', fitness_level: 'beginner',
    weight: '', height: '', age: ''
  });

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleNext = () => {
    if (step === 1) {
      if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
        return Alert.alert('Missing Fields', 'Please fill all required fields.');
      }
      if (form.password.length < 6) {
        return Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      }
      setStep(2);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const payload = {
        ...form,
        weight: form.weight ? parseFloat(form.weight) : null,
        height: form.height ? parseFloat(form.height) : null,
        age: form.age ? parseInt(form.age) : null,
      };
      const { data } = await authAPI.register(payload);
      await signIn(data.token, data.user);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <TouchableOpacity style={styles.backBtn} onPress={() => step > 1 ? setStep(1) : navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={COLORS.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>{step === 1 ? 'Create Account' : 'Your Fitness Profile'}</Text>
            <Text style={styles.subtitle}>
              {step === 1 ? 'Join thousands crushing their goals' : 'Help us personalize your experience'}
            </Text>
            {/* Step indicator */}
            <View style={styles.stepRow}>
              {[1, 2].map(s => (
                <View key={s} style={[styles.stepDot, s <= step && styles.stepDotActive]} />
              ))}
            </View>
          </View>

          {step === 1 && (
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="John Doe" placeholderTextColor={COLORS.textMuted}
                    value={form.name} onChangeText={v => update('name', v)} />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor={COLORS.textMuted}
                    value={form.email} onChangeText={v => update('email', v)} autoCapitalize="none" keyboardType="email-address" />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput style={[styles.input, { flex: 1 }]} placeholder="Min 6 characters" placeholderTextColor={COLORS.textMuted}
                    value={form.password} onChangeText={v => update('password', v)} secureTextEntry={!showPassword} />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity onPress={handleNext} activeOpacity={0.85}>
                <LinearGradient colors={COLORS.cardGradient1} style={styles.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.btnText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View style={styles.formCard}>
              <Text style={styles.sectionLabel}>Your Goal</Text>
              <View style={styles.goalGrid}>
                {GOALS.map(g => (
                  <TouchableOpacity key={g.key} style={[styles.goalCard, form.goal === g.key && styles.goalCardActive]}
                    onPress={() => update('goal', g.key)}>
                    <Ionicons name={g.icon} size={22} color={form.goal === g.key ? COLORS.primary : COLORS.textMuted} />
                    <Text style={[styles.goalLabel, form.goal === g.key && { color: COLORS.primary }]}>{g.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Fitness Level</Text>
              <View style={styles.levelRow}>
                {LEVELS.map(l => (
                  <TouchableOpacity key={l.key} style={[styles.levelBtn, form.fitness_level === l.key && styles.levelBtnActive]}
                    onPress={() => update('fitness_level', l.key)}>
                    <Text style={[styles.levelBtnText, form.fitness_level === l.key && { color: COLORS.primary }]}>{l.label}</Text>
                    <Text style={styles.levelBtnDesc}>{l.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Body Stats (optional)</Text>
              <View style={styles.statsRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Weight (kg)</Text>
                  <TextInput style={styles.statInput} placeholder="75" placeholderTextColor={COLORS.textMuted}
                    value={form.weight} onChangeText={v => update('weight', v)} keyboardType="decimal-pad" />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginHorizontal: 4 }]}>
                  <Text style={styles.label}>Height (cm)</Text>
                  <TextInput style={styles.statInput} placeholder="175" placeholderTextColor={COLORS.textMuted}
                    value={form.height} onChangeText={v => update('height', v)} keyboardType="decimal-pad" />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Age</Text>
                  <TextInput style={styles.statInput} placeholder="25" placeholderTextColor={COLORS.textMuted}
                    value={form.age} onChangeText={v => update('age', v)} keyboardType="number-pad" />
                </View>
              </View>

              <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
                <LinearGradient colors={COLORS.cardGradient1} style={styles.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <><Text style={styles.btnText}>Start My Journey</Text><Ionicons name="rocket" size={18} color="#fff" /></>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Sign In</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, paddingHorizontal: SIZES.padding.xl, paddingTop: 20, paddingBottom: 40 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
  },
  header: { marginBottom: 28 },
  title: { ...FONTS.extraBold, fontSize: SIZES.xxxl, color: COLORS.text, letterSpacing: -0.5, marginBottom: 6 },
  subtitle: { color: COLORS.textSecondary, fontSize: SIZES.base, marginBottom: 16 },
  stepRow: { flexDirection: 'row', gap: 8 },
  stepDot: { width: 24, height: 4, borderRadius: 2, backgroundColor: COLORS.border },
  stepDotActive: { backgroundColor: COLORS.primary },
  formCard: { backgroundColor: COLORS.surface, borderRadius: SIZES.radius.xl, padding: SIZES.padding.xxl, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { color: COLORS.textSecondary, fontSize: SIZES.sm, ...FONTS.medium, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceElevated, borderRadius: SIZES.radius.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, height: 50 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: COLORS.text, fontSize: SIZES.base },
  btn: { borderRadius: SIZES.radius.lg, height: 52, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 10 },
  btnText: { color: '#fff', fontSize: SIZES.lg, ...FONTS.bold },
  sectionLabel: { ...FONTS.semiBold, color: COLORS.text, fontSize: SIZES.base, marginBottom: 12 },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  goalCard: { flex: 1, minWidth: '45%', backgroundColor: COLORS.surfaceElevated, borderRadius: SIZES.radius.md, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, gap: 6 },
  goalCardActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(108,99,255,0.1)' },
  goalLabel: { color: COLORS.textSecondary, fontSize: SIZES.sm, ...FONTS.medium },
  levelRow: { flexDirection: 'row', gap: 8 },
  levelBtn: { flex: 1, backgroundColor: COLORS.surfaceElevated, borderRadius: SIZES.radius.md, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  levelBtnActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(108,99,255,0.1)' },
  levelBtnText: { color: COLORS.textSecondary, fontSize: SIZES.sm, ...FONTS.semiBold },
  levelBtnDesc: { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },
  statsRow: { flexDirection: 'row', marginBottom: 20 },
  statInput: { backgroundColor: COLORS.surfaceElevated, borderRadius: SIZES.radius.md, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text, padding: 12, fontSize: SIZES.base },
  loginLink: { alignItems: 'center' },
  loginLinkText: { color: COLORS.textSecondary, fontSize: SIZES.base },
});
