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

    const metrics = await db.bodyMetric.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Get body metrics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, date, weight, bodyFat, waist, chest, arms, thighs } = body;

    if (!userId || !date || weight === undefined) {
      return NextResponse.json(
        { error: 'userId, date, and weight are required' },
        { status: 400 }
      );
    }

    const metric = await db.bodyMetric.create({
      data: {
        userId,
        date: new Date(date),
        weight,
        bodyFat: bodyFat || null,
        waist: waist || null,
        chest: chest || null,
        arms: arms || null,
        thighs: thighs || null,
      },
    });

    return NextResponse.json({ metric }, { status: 201 });
  } catch (error) {
    console.error('Create body metric error:', error);
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

    const metric = await db.bodyMetric.findUnique({
      where: { id },
    });

    if (!metric) {
      return NextResponse.json(
        { error: 'Body metric not found' },
        { status: 404 }
      );
    }

    await db.bodyMetric.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete body metric error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
