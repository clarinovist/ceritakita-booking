import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData, readServices, Booking } from '@/lib/storage';
import { requireAuth } from '@/lib/auth';
import { createBookingSchema } from '@/lib/validation';
import formidable from 'formidable';
import { IncomingMessage } from 'http';
import { Readable } from 'stream';
import { saveUploadedFile, validateFile } from '@/lib/file-storage';
import { readFile } from 'fs/promises';

/**
 * Helper: Parse multipart form data
 */
async function parseMultipartForm(req: NextRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
    // Convert NextRequest to Node.js IncomingMessage
    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const readable = Readable.from(buffer);
    const fakeReq = Object.assign(readable, {
        headers: Object.fromEntries(req.headers.entries()),
        method: req.method,
        url: req.url,
    }) as unknown as IncomingMessage;

    const form = formidable({
        maxFileSize: 5 * 1024 * 1024, // 5MB
        keepExtensions: true,
        allowEmptyFiles: false,
    });

    return new Promise((resolve, reject) => {
        form.parse(fakeReq, (err, fields, files) => {
            if (err) reject(err);
            else resolve({ fields, files });
        });
    });
}

export async function GET(req: NextRequest) {
    // Require authentication for viewing bookings
    const authCheck = await requireAuth(req);
    if (authCheck) return authCheck;

    const data = readData();
    return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get('content-type') || '';
        let bodyData: unknown;
        let uploadedFile: formidable.File | null = null;

        // Parse request based on content type
        if (contentType.includes('multipart/form-data')) {
            // Parse multipart form data
            const { fields, files } = await parseMultipartForm(req);

            // Extract JSON data from 'data' field
            const dataField = fields.data;
            const dataString = Array.isArray(dataField) ? dataField[0] : dataField;
            bodyData = JSON.parse(dataString || '{}');

            // Extract file from 'proof' field
            const proofField = files.proof;
            uploadedFile = Array.isArray(proofField) ? proofField[0] ?? null : proofField ?? null;
        } else {
            // Parse JSON (backward compatibility)
            bodyData = await req.json();
        }

        // Validate input using Zod
        const validationResult = createBookingSchema.safeParse(bodyData);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.issues },
                { status: 400 }
            );
        }

        const { customer, booking, finance } = validationResult.data;

        // Backend Price Validation
        const services = readServices();
        const service = services.find(s => s.id === customer.serviceId);

        let validatedTotalPrice = 0;
        if (service && service.isActive) {
            validatedTotalPrice = service.basePrice - service.discountValue;
        } else if (service && !service.isActive) {
            return NextResponse.json(
                { error: 'Selected service is not available' },
                { status: 400 }
            );
        } else {
            return NextResponse.json(
                { error: 'Invalid service selected' },
                { status: 400 }
            );
        }

        // Create booking ID first (needed for file naming)
        const bookingId = crypto.randomUUID();

        // Process uploaded file if present
        let proofFilename: string | undefined;
        if (uploadedFile && uploadedFile.filepath) {
            try {
                // Validate file
                validateFile({
                    size: uploadedFile.size,
                    type: uploadedFile.mimetype || 'application/octet-stream',
                    name: uploadedFile.originalFilename || 'file'
                });

                // Read file buffer
                const fileBuffer = await readFile(uploadedFile.filepath);

                // Save file
                const savedFile = await saveUploadedFile(
                    fileBuffer,
                    bookingId,
                    0, // First payment (index 0)
                    uploadedFile.originalFilename || 'proof.jpg',
                    uploadedFile.mimetype || 'image/jpeg'
                );

                proofFilename = savedFile.relativePath;
            } catch (fileError) {
                console.error('Error saving uploaded file:', fileError);
                return NextResponse.json(
                    { error: 'Failed to save uploaded file' },
                    { status: 400 }
                );
            }
        }

        // Update payment with proof filename or keep base64 (backward compat)
        const payments = (finance?.payments || []).map((payment, index) => {
            if (index === 0 && proofFilename) {
                // First payment: add proof_filename, remove proof_base64
                const { proof_base64: _, ...paymentWithoutBase64 } = payment;
                return {
                    ...paymentWithoutBase64,
                    proof_filename: proofFilename
                };
            }
            return payment;
        });

        const newBooking: Booking = {
            id: bookingId,
            created_at: new Date().toISOString(),
            status: 'Active',
            customer,
            booking,
            finance: {
                total_price: validatedTotalPrice,
                payments
            }
        };

        const data = readData();
        data.push(newBooking);
        await writeData(data);

        return NextResponse.json(newBooking, { status: 201 });
    } catch (error) {
        console.error('Error creating booking:', error);
        return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }
}
