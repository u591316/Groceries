"use client";
import { useEffect, useRef, useState } from "react";
import { useShoppingList } from "./useShoppingList";
import styles from "./page.module.css";
import PullToRefresh from "pulltorefreshjs";

export default function Home() {
    const { items, loading, error, addItem, toggleItem, deleteItem } = useShoppingList();
    const [newItem, setNewItem] = useState("");
    const hasCleanedCheckedItems = useRef(false);

    async function submitNewItem() {
        if (newItem.trim() === "") {
            return;
        }

        await addItem(newItem);
        setNewItem("");
    }

    useEffect(() => {
        const standalone = window.matchMedia("(display-mode: standalone)").matches;

        if (standalone) {
            PullToRefresh.init({
                onRefresh() {
                    window.location.reload();
                },
            });
        }

        return () => {
            PullToRefresh.destroyAll();
        };
    }, []);

    useEffect(() => {
        if (loading || hasCleanedCheckedItems.current) {
            return;
        }

        hasCleanedCheckedItems.current = true;
        items.forEach((item) => {
            if (item.checked) {
                void deleteItem(item.id);
            }
        });
    }, [deleteItem, items, loading]);

    if (loading) {
        return <div>Laster handleliste...</div>;
    }

    return (
        <main style={{padding: "1rem"}} className={styles.page}>
            <h1>Handleliste</h1>
            {error ? <p style={{color: "#d00000"}}>{error}</p> : null}
            <ul className={styles.toDoList}>
                {items.map((item) => (
                    <li key={item.id} className={styles.toDoList__item}>
                        <label style={{textDecoration: item.checked ? "line-through" : ""}}>
                            <input
                                type="checkbox"
                                checked={item.checked}
                                onChange={() => toggleItem(item.id, item.checked)}
                            />
                            <span>
              {item.name}
                </span>
                        </label>
                    </li>
                ))}
            </ul>
            <div className={styles.toDoInput}>
                <input
                    type="text"
                    placeholder="Legg til vare"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onBlur={() => {
                        if (newItem.trim() !== "") {
                            void submitNewItem();
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            void submitNewItem();
                        }
                    }}
                />
            </div>
        </main>
    );
}
