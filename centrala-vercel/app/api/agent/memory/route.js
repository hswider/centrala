import { NextResponse } from 'next/server';
import { getAIMemories, saveAIMemory, deleteAIMemory, clearAllAIMemories } from '@/lib/db';

// GET - list all memories
export async function GET() {
  try {
    const memories = await getAIMemories();
    return NextResponse.json({
      success: true,
      memories,
      count: memories.length
    });
  } catch (error) {
    console.error('[Memory API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - add new memory
export async function POST(request) {
  try {
    const { fact, category } = await request.json();

    if (!fact || typeof fact !== 'string' || fact.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Fact is required' },
        { status: 400 }
      );
    }

    const memory = await saveAIMemory(fact.trim(), category || 'general');
    return NextResponse.json({
      success: true,
      memory
    });
  } catch (error) {
    console.error('[Memory API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - remove memory by id or clear all
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const clearAll = searchParams.get('clearAll');

    if (clearAll === 'true') {
      await clearAllAIMemories();
      return NextResponse.json({
        success: true,
        message: 'All memories cleared'
      });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Memory ID is required' },
        { status: 400 }
      );
    }

    await deleteAIMemory(parseInt(id));
    return NextResponse.json({
      success: true,
      message: `Memory ${id} deleted`
    });
  } catch (error) {
    console.error('[Memory API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
