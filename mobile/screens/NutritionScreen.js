import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
  SafeAreaView, Alert, ActivityIndicator, Modal, FlatList, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { nutritionAPI } from '../utils/api';
import { COLORS, SIZES, FONTS, SHADOWS } from '../utils/theme';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_ICONS = { breakfast: 'sunny', lunch: 'partly-sunny', dinner: 'moon', snack: 'cafe' };
const MEAL_COLORS = { breakfast: COLORS.accentOrange, lunch: COLORS.accent, dinner: COLORS.primary, snack: COLORS.secondary };

function MacroRing({ label, value, max, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <View style={styles.macroRing}>
      <View style={styles.macroRingBg}>
        <View style={[styles.macroRingFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.macroValue, { color }]}>{Math.round(value)}g</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

function MealItem({ meal, onDelete }) {
  const color = MEAL_COLORS[meal.meal_type] || COLORS.primary;
  return (
    <View style={styles.mealItem}>
      <View style={[styles.mealTypeIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={MEAL_ICONS[meal.meal_type] || 'restaurant'} size={16} color={color} />
      </View>
      <View style={styles.mealContent}>
        <Text style={styles.mealName}>{meal.meal_name}</Text>
        <View style={styles.mealMacros}>
          <Text style={styles.mealMacroText}>P:{meal.protein}g</Text>
          <Text style={styles.mealMacroText}>C:{meal.carbs}g</Text>
          <Text style={styles.mealMacroText}>F:{meal.fat}g</Text>
        </View>
      </View>
      <Text style={styles.mealCal}>{meal.calories} kcal</Text>
      <TouchableOpacity onPress={() => onDelete(meal.id)} style={styles.mealDelete}>
        <Ionicons name="trash-outline" size={16} color={COLORS.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

export default function NutritionScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [foods, setFoods] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMealType, setSelectedMealType] = useState('breakfast');
  const [customMeal, setCustomMeal] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  const [activeTab, setActiveTab] = useState('search');
  const [addingMeal, setAddingMeal] = useState(false);

  const load = async () => {
    try {
      const [todayRes, foodsRes] = await Promise.allSettled([
        nutritionAPI.getToday(),
        nutritionAPI.getFoods(),
      ]);
      if (todayRes.status === 'fulfilled') setData(todayRes.value.data);
      if (foodsRes.status === 'fulfilled') setFoods(foodsRes.value.data);
    } catch (e) {
      console.log('Nutrition load error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (q.length > 1) {
      try {
        const { data: results } = await nutritionAPI.searchFood(q);
        setFoods(results);
      } catch (e) {}
    }
  };

  const handleAddFood = async (food) => {
    setAddingMeal(true);
    try {
      await nutritionAPI.logMeal({
        meal_name: food.name,
        meal_type: selectedMealType,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        fiber: food.fiber || 0,
      });
      setShowModal(false);
      setSearchQuery('');
      await load();
      Alert.alert('Added!', `${food.name} logged to ${selectedMealType}.`);
    } catch (e) {
      Alert.alert('Error', 'Could not log meal.');
    } finally {
      setAddingMeal(false);
    }
  };

  const handleAddCustom = async () => {
    if (!customMeal.name || !customMeal.calories) {
      return Alert.alert('Missing fields', 'Name and calories are required.');
    }
    setAddingMeal(true);
    try {
      await nutritionAPI.logMeal({
        meal_name: customMeal.name,
        meal_type: selectedMealType,
        calories: parseInt(customMeal.calories),
        protein: parseFloat(customMeal.protein) || 0,
        carbs: parseFloat(customMeal.carbs) || 0,
        fat: parseFloat(customMeal.fat) || 0,
      });
      setShowModal(false);
      setCustomMeal({ name: '', calories: '', protein: '', carbs: '', fat: '' });
      await load();
    } catch (e) {
      Alert.alert('Error', 'Could not log meal.');
    } finally {
      setAddingMeal(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await nutritionAPI.deleteLog(id);
      await load();
    } catch (e) {
      Alert.alert('Error', 'Could not delete meal.');
    }
  };

  const calPct = data ? Math.min(100, Math.round((data.totals.calories / data.calorie_goal) * 100)) : 0;
  const mealsByType = MEAL_TYPES.reduce((acc, t) => {
    acc[t] = data?.meals?.filter(m => m.meal_type === t) || [];
    return acc;
  }, {});

  if (loading) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centered}><ActivityIndicator color={COLORS.primary} size="large" /></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={COLORS.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Nutrition</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Calorie Ring */}
        <View style={styles.calorieCard}>
          <LinearGradient colors={['rgba(108,99,255,0.15)', 'transparent']} style={styles.calorieGradient}>
            <View style={styles.calorieCenter}>
              <Text style={styles.calorieCurrent}>{data?.totals?.calories || 0}</Text>
              <Text style={styles.calorieGoalText}>/ {data?.calorie_goal || 2200} kcal</Text>
              <Text style={styles.calorieLabel}>Today</Text>
            </View>
            <View style={styles.caloriePctBar}>
              <View style={styles.caloriePctBg}>
                <LinearGradient
                  colors={calPct > 90 ? COLORS.cardGradient2 : COLORS.cardGradient1}
                  style={[styles.caloriePctFill, { width: `${calPct}%` }]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                />
              </View>
              <Text style={styles.caloriePctText}>{calPct}% of goal</Text>
            </View>
            <View style={styles.macroRow}>
              <MacroRing label="Protein" value={data?.totals?.protein || 0} max={150} color={COLORS.secondary} />
              <MacroRing label="Carbs" value={data?.totals?.carbs || 0} max={250} color={COLORS.accentOrange} />
              <MacroRing label="Fat" value={data?.totals?.fat || 0} max={80} color={COLORS.accent} />
              <MacroRing label="Fiber" value={data?.totals?.fiber || 0} max={30} color={COLORS.primary} />
            </View>
          </LinearGradient>
        </View>

        {/* Meals by type */}
        <View style={styles.mealsSection}>
          {MEAL_TYPES.map(type => {
            const meals = mealsByType[type];
            const color = MEAL_COLORS[type];
            return (
              <View key={type} style={styles.mealGroup}>
                <View style={styles.mealGroupHeader}>
                  <Ionicons name={MEAL_ICONS[type]} size={16} color={color} />
                  <Text style={styles.mealGroupTitle}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                  <Text style={styles.mealGroupCalories}>
                    {meals.reduce((s, m) => s + m.calories, 0)} kcal
                  </Text>
                  <TouchableOpacity onPress={() => { setSelectedMealType(type); setShowModal(true); }} style={styles.mealGroupAdd}>
                    <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
                {meals.length === 0 ? (
                  <TouchableOpacity
                    style={styles.mealEmpty}
                    onPress={() => { setSelectedMealType(type); setShowModal(true); }}
                  >
                    <Text style={styles.mealEmptyText}>+ Add {type}</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.mealList}>
                    {meals.map(meal => (
                      <MealItem key={meal.id} meal={meal} onDelete={handleDelete} />
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Add Meal Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log Food</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.mealTypeRow}>
            {MEAL_TYPES.map(t => (
              <TouchableOpacity key={t} style={[styles.mealTypeChip, selectedMealType === t && styles.mealTypeChipActive]}
                onPress={() => setSelectedMealType(t)}>
                <Text style={[styles.mealTypeChipText, selectedMealType === t && { color: COLORS.primary }]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.tabRow}>
            <TouchableOpacity style={[styles.tab, activeTab === 'search' && styles.tabActive]} onPress={() => setActiveTab('search')}>
              <Text style={[styles.tabText, activeTab === 'search' && styles.tabTextActive]}>Database</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, activeTab === 'custom' && styles.tabActive]} onPress={() => setActiveTab('custom')}>
              <Text style={[styles.tabText, activeTab === 'custom' && styles.tabTextActive]}>Custom</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'search' ? (
            <View style={{ flex: 1 }}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={18} color={COLORS.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search foods..."
                  placeholderTextColor={COLORS.textMuted}
                  value={searchQuery}
                  onChangeText={handleSearch}
                />
              </View>
              <FlatList
                data={foods}
                keyExtractor={(_, i) => i.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.foodItem} onPress={() => handleAddFood(item)}>
                    <View style={styles.foodInfo}>
                      <Text style={styles.foodName}>{item.name}</Text>
                      <Text style={styles.foodMacros}>P:{item.protein}g · C:{item.carbs}g · F:{item.fat}g</Text>
                    </View>
                    <Text style={styles.foodCal}>{item.calories} kcal</Text>
                    {addingMeal ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Ionicons name="add-circle" size={22} color={COLORS.primary} />}
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.foodDivider} />}
              />
            </View>
          ) : (
            <ScrollView style={styles.customForm}>
              {[
                { key: 'name', label: 'Food Name', placeholder: 'e.g. Grilled Chicken' },
                { key: 'calories', label: 'Calories (kcal)', placeholder: '0', numeric: true },
                { key: 'protein', label: 'Protein (g)', placeholder: '0', numeric: true },
                { key: 'carbs', label: 'Carbs (g)', placeholder: '0', numeric: true },
                { key: 'fat', label: 'Fat (g)', placeholder: '0', numeric: true },
              ].map(field => (
                <View key={field.key} style={styles.customField}>
                  <Text style={styles.customLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.customInput}
                    placeholder={field.placeholder}
                    placeholderTextColor={COLORS.textMuted}
                    value={customMeal[field.key]}
                    onChangeText={v => setCustomMeal(prev => ({ ...prev, [field.key]: v }))}
                    keyboardType={field.numeric ? 'decimal-pad' : 'default'}
                  />
                </View>
              ))}
              <TouchableOpacity onPress={handleAddCustom} disabled={addingMeal} activeOpacity={0.85}>
                <LinearGradient colors={COLORS.cardGradient1} style={styles.addCustomBtn}>
                  {addingMeal ? <ActivityIndicator color="#fff" /> : <Text style={styles.addCustomBtnText}>Add Custom Food</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.padding.xl, paddingTop: SIZES.padding.xl, paddingBottom: 8 },
  title: { ...FONTS.extraBold, fontSize: SIZES.xxxl, color: COLORS.text, letterSpacing: -0.5 },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', ...SHADOWS.glow() },
  calorieCard: { marginHorizontal: SIZES.padding.xl, marginTop: 16, borderRadius: SIZES.radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  calorieGradient: { padding: SIZES.padding.xl },
  calorieCenter: { alignItems: 'center', marginBottom: 16 },
  calorieCurrent: { ...FONTS.extraBold, fontSize: 52, color: COLORS.text, letterSpacing: -2 },
  calorieGoalText: { color: COLORS.textMuted, fontSize: SIZES.base, marginTop: 2 },
  calorieLabel: { color: COLORS.textSecondary, fontSize: SIZES.sm, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
  caloriePctBar: { marginBottom: 20 },
  caloriePctBg: { height: 8, backgroundColor: COLORS.surfaceElevated, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  caloriePctFill: { height: '100%', borderRadius: 4 },
  caloriePctText: { color: COLORS.textMuted, fontSize: SIZES.sm, textAlign: 'right' },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between' },
  macroRing: { flex: 1, alignItems: 'center', gap: 4 },
  macroRingBg: { width: '80%', height: 4, backgroundColor: COLORS.border, borderRadius: 2, overflow: 'hidden' },
  macroRingFill: { height: '100%', borderRadius: 2 },
  macroValue: { ...FONTS.bold, fontSize: SIZES.base },
  macroLabel: { color: COLORS.textMuted, fontSize: 11, textTransform: 'uppercase' },
  mealsSection: { paddingHorizontal: SIZES.padding.xl, marginTop: 24 },
  mealGroup: { marginBottom: 16 },
  mealGroupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  mealGroupTitle: { ...FONTS.bold, color: COLORS.text, fontSize: SIZES.base, flex: 1 },
  mealGroupCalories: { color: COLORS.textMuted, fontSize: SIZES.sm },
  mealGroupAdd: {},
  mealEmpty: { backgroundColor: COLORS.surface, borderRadius: SIZES.radius.lg, padding: 14, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed', alignItems: 'center' },
  mealEmptyText: { color: COLORS.textMuted, fontSize: SIZES.sm },
  mealList: { backgroundColor: COLORS.surface, borderRadius: SIZES.radius.lg, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  mealItem: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  mealTypeIcon: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  mealContent: { flex: 1 },
  mealName: { ...FONTS.medium, color: COLORS.text, fontSize: SIZES.sm },
  mealMacros: { flexDirection: 'row', gap: 8, marginTop: 2 },
  mealMacroText: { color: COLORS.textMuted, fontSize: 11 },
  mealCal: { ...FONTS.bold, color: COLORS.text, fontSize: SIZES.sm },
  mealDelete: { padding: 4 },
  modal: { flex: 1, backgroundColor: COLORS.background, paddingTop: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.padding.xl, marginBottom: 20 },
  modalTitle: { ...FONTS.bold, fontSize: SIZES.xxl, color: COLORS.text },
  mealTypeRow: { flexDirection: 'row', paddingHorizontal: SIZES.padding.xl, gap: 8, marginBottom: 16 },
  mealTypeChip: { flex: 1, paddingVertical: 8, borderRadius: SIZES.radius.full, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  mealTypeChipActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(108,99,255,0.1)' },
  mealTypeChipText: { color: COLORS.textMuted, fontSize: 11, ...FONTS.medium },
  tabRow: { flexDirection: 'row', marginHorizontal: SIZES.padding.xl, backgroundColor: COLORS.surface, borderRadius: SIZES.radius.md, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: SIZES.radius.sm, alignItems: 'center' },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.textMuted, fontSize: SIZES.sm, ...FONTS.medium },
  tabTextActive: { color: '#fff' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.surface, borderRadius: SIZES.radius.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, height: 46, marginHorizontal: SIZES.padding.xl, marginBottom: 12 },
  searchInput: { flex: 1, color: COLORS.text, fontSize: SIZES.base },
  foodItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.padding.xl, paddingVertical: 12, gap: 12 },
  foodInfo: { flex: 1 },
  foodName: { ...FONTS.medium, color: COLORS.text, fontSize: SIZES.sm },
  foodMacros: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  foodCal: { ...FONTS.bold, color: COLORS.text, fontSize: SIZES.sm },
  foodDivider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: SIZES.padding.xl },
  customForm: { paddingHorizontal: SIZES.padding.xl },
  customField: { marginBottom: 14 },
  customLabel: { color: COLORS.textSecondary, fontSize: SIZES.sm, marginBottom: 6, ...FONTS.medium },
  customInput: { backgroundColor: COLORS.surface, borderRadius: SIZES.radius.md, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text, padding: 12, fontSize: SIZES.base },
  addCustomBtn: { borderRadius: SIZES.radius.lg, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  addCustomBtnText: { color: '#fff', ...FONTS.bold, fontSize: SIZES.base },
});
