import { NextResponse } from 'next/server';
import { getInventoryHistory, getInventoryHistoryUsers, initDatabase } from '../../../../lib/db';

// GET - pobierz historie zmian inventory
export async function GET(request) {
  try {
    await initDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '50');
    const username = searchParams.get('username') || null;
    const actionType = searchParams.get('actionType') || null;
    const sku = searchParams.get('sku') || null;
    const dateFrom = searchParams.get('dateFrom') || null;
    const dateTo = searchParams.get('dateTo') || null;

    // Get history with filters
    const result = await getInventoryHistory(page, perPage, {
      username,
      actionType,
      sku,
      dateFrom,
      dateTo
    });

    // Get list of users for filter dropdown
    const users = await getInventoryHistoryUsers();

    return NextResponse.json({
      success: true,
      ...result,
      users,
      actionTypes: [
        { value: 'STAN_CHANGE', label: 'Zmiana stanu' },
        { value: 'PRICE_CHANGE', label: 'Zmiana ceny' },
        { value: 'PRODUCT_ADD', label: 'Dodanie produktu' },
        { value: 'PRODUCT_MODIFY', label: 'Modyfikacja produktu' },
        { value: 'PRODUCT_DELETE', label: 'Usuniecie produktu' }
      ]
    });
  } catch (error) {
    console.error('Inventory history GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
