// useShoppingList.ts
"use client";
import { useState, useEffect } from "react";
import { db } from "./firebase";   // Viktig: importér "db" fra firebase.ts
import {
    collection,
    query,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    deleteDoc
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

    useEffect(() => {
        const itemsRef = collection(db, "/items");
        const q = query(itemsRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...(doc.data() as Omit<Item, "id">),
            }));
            setItems(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Legg til et nytt item
    async function addItem(name: string) {
        const itemsRef = collection(db, "/items");
        await addDoc(itemsRef, {
            name,
            checked: false,
        });
    }

    // Toggle av/på (checked)
    async function toggleItem(id: string, checked: boolean) {
        const docRef = doc(db, "/items", id);
        await updateDoc(docRef, { checked: !checked });
    }

    async function deleteItem(id: string){
        const docRef = doc(db, "/items", id);
        await deleteDoc(docRef);
    }

    return { items, loading, addItem, toggleItem, deleteItem };
}
