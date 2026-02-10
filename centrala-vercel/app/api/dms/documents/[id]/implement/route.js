import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { cookies } from 'next/headers';

async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('poom_user');
    if (userCookie) {
      return JSON.parse(userCookie.value);
    }
  } catch (e) {
    console.error('Error getting user from cookie:', e);
  }
  return null;
}

async function logDocumentHistory(documentId, action, actionDetails, userName, userId) {
  try {
    await sql`
      INSERT INTO document_history (document_id, action, action_details, user_name, user_id)
      VALUES (${documentId}, ${action}, ${JSON.stringify(actionDetails || {})}, ${userName || 'System'}, ${userId || null})
    `;
  } catch (error) {
    console.error('Error logging document history:', error);
  }
}

// POST /api/dms/documents/[id]/implement
// Body: { action: 'reset' | 'implement' }
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { action } = await request.json();
    const user = await getCurrentUser();
    const userName = user?.username || 'System';
    const userId = user?.id || null;

    if (!['reset', 'implement', 'reapply'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid action. Use "reset", "implement" or "reapply".' }, { status: 400 });
    }

    // 1. Pobierz dokument
    const { rows: docRows } = await sql`
      SELECT * FROM generated_documents WHERE id = ${id}
    `;

    if (docRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    const doc = docRows[0];
    const docType = doc.doc_type;

    if (!['WZ', 'RW'].includes(docType)) {
      return NextResponse.json({ success: false, error: 'Only WZ/RW documents can be reset/implemented' }, { status: 400 });
    }

    // Walidacja statusu
    if (action === 'reset' && doc.status !== 'completed') {
      return NextResponse.json({ success: false, error: 'Can only reset completed documents' }, { status: 400 });
    }
    if (action === 'implement' && doc.status !== 'reset') {
      return NextResponse.json({ success: false, error: 'Can only implement reset documents' }, { status: 400 });
    }
    if (action === 'reapply' && doc.status !== 'completed') {
      return NextResponse.json({ success: false, error: 'Can only reapply completed documents' }, { status: 400 });
    }

    const data = typeof doc.data === 'string' ? JSON.parse(doc.data) : doc.data;
    const pozycje = data?.pozycje || [];

    if (pozycje.length === 0) {
      return NextResponse.json({ success: false, error: 'Document has no positions' }, { status: 400 });
    }

    // 2. Dla kazdej pozycji: resolve produktId
    const resolvedPozycje = [];
    for (const poz of pozycje) {
      let produktId = poz.produktId || null;

      // Jesli brak produktId, szukaj po nazwie w inventory (surowce)
      if (!produktId && poz.nazwa) {
        const { rows: matchRows } = await sql`
          SELECT id FROM inventory WHERE nazwa = ${poz.nazwa} AND kategoria = 'surowce' LIMIT 1
        `;
        if (matchRows.length > 0) {
          produktId = matchRows[0].id;
        }
      }

      if (!produktId) {
        return NextResponse.json({
          success: false,
          error: `Cannot find product for position: "${poz.nazwa}". Add produktId or ensure name matches inventory.`
        }, { status: 400 });
      }

      resolvedPozycje.push({
        ...poz,
        produktId,
        ilosc: parseFloat(poz.ilosc) || 0
      });
    }

    // 3. Sumuj ilości per produkt
    const deltaMap = {};
    for (const poz of resolvedPozycje) {
      deltaMap[poz.produktId] = (deltaMap[poz.produktId] || 0) + poz.ilosc;
    }

    // 4. Aplikuj zmiany stanów
    // WZ = przyjęcie zewnętrzne (dodaje stan)
    // RW = rozchód wewnętrzny (odejmuje stan)
    // Reset odwraca operację, Implement ją stosuje
    const changes = [];

    for (const [produktId, delta] of Object.entries(deltaMap)) {
      const { rows: itemRows } = await sql`
        SELECT id, nazwa, sku, kategoria, stan FROM inventory WHERE id = ${parseInt(produktId)}
      `;

      if (itemRows.length === 0) {
        return NextResponse.json({
          success: false,
          error: `Product id=${produktId} not found in inventory`
        }, { status: 400 });
      }

      const item = itemRows[0];
      const currentStan = parseFloat(item.stan) || 0;
      let newStan;

      if (action === 'reset') {
        // Cofnij operację (odwróć efekt dokumentu)
        if (docType === 'WZ') {
          // WZ dodało stan → cofnij = odejmij
          newStan = Math.round((currentStan - delta) * 100) / 100;
        } else {
          // RW odjęło stan → cofnij = dodaj z powrotem
          newStan = Math.round((currentStan + delta) * 100) / 100;
        }
      } else if (action === 'implement' || action === 'reapply') {
        // Zastosuj operację dokumentu (ponów efekt)
        if (docType === 'WZ') {
          // WZ = przyjęcie → dodaj
          newStan = Math.round((currentStan + delta) * 100) / 100;
        } else {
          // RW = rozchód → odejmij
          newStan = Math.round((currentStan - delta) * 100) / 100;
        }
      }

      // Aktualizuj stan
      await sql`
        UPDATE inventory SET stan = ${newStan}, updated_at = CURRENT_TIMESTAMP WHERE id = ${parseInt(produktId)}
      `;

      // Loguj do inventory_history
      const actionType = action === 'reset'
        ? `DMS_reset_${docType}`
        : action === 'reapply'
        ? `DMS_reapply_${docType}`
        : `DMS_implement_${docType}`;

      await sql`
        INSERT INTO inventory_history (
          inventory_id, sku, nazwa, kategoria, action_type,
          field_changed, old_value, new_value, user_id, username, created_at
        ) VALUES (
          ${item.id}, ${item.sku}, ${item.nazwa}, ${item.kategoria}, ${actionType},
          'stan', ${String(currentStan)}, ${String(newStan)}, ${userId}, ${userName}, CURRENT_TIMESTAMP
        )
      `;

      changes.push({
        produktId: item.id,
        nazwa: item.nazwa,
        oldStan: currentStan,
        newStan,
        delta
      });
    }

    // 5. Zmień status dokumentu (reapply nie zmienia statusu)
    const newStatus = action === 'reset' ? 'reset' : 'completed';
    if (action !== 'reapply') {
      await sql`
        UPDATE generated_documents SET status = ${newStatus}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}
      `;
    } else {
      await sql`
        UPDATE generated_documents SET updated_at = CURRENT_TIMESTAMP WHERE id = ${id}
      `;
    }

    // 6. Loguj do document_history
    const historyAction = action === 'reset' ? 'implementation_reset' :
                          action === 'reapply' ? 'reapplied' : 'reimplemented';
    await logDocumentHistory(id, historyAction, {
      docType,
      docNumber: doc.doc_number,
      changes
    }, userName, userId);

    return NextResponse.json({
      success: true,
      action,
      newStatus,
      changes
    });
  } catch (error) {
    console.error('Implement/reset error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
