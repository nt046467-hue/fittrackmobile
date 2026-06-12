import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.planDayCompletion.deleteMany();
  await prisma.planExercise.deleteMany();
  await prisma.planDay.deleteMany();
  await prisma.workoutPlan.deleteMany();
  await prisma.exerciseSet.deleteMany();
  await prisma.workoutExercise.deleteMany();
  await prisma.workout.deleteMany();
  await prisma.bodyMetric.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.user.deleteMany();

  // Create demo user
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@fittrack.com',
      password: 'demo123',
      name: 'Demo User',
      unitSystem: 'metric',
      theme: 'dark',
    },
  });
  console.log('Created demo user:', demoUser.email);

  // ========== EXERCISES ==========
  // Type categories for default targets:
  // Compound (Squat, Deadlift, Bench): 5 sets × 5 reps, rest 180s
  // Accessory (Rows, Press, Curl): 3-4 sets × 8-12 reps, rest 90-120s
  // Isolation (Lateral raises, Cable): 3 sets × 12-15 reps, rest 60s
  // Bodyweight / Cardio: 3 sets × 15-20 reps, rest 45-60s
  const exercisesData = [
    // Chest — Compound
    { name: 'Bench Press', primaryMuscles: '["chest"]', secondaryMuscles: '["triceps","shoulders"]', equipment: 'barbell', instructions: 'Lie on a flat bench, grip the bar slightly wider than shoulder width. Lower the bar to your chest, then press back up.', targetSets: 5, targetReps: 5, recommendedRest: 180 },
    { name: 'Incline Bench Press', primaryMuscles: '["chest"]', secondaryMuscles: '["triceps","shoulders"]', equipment: 'barbell', instructions: 'Lie on an incline bench at 30-45 degrees. Lower the bar to your upper chest, then press up.', targetSets: 4, targetReps: 8, recommendedRest: 120 },
    { name: 'Dumbbell Fly', primaryMuscles: '["chest"]', secondaryMuscles: '["shoulders"]', equipment: 'dumbbell', instructions: 'Lie on a flat bench with dumbbells above your chest. Lower arms out to the sides in a wide arc, then bring back together.', targetSets: 3, targetReps: 12, recommendedRest: 60 },
    { name: 'Push-ups', primaryMuscles: '["chest"]', secondaryMuscles: '["triceps","shoulders"]', equipment: 'bodyweight', instructions: 'Start in a plank position with hands slightly wider than shoulders. Lower your body until chest nearly touches the floor, then push back up.', targetSets: 3, targetReps: 15, recommendedRest: 60 },
    { name: 'Cable Crossover', primaryMuscles: '["chest"]', secondaryMuscles: '["shoulders"]', equipment: 'cable', instructions: 'Stand between two cable pulleys at high position. Pull cables down and across your body, squeezing your chest.', targetSets: 3, targetReps: 12, recommendedRest: 60 },
    { name: 'Decline Bench Press', primaryMuscles: '["chest"]', secondaryMuscles: '["triceps"]', equipment: 'barbell', instructions: 'Lie on a decline bench. Lower the bar to your lower chest, then press back up.', targetSets: 4, targetReps: 8, recommendedRest: 120 },
    { name: 'Dumbbell Bench Press', primaryMuscles: '["chest"]', secondaryMuscles: '["triceps","shoulders"]', equipment: 'dumbbell', instructions: 'Lie on a flat bench with dumbbells at chest level. Press up until arms are extended, then lower back down.', targetSets: 4, targetReps: 8, recommendedRest: 120 },
    { name: 'Chest Dip', primaryMuscles: '["chest"]', secondaryMuscles: '["triceps"]', equipment: 'bodyweight', instructions: 'Lean forward on parallel bars. Lower your body by bending your arms, then push back up.', targetSets: 3, targetReps: 10, recommendedRest: 90 },
    { name: 'Machine Chest Press', primaryMuscles: '["chest"]', secondaryMuscles: '["triceps"]', equipment: 'machine', instructions: 'Sit in the machine with handles at chest level. Press forward until arms are extended, then return.', targetSets: 3, targetReps: 10, recommendedRest: 90 },
    { name: 'Pec Deck', primaryMuscles: '["chest"]', secondaryMuscles: '["shoulders"]', equipment: 'machine', instructions: 'Sit with arms on the pads. Bring pads together in front of your chest, then slowly return.', targetSets: 3, targetReps: 12, recommendedRest: 60 },
    { name: 'Incline Dumbbell Press', primaryMuscles: '["chest"]', secondaryMuscles: '["triceps","shoulders"]', equipment: 'dumbbell', instructions: 'Lie on an incline bench with dumbbells at upper chest level. Press up, then lower back down.', targetSets: 4, targetReps: 10, recommendedRest: 120 },
    { name: 'Floor Press', primaryMuscles: '["chest"]', secondaryMuscles: '["triceps"]', equipment: 'barbell', instructions: 'Lie on the floor with barbell above your chest. Lower until triceps touch the floor, then press back up.', targetSets: 4, targetReps: 8, recommendedRest: 120 },

    // Back — Compound
    { name: 'Deadlift', primaryMuscles: '["back"]', secondaryMuscles: '["legs","core"]', equipment: 'barbell', instructions: 'Stand with feet hip-width apart, grip the bar. Lift by extending hips and knees, keeping back straight.', targetSets: 5, targetReps: 5, recommendedRest: 240 },
    { name: 'Barbell Row', primaryMuscles: '["back"]', secondaryMuscles: '["biceps"]', equipment: 'barbell', instructions: 'Bend at hips with flat back. Pull the bar to your lower chest, then lower with control.', targetSets: 4, targetReps: 8, recommendedRest: 120 },
    { name: 'Pull-ups', primaryMuscles: '["back"]', secondaryMuscles: '["biceps"]', equipment: 'bodyweight', instructions: 'Hang from a bar with overhand grip. Pull yourself up until chin clears the bar, then lower.', targetSets: 3, targetReps: 8, recommendedRest: 90 },
    { name: 'Lat Pulldown', primaryMuscles: '["back"]', secondaryMuscles: '["biceps"]', equipment: 'cable', instructions: 'Sit with arms extended gripping the bar. Pull the bar down to your upper chest, then extend arms.', targetSets: 3, targetReps: 10, recommendedRest: 90 },
    { name: 'Seated Row', primaryMuscles: '["back"]', secondaryMuscles: '["biceps"]', equipment: 'cable', instructions: 'Sit at the cable row machine. Pull the handle to your abdomen, squeezing shoulder blades together.', targetSets: 3, targetReps: 10, recommendedRest: 90 },
    { name: 'Dumbbell Row', primaryMuscles: '["back"]', secondaryMuscles: '["biceps"]', equipment: 'dumbbell', instructions: 'Place one knee and hand on a bench. Pull the dumbbell to your hip, then lower.', targetSets: 3, targetReps: 10, recommendedRest: 90 },
    { name: 'T-Bar Row', primaryMuscles: '["back"]', secondaryMuscles: '["biceps"]', equipment: 'barbell', instructions: 'Straddle the bar and grip the T-handle. Pull up to your chest, then lower.', targetSets: 4, targetReps: 8, recommendedRest: 120 },
    { name: 'Single-Arm Lat Pulldown', primaryMuscles: '["back"]', secondaryMuscles: '["biceps"]', equipment: 'cable', instructions: 'Use a single handle attachment. Pull down with one arm, squeezing the lat.', targetSets: 3, targetReps: 10, recommendedRest: 90 },
    { name: 'Face Pull', primaryMuscles: '["back"]', secondaryMuscles: '["shoulders"]', equipment: 'cable', instructions: 'Set cable at face height with rope attachment. Pull rope toward your face, separating the ends.', targetSets: 3, targetReps: 15, recommendedRest: 60 },
    { name: 'Chin-ups', primaryMuscles: '["back"]', secondaryMuscles: '["biceps"]', equipment: 'bodyweight', instructions: 'Hang from a bar with underhand grip. Pull yourself up until chin clears the bar.', targetSets: 3, targetReps: 8, recommendedRest: 90 },
    { name: 'Meadows Row', primaryMuscles: '["back"]', secondaryMuscles: '["biceps"]', equipment: 'barbell', instructions: 'Perform a one-arm row using a landmine attachment at the end of a barbell.', targetSets: 3, targetReps: 10, recommendedRest: 90 },
    { name: 'Hyperextension', primaryMuscles: '["back"]', secondaryMuscles: '["core"]', equipment: 'bodyweight', instructions: 'Position yourself on a hyperextension bench. Lower your torso, then raise back up.', targetSets: 3, targetReps: 12, recommendedRest: 60 },

    // Shoulders — Compound + Accessory + Isolation
    { name: 'Overhead Press', primaryMuscles: '["shoulders"]', secondaryMuscles: '["triceps"]', equipment: 'barbell', instructions: 'Stand with barbell at shoulder height. Press overhead until arms are extended, then lower.', targetSets: 5, targetReps: 5, recommendedRest: 180 },
    { name: 'Lateral Raise', primaryMuscles: '["shoulders"]', secondaryMuscles: '[]', equipment: 'dumbbell', instructions: 'Stand holding dumbbells at your sides. Raise arms out to the sides to shoulder height, then lower.', targetSets: 3, targetReps: 12, recommendedRest: 60 },
    { name: 'Front Raise', primaryMuscles: '["shoulders"]', secondaryMuscles: '[]', equipment: 'dumbbell', instructions: 'Stand holding dumbbells in front of your thighs. Raise one arm forward to shoulder height, then lower.', targetSets: 3, targetReps: 12, recommendedRest: 60 },
    { name: 'Arnold Press', primaryMuscles: '["shoulders"]', secondaryMuscles: '["triceps"]', equipment: 'dumbbell', instructions: 'Start with dumbbells at shoulder height, palms facing you. Press up while rotating palms to face forward.', targetSets: 4, targetReps: 8, recommendedRest: 90 },
    { name: 'Dumbbell Shoulder Press', primaryMuscles: '["shoulders"]', secondaryMuscles: '["triceps"]', equipment: 'dumbbell', instructions: 'Sit or stand with dumbbells at shoulder height. Press up until arms are extended, then lower.', targetSets: 4, targetReps: 8, recommendedRest: 90 },
    { name: 'Reverse Fly', primaryMuscles: '["shoulders"]', secondaryMuscles: '["back"]', equipment: 'dumbbell', instructions: 'Bend at hips with flat back. Raise dumbbells out to the sides, squeezing shoulder blades.', targetSets: 3, targetReps: 12, recommendedRest: 60 },
    { name: 'Upright Row', primaryMuscles: '["shoulders"]', secondaryMuscles: '["traps"]', equipment: 'barbell', instructions: 'Stand holding barbell with narrow grip. Pull bar up to chin level, leading with elbows.', targetSets: 3, targetReps: 10, recommendedRest: 90 },
    { name: 'Cable Lateral Raise', primaryMuscles: '["shoulders"]', secondaryMuscles: '[]', equipment: 'cable', instructions: 'Use a low cable with a single handle. Raise arm out to the side to shoulder height.', targetSets: 3, targetReps: 12, recommendedRest: 60 },
    { name: 'Pike Push-up', primaryMuscles: '["shoulders"]', secondaryMuscles: '["triceps"]', equipment: 'bodyweight', instructions: 'Start in a pike position with hips high. Bend elbows to lower head toward the floor, then push back up.', targetSets: 3, targetReps: 8, recommendedRest: 90 },
    { name: 'Landmine Press', primaryMuscles: '["shoulders"]', secondaryMuscles: '["triceps"]', equipment: 'barbell', instructions: 'Hold the end of a barbell at shoulder height. Press up and forward at an angle.', targetSets: 3, targetReps: 10, recommendedRest: 90 },
    { name: 'Shrugs', primaryMuscles: '["shoulders"]', secondaryMuscles: '[]', equipment: 'dumbbell', instructions: 'Stand holding dumbbells at sides. Shrug shoulders up toward ears, then lower.', targetSets: 4, targetReps: 10, recommendedRest: 60 },
    { name: 'Behind the Neck Press', primaryMuscles: '["shoulders"]', secondaryMuscles: '["triceps"]', equipment: 'barbell', instructions: 'Sit with barbell behind your neck. Press overhead until arms are extended, then lower behind the neck.', targetSets: 4, targetReps: 8, recommendedRest: 120 },

    // Legs — Compound + Accessory
    { name: 'Squat', primaryMuscles: '["legs"]', secondaryMuscles: '["core","back"]', equipment: 'barbell', instructions: 'Place barbell on upper back. Squat down until thighs are parallel to the floor, then stand back up.', targetSets: 5, targetReps: 5, recommendedRest: 240 },
    { name: 'Leg Press', primaryMuscles: '["legs"]', secondaryMuscles: '[]', equipment: 'machine', instructions: 'Sit in the leg press machine with feet shoulder-width apart. Lower the platform, then press back up.', targetSets: 4, targetReps: 10, recommendedRest: 120 },
    { name: 'Lunges', primaryMuscles: '["legs"]', secondaryMuscles: '["core"]', equipment: 'bodyweight', instructions: 'Step forward into a lunge position. Lower your back knee toward the floor, then return to standing.', targetSets: 3, targetReps: 12, recommendedRest: 60 },
    { name: 'Leg Curl', primaryMuscles: '["legs"]', secondaryMuscles: '[]', equipment: 'machine', instructions: 'Sit or lie in the leg curl machine. Curl the pad toward your glutes, then lower with control.', targetSets: 3, targetReps: 12, recommendedRest: 60 },
    { name: 'Leg Extension', primaryMuscles: '["legs"]', secondaryMuscles: '[]', equipment: 'machine', instructions: 'Sit in the leg extension machine. Extend your legs until straight, then lower with control.', targetSets: 3, targetReps: 12, recommendedRest: 60 },
    { name: 'Calf Raise', primaryMuscles: '["legs"]', secondaryMuscles: '[]', equipment: 'machine', instructions: 'Stand on a raised surface or in the calf raise machine. Rise up on your toes, then lower.', targetSets: 4, targetReps: 15, recommendedRest: 45 },
    { name: 'Romanian Deadlift', primaryMuscles: '["legs"]', secondaryMuscles: '["back"]', equipment: 'barbell', instructions: 'Hold barbell with straight arms. Hinge at hips, lowering the bar along your legs, then return to standing.', targetSets: 3, targetReps: 10, recommendedRest: 120 },
    { name: 'Bulgarian Split Squat', primaryMuscles: '["legs"]', secondaryMuscles: '["core"]', equipment: 'dumbbell', instructions: 'Place one foot behind you on a bench. Lower into a squat, then push back up.', targetSets: 3, targetReps: 10, recommendedRest: 90 },
    { name: 'Front Squat', primaryMuscles: '["legs"]', secondaryMuscles: '["core"]', equipment: 'barbell', instructions: 'Hold barbell in front rack position. Squat down until thighs are parallel, then stand.', targetSets: 4, targetReps: 8, recommendedRest: 180 },
    { name: 'Hack Squat', primaryMuscles: '["legs"]', secondaryMuscles: '[]', equipment: 'machine', instructions: 'Position yourself in the hack squat machine. Lower your body, then press back up.', targetSets: 4, targetReps: 10, recommendedRest: 120 },
    { name: 'Goblet Squat', primaryMuscles: '["legs"]', secondaryMuscles: '["core"]', equipment: 'dumbbell', instructions: 'Hold a dumbbell at chest level. Squat down until thighs are parallel, then stand.', targetSets: 3, targetReps: 10, recommendedRest: 90 },
    { name: 'Walking Lunges', primaryMuscles: '["legs"]', secondaryMuscles: '["core"]', equipment: 'dumbbell', instructions: 'Hold dumbbells at sides. Step forward into a lunge, then push off the front foot to step into the next lunge.', targetSets: 3, targetReps: 12, recommendedRest: 60 },
    { name: 'Seated Calf Raise', primaryMuscles: '["legs"]', secondaryMuscles: '[]', equipment: 'machine', instructions: 'Sit in the seated calf raise machine. Raise your heels up, then lower slowly.', targetSets: 4, targetReps: 15, recommendedRest: 45 },
    { name: 'Leg Press (Narrow)', primaryMuscles: '["legs"]', secondaryMuscles: '[]', equipment: 'machine', instructions: 'Place feet close together on the leg press platform. Lower and press back up.', targetSets: 3, targetReps: 12, recommendedRest: 90 },

    // Arms — Accessory + Isolation
    { name: 'Barbell Curl', primaryMuscles: '["arms"]', secondaryMuscles: '[]', equipment: 'barbell', instructions: 'Stand holding barbell with underhand grip. Curl the bar up to your shoulders, then lower.', targetSets: 3, targetReps: 10, recommendedRest: 90 },
    { name: 'Hammer Curl', primaryMuscles: '["arms"]', secondaryMuscles: '[]', equipment: 'dumbbell', instructions: 'Stand holding dumbbells with neutral grip. Curl up while keeping palms facing each other.', targetSets: 3, targetReps: 10, recommendedRest: 90 },
    { name: 'Tricep Pushdown', primaryMuscles: '["arms"]', secondaryMuscles: '[]', equipment: 'cable', instructions: 'Stand at a cable machine with high pulley. Push the bar or rope down until arms are extended.', targetSets: 3, targetReps: 12, recommendedRest: 60 },
    { name: 'Skull Crusher', primaryMuscles: '["arms"]', secondaryMuscles: '[]', equipment: 'barbell', instructions: 'Lie on a bench holding a barbell above your chest. Bend elbows to lower the bar to your forehead, then extend.', targetSets: 3, targetReps: 10, recommendedRest: 90 },
    { name: 'Preacher Curl', primaryMuscles: '["arms"]', secondaryMuscles: '[]', equipment: 'barbell', instructions: 'Sit at a preacher bench with arms extended. Curl the weight up, then lower with control.', targetSets: 3, targetReps: 10, recommendedRest: 90 },
    { name: 'Dumbbell Curl', primaryMuscles: '["arms"]', secondaryMuscles: '[]', equipment: 'dumbbell', instructions: 'Stand holding dumbbells at sides. Curl one or both dumbbells up to shoulders, then lower.', targetSets: 3, targetReps: 10, recommendedRest: 90 },
    { name: 'Concentration Curl', primaryMuscles: '["arms"]', secondaryMuscles: '[]', equipment: 'dumbbell', instructions: 'Sit with elbow braced against inner thigh. Curl the dumbbell up, then lower.', targetSets: 3, targetReps: 10, recommendedRest: 60 },
    { name: 'Tricep Dip', primaryMuscles: '["arms"]', secondaryMuscles: '["chest"]', equipment: 'bodyweight', instructions: 'Keep torso upright on parallel bars. Lower your body by bending arms, then push back up.', targetSets: 3, targetReps: 10, recommendedRest: 90 },
    { name: 'Overhead Tricep Extension', primaryMuscles: '["arms"]', secondaryMuscles: '[]', equipment: 'dumbbell', instructions: 'Hold a dumbbell overhead with both hands. Lower behind your head by bending elbows, then extend.', targetSets: 3, targetReps: 12, recommendedRest: 60 },
    { name: 'Cable Kickback', primaryMuscles: '["arms"]', secondaryMuscles: '[]', equipment: 'cable', instructions: 'Use a low cable with a single handle. Extend your arm back until straight, then return.', targetSets: 3, targetReps: 12, recommendedRest: 60 },
    { name: 'Close-Grip Bench Press', primaryMuscles: '["arms"]', secondaryMuscles: '["chest"]', equipment: 'barbell', instructions: 'Lie on a bench with narrow grip on the barbell. Lower to chest, then press back up, focusing on triceps.', targetSets: 3, targetReps: 10, recommendedRest: 90 },
    { name: 'Reverse Curl', primaryMuscles: '["arms"]', secondaryMuscles: '[]', equipment: 'barbell', instructions: 'Stand holding barbell with overhand grip. Curl the bar up, then lower with control.', targetSets: 3, targetReps: 10, recommendedRest: 90 },
    { name: 'Incline Dumbbell Curl', primaryMuscles: '["arms"]', secondaryMuscles: '[]', equipment: 'dumbbell', instructions: 'Sit on an incline bench with dumbbells hanging at arms length. Curl up, then lower.', targetSets: 3, targetReps: 10, recommendedRest: 90 },
    { name: 'Spider Curl', primaryMuscles: '["arms"]', secondaryMuscles: '[]', equipment: 'dumbbell', instructions: 'Lie face down on an incline bench with arms hanging. Curl the dumbbells up, then lower.', targetSets: 3, targetReps: 10, recommendedRest: 90 },

    // Core — Bodyweight
    { name: 'Plank', primaryMuscles: '["core"]', secondaryMuscles: '["shoulders"]', equipment: 'bodyweight', instructions: 'Hold a push-up position with your body in a straight line from head to heels. Maintain the position.', targetSets: 3, targetReps: 30, recommendedRest: 45 },
    { name: 'Crunches', primaryMuscles: '["core"]', secondaryMuscles: '[]', equipment: 'bodyweight', instructions: 'Lie on your back with knees bent. Curl your shoulders off the floor, then lower.', targetSets: 3, targetReps: 15, recommendedRest: 45 },
    { name: 'Russian Twist', primaryMuscles: '["core"]', secondaryMuscles: '[]', equipment: 'bodyweight', instructions: 'Sit with knees bent, lean back slightly. Twist your torso side to side.', targetSets: 3, targetReps: 15, recommendedRest: 45 },
    { name: 'Leg Raise', primaryMuscles: '["core"]', secondaryMuscles: '[]', equipment: 'bodyweight', instructions: 'Lie on your back with legs straight. Raise your legs to 90 degrees, then lower with control.', targetSets: 3, targetReps: 12, recommendedRest: 45 },
    { name: 'Mountain Climbers', primaryMuscles: '["core"]', secondaryMuscles: '["legs"]', equipment: 'bodyweight', instructions: 'Start in a plank position. Alternately drive your knees toward your chest in a running motion.', targetSets: 3, targetReps: 20, recommendedRest: 45 },
    { name: 'Bicycle Crunch', primaryMuscles: '["core"]', secondaryMuscles: '[]', equipment: 'bodyweight', instructions: 'Lie on your back and bring alternating elbow to opposite knee in a cycling motion.', targetSets: 3, targetReps: 15, recommendedRest: 45 },
    { name: 'Hanging Leg Raise', primaryMuscles: '["core"]', secondaryMuscles: '[]', equipment: 'bodyweight', instructions: 'Hang from a bar with straight arms. Raise your legs to parallel or above, then lower.', targetSets: 3, targetReps: 10, recommendedRest: 60 },
    { name: 'Ab Wheel Rollout', primaryMuscles: '["core"]', secondaryMuscles: '["shoulders"]', equipment: 'other', instructions: 'Kneel holding the ab wheel. Roll forward extending your body, then pull back to the starting position.', targetSets: 3, targetReps: 8, recommendedRest: 60 },
    { name: 'Cable Woodchop', primaryMuscles: '["core"]', secondaryMuscles: '[]', equipment: 'cable', instructions: 'Stand sideways to a cable machine. Pull the cable across your body in a chopping motion.', targetSets: 3, targetReps: 12, recommendedRest: 60 },
    { name: 'Dead Bug', primaryMuscles: '["core"]', secondaryMuscles: '[]', equipment: 'bodyweight', instructions: 'Lie on your back with arms and legs extended. Lower opposite arm and leg simultaneously, then return.', targetSets: 3, targetReps: 10, recommendedRest: 45 },
    { name: 'Pallof Press', primaryMuscles: '["core"]', secondaryMuscles: '[]', equipment: 'cable', instructions: 'Stand sideways to a cable machine at chest height. Press the handle away from your chest, resisting rotation.', targetSets: 3, targetReps: 10, recommendedRest: 60 },
    { name: 'Side Plank', primaryMuscles: '["core"]', secondaryMuscles: '["shoulders"]', equipment: 'bodyweight', instructions: 'Lie on your side propped up on your elbow. Hold your body in a straight line.', targetSets: 3, targetReps: 20, recommendedRest: 45 },

    // Full Body — Compound + Bodyweight
    { name: 'Clean and Press', primaryMuscles: '["full body"]', secondaryMuscles: '["legs","shoulders","back"]', equipment: 'barbell', instructions: 'Start with barbell on the floor. Clean the bar to your shoulders, then press overhead.', targetSets: 5, targetReps: 3, recommendedRest: 240 },
    { name: 'Thruster', primaryMuscles: '["full body"]', secondaryMuscles: '["legs","shoulders"]', equipment: 'barbell', instructions: 'Perform a front squat, then press the bar overhead as you stand up.', targetSets: 4, targetReps: 8, recommendedRest: 120 },
    { name: 'Burpees', primaryMuscles: '["full body"]', secondaryMuscles: '["chest","legs"]', equipment: 'bodyweight', instructions: 'From standing, squat down, kick feet back to plank, do a push-up, jump feet forward, then jump up.', targetSets: 3, targetReps: 10, recommendedRest: 60 },
    { name: 'Kettlebell Swing', primaryMuscles: '["full body"]', secondaryMuscles: '["legs","back"]', equipment: 'kettlebell', instructions: 'Hold a kettlebell with both hands. Hinge at hips and swing the kettlebell to shoulder height.', targetSets: 3, targetReps: 15, recommendedRest: 60 },
    { name: 'Turkish Get-up', primaryMuscles: '["full body"]', secondaryMuscles: '["shoulders","core"]', equipment: 'kettlebell', instructions: 'Lie on the floor holding a kettlebell overhead. Stand up while keeping the weight locked out overhead.', targetSets: 3, targetReps: 3, recommendedRest: 90 },
    { name: 'Man Maker', primaryMuscles: '["full body"]', secondaryMuscles: '["chest","back","legs"]', equipment: 'dumbbell', instructions: 'Start in plank with dumbbells. Row each arm, do a push-up, jump feet in, then do a thruster.', targetSets: 3, targetReps: 6, recommendedRest: 90 },
    { name: 'Bear Crawl', primaryMuscles: '["full body"]', secondaryMuscles: '["core","shoulders"]', equipment: 'bodyweight', instructions: 'Walk on hands and feet with knees close to the ground, moving opposite limbs together.', targetSets: 3, targetReps: 15, recommendedRest: 45 },
    { name: 'Battle Ropes', primaryMuscles: '["full body"]', secondaryMuscles: '["arms","core"]', equipment: 'other', instructions: 'Hold the ends of battle ropes. Create waves by alternating arm movements up and down.', targetSets: 3, targetReps: 15, recommendedRest: 45 },
    { name: 'Box Jump', primaryMuscles: '["full body"]', secondaryMuscles: '["legs"]', equipment: 'other', instructions: 'Stand facing a box. Jump up onto the box, landing softly, then step down.', targetSets: 3, targetReps: 8, recommendedRest: 60 },
    { name: 'Farmer Walk', primaryMuscles: '["full body"]', secondaryMuscles: '["core","arms"]', equipment: 'dumbbell', instructions: 'Hold heavy dumbbells at your sides. Walk for distance or time while maintaining upright posture.', targetSets: 3, targetReps: 20, recommendedRest: 60 },
  ];

  const exercises = await Promise.all(
    exercisesData.map((e) =>
      prisma.exercise.create({
        data: {
          name: e.name,
          primaryMuscles: e.primaryMuscles,
          secondaryMuscles: e.secondaryMuscles,
          equipment: e.equipment,
          instructions: e.instructions,
          targetSets: e.targetSets,
          targetReps: e.targetReps,
          recommendedRest: e.recommendedRest,
          isCustom: false,
        },
      })
    )
  );
  console.log(`Created ${exercises.length} exercises`);

  // Helper: find exercise by name
  const findExercise = (name: string) => exercises.find((e) => e.name === name)!;

  // ========== WORKOUT PLANS ==========
  // StrongLifts 5x5
  const stronglifts = await prisma.workoutPlan.create({
    data: {
      name: 'StrongLifts 5x5',
      description: 'Classic strength program. Alternate between Workout A and Workout B, 3 days per week.',
      isBuiltIn: true,
      days: {
        create: [
          {
            dayOfWeek: 1,
            name: 'Workout A',
            exercises: {
              create: [
                { exerciseId: findExercise('Squat').id, targetSets: 5, targetReps: 5, order: 0 },
                { exerciseId: findExercise('Bench Press').id, targetSets: 5, targetReps: 5, order: 1 },
                { exerciseId: findExercise('Barbell Row').id, targetSets: 5, targetReps: 5, order: 2 },
              ],
            },
          },
          {
            dayOfWeek: 3,
            name: 'Workout B',
            exercises: {
              create: [
                { exerciseId: findExercise('Squat').id, targetSets: 5, targetReps: 5, order: 0 },
                { exerciseId: findExercise('Overhead Press').id, targetSets: 5, targetReps: 5, order: 1 },
                { exerciseId: findExercise('Deadlift').id, targetSets: 1, targetReps: 5, order: 2 },
              ],
            },
          },
          {
            dayOfWeek: 5,
            name: 'Workout A',
            exercises: {
              create: [
                { exerciseId: findExercise('Squat').id, targetSets: 5, targetReps: 5, order: 0 },
                { exerciseId: findExercise('Bench Press').id, targetSets: 5, targetReps: 5, order: 1 },
                { exerciseId: findExercise('Barbell Row').id, targetSets: 5, targetReps: 5, order: 2 },
              ],
            },
          },
        ],
      },
    },
  });
  console.log('Created StrongLifts 5x5 plan');

  // Push-Pull-Legs
  const ppl = await prisma.workoutPlan.create({
    data: {
      name: 'Push-Pull-Legs',
      description: '6-day PPL split. Push (chest/shoulders/triceps), Pull (back/biceps), Legs.',
      isBuiltIn: true,
      days: {
        create: [
          {
            dayOfWeek: 1,
            name: 'Push',
            exercises: {
              create: [
                { exerciseId: findExercise('Bench Press').id, targetSets: 4, targetReps: 8, order: 0 },
                { exerciseId: findExercise('Overhead Press').id, targetSets: 3, targetReps: 10, order: 1 },
                { exerciseId: findExercise('Incline Dumbbell Press').id, targetSets: 3, targetReps: 10, order: 2 },
                { exerciseId: 'Lateral Raise'.length ? findExercise('Lateral Raise').id : '', targetSets: 3, targetReps: 12, order: 3 },
                { exerciseId: findExercise('Tricep Pushdown').id, targetSets: 3, targetReps: 12, order: 4 },
                { exerciseId: findExercise('Skull Crusher').id, targetSets: 3, targetReps: 10, order: 5 },
              ],
            },
          },
          {
            dayOfWeek: 2,
            name: 'Pull',
            exercises: {
              create: [
                { exerciseId: findExercise('Deadlift').id, targetSets: 3, targetReps: 5, order: 0 },
                { exerciseId: findExercise('Barbell Row').id, targetSets: 4, targetReps: 8, order: 1 },
                { exerciseId: findExercise('Lat Pulldown').id, targetSets: 3, targetReps: 10, order: 2 },
                { exerciseId: findExercise('Face Pull').id, targetSets: 3, targetReps: 15, order: 3 },
                { exerciseId: findExercise('Barbell Curl').id, targetSets: 3, targetReps: 10, order: 4 },
                { exerciseId: findExercise('Hammer Curl').id, targetSets: 3, targetReps: 10, order: 5 },
              ],
            },
          },
          {
            dayOfWeek: 3,
            name: 'Legs',
            exercises: {
              create: [
                { exerciseId: findExercise('Squat').id, targetSets: 4, targetReps: 8, order: 0 },
                { exerciseId: findExercise('Romanian Deadlift').id, targetSets: 3, targetReps: 10, order: 1 },
                { exerciseId: findExercise('Leg Press').id, targetSets: 3, targetReps: 10, order: 2 },
                { exerciseId: findExercise('Leg Curl').id, targetSets: 3, targetReps: 12, order: 3 },
                { exerciseId: findExercise('Leg Extension').id, targetSets: 3, targetReps: 12, order: 4 },
                { exerciseId: findExercise('Calf Raise').id, targetSets: 4, targetReps: 15, order: 5 },
              ],
            },
          },
          {
            dayOfWeek: 4,
            name: 'Push',
            exercises: {
              create: [
                { exerciseId: findExercise('Incline Bench Press').id, targetSets: 4, targetReps: 8, order: 0 },
                { exerciseId: findExercise('Dumbbell Shoulder Press').id, targetSets: 3, targetReps: 10, order: 1 },
                { exerciseId: findExercise('Cable Crossover').id, targetSets: 3, targetReps: 12, order: 2 },
                { exerciseId: findExercise('Lateral Raise').id, targetSets: 3, targetReps: 12, order: 3 },
                { exerciseId: findExercise('Overhead Tricep Extension').id, targetSets: 3, targetReps: 12, order: 4 },
                { exerciseId: findExercise('Close-Grip Bench Press').id, targetSets: 3, targetReps: 10, order: 5 },
              ],
            },
          },
          {
            dayOfWeek: 5,
            name: 'Pull',
            exercises: {
              create: [
                { exerciseId: findExercise('Pull-ups').id, targetSets: 4, targetReps: 8, order: 0 },
                { exerciseId: findExercise('Seated Row').id, targetSets: 3, targetReps: 10, order: 1 },
                { exerciseId: findExercise('Dumbbell Row').id, targetSets: 3, targetReps: 10, order: 2 },
                { exerciseId: findExercise('Reverse Fly').id, targetSets: 3, targetReps: 12, order: 3 },
                { exerciseId: findExercise('Preacher Curl').id, targetSets: 3, targetReps: 10, order: 4 },
                { exerciseId: findExercise('Concentration Curl').id, targetSets: 3, targetReps: 10, order: 5 },
              ],
            },
          },
          {
            dayOfWeek: 6,
            name: 'Legs',
            exercises: {
              create: [
                { exerciseId: findExercise('Front Squat').id, targetSets: 4, targetReps: 8, order: 0 },
                { exerciseId: findExercise('Bulgarian Split Squat').id, targetSets: 3, targetReps: 10, order: 1 },
                { exerciseId: findExercise('Leg Press').id, targetSets: 3, targetReps: 10, order: 2 },
                { exerciseId: findExercise('Leg Curl').id, targetSets: 3, targetReps: 12, order: 3 },
                { exerciseId: findExercise('Walking Lunges').id, targetSets: 3, targetReps: 10, order: 4 },
                { exerciseId: findExercise('Calf Raise').id, targetSets: 4, targetReps: 15, order: 5 },
              ],
            },
          },
        ],
      },
    },
  });
  console.log('Created Push-Pull-Legs plan');

  // Full Body 3x/week
  const fullBody = await prisma.workoutPlan.create({
    data: {
      name: 'Full Body 3x/week',
      description: 'A balanced full body program performed 3 days per week. Great for beginners.',
      isBuiltIn: true,
      days: {
        create: [
          {
            dayOfWeek: 1,
            name: 'Day A',
            exercises: {
              create: [
                { exerciseId: findExercise('Squat').id, targetSets: 3, targetReps: 8, order: 0 },
                { exerciseId: findExercise('Bench Press').id, targetSets: 3, targetReps: 8, order: 1 },
                { exerciseId: findExercise('Barbell Row').id, targetSets: 3, targetReps: 8, order: 2 },
                { exerciseId: findExercise('Lateral Raise').id, targetSets: 2, targetReps: 12, order: 3 },
                { exerciseId: findExercise('Plank').id, targetSets: 3, targetReps: 30, order: 4 },
              ],
            },
          },
          {
            dayOfWeek: 3,
            name: 'Day B',
            exercises: {
              create: [
                { exerciseId: findExercise('Deadlift').id, targetSets: 3, targetReps: 5, order: 0 },
                { exerciseId: findExercise('Overhead Press').id, targetSets: 3, targetReps: 8, order: 1 },
                { exerciseId: findExercise('Lat Pulldown').id, targetSets: 3, targetReps: 10, order: 2 },
                { exerciseId: findExercise('Leg Curl').id, targetSets: 2, targetReps: 12, order: 3 },
                { exerciseId: findExercise('Barbell Curl').id, targetSets: 2, targetReps: 10, order: 4 },
              ],
            },
          },
          {
            dayOfWeek: 5,
            name: 'Day C',
            exercises: {
              create: [
                { exerciseId: findExercise('Leg Press').id, targetSets: 3, targetReps: 10, order: 0 },
                { exerciseId: findExercise('Incline Bench Press').id, targetSets: 3, targetReps: 8, order: 1 },
                { exerciseId: findExercise('Seated Row').id, targetSets: 3, targetReps: 10, order: 2 },
                { exerciseId: findExercise('Tricep Pushdown').id, targetSets: 2, targetReps: 12, order: 3 },
                { exerciseId: findExercise('Russian Twist').id, targetSets: 3, targetReps: 15, order: 4 },
              ],
            },
          },
        ],
      },
    },
  });
  console.log('Created Full Body 3x/week plan');

  // ========== SAMPLE WORKOUTS ==========
  const now = new Date();

  // Helper to create date N days ago
  const daysAgo = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return d;
  };

  const workoutData = [
    {
      name: 'Push Day',
      date: daysAgo(1),
      durationMinutes: 65,
      notes: 'Great session, hit a new PR on bench!',
      exercises: [
        {
          exerciseId: findExercise('Bench Press').id,
          sets: [
            { reps: 10, weight: 60, completed: true, order: 0 },
            { reps: 8, weight: 70, completed: true, order: 1 },
            { reps: 6, weight: 80, completed: true, order: 2 },
            { reps: 4, weight: 90, completed: true, order: 3 },
          ],
        },
        {
          exerciseId: findExercise('Overhead Press').id,
          sets: [
            { reps: 10, weight: 40, completed: true, order: 0 },
            { reps: 8, weight: 45, completed: true, order: 1 },
            { reps: 6, weight: 50, completed: true, order: 2 },
          ],
        },
        {
          exerciseId: findExercise('Lateral Raise').id,
          sets: [
            { reps: 12, weight: 10, completed: true, order: 0 },
            { reps: 12, weight: 10, completed: true, order: 1 },
            { reps: 12, weight: 10, completed: true, order: 2 },
          ],
        },
        {
          exerciseId: findExercise('Tricep Pushdown').id,
          sets: [
            { reps: 12, weight: 25, completed: true, order: 0 },
            { reps: 12, weight: 25, completed: true, order: 1 },
            { reps: 10, weight: 30, completed: true, order: 2 },
          ],
        },
      ],
    },
    {
      name: 'Pull Day',
      date: daysAgo(2),
      durationMinutes: 55,
      notes: 'Deadlift felt heavy but good form.',
      exercises: [
        {
          exerciseId: findExercise('Deadlift').id,
          sets: [
            { reps: 5, weight: 100, completed: true, order: 0 },
            { reps: 5, weight: 120, completed: true, order: 1 },
            { reps: 3, weight: 140, completed: true, order: 2 },
          ],
        },
        {
          exerciseId: findExercise('Barbell Row').id,
          sets: [
            { reps: 10, weight: 60, completed: true, order: 0 },
            { reps: 8, weight: 65, completed: true, order: 1 },
            { reps: 8, weight: 65, completed: true, order: 2 },
          ],
        },
        {
          exerciseId: findExercise('Lat Pulldown').id,
          sets: [
            { reps: 10, weight: 50, completed: true, order: 0 },
            { reps: 10, weight: 50, completed: true, order: 1 },
            { reps: 10, weight: 55, completed: true, order: 2 },
          ],
        },
        {
          exerciseId: findExercise('Barbell Curl').id,
          sets: [
            { reps: 10, weight: 30, completed: true, order: 0 },
            { reps: 10, weight: 30, completed: true, order: 1 },
            { reps: 8, weight: 35, completed: true, order: 2 },
          ],
        },
      ],
    },
    {
      name: 'Leg Day',
      date: daysAgo(4),
      durationMinutes: 70,
      notes: 'Squats were tough. Need to work on depth.',
      exercises: [
        {
          exerciseId: findExercise('Squat').id,
          sets: [
            { reps: 10, weight: 80, completed: true, order: 0 },
            { reps: 8, weight: 90, completed: true, order: 1 },
            { reps: 6, weight: 100, completed: true, order: 2 },
            { reps: 6, weight: 100, completed: true, order: 3 },
          ],
        },
        {
          exerciseId: findExercise('Romanian Deadlift').id,
          sets: [
            { reps: 10, weight: 70, completed: true, order: 0 },
            { reps: 10, weight: 70, completed: true, order: 1 },
            { reps: 10, weight: 75, completed: true, order: 2 },
          ],
        },
        {
          exerciseId: findExercise('Leg Press').id,
          sets: [
            { reps: 12, weight: 150, completed: true, order: 0 },
            { reps: 12, weight: 150, completed: true, order: 1 },
            { reps: 10, weight: 160, completed: true, order: 2 },
          ],
        },
        {
          exerciseId: findExercise('Calf Raise').id,
          sets: [
            { reps: 15, weight: 80, completed: true, order: 0 },
            { reps: 15, weight: 80, completed: true, order: 1 },
            { reps: 15, weight: 80, completed: true, order: 2 },
          ],
        },
      ],
    },
    {
      name: 'Upper Body',
      date: daysAgo(7),
      durationMinutes: 60,
      notes: 'Solid workout overall.',
      exercises: [
        {
          exerciseId: findExercise('Bench Press').id,
          sets: [
            { reps: 10, weight: 60, completed: true, order: 0 },
            { reps: 8, weight: 70, completed: true, order: 1 },
            { reps: 8, weight: 70, completed: true, order: 2 },
          ],
        },
        {
          exerciseId: findExercise('Barbell Row').id,
          sets: [
            { reps: 10, weight: 55, completed: true, order: 0 },
            { reps: 8, weight: 60, completed: true, order: 1 },
            { reps: 8, weight: 60, completed: true, order: 2 },
          ],
        },
        {
          exerciseId: findExercise('Overhead Press').id,
          sets: [
            { reps: 10, weight: 40, completed: true, order: 0 },
            { reps: 8, weight: 45, completed: true, order: 1 },
            { reps: 6, weight: 50, completed: true, order: 2 },
          ],
        },
        {
          exerciseId: findExercise('Barbell Curl').id,
          sets: [
            { reps: 10, weight: 30, completed: true, order: 0 },
            { reps: 10, weight: 30, completed: true, order: 1 },
            { reps: 8, weight: 35, completed: true, order: 2 },
          ],
        },
        {
          exerciseId: findExercise('Skull Crusher').id,
          sets: [
            { reps: 10, weight: 25, completed: true, order: 0 },
            { reps: 10, weight: 25, completed: true, order: 1 },
            { reps: 8, weight: 30, completed: true, order: 2 },
          ],
        },
      ],
    },
    {
      name: 'Full Body HIIT',
      date: daysAgo(10),
      durationMinutes: 45,
      notes: 'Cardio-focused session. Heart rate was through the roof!',
      exercises: [
        {
          exerciseId: findExercise('Burpees').id,
          sets: [
            { reps: 10, weight: 0, completed: true, order: 0 },
            { reps: 10, weight: 0, completed: true, order: 1 },
            { reps: 10, weight: 0, completed: true, order: 2 },
          ],
        },
        {
          exerciseId: findExercise('Mountain Climbers').id,
          sets: [
            { reps: 20, weight: 0, completed: true, order: 0 },
            { reps: 20, weight: 0, completed: true, order: 1 },
            { reps: 20, weight: 0, completed: true, order: 2 },
          ],
        },
        {
          exerciseId: findExercise('Kettlebell Swing').id,
          sets: [
            { reps: 15, weight: 16, completed: true, order: 0 },
            { reps: 15, weight: 16, completed: true, order: 1 },
            { reps: 15, weight: 16, completed: true, order: 2 },
          ],
        },
        {
          exerciseId: findExercise('Plank').id,
          sets: [
            { reps: 45, weight: 0, completed: true, order: 0 },
            { reps: 45, weight: 0, completed: true, order: 1 },
            { reps: 30, weight: 0, completed: true, order: 2 },
          ],
        },
      ],
    },
    {
      name: 'Push Day',
      date: daysAgo(14),
      durationMinutes: 55,
      exercises: [
        {
          exerciseId: findExercise('Bench Press').id,
          sets: [
            { reps: 10, weight: 55, completed: true, order: 0 },
            { reps: 8, weight: 65, completed: true, order: 1 },
            { reps: 6, weight: 75, completed: true, order: 2 },
          ],
        },
        {
          exerciseId: findExercise('Dumbbell Shoulder Press').id,
          sets: [
            { reps: 10, weight: 16, completed: true, order: 0 },
            { reps: 10, weight: 18, completed: true, order: 1 },
            { reps: 8, weight: 20, completed: true, order: 2 },
          ],
        },
        {
          exerciseId: findExercise('Lateral Raise').id,
          sets: [
            { reps: 12, weight: 8, completed: true, order: 0 },
            { reps: 12, weight: 8, completed: true, order: 1 },
            { reps: 12, weight: 10, completed: true, order: 2 },
          ],
        },
      ],
    },
    {
      name: 'Pull Day',
      date: daysAgo(17),
      durationMinutes: 50,
      exercises: [
        {
          exerciseId: findExercise('Deadlift').id,
          sets: [
            { reps: 5, weight: 90, completed: true, order: 0 },
            { reps: 5, weight: 110, completed: true, order: 1 },
            { reps: 3, weight: 130, completed: true, order: 2 },
          ],
        },
        {
          exerciseId: findExercise('Pull-ups').id,
          sets: [
            { reps: 8, weight: 0, completed: true, order: 0 },
            { reps: 6, weight: 0, completed: true, order: 1 },
            { reps: 5, weight: 0, completed: true, order: 2 },
          ],
        },
        {
          exerciseId: findExercise('Seated Row').id,
          sets: [
            { reps: 10, weight: 50, completed: true, order: 0 },
            { reps: 10, weight: 55, completed: true, order: 1 },
            { reps: 10, weight: 55, completed: true, order: 2 },
          ],
        },
      ],
    },
    {
      name: 'Leg Day',
      date: daysAgo(21),
      durationMinutes: 65,
      notes: 'Added front squats to the routine.',
      exercises: [
        {
          exerciseId: findExercise('Squat').id,
          sets: [
            { reps: 10, weight: 70, completed: true, order: 0 },
            { reps: 8, weight: 80, completed: true, order: 1 },
            { reps: 8, weight: 80, completed: true, order: 2 },
          ],
        },
        {
          exerciseId: findExercise('Front Squat').id,
          sets: [
            { reps: 8, weight: 50, completed: true, order: 0 },
            { reps: 8, weight: 55, completed: true, order: 1 },
            { reps: 6, weight: 60, completed: true, order: 2 },
          ],
        },
        {
          exerciseId: findExercise('Leg Curl').id,
          sets: [
            { reps: 12, weight: 40, completed: true, order: 0 },
            { reps: 12, weight: 40, completed: true, order: 1 },
            { reps: 10, weight: 45, completed: true, order: 2 },
          ],
        },
      ],
    },
    {
      name: 'Arm Day',
      date: daysAgo(25),
      durationMinutes: 40,
      notes: 'Great pump!',
      exercises: [
        {
          exerciseId: findExercise('Barbell Curl').id,
          sets: [
            { reps: 10, weight: 30, completed: true, order: 0 },
            { reps: 10, weight: 30, completed: true, order: 1 },
            { reps: 8, weight: 35, completed: true, order: 2 },
          ],
        },
        {
          exerciseId: findExercise('Hammer Curl').id,
          sets: [
            { reps: 10, weight: 14, completed: true, order: 0 },
            { reps: 10, weight: 14, completed: true, order: 1 },
            { reps: 10, weight: 16, completed: true, order: 2 },
          ],
        },
        {
          exerciseId: findExercise('Tricep Pushdown').id,
          sets: [
            { reps: 12, weight: 25, completed: true, order: 0 },
            { reps: 12, weight: 25, completed: true, order: 1 },
            { reps: 10, weight: 30, completed: true, order: 2 },
          ],
        },
        {
          exerciseId: findExercise('Skull Crusher').id,
          sets: [
            { reps: 10, weight: 25, completed: true, order: 0 },
            { reps: 10, weight: 25, completed: true, order: 1 },
            { reps: 8, weight: 30, completed: true, order: 2 },
          ],
        },
      ],
    },
    {
      name: 'Core & Cardio',
      date: daysAgo(28),
      durationMinutes: 35,
      exercises: [
        {
          exerciseId: findExercise('Plank').id,
          sets: [
            { reps: 60, weight: 0, completed: true, order: 0 },
            { reps: 45, weight: 0, completed: true, order: 1 },
            { reps: 30, weight: 0, completed: true, order: 2 },
          ],
        },
        {
          exerciseId: findExercise('Russian Twist').id,
          sets: [
            { reps: 20, weight: 10, completed: true, order: 0 },
            { reps: 20, weight: 10, completed: true, order: 1 },
            { reps: 20, weight: 10, completed: true, order: 2 },
          ],
        },
        {
          exerciseId: findExercise('Leg Raise').id,
          sets: [
            { reps: 15, weight: 0, completed: true, order: 0 },
            { reps: 15, weight: 0, completed: true, order: 1 },
            { reps: 12, weight: 0, completed: true, order: 2 },
          ],
        },
        {
          exerciseId: findExercise('Mountain Climbers').id,
          sets: [
            { reps: 20, weight: 0, completed: true, order: 0 },
            { reps: 20, weight: 0, completed: true, order: 1 },
            { reps: 20, weight: 0, completed: true, order: 2 },
          ],
        },
      ],
    },
  ];

  for (const w of workoutData) {
    await prisma.workout.create({
      data: {
        name: w.name,
        date: w.date,
        durationMinutes: w.durationMinutes,
        notes: w.notes,
        userId: demoUser.id,
        exercises: {
          create: w.exercises.map((ex, ei) => ({
            exerciseId: ex.exerciseId,
            order: ei,
            sets: {
              create: ex.sets.map((s) => ({
                reps: s.reps,
                weight: s.weight,
                completed: s.completed,
                order: s.order,
              })),
            },
          })),
        },
      },
    });
  }
  console.log(`Created ${workoutData.length} sample workouts`);

  // ========== BODY METRICS ==========
  const metricsData = [
    { daysAgo: 3, weight: 82.5, bodyFat: 18.2, waist: 86, chest: 102, arms: 36, thighs: 58 },
    { daysAgo: 10, weight: 82.8, bodyFat: 18.5, waist: 87, chest: 101, arms: 35.5, thighs: 57.5 },
    { daysAgo: 17, weight: 83.2, bodyFat: 18.8, waist: 88, chest: 100, arms: 35, thighs: 57 },
    { daysAgo: 24, weight: 83.5, bodyFat: 19.2, waist: 89, chest: 99, arms: 34.5, thighs: 56.5 },
    { daysAgo: 31, weight: 84.0, bodyFat: 19.5, waist: 90, chest: 98, arms: 34, thighs: 56 },
    { daysAgo: 38, weight: 84.5, bodyFat: 19.8, waist: 91, chest: 97, arms: 33.5, thighs: 55.5 },
    { daysAgo: 45, weight: 85.0, bodyFat: 20.2, waist: 92, chest: 96, arms: 33, thighs: 55 },
    { daysAgo: 52, weight: 85.5, bodyFat: 20.5, waist: 93, chest: 95, arms: 33, thighs: 54.5 },
  ];

  for (const m of metricsData) {
    await prisma.bodyMetric.create({
      data: {
        date: daysAgo(m.daysAgo),
        weight: m.weight,
        bodyFat: m.bodyFat,
        waist: m.waist,
        chest: m.chest,
        arms: m.arms,
        thighs: m.thighs,
        userId: demoUser.id,
      },
    });
  }
  console.log(`Created ${metricsData.length} body metric entries`);

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
