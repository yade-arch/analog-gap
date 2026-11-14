import React from "react";
import { t } from "../i18n/index.js";
import { Icon } from "./ThemeToggle.jsx";

// Sol yan çubuk: yalnızca çalışan bağlantılar. İçerik sayfaları sonra ayrı talimatla genişletilecek (bkz. NOTES-anaekran.md).
const P = {
  home: "M3 11.5 12 4l9 7.5M5.5 9.5V20h5v-6h3v6h5V9.5",
  report: "M7 3h7l4 4v14H7zM14 3v4h4M9.5 12h6M9.5 15.5h6",
  settings: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm7.4 3a7.4 7.4 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7.5 7.5 0 0 0-2.1-1.2L14.5 3h-5l-.4 2.6A7.5 7.5 0 0 0 7 6.8l-2.3-.9-2 3.4 2 1.5a7.4 7.4 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-.9a7.5 7.5 0 0 0 2.1 1.2l.4 2.6h5l.4-2.6a7.5 7.5 0 0 0 2.1-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z",
  help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-2.5-11.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14m0 3v.01",
};

export default function SideBar({ page, reportHref, open, onNavigate }) {
  const items = [
    { id: "home", href: "#/home", key: "side.home" },
    { id: "report", href: reportHref, key: "side.reports" },
    { id: "settings", href: "#/settings", key: "side.settings" },
    { id: "help", href: "#/help", key: "side.help" },
  ];
  return (
    <aside className={"sidebar" + (open ? " open" : "")} id="sidebar" aria-label={t("side.aria")}>
      <nav>
        {items.map((it) => (
          <a key={it.id} href={it.href} className={page === it.id ? "on" : ""} aria-current={page === it.id ? "page" : undefined} onClick={onNavigate}>
            <Icon d={P[it.id]} size={18} /><span>{t(it.key)}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}
