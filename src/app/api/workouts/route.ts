import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const rawWorkouts = await db.workout.findMany({
      where: { userId },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Map to include exerciseName and primaryMuscles on each exercise
    const workouts = rawWorkouts.map((w) => ({
      ...w,
      date: w.date.toISOString().split('T')[0],
      exercises: w.exercises.map((ex) => ({
        ...ex,
        exerciseName: ex.exercise?.name || 'Unknown Exercise',
        primaryMuscles: ex.exercise?.primaryMuscles
          ? JSON.parse(ex.exercise.primaryMuscles)
          : [],
        sets: ex.sets.map((s) => ({
          reps: s.reps,
          weight: s.weight,
          completed: s.completed,
        })),
      })),
    }));

    return NextResponse.json({ workouts });
  } catch (error) {
    console.error('Get workouts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, date, notes, durationMinutes, exercises } = body;

    if (!userId || !name || !date) {
      return NextResponse.json(
        { error: 'userId, name, and date are required' },
        { status: 400 }
      );
    }

    const workout = await db.workout.create({
      data: {
        userId,
        name,
        date: new Date(date),
        notes: notes || null,
        durationMinutes: durationMinutes || null,
        exercises: {
          create: (exercises || []).map(
            (ex: { exerciseId: string; notes?: string; sets: { reps: number; weight: number; completed: boolean }[] }, index: number) => ({
              exerciseId: ex.exerciseId,
              notes: ex.notes || null,
              order: index,
              sets: {
                create: (ex.sets || []).map(
                  (set: { reps: number; weight: number; completed: boolean }, setIndex: number) => ({
                    reps: set.reps,
                    weight: set.weight || 0,
                    completed: set.completed || false,
                    order: setIndex,
                  })
                ),
              },
            })
          ),
        },
      },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json({ workout }, { status: 201 });
  } catch (error) {
    console.error('Create workout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const workout = await db.workout.findUnique({
      where: { id },
    });

    if (!workout) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      );
    }

    await db.workout.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete workout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
