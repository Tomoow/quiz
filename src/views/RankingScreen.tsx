/**
 * Screen 3: Team Rankings – live points leaderboard.
 * Points use current menu (by itemId) so ranking updates when points change. Top 3 get gold/silver/bronze.
 * Smooth layout animation when teams swap places; confetti when someone takes first place.
 */
import { useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Crown, Trophy, Medal } from 'lucide-react';
import { Card } from '@tomlievens/design-system';
import { useOrders } from '../store/orders-context';
import { useTables } from '../store/tables-context';
import { useMenu } from '../store/menu-context';
import { playVictorySound } from '../utils/victorySound';
import './RankingScreen.css';

const LAYOUT_TRANSITION = { type: 'spring' as const, stiffness: 300, damping: 30 };

type TeamRank = {
  teamName: string;
  tableNumber: string;
  points: number;
  rank: number;
};

function fireFirstPlaceConfetti() {
  const count = 120;
  const defaults = { origin: { y: 0.6 }, zIndex: 9999 };
  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
  }
  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

export function RankingScreen() {
  const { orders } = useOrders();
  const { tables } = useTables();
  const { menuItems } = useMenu();
  const prevFirstPlaceRef = useRef<string | null>(null);

  /** Points per item from current menu (so ranking reflects admin changes). */
  const pointsByItemId = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of menuItems) map.set(m.id, m.points);
    return map;
  }, [menuItems]);

  const rankedTeams = useMemo<TeamRank[]>(() => {
    const pointsByTeam = new Map<string, number>();
    for (const order of orders) {
      let orderPoints = 0;
      for (const line of order.items) {
        const ptsPerUnit = pointsByItemId.get(line.itemId) ?? line.points;
        orderPoints += line.quantity * ptsPerUnit;
      }
      const current = pointsByTeam.get(order.teamName) ?? 0;
      pointsByTeam.set(order.teamName, current + orderPoints);
    }
    const list: TeamRank[] = tables.map((t) => ({
      teamName: t.teamName,
      tableNumber: t.tableNumber,
      points: pointsByTeam.get(t.teamName) ?? 0,
      rank: 0,
    }));
    list.sort((a, b) => b.points - a.points);
    list.forEach((row, i) => {
      row.rank = i + 1;
    });
    return list;
  }, [orders, tables, pointsByItemId]);

  const currentFirst = rankedTeams[0]?.teamName ?? null;
  useEffect(() => {
    if (currentFirst === null) return;
    if (prevFirstPlaceRef.current !== null && prevFirstPlaceRef.current !== currentFirst) {
      fireFirstPlaceConfetti();
      playVictorySound();
    }
    prevFirstPlaceRef.current = currentFirst;
  }, [currentFirst]);

  const top3 = rankedTeams.slice(0, 3);
  const chartTeams = rankedTeams.slice(0, 8);
  const maxPoints = Math.max(1, ...rankedTeams.map((t) => t.points));

  const RankIcon = (rank: number) => {
    if (rank === 1) return Crown;
    if (rank === 2) return Trophy;
    return Medal;
  };

  return (
    <section className="section ranking" aria-labelledby="ranking-heading">
      <h1 id="ranking-heading" className="ranking__title">
        Team Rankings
      </h1>
      <p className="ranking__subtitle">Live Points Leaderboard</p>

      <div className="ranking__top3" role="list">
        {top3.map((team) => {
          const IconComponent = RankIcon(team.rank);
          return (
            <motion.div
              key={team.teamName}
              layout
              transition={LAYOUT_TRANSITION}
              className={`ranking-card-wrap ranking-card-wrap--${team.rank}`}
              role="listitem"
            >
              <Card
                icon={<IconComponent className="ranking-card__icon" aria-hidden />}
                title={team.teamName}
                subtitle={`Tafel ${team.tableNumber}`}
                footer={
                  <div className="ranking-card__points-bar">
                    <IconComponent className="ranking-card__points-icon" aria-hidden />
                    <span className="ranking-card__points">
                      {team.points} pts
                    </span>
                  </div>
                }
                className="ranking__card ranking__card--podium"
              />
            </motion.div>
          );
        })}
      </div>

      <h2 className="ranking__section-title">Points by Team</h2>
      <div className="ranking-chart" role="img" aria-label="Bar chart of points by team">
        <div className="ranking-chart__bars">
          {chartTeams.map((team) => (
            <motion.div
              key={team.teamName}
              layout
              transition={LAYOUT_TRANSITION}
              className="ranking-chart__bar-wrap"
            >
              <span className="ranking-chart__points" aria-hidden>
                {team.points} pts
              </span>
              <motion.div
                layout
                transition={LAYOUT_TRANSITION}
                className={`ranking-chart__bar ranking-chart__bar--${team.rank <= 3 ? team.rank : 'rest'}`}
                style={{ height: `${(team.points / maxPoints) * 100}%` }}
                title={`${team.teamName}: ${team.points} pts`}
              />
            </motion.div>
          ))}
        </div>
        <div className="ranking-chart__labels">
          {chartTeams.map((team) => (
            <motion.span
              key={team.teamName}
              layout
              transition={LAYOUT_TRANSITION}
              className="ranking-chart__label"
            >
              {team.teamName}
            </motion.span>
          ))}
        </div>
      </div>

      <h2 className="ranking__section-title">All Teams</h2>
      <ul className="ranking-list" aria-label="All teams ranked by points">
        {rankedTeams.map((team) => (
          <motion.li
            key={team.teamName}
            layout
            transition={LAYOUT_TRANSITION}
            className={`ranking-list__row ranking-list__row--${team.rank <= 3 ? team.rank : 'rest'}`}
          >
            <span className={`ranking-list__rank ranking-list__rank--${team.rank <= 3 ? team.rank : 'rest'}`} aria-hidden>
              {team.rank}
            </span>
            <div className="ranking-list__info">
              <span className="ranking-list__name">{team.teamName}</span>
              <span className="ranking-list__table">Tafel {team.tableNumber}</span>
            </div>
            <span className="ranking-list__points" aria-label={`${team.points} points`}>
              {team.points} pts
            </span>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
