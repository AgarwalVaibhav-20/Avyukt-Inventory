import React, { useState } from "react";
import { MENU_ITEMS } from "@/constants";
import {
  ChevronDown,
  ChevronRight,
  Search,
  Menu as MenuIcon,
  X,
  Box,
} from "lucide-react";
import { MenuItem } from "@/types";
import { Link } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import { User as UserIcon } from "lucide-react";

interface SidebarProps {
  activeMenuId: string;
  onMenuSelect: (id: string, parentLabel?: string, childLabel?: string) => void;
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeMenuId,
  onMenuSelect,
  isOpen,
  setIsOpen,
}) => {
  const { user } = useAppSelector((state) => state.auth);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(
    new Set(["dashboard"]),
  );
  const [searchTerm, setSearchTerm] = useState("");

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedMenus(newExpanded);
  };

  const filteredItems = MENU_ITEMS.map((item) => {
    // If search term exists, check if item or subitems match
    if (!searchTerm) return item;
    const matchesLabel = item.label
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchingSubMenus = item.subMenus?.filter((sub) =>
      sub.label.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    if (matchesLabel || (matchingSubMenus && matchingSubMenus.length > 0)) {
      return {
        ...item,
        subMenus: matchingSubMenus?.length ? matchingSubMenus : item.subMenus, // Keep original if parent matches
      };
    }
    return null;
  }).filter(Boolean) as MenuItem[];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`
        fixed top-0 left-0 z-30 h-screen w-72 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        flex flex-col border-r border-slate-800 shadow-xl
      `}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2 text-white font-bold text-lg leading-tight">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Box size={20} className="text-white" />
            </div>
            <span>
              ACT <span className="text-blue-500">BUSINESS</span>
              <br />
              <span className="text-xs font-medium text-slate-400">
                SOLUTION
              </span>
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-800"
            title="Hide Sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-2.5 text-slate-500"
              size={16}
            />
            <input
              type="text"
              placeholder="Search menus..."
              className="w-full bg-slate-800 text-sm text-slate-200 pl-10 pr-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Menu List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-2 pb-4">
          {filteredItems.map((item) => {
            const Icon = item.icon!;
            const isExpanded = expandedMenus.has(item.id) || !!searchTerm; // Auto expand on search
            const isActiveParent = item.subMenus?.some(
              (sub) => sub.id === activeMenuId,
            );

            return (
              <div key={item.id} className="mb-1">
                <a
                  href="javascript:void(0)"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleExpand(item.id);
                  }}
                  className={`
                    w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-colors
                    ${isActiveParent ? "bg-slate-800 text-white" : "hover:bg-slate-800 hover:text-white"}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={18}
                      className={
                        isActiveParent ? "text-blue-400" : "text-slate-500"
                      }
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.subMenus &&
                    (isExpanded ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    ))}
                </a>

                {/* Submenus */}
                {item.subMenus && isExpanded && (
                  <div className="ml-9 mt-1 space-y-0.5 border-l border-slate-700 pl-2">
                    {item.subMenus.map((sub) => {
                      const path = `/${item.id}/${sub.id}`;
                      const isSubActive = location.pathname === path;

                      return (
                        <Link
                          key={sub.id}
                          to={path}
                          onClick={() => {
                            onMenuSelect(sub.id, item.label, sub.label);
                            if (window.innerWidth < 768) setIsOpen(false);
                          }}
                          className={`
                            block w-full text-left py-2 px-3 rounded-md text-sm transition-colors
                            ${
                              isSubActive
                                ? "bg-blue-600/10 text-blue-400 font-medium"
                                : "text-slate-400 hover:text-slate-200"
                            }
                          `}
                        >
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 overflow-hidden border border-slate-700">
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt="User"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon size={18} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.fullname || "Admin User"}
              </p>
              <p className="text-xs text-slate-500 truncate capitalize">
                {user?.role || "Warehouse Mgr"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
