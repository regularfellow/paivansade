import * as functions from 'firebase-functions';
import adjectives from './adjectives';
import subjectives from "./subjectives";
import * as qr from 'qrcode';
import * as admin from 'firebase-admin';
import {Storage} from '@google-cloud/storage';

admin.initializeApp();

const randomElement = (arr: string[]): string => arr[Math.floor(Math.random() * arr.length)];

const capitalize = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1);

export const createTitle = functions.firestore
    .document('calendars/{doc_id}')
    .onWrite(change => {
        const document = change.after.data();
        if (!document) {
            return change.after;
        }
        if (document['title']) {
            return change.after;
        }
        return change.after.ref.set({
            title: capitalize(randomElement(adjectives)) + " " + randomElement(subjectives),
        }, {merge: true});
    });

const createCalendarUrl = (id: string): string => `https://paivansade-ecfb0.web.app/cal/${id}`;

export const createQr = functions.firestore
    .document('calendars/{doc_id}')
    .onCreate(async snapshot => {
        const url = createCalendarUrl(snapshot.id);
        const dataUrl = await qr.toDataURL(url);
        const bucket = (new Storage()).bucket('paivansade-ecfb0.appspot.com');
        const filename = `qr/${snapshot.id}.png`;
        const file = bucket.file(filename);
        const buffer = new Buffer(dataUrl.split(';base64,').pop()!, 'base64');
        await file.save(buffer, {
            contentType: 'image/png',
            public: true,
        });
        await snapshot.ref.set({
            qr_v1: filename,
        }, {merge: true});
    });
