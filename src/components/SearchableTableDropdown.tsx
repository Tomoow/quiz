/**
 * Searchable table dropdown: trigger (input-like) opens panel with SearchField + filtered table list.
 * Uses design system: SearchField, token-based list. For Order Taking screen (Select Table).
 */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { SearchField } from '@tomlievens/design-system';
import type { Table } from '../types';
import './SearchableTeamDropdown.css';

export type SearchableTableDropdownProps = {
  label: string;
  tables: Table[];
  value: Table | null;
  onChange: (table: Table | null) => void;
  placeholder?: string;
  'aria-label'?: string;
};

export function SearchableTableDropdown({
  label,
  tables,
  value,
  onChange,
  placeholder = 'Search team or table',
  'aria-label': ariaLabel,
}: SearchableTableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredTables = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tables;
    return tables.filter(
      (t) =>
        t.teamName.toLowerCase().includes(q) ||
        t.tableNumber.toLowerCase().includes(q)
    );
  }, [tables, search]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const displayValue = value ? `${value.teamName} (Tafel ${value.tableNumber})` : '';
  const triggerLabel = ariaLabel || label;

  const handleSelect = (table: Table) => {
    onChange(table);
    setSearch('');
    setIsOpen(false);
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="searchable-team-dropdown">
      <label className="searchable-team-dropdown__label" id="searchable-team-dropdown-label">
        {label}
      </label>
      <button
        type="button"
        className="searchable-team-dropdown__trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby="searchable-team-dropdown-label"
        aria-label={triggerLabel}
      >
        <span className={displayValue ? '' : 'searchable-team-dropdown__trigger-placeholder'}>
          {displayValue || placeholder}
        </span>
        <ChevronDown className="searchable-team-dropdown__chevron" aria-hidden />
      </button>

      {isOpen && (
        <div
          className="searchable-team-dropdown__panel"
          role="listbox"
          aria-labelledby="searchable-team-dropdown-label"
        >
          <div className="searchable-team-dropdown__search">
            <SearchField
              label="Search team or table"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. Quiz Masters or 3"
            />
          </div>
          <div className="searchable-team-dropdown__list">
            {filteredTables.length === 0 ? (
              <p className="searchable-team-dropdown__empty" role="status">
                No team matches. Try another search.
              </p>
            ) : (
              filteredTables.map((table) => (
                <button
                  key={table.id}
                  type="button"
                  role="option"
                  aria-selected={value?.id === table.id}
                  className="searchable-team-dropdown__option"
                  onClick={() => handleSelect(table)}
                >
                  <span className="searchable-team-dropdown__option-name">{table.teamName}</span>
                  <span className="searchable-team-dropdown__option-table">Tafel {table.tableNumber}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
