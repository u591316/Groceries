// useShoppingList.ts
"use client";
import { useEffect, useState } from "react";
import { FirebaseError } from "firebase/app";
import { User, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth, db } from "./firebase";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
    writeBatch,
} from "firebase/firestore";

export const DEFAULT_TAB_ID = "default";

export type Item = {
    id: string;
    name: string;
    checked: boolean;
    tabId?: string;
};

export type ShoppingTab = {
    id: string;
    name: string;
    isDefault: boolean;
};

const defaultTab: ShoppingTab = {
    id: DEFAULT_TAB_ID,
    name: "Handleliste",
    isDefault: true,
};

export function useShoppingList() {
    const [tabs, setTabs] = useState<ShoppingTab[]>([defaultTab]);
    const [items, setItems] = useState<Item[]>([]);
    const [tabsLoading, setTabsLoading] = useState(true);
    const [itemsLoading, setItemsLoading] = useState(true);
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
        if (!authReady || !user) {
            return;
        }

        void setDoc(
            doc(db, "lists", listId, "tabs", DEFAULT_TAB_ID),
            {
                name: defaultTab.name,
                isDefault: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            },
            { merge: true }
        ).catch((setupError) => {
            setError(getErrorMessage(setupError));
        });
    }, [authReady, listId, user]);

    useEffect(() => {
        if (!authReady) {
            return;
        }

        if (!user) {
            setTabsLoading(false);
            setItemsLoading(false);
            return;
        }

        setTabsLoading(true);
        const unsubscribeTabs = onSnapshot(
            collection(db, "lists", listId, "tabs"),
            (snapshot) => {
                const firestoreTabs = snapshot.docs
                    .map((tabDoc) => {
                        const data = tabDoc.data();
                        if (typeof data.name !== "string") {
                            return null;
                        }

                        return {
                            id: tabDoc.id,
                            name: data.name,
                            isDefault: Boolean(data.isDefault),
                        } satisfies ShoppingTab;
                    })
                    .filter((tab): tab is ShoppingTab => tab !== null);

                const nextTabs = [
                    defaultTab,
                    ...firestoreTabs
                        .filter((tab) => tab.id !== DEFAULT_TAB_ID)
                        .sort((left, right) => left.name.localeCompare(right.name, "nb")),
                ];
                setTabs(nextTabs);
                setError(null);
                setTabsLoading(false);
            },
            (snapshotError) => {
                setError(getErrorMessage(snapshotError));
                setTabsLoading(false);
            }
        );

        return () => unsubscribeTabs();
    }, [authReady, listId, user]);

    useEffect(() => {
        if (!authReady) {
            return;
        }

        if (!user) {
            setItemsLoading(false);
            return;
        }

        setItemsLoading(true);
        const unsubscribeItems = onSnapshot(
            collection(db, "lists", listId, "items"),
            (snapshot) => {
                const data = snapshot.docs.map((itemDoc) => ({
                    id: itemDoc.id,
                    ...(itemDoc.data() as Omit<Item, "id">),
                }));
                setItems(data);
                setError(null);
                setItemsLoading(false);
            },
            (snapshotError) => {
                setError(getErrorMessage(snapshotError));
                setItemsLoading(false);
            }
        );

        return () => unsubscribeItems();
    }, [authReady, listId, user]);

    async function addItem(name: string, tabId: string) {
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
                tabId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        } catch (addError) {
            setError(getErrorMessage(addError));
        }
    }

    async function toggleItem(id: string, checked: boolean) {
        if (!user) {
            setError("Ikke innlogget i Firebase.");
            return;
        }

        try {
            await updateDoc(doc(db, "lists", listId, "items", id), {
                checked: !checked,
                updatedAt: serverTimestamp(),
            });
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

    async function createTab(name: string) {
        if (!user) {
            setError("Ikke innlogget i Firebase.");
            return null;
        }

        const trimmedName = name.trim();
        if (!trimmedName) {
            return null;
        }

        try {
            const tabRef = await addDoc(collection(db, "lists", listId, "tabs"), {
                name: trimmedName,
                isDefault: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            return tabRef.id;
        } catch (createError) {
            setError(getErrorMessage(createError));
            return null;
        }
    }

    async function deleteTab(tabId: string) {
        if (!user) {
            setError("Ikke innlogget i Firebase.");
            return;
        }

        if (tabId === DEFAULT_TAB_ID) {
            setError("Standardfanen kan ikke slettes.");
            return;
        }

        try {
            const itemsSnapshot = await getDocs(
                query(collection(db, "lists", listId, "items"), where("tabId", "==", tabId))
            );

            const batch = writeBatch(db);
            itemsSnapshot.docs.forEach((itemDoc) => {
                batch.delete(itemDoc.ref);
            });
            batch.delete(doc(db, "lists", listId, "tabs", tabId));
            await batch.commit();
        } catch (deleteError) {
            setError(getErrorMessage(deleteError));
        }
    }

    return {
        defaultTabId: DEFAULT_TAB_ID,
        tabs,
        items,
        loading: !authReady || tabsLoading || itemsLoading,
        error,
        addItem,
        toggleItem,
        deleteItem,
        createTab,
        deleteTab,
    };
}
