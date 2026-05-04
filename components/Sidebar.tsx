import React, { useState } from 'react';
import { MENU_ITEMS } from '../constants';
import { ChevronDown, ChevronRight, Search, Menu as MenuIcon, X, Box } from 'lucide-react';
import { MenuItem } from '../types';

interface SidebarProps {
  activeMenuId: string;
  onMenuSelect: (id: string, parentLabel?: string, childLabel?: string) => void;
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeMenuId, onMenuSelect, isOpen, setIsOpen }) => {
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['dashboard']));
  const [searchTerm, setSearchTerm] = useState('');

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedMenus(newExpanded);
  };

  const filteredItems = MENU_ITEMS.map(item => {
    // If search term exists, check if item or subitems match
    if (!searchTerm) return item;
    const matchesLabel = item.label.toLowerCase().includes(searchTerm.toLowerCase());
    const matchingSubMenus = item.subMenus?.filter(sub => 
      sub.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (matchesLabel || (matchingSubMenus && matchingSubMenus.length > 0)) {
        return {
            ...item,
            subMenus: matchingSubMenus?.length ? matchingSubMenus : item.subMenus // Keep original if parent matches
        };
    }
    return null;
  }).filter(Boolean) as MenuItem[];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed top-0 left-0 z-30 h-screen w-72 text-slate-300 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static flex flex-col border-r border-slate-800 bg-slate-900
      `}>
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3 text-white font-bold text-lg leading-tight">
             <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Box size={20} className="text-white"/>
             </div>
             <span className="leading-tight">ACT <span className="text-blue-400">BUSINESS</span><br/><span className="text-[10px] font-medium tracking-[0.28em] text-slate-500 uppercase">Solution</span></span>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-400">
            <X size={24} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Search menus..." 
              className="w-full bg-slate-800 border border-slate-700 text-sm text-slate-100 pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 placeholder:text-slate-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Menu List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-3 pb-4 pt-3">
          {filteredItems.map((item) => {
            const Icon = item.icon!;
            const isExpanded = expandedMenus.has(item.id) || !!searchTerm; // Auto expand on search
            const isActiveParent = item.subMenus?.some(sub => sub.id === activeMenuId);

            return (
              <div key={item.id} className="mb-2">
                <button
                  onClick={() => toggleExpand(item.id)}
                  className={`
                    w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-all border
                    ${isActiveParent ? 'bg-blue-500/15 text-blue-300 border-blue-500/30' : 'border-transparent hover:bg-slate-800/60 hover:text-slate-200'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={isActiveParent ? 'text-blue-400' : 'text-slate-500'} />
                    <span>{item.label}</span>
                  </div>
                  {item.subMenus && (
                    isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                  )}
                </button>

                {/* Submenus */}
                {item.subMenus && isExpanded && (
                  <div className="ml-6 mt-2 space-y-1 border-l border-slate-700 pl-3">
                    {item.subMenus.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => {
                            onMenuSelect(sub.id, item.label, sub.label);
                            if(window.innerWidth < 768) setIsOpen(false);
                        }}
                        className={`
                          w-full text-left py-2.5 px-3 rounded-lg text-sm transition-all
                          ${activeMenuId === sub.id 
                            ? 'bg-blue-500/20 text-blue-300 font-medium ring-1 ring-blue-500/30' 
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}
                        `}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* User Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-800/50">
          <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800 p-3">
            <img src="https://picsum.photos/40/40" alt="User" className="w-9 h-9 rounded-full" />
                <div>
                    <p className="text-sm font-medium text-slate-100">Admin User</p>
                    <p className="text-xs text-slate-400">Warehouse Mgr</p>
                </div>
            </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;