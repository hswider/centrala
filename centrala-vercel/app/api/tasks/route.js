import { NextResponse } from 'next/server';
import {
  initDatabase,
  createTask,
  getTasksForUser,
  getAllTasks,
  completeTask,
  deleteTask
} from '../../../lib/db';

// GET - Get tasks for a user or all tasks
export async function GET(request) {
  try {
    await initDatabase();

    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const all = searchParams.get('all') === 'true';

    let tasks;
    if (all) {
      tasks = await getAllTasks();
    } else if (username) {
      tasks = await getTasksForUser(username);
    } else {
      return NextResponse.json({
        success: false,
        error: 'Username parameter is required'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      tasks
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new task
export async function POST(request) {
  try {
    await initDatabase();

    const body = await request.json();
    const { createdBy, assignedTo, content, threadId, threadType } = body;

    if (!createdBy || !assignedTo || !content) {
      return NextResponse.json({
        success: false,
        error: 'createdBy, assignedTo, and content are required'
      }, { status: 400 });
    }

    const task = await createTask({
      createdBy,
      assignedTo,
      content,
      threadId: threadId || null,
      threadType: threadType || null
    });

    return NextResponse.json({
      success: true,
      task
    });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Complete a task
export async function PUT(request) {
  try {
    await initDatabase();

    const body = await request.json();
    const { taskId, username } = body;

    if (!taskId || !username) {
      return NextResponse.json({
        success: false,
        error: 'taskId and username are required'
      }, { status: 400 });
    }

    const task = await completeTask(taskId, username);

    if (!task) {
      return NextResponse.json({
        success: false,
        error: 'Task not found or you are not authorized to complete it'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      task
    });
  } catch (error) {
    console.error('Complete task error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a task
export async function DELETE(request) {
  try {
    await initDatabase();

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({
        success: false,
        error: 'taskId parameter is required'
      }, { status: 400 });
    }

    await deleteTask(taskId);

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
