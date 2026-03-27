"use client";
import { useEffect, useRef, useState } from "react";
import PullToRefresh from "pulltorefreshjs";
import styles from "./page.module.css";
import { DEFAULT_TAB_ID, useShoppingList } from "./useShoppingList";

export default function Home() {
    const { tabs, items, loading, error, addItem, toggleItem, deleteItem, createTab, deleteTab } = useShoppingList();
    const [newItem, setNewItem] = useState("");
    const [activeTabId, setActiveTabId] = useState(DEFAULT_TAB_ID);
    const cleanedTabs = useRef<Set<string>>(new Set());

    const activeItems = items.filter((item) => (item.tabId ?? DEFAULT_TAB_ID) === activeTabId);

    async function submitNewItem() {
        if (newItem.trim() === "") {
            return;
        }

        await addItem(newItem, activeTabId);
        setNewItem("");
    }

    async function handleCreateTab() {
        const tabName = window.prompt("Hva skal fanen hete?");
        if (!tabName) {
            return;
        }

        const tabId = await createTab(tabName);
        if (tabId) {
            setActiveTabId(tabId);
        }
    }

    async function handleDeleteTab(tabId: string, tabName: string) {
        const confirmed = window.confirm(`Vil du slette fanen "${tabName}"?`);
        if (!confirmed) {
            return;
        }

        await deleteTab(tabId);
        setActiveTabId(DEFAULT_TAB_ID);
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
        const activeTabExists = tabs.some((tab) => tab.id === activeTabId);
        if (!activeTabExists) {
            setActiveTabId(DEFAULT_TAB_ID);
        }
    }, [activeTabId, tabs]);

    useEffect(() => {
        if (loading || cleanedTabs.current.has(activeTabId)) {
            return;
        }

        cleanedTabs.current.add(activeTabId);
        activeItems.forEach((item) => {
            if (item.checked) {
                void deleteItem(item.id);
            }
        });
    }, [activeItems, activeTabId, deleteItem, loading]);

    if (loading) {
        return (
            <main className={styles.page}>
                <section className={styles.shell}>
                    <p className={styles.loading}>Laster handleliste...</p>
                </section>
            </main>
        );
    }

    return (
        <main className={styles.page}>
            <section className={styles.shell}>
                <div className={styles.tabsRow}>
                    <div className={styles.tabsScroller}>
                        <ul className={styles.tabs}>
                            {tabs.map((tab) => {
                                const isActive = tab.id === activeTabId;

                                return (
                                    <li
                                        key={tab.id}
                                        className={`${styles.tabItem} ${isActive ? styles.tabItemActive : ""}`}
                                    >
                                        <button
                                            type="button"
                                            className={styles.tabButton}
                                            onClick={() => setActiveTabId(tab.id)}
                                        >
                                            {tab.name}
                                            {tab.id === DEFAULT_TAB_ID ? (
                                                <span className={styles.titleEmoji}>👩‍❤️‍💋‍👨</span>
                                            ) : null}
                                        </button>
                                        {!tab.isDefault ? (
                                            <button
                                                type="button"
                                                className={styles.tabRemove}
                                                aria-label={`Slett fanen ${tab.name}`}
                                                onClick={() => void handleDeleteTab(tab.id, tab.name)}
                                            >
                                                ×
                                            </button>
                                        ) : null}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    <button type="button" className={styles.addTabButton} aria-label="Opprett ny fane" onClick={() => void handleCreateTab()}>
                        +
                    </button>
                </div>

                <div className={styles.headerMeta}>
                    <p className={styles.subtitle}>{activeItems.length} varer</p>
                    <p className={styles.activeTabLabel}>{tabs.find((tab) => tab.id === activeTabId)?.name ?? "Handleliste"}</p>
                </div>

                {error ? <p className={styles.error}>{error}</p> : null}

                <ul className={styles.toDoList}>
                    {activeItems.map((item) => (
                        <li key={item.id} className={styles.toDoList__item}>
                            <label className={styles.itemLabel}>
                                <input
                                    type="checkbox"
                                    checked={item.checked}
                                    onChange={() => toggleItem(item.id, item.checked)}
                                />
                                <span className={`${styles.itemText} ${item.checked ? styles.itemTextChecked : ""}`}>{item.name}</span>
                            </label>
                        </li>
                    ))}
                </ul>

                <div className={styles.toDoInput}>
                    <input
                        type="text"
                        placeholder={`Legg til vare i ${tabs.find((tab) => tab.id === activeTabId)?.name ?? "Handleliste"}`}
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
            </section>
        </main>
    );
}
