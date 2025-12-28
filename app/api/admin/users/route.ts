import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, updateUserStatus, deleteUser } from '@/lib/db';
import { getSession } from '@/lib/auth';

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

// GET - Get all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await getAllUsers();
    return NextResponse.json(users);
  } catch (error: unknown) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

// PUT - Update user status (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, status, membership_level, email_verified } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const updates: {
      status?: string;
      membership_level?: string;
      email_verified?: boolean;
    } = {};

    if (status !== undefined) updates.status = status;
    if (membership_level !== undefined) updates.membership_level = membership_level;
    if (email_verified !== undefined) updates.email_verified = email_verified;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'At least one field (status, membership_level, email_verified) must be provided' },
        { status: 400 }
      );
    }

    const updatedUser = await updateUserStatus(userId, updates);
    return NextResponse.json(updatedUser);
  } catch (error: unknown) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user', details: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

// DELETE - Delete user (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const deleted = await deleteUser(userId);
    if (!deleted) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error: unknown) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user', details: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

