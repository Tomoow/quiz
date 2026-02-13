/**
 * Team selection: "Create a new order" – search by team name or table number, grid of team cards.
 * Each card: group icon, title (Tafel X), subtext (team name), secondary add IconButton to start order.
 */
import { useState, useMemo } from 'react';
import { UsersRound, Plus } from 'lucide-react';
import { SearchField, IconButton } from '@tomlievens/design-system';
import { useTables } from '../store/tables-context';
import type { Table } from '../types';
import './TeamSelectionScreen.css';

export type TeamSelectionScreenProps = {
  onSelectTable: (table: Table) => void;
};

export function TeamSelectionScreen({ onSelectTable }: TeamSelectionScreenProps) {
  const { tables, loading } = useTables();
  const [search, setSearch] = useState('');

  const filteredTables = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tables;
    return tables.filter(
      (t) =>
        t.teamName.toLowerCase().includes(q) ||
        t.tableNumber.toLowerCase().includes(q)
    );
  }, [tables, search]);

  return (
    <section className="team-selection" aria-labelledby="team-selection-heading">
      <h1 id="team-selection-heading" className="team-selection__title">
        Nieuwe bestelling maken
      </h1>
      <p className="team-selection__label">
        Zoek een team of tafel<span aria-hidden>*</span>
      </p>

      <SearchField
        aria-label="Zoek op team of tafelnummer"
        placeholder="Zoeken"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onClear={() => setSearch('')}
        className="team-selection__search"
      />

      {loading ? (
        <p className="empty-state" role="status">
          Tafels laden…
        </p>
      ) : filteredTables.length === 0 ? (
        <p className="empty-state" role="status">
          {tables.length === 0
            ? 'Nog geen teams. Voeg teams toe in Beheer.'
            : 'Geen teams gevonden voor je zoekopdracht.'}
        </p>
      ) : (
        <ul className="team-selection__grid" role="list" aria-label="Teams en tafels">
          {filteredTables.map((table) => (
            <li key={table.id} className="team-selection__card-wrap">
              <article className="team-selection__card">
                <span className="team-selection__card-icon" aria-hidden>
                  <UsersRound />
                </span>
                <div className="team-selection__card-text">
                  <h2 className="team-selection__card-title">
                    Tafel {table.tableNumber}
                  </h2>
                  <p className="team-selection__card-subtitle">
                    {table.teamName}
                  </p>
                </div>
                <IconButton
                  icon={Plus as Parameters<typeof IconButton>[0]['icon']}
                  variant="secondary"
                  size="small"
                  aria-label={`Bestelling maken voor ${table.teamName} (Tafel ${table.tableNumber})`}
                  onClick={() => onSelectTable(table)}
                />
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
