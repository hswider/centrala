import { NextResponse } from 'next/server';
import { declareAttachment, uploadAttachmentBinary } from '../../../../../lib/allegro';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name;
    const contentType = file.type || 'application/octet-stream';

    // Step 1: Declare attachment
    const declared = await declareAttachment(fileName, buffer.length);
    const attachmentId = declared.id;

    // Step 2: Upload binary
    await uploadAttachmentBinary(attachmentId, buffer, contentType);

    return NextResponse.json({
      success: true,
      attachmentId
    });
  } catch (error) {
    console.error('Attachment upload error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
