"use client";
import { useEffect, useState } from "react";
import { FirebaseError } from "firebase/app";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

type Status =
    | { kind: "idle" }
    | { kind: "locating" }
    | { kind: "saving" }
    | { kind: "done"; latitude: number; longitude: number; accuracy: number }
    | { kind: "error"; message: string };

const LIST_ID = process.env.NEXT_PUBLIC_LIST_ID ?? "main";

function formatCoord(value: number) {
    return value.toFixed(5);
}

function geolocationErrorMessage(error: GeolocationPositionError) {
    if (error.code === error.PERMISSION_DENIED) {
        return "Du må gi tilgang til posisjon for at dette skal fungere.";
    }
    if (error.code === error.POSITION_UNAVAILABLE) {
        return "Klarte ikke å finne posisjonen din akkurat nå.";
    }
    if (error.code === error.TIMEOUT) {
        return "Det tok for lang tid å hente posisjon. Prøv igjen.";
    }
    return "Ukjent feil ved henting av posisjon.";
}

export default function Home() {
    const [status, setStatus] = useState<Status>({ kind: "idle" });

    useEffect(() => {
        let cancelled = false;

        async function share() {
            if (typeof window === "undefined" || !("geolocation" in navigator)) {
                if (!cancelled) {
                    setStatus({ kind: "error", message: "Nettleseren støtter ikke geolokasjon." });
                }
                return;
            }

            try {
                const user = await new Promise<import("firebase/auth").User>((resolve, reject) => {
                    const unsubscribe = onAuthStateChanged(
                        auth,
                        (currentUser) => {
                            if (currentUser) {
                                unsubscribe();
                                resolve(currentUser);
                                return;
                            }
                            signInAnonymously(auth).catch((signinError) => {
                                unsubscribe();
                                reject(signinError);
                            });
                        },
                        (authError) => {
                            unsubscribe();
                            reject(authError);
                        }
                    );
                });

                if (cancelled) return;
                setStatus({ kind: "locating" });

                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 15000,
                        maximumAge: 0,
                    });
                });

                if (cancelled) return;
                setStatus({ kind: "saving" });

                const { latitude, longitude, accuracy } = position.coords;
                await setDoc(doc(db, "lists", LIST_ID, "locations", user.uid), {
                    latitude,
                    longitude,
                    accuracy,
                    updatedAt: serverTimestamp(),
                });

                if (cancelled) return;
                setStatus({ kind: "done", latitude, longitude, accuracy });
            } catch (err) {
                if (cancelled) return;
                if (err && typeof err === "object" && "code" in err && "PERMISSION_DENIED" in err) {
                    setStatus({ kind: "error", message: geolocationErrorMessage(err as GeolocationPositionError) });
                    return;
                }
                if (err instanceof FirebaseError) {
                    setStatus({ kind: "error", message: `Databasefeil (${err.code}).` });
                    return;
                }
                setStatus({ kind: "error", message: "Noe gikk galt. Prøv å laste siden på nytt." });
            }
        }

        void share();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <main
            style={{
                minHeight: "100dvh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem",
                textAlign: "center",
            }}
        >
            <div style={{ maxWidth: "28rem", width: "100%" }}>
                {status.kind === "idle" || status.kind === "locating" ? (
                    <p style={{ fontSize: "1.125rem" }}>Henter posisjon…</p>
                ) : null}

                {status.kind === "saving" ? (
                    <p style={{ fontSize: "1.125rem" }}>Sender posisjon…</p>
                ) : null}

                {status.kind === "done" ? (
                    <>
                        <p style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>Posisjon delt 📍</p>
                        <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: "0.95rem", opacity: 0.75 }}>
                            {formatCoord(status.latitude)}, {formatCoord(status.longitude)}
                        </p>
                        <p style={{ fontSize: "0.85rem", opacity: 0.6, marginTop: "0.5rem" }}>
                            Nøyaktighet: ±{Math.round(status.accuracy)} m
                        </p>
                    </>
                ) : null}

                {status.kind === "error" ? (
                    <p style={{ fontSize: "1.05rem", color: "#a23636" }}>{status.message}</p>
                ) : null}
            </div>
        </main>
    );
}
