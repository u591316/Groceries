// useShoppingList.ts
"use client";
import { useState, useEffect } from "react";
import { FirebaseError } from "firebase/app";
import { User, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth, db } from "./firebase";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";

// Typen for en vare:
type Item = {
    id: string;
    name: string;
    checked: boolean;
};

export function useShoppingList() {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [authReady, setAuthReady] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);

    const listId = process.env.NEXT_PUBLIC_LIST_ID ?? "main";

    function getErrorMessage(snapshotError: unknown) {
        if (snapshotError instanceof FirebaseError && snapshotError.code === "permission-denied") {
            return "Mangler tilgang til databasen. Sjekk at Anonymous Auth er aktivert og at Firestore-reglene er oppdatert.";
        }

        if (snapshotError instanceof FirebaseError) {
            return `Databasefeil (${snapshotError.code}).`;
        }

        return "Ukjent databasefeil.";
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setAuthReady(true);
                return;
            }

            try {
                await signInAnonymously(auth);
            } catch (signinError) {
                setError(getErrorMessage(signinError));
                setAuthReady(true);
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!authReady) {
            return;
        }

        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = onSnapshot(
            collection(db, "lists", listId, "items"),
            (snapshot) => {
                const data = snapshot.docs.map((itemDoc) => ({
                    id: itemDoc.id,
                    ...(itemDoc.data() as Omit<Item, "id">),
                }));
                setItems(data);
                setError(null);
                setLoading(false);
            },
            (snapshotError) => {
                setError(getErrorMessage(snapshotError));
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [authReady, listId, user]);

    // Legg til et nytt item
    async function addItem(name: string) {
        if (!user) {
            setError("Ikke innlogget i Firebase.");
            return;
        }

        const trimmedName = name.trim();
        if (!trimmedName) {
            return;
        }

        try {
            await addDoc(collection(db, "lists", listId, "items"), {
                name: trimmedName,
                checked: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        } catch (addError) {
            setError(getErrorMessage(addError));
        }
    }

    // Toggle av/på (checked)
    async function toggleItem(id: string, checked: boolean) {
        if (!user) {
            setError("Ikke innlogget i Firebase.");
            return;
        }

        try {
            await updateDoc(doc(db, "lists", listId, "items", id), { checked: !checked, updatedAt: serverTimestamp() });
        } catch (toggleError) {
            setError(getErrorMessage(toggleError));
        }
    }

    async function deleteItem(id: string) {
        if (!user) {
            setError("Ikke innlogget i Firebase.");
            return;
        }

        try {
            await deleteDoc(doc(db, "lists", listId, "items", id));
        } catch (deleteError) {
            setError(getErrorMessage(deleteError));
        }
    }

    return { items, loading: loading || !authReady, error, addItem, toggleItem, deleteItem };
}
