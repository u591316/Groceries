"use client";
import { useState, useEffect } from "react";
import { useShoppingList } from "./useShoppingList";
import styles from "./page.module.css";

export default function Home() {
    const { items, loading, addItem, toggleItem, deleteItem } = useShoppingList();
    const [newItem, setNewItem] = useState("");

    useEffect(() => {
        if (!loading) {
            // Slett alle varer der "checked" er true
            items.forEach((item) => {
                if (item.checked) {
                    deleteItem(item.id);
                }
            });
        }
    }, [loading]);

    if (loading) {
        return <div>Laster handleliste...</div>;
    }

    return (
        <main style={{padding: "1rem"}} className={styles.page}>
            <h1>Handleliste</h1>
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
                            addItem(newItem);
                            setNewItem("");
                        }
                    }}
                />
            </div>
        </main>
    );
}
