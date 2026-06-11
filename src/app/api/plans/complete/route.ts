import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planDayId, userId, date } = body;

    if (!planDayId || !userId || !date) {
      return NextResponse.json(
        { error: 'planDayId, userId, and date are required' },
        { status: 400 }
      );
    }

    // Check if already completed for this date
    const existing = await db.planDayCompletion.findFirst({
      where: {
        planDayId,
        userId,
        date: new Date(date),
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Plan day already completed for this date' },
        { status: 409 }
      );
    }

    const completion = await db.planDayCompletion.create({
      data: {
        planDayId,
        userId,
        date: new Date(date),
      },
    });

    return NextResponse.json({ completion }, { status: 201 });
  } catch (error) {
    console.error('Complete plan day error:', error);
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

    const completion = await db.planDayCompletion.findUnique({
      where: { id },
    });

    if (!completion) {
      return NextResponse.json(
        { error: 'Completion not found' },
        { status: 404 }
      );
    }

    await db.planDayCompletion.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete plan completion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
