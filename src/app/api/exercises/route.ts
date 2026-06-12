import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const muscle = searchParams.get('muscle');
    const equipment = searchParams.get('equipment');

    const where: Record<string, unknown> = {};

    if (q) {
      where.name = { contains: q };
    }

    if (muscle) {
      where.primaryMuscles = { contains: muscle };
    }

    if (equipment) {
      where.equipment = equipment;
    }

    const rawExercises = await db.exercise.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    // Parse JSON string fields to arrays
    const exercises = rawExercises.map((e) => ({
      ...e,
      primaryMuscles: e.primaryMuscles ? JSON.parse(e.primaryMuscles) : [],
      secondaryMuscles: e.secondaryMuscles ? JSON.parse(e.secondaryMuscles) : [],
    }));

    return NextResponse.json({ exercises });
  } catch (error) {
    console.error('Get exercises error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, primaryMuscles, secondaryMuscles, equipment, instructions, targetSets, targetReps, recommendedRest, createdById } = body;

    if (!name || !primaryMuscles || !equipment) {
      return NextResponse.json(
        { error: 'Name, primaryMuscles, and equipment are required' },
        { status: 400 }
      );
    }

    const exercise = await db.exercise.create({
      data: {
        name,
        primaryMuscles: JSON.stringify(primaryMuscles),
        secondaryMuscles: JSON.stringify(secondaryMuscles || []),
        equipment,
        instructions: instructions || null,
        targetSets: targetSets || 3,
        targetReps: targetReps || 10,
        recommendedRest: recommendedRest || 90,
        isCustom: true,
        createdById: createdById || null,
      },
    });

    return NextResponse.json({ exercise }, { status: 201 });
  } catch (error) {
    console.error('Create exercise error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
