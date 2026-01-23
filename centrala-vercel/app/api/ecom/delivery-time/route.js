import { NextResponse } from 'next/server';

const MARKETPLACE_DOMAINS = {
  DE: 'amazon.de',
  FR: 'amazon.fr',
  IT: 'amazon.it',
  ES: 'amazon.es',
  BE: 'amazon.com.be',
  NL: 'amazon.nl',
  SE: 'amazon.se',
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const asin = searchParams.get('asin');
  const marketplace = searchParams.get('marketplace') || 'DE';

  if (!asin) {
    return NextResponse.json({ error: 'ASIN is required' }, { status: 400 });
  }

  const domain = MARKETPLACE_DOMAINS[marketplace];
  if (!domain) {
    return NextResponse.json({ error: 'Invalid marketplace' }, { status: 400 });
  }

  const url = `https://www.${domain}/dp/${asin}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      return NextResponse.json({
        error: `Failed to fetch Amazon page: ${response.status}`,
        url
      }, { status: 500 });
    }

    const html = await response.text();

    // Try to extract delivery information from the HTML
    let deliveryDate = null;
    let deliveryText = null;

    // Pattern 1: Look for delivery date in various formats
    // German: "Lieferung Mittwoch, 28. Januar"
    const deliveryPatterns = [
      // German patterns
      /Lieferung\s+(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag),?\s*(\d{1,2})\.?\s*(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)/gi,
      /Lieferung\s+bis\s+(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag),?\s*(\d{1,2})\.?\s*(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)/gi,
      /GRATIS\s+Lieferung\s+(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag),?\s*(\d{1,2})\.?\s*(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)/gi,
      // French patterns
      /Livraison\s+(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche),?\s*(\d{1,2})\s*(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/gi,
      // Italian patterns
      /Consegna\s+(lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica),?\s*(\d{1,2})\s*(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)/gi,
      // Spanish patterns
      /Entrega\s+(lunes|martes|miércoles|jueves|viernes|sábado|domingo),?\s*(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/gi,
    ];

    for (const pattern of deliveryPatterns) {
      const match = html.match(pattern);
      if (match) {
        deliveryText = match[0];
        break;
      }
    }

    // Alternative: Look for delivery-message or similar elements
    const deliveryMessageMatch = html.match(/id="delivery-message"[^>]*>([^<]+)</i);
    if (deliveryMessageMatch && !deliveryText) {
      deliveryText = deliveryMessageMatch[1].trim();
    }

    // Look for #mir-layout-DELIVERY_BLOCK content
    const deliveryBlockMatch = html.match(/id="mir-layout-DELIVERY_BLOCK[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (deliveryBlockMatch && !deliveryText) {
      // Extract text content
      const blockHtml = deliveryBlockMatch[1];
      const textMatch = blockHtml.match(/>([^<]*(?:Lieferung|Livraison|Consegna|Entrega|Delivery)[^<]*)</i);
      if (textMatch) {
        deliveryText = textMatch[1].trim();
      }
    }

    // Look for data-csa-c-delivery-time attribute
    const deliveryTimeAttrMatch = html.match(/data-csa-c-delivery-time="([^"]+)"/i);
    if (deliveryTimeAttrMatch) {
      deliveryDate = deliveryTimeAttrMatch[1];
    }

    // Look for "fastestDeliveryDate" in JSON data
    const jsonDeliveryMatch = html.match(/"fastestDeliveryDate"\s*:\s*"([^"]+)"/i);
    if (jsonDeliveryMatch) {
      deliveryDate = jsonDeliveryMatch[1];
    }

    // Extract a snippet around delivery keywords for debugging
    let debugSnippet = null;
    const lieferungIndex = html.indexOf('Lieferung');
    if (lieferungIndex > -1) {
      debugSnippet = html.substring(Math.max(0, lieferungIndex - 50), Math.min(html.length, lieferungIndex + 200));
    }

    return NextResponse.json({
      success: true,
      asin,
      marketplace,
      url,
      deliveryText,
      deliveryDate,
      debugSnippet,
      htmlLength: html.length,
    });
  } catch (error) {
    return NextResponse.json({
      error: error.message,
      asin,
      marketplace,
      url
    }, { status: 500 });
  }
}
