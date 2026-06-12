import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const where: Record<string, unknown> = {
      OR: [{ isBuiltIn: true }],
    };

    if (userId) {
      (where.OR as Record<string, unknown>[]).push({ userId });
    }

    const rawPlans = await db.workoutPlan.findMany({
      where,
      include: {
        days: {
          include: {
            exercises: {
              include: {
                exercise: true,
              },
              orderBy: { order: 'asc' },
            },
            completions: true,
          },
          orderBy: { dayOfWeek: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map to include exerciseName, recommendedRest, primaryMuscles, equipment on each plan exercise
    const plans = rawPlans.map((p) => ({
      ...p,
      days: p.days.map((d) => ({
        ...d,
        exercises: d.exercises.map((ex) => ({
          ...ex,
          exerciseName: ex.exercise?.name || ex.exerciseId,
          recommendedRest: ex.exercise?.recommendedRest || 90,
          primaryMuscles: ex.exercise?.primaryMuscles ? JSON.parse(ex.exercise.primaryMuscles) : [],
          equipment: ex.exercise?.equipment || undefined,
        })),
      })),
    }));

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Get plans error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, description, isBuiltIn, days } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    const plan = await db.workoutPlan.create({
      data: {
        name,
        description: description || null,
        isBuiltIn: isBuiltIn || false,
        userId: userId || null,
        days: {
          create: (days || []).map(
            (day: { dayOfWeek: number; name: string; exercises: { exerciseId: string; targetSets: number; targetReps: number }[] }) => ({
              dayOfWeek: day.dayOfWeek || 0,
              name: day.name,
              exercises: {
                create: (day.exercises || []).map(
                  (ex: { exerciseId: string; targetSets: number; targetReps: number }, index: number) => ({
                    exerciseId: ex.exerciseId,
                    targetSets: ex.targetSets || 3,
                    targetReps: ex.targetReps || 10,
                    order: index,
                  })
                ),
              },
            })
          ),
        },
      },
      include: {
        days: {
          include: {
            exercises: {
              include: {
                exercise: true,
              },
              orderBy: { order: 'asc' },
            },
            completions: true,
          },
          orderBy: { dayOfWeek: 'asc' },
        },
      },
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error('Create plan error:', error);
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

    const plan = await db.workoutPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    if (plan.isBuiltIn) {
      return NextResponse.json(
        { error: 'Cannot delete built-in plans' },
        { status: 403 }
      );
    }

    await db.workoutPlan.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete plan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
